import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { calculateAuthRate } from '@/lib/health'
import { subDays, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const paymentMethod = searchParams.get('payment_method')
    const country = searchParams.get('country')

    const defaultEndDate = new Date()
    const defaultStartDate = subDays(defaultEndDate, 60)

    const start = startDate ? startOfDay(new Date(startDate)) : defaultStartDate
    const end = endDate ? endOfDay(new Date(endDate)) : defaultEndDate

    // Build where conditions
    const whereConditions: Record<string, unknown> = {
      dateBucket: {
        gte: start,
        lte: end,
      },
      hourBucket: -1,
      processor: { not: null },
    }

    if (paymentMethod) whereConditions.paymentMethod = paymentMethod
    if (country) whereConditions.country = country

    // Get metrics grouped by processor
    const processorMetrics = await prisma.aggregatedMetric.groupBy({
      by: ['processor'],
      where: whereConditions,
      _sum: {
        totalAttempts: true,
        approvedCount: true,
        declinedCount: true,
        failedCount: true,
        pendingCount: true,
      },
    })

    // Calculate previous period for trend comparison
    const periodDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const previousStart = subDays(start, periodDuration)
    const previousEnd = subDays(end, periodDuration)

    const previousMetrics = await prisma.aggregatedMetric.groupBy({
      by: ['processor'],
      where: {
        ...whereConditions,
        dateBucket: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
      _sum: {
        approvedCount: true,
        declinedCount: true,
        failedCount: true,
        pendingCount: true,
      },
    })

    const previousMetricsMap = new Map(
      previousMetrics.map((m) => [m.processor, m._sum])
    )

    // Format response
    const data = processorMetrics.map((m) => {
      const totalAttempts = m._sum.totalAttempts || 0
      const approvedCount = m._sum.approvedCount || 0
      const declinedCount = m._sum.declinedCount || 0
      const failedCount = m._sum.failedCount || 0
      const pendingCount = m._sum.pendingCount || 0

      const authRate = calculateAuthRate(approvedCount, declinedCount, failedCount, pendingCount)

      // Calculate previous period rate
      const prev = previousMetricsMap.get(m.processor)
      const prevAuthRate = prev
        ? calculateAuthRate(
            prev.approvedCount || 0,
            prev.declinedCount || 0,
            prev.failedCount || 0,
            prev.pendingCount || 0
          )
        : 0

      const change = authRate - prevAuthRate
      let direction: 'up' | 'down' | 'stable' = 'stable'
      if (change > 0.5) direction = 'up'
      if (change < -0.5) direction = 'down'

      return {
        processor: m.processor,
        authRate: parseFloat(authRate.toFixed(2)),
        totalAttempts,
        approvedCount,
        declinedCount,
        trend: {
          direction,
          changePercent: parseFloat(change.toFixed(2)),
        },
      }
    }).sort((a, b) => b.authRate - a.authRate)

    return NextResponse.json({
      data,
      meta: {
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching processor metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch processor metrics' },
      { status: 500 }
    )
  }
}
