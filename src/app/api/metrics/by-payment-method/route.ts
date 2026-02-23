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
    const country = searchParams.get('country')

    const defaultEndDate = new Date()
    const defaultStartDate = subDays(defaultEndDate, 60)

    const start = startDate ? startOfDay(new Date(startDate)) : defaultStartDate
    const end = endDate ? endOfDay(new Date(endDate)) : defaultEndDate

    const whereConditions: Record<string, unknown> = {
      dateBucket: {
        gte: start,
        lte: end,
      },
      hourBucket: -1,
      paymentMethod: { not: null },
    }

    if (processor) whereConditions.processor = processor
    if (country) whereConditions.country = country

    // Get metrics grouped by payment method
    const paymentMethodMetrics = await prisma.aggregatedMetric.groupBy({
      by: ['paymentMethod'],
      where: whereConditions,
      _sum: {
        totalAttempts: true,
        approvedCount: true,
        declinedCount: true,
        failedCount: true,
        pendingCount: true,
      },
    })

    // Calculate total volume for percentage calculation
    const totalVolume = paymentMethodMetrics.reduce(
      (sum, m) => sum + (m._sum.totalAttempts || 0),
      0
    )

    // Format response
    const data = paymentMethodMetrics.map((m) => {
      const totalAttempts = m._sum.totalAttempts || 0
      const approvedCount = m._sum.approvedCount || 0
      const declinedCount = m._sum.declinedCount || 0
      const failedCount = m._sum.failedCount || 0
      const pendingCount = m._sum.pendingCount || 0

      const authRate = calculateAuthRate(approvedCount, declinedCount, failedCount, pendingCount)
      const volumePercentage = totalVolume > 0 ? (totalAttempts / totalVolume) * 100 : 0

      return {
        paymentMethod: m.paymentMethod,
        authRate: parseFloat(authRate.toFixed(2)),
        totalAttempts,
        approvedCount,
        volumePercentage: parseFloat(volumePercentage.toFixed(1)),
      }
    }).sort((a, b) => b.totalAttempts - a.totalAttempts)

    return NextResponse.json({
      data,
      meta: {
        totalVolume,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching payment method metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment method metrics' },
      { status: 500 }
    )
  }
}
