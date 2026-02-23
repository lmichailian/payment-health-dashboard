import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { subDays, startOfDay, endOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const processor = searchParams.get('processor')
    const paymentMethod = searchParams.get('payment_method')
    const country = searchParams.get('country')
    const limit = parseInt(searchParams.get('limit') || '10')

    const defaultEndDate = new Date()
    const defaultStartDate = subDays(defaultEndDate, 60)

    const start = startDate ? startOfDay(new Date(startDate)) : defaultStartDate
    const end = endDate ? endOfDay(new Date(endDate)) : defaultEndDate

    const whereConditions: Record<string, unknown> = {
      dateBucket: {
        gte: start,
        lte: end,
      },
    }

    if (processor) whereConditions.processor = processor
    if (paymentMethod) whereConditions.paymentMethod = paymentMethod
    if (country) whereConditions.country = country

    // Get decline reasons aggregated
    const declineReasons = await prisma.declineReasonStat.groupBy({
      by: ['declineReason'],
      where: whereConditions,
      _sum: {
        occurrences: true,
      },
      orderBy: {
        _sum: {
          occurrences: 'desc',
        },
      },
      take: limit,
    })

    // Calculate total for percentages
    const totalDeclines = declineReasons.reduce(
      (sum, r) => sum + (r._sum.occurrences || 0),
      0
    )

    // Format response with human-readable reasons
    const reasonLabels: Record<string, string> = {
      insufficient_funds: 'Insufficient Funds',
      do_not_honor: 'Do Not Honor',
      expired_card: 'Expired Card',
      invalid_card: 'Invalid Card Number',
      fraud_suspected: 'Fraud Suspected',
      card_not_supported: 'Card Not Supported',
      processing_error: 'Processing Error',
      limit_exceeded: 'Limit Exceeded',
      stolen_card: 'Stolen Card',
      lost_card: 'Lost Card',
    }

    const data = declineReasons.map((r) => {
      const count = r._sum.occurrences || 0
      const percentage = totalDeclines > 0 ? (count / totalDeclines) * 100 : 0

      return {
        reason: r.declineReason,
        label: reasonLabels[r.declineReason] || r.declineReason,
        count,
        percentage: parseFloat(percentage.toFixed(1)),
      }
    })

    return NextResponse.json({
      data,
      meta: {
        totalDeclines,
        period: {
          start: start.toISOString(),
          end: end.toISOString(),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching decline reasons:', error)
    return NextResponse.json(
      { error: 'Failed to fetch decline reasons' },
      { status: 500 }
    )
  }
}
