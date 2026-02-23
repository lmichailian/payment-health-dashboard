import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { TransactionStatus } from '@prisma/client'

const VALID_STATUSES: TransactionStatus[] = ['approved', 'declined', 'pending', 'failed']

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      transaction_id,
      amount,
      currency,
      status,
      processor,
      payment_method,
      country,
      decline_reason,
      timestamp,
    } = body

    // Validation
    if (!transaction_id) {
      return NextResponse.json(
        { error: 'transaction_id is required' },
        { status: 400 }
      )
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: 'amount is required' },
        { status: 400 }
      )
    }

    if (amount < 0) {
      return NextResponse.json(
        { error: 'amount must be greater than or equal to 0' },
        { status: 400 }
      )
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Valid values: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    if (!processor) {
      return NextResponse.json(
        { error: 'processor is required' },
        { status: 400 }
      )
    }

    // Check for duplicate transaction_id
    const existing = await prisma.transaction.findUnique({
      where: { transactionId: transaction_id },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Transaction with this ID already exists', code: 'DUPLICATE' },
        { status: 409 }
      )
    }

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        transactionId: transaction_id,
        amount: parseFloat(amount),
        currency: currency || 'USD',
        status: status as TransactionStatus,
        processor,
        paymentMethod: payment_method || 'CARD',
        country: country || 'US',
        declineReason: status === 'declined' ? decline_reason : null,
        createdAt: timestamp ? new Date(timestamp) : new Date(),
        receivedAt: new Date(),
      },
    })

    return NextResponse.json(
      { message: 'Transaction created', data: transaction },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const processor = searchParams.get('processor')

    const skip = (page - 1) * limit

    const whereConditions: Record<string, unknown> = {}
    if (status && VALID_STATUSES.includes(status as TransactionStatus)) {
      whereConditions.status = status
    }
    if (processor) {
      whereConditions.processor = processor
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: whereConditions,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: whereConditions }),
    ])

    return NextResponse.json({
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}
