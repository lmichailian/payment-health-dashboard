import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { calculateAuthRate } from '@/lib/health'
import { subDays, startOfDay, endOfDay, format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '60')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const processor = searchParams.get('processor')
    const paymentMethod = searchParams.get('payment_method')
    const country = searchParams.get('country')

    const defaultEndDate = new Date()
    const defaultStartDate = subDays(defaultEndDate, days)

    const start = startDate ? startOfDay(new Date(startDate)) : defaultStartDate
    const end = endDate ? endOfDay(new Date(endDate)) : defaultEndDate

    const whereConditions: Record<string, unknown> = {
      dateBucket: {
        gte: start,
        lte: end,
      },
      hourBucket: -1, // Daily aggregates only
    }

    if (processor) whereConditions.processor = processor
    if (paymentMethod) whereConditions.paymentMethod = paymentMethod
    if (country) whereConditions.country = country

    // Get metrics grouped by date
    const dailyMetrics = await prisma.aggregatedMetric.groupBy({
      by: ['dateBucket'],
      where: whereConditions,
      _sum: {
        totalAttempts: true,
        approvedCount: true,
        declinedCount: true,
        failedCount: true,
        pendingCount: true,
      },
      orderBy: {
        dateBucket: 'asc',
      },
    })

    // Format response
    const data = dailyMetrics.map((m) => {
      const totalAttempts = m._sum.totalAttempts || 0
      const approvedCount = m._sum.approvedCount || 0
      const declinedCount = m._sum.declinedCount || 0
      const failedCount = m._sum.failedCount || 0
      const pendingCount = m._sum.pendingCount || 0

      const authRate = calculateAuthRate(approvedCount, declinedCount, failedCount, pendingCount)

      return {
        date: format(m.dateBucket, 'yyyy-MM-dd'),
        authRate: parseFloat(authRate.toFixed(2)),
        totalAttempts,
        approvedCount,
        declinedCount,
        failedCount,
      }
    })

    return NextResponse.json({
      data,
      meta: {
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
        dataPoints: data.length,
        filtersApplied: {
          processor: processor || null,
          paymentMethod: paymentMethod || null,
          country: country || null,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching trend data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trend data' },
      { status: 500 }
    )
  }
}
