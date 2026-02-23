import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { calculateAuthRate } from '@/lib/health'
import { subDays, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const processor = searchParams.get('processor')
    const paymentMethod = searchParams.get('payment_method')
    const country = searchParams.get('country')

    // Default to last 60 days
    const defaultEndDate = new Date()
    const defaultStartDate = subDays(defaultEndDate, 60)

    const start = startDate ? startOfDay(new Date(startDate)) : defaultStartDate
    const end = endDate ? endOfDay(new Date(endDate)) : defaultEndDate

    // Build filter conditions
    const whereConditions: Record<string, unknown> = {
      dateBucket: {
        gte: start,
        lte: end,
      },
      hourBucket: -1, // Daily aggregates only (-1 is sentinel for daily)
    }

    if (processor) whereConditions.processor = processor
    if (paymentMethod) whereConditions.paymentMethod = paymentMethod
    if (country) whereConditions.country = country

    // Get current period metrics from aggregated table
    const currentPeriodMetrics = await prisma.aggregatedMetric.aggregate({
      where: whereConditions,
      _sum: {
        totalAttempts: true,
        approvedCount: true,
        declinedCount: true,
        failedCount: true,
        pendingCount: true,
      },
    })

    const totalAttempts = currentPeriodMetrics._sum.totalAttempts || 0
    const approvedCount = currentPeriodMetrics._sum.approvedCount || 0
    const declinedCount = currentPeriodMetrics._sum.declinedCount || 0
    const failedCount = currentPeriodMetrics._sum.failedCount || 0
    const pendingCount = currentPeriodMetrics._sum.pendingCount || 0

    // Calculate auth rate (excluding pending)
    const authRate = calculateAuthRate(approvedCount, declinedCount, failedCount, pendingCount)

    // Get previous period for comparison
    const periodDuration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    const previousStart = subDays(start, periodDuration)
    const previousEnd = subDays(end, periodDuration)

    const previousPeriodMetrics = await prisma.aggregatedMetric.aggregate({
      where: {
        ...whereConditions,
        dateBucket: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
      _sum: {
        totalAttempts: true,
        approvedCount: true,
        declinedCount: true,
        failedCount: true,
        pendingCount: true,
      },
    })

    const prevApproved = previousPeriodMetrics._sum.approvedCount || 0
    const prevDeclined = previousPeriodMetrics._sum.declinedCount || 0
    const prevFailed = previousPeriodMetrics._sum.failedCount || 0
    const prevPending = previousPeriodMetrics._sum.pendingCount || 0

    const previousAuthRate = calculateAuthRate(prevApproved, prevDeclined, prevFailed, prevPending)

    // Determine trend
    const change = authRate - previousAuthRate
    let direction: 'up' | 'down' | 'stable' = 'stable'
    if (change > 0.5) direction = 'up'
    if (change < -0.5) direction = 'down'

    // Determine health status
    let healthStatus: 'excellent' | 'warning' | 'critical' = 'excellent'
    if (authRate < 80) healthStatus = 'critical'
    else if (authRate < 85) healthStatus = 'warning'

    const response = {
      data: {
        authRate: parseFloat(authRate.toFixed(2)),
        totalAttempts,
        approvedCount,
        declinedCount,
        failedCount,
        pendingCount,
        trend: {
          direction,
          changePercent: parseFloat(change.toFixed(2)),
          previousPeriodRate: parseFloat(previousAuthRate.toFixed(2)),
        },
        healthStatus,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
      meta: {
        filtersApplied: {
          processor: processor || null,
          paymentMethod: paymentMethod || null,
          country: country || null,
        },
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching authorization rate:', error)
    return NextResponse.json(
      { error: 'Failed to fetch authorization rate' },
      { status: 500 }
    )
  }
}
