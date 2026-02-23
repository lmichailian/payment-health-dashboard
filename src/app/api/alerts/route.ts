import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeResolved = searchParams.get('include_resolved') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const whereConditions: Record<string, unknown> = {}
    if (!includeResolved) {
      whereConditions.isResolved = false
    }

    const alerts = await prisma.alertHistory.findMany({
      where: whereConditions,
      include: {
        alertConfig: true,
      },
      orderBy: {
        triggeredAt: 'desc',
      },
      take: limit,
    })

    const data = alerts.map((alert) => ({
      id: alert.id,
      alertName: alert.alertConfig.alertName,
      metricType: alert.alertConfig.metricType,
      metricValue: alert.metricValue ? parseFloat(alert.metricValue.toString()) : null,
      thresholdValue: alert.thresholdValue ? parseFloat(alert.thresholdValue.toString()) : null,
      severity: alert.severity,
      message: alert.message,
      triggeredAt: alert.triggeredAt.toISOString(),
      resolvedAt: alert.resolvedAt?.toISOString() || null,
      isResolved: alert.isResolved,
      processor: alert.processor,
      paymentMethod: alert.paymentMethod,
      country: alert.country,
    }))

    // Count active alerts by severity
    const activeCritical = data.filter((a) => !a.isResolved && a.severity === 'critical').length
    const activeWarning = data.filter((a) => !a.isResolved && a.severity === 'warning').length

    return NextResponse.json({
      data,
      meta: {
        total: data.length,
        activeCritical,
        activeWarning,
        hasActiveAlerts: activeCritical > 0 || activeWarning > 0,
      },
    })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { alertId, action } = body

    if (!alertId || !action) {
      return NextResponse.json(
        { error: 'alertId and action are required' },
        { status: 400 }
      )
    }

    if (action === 'resolve') {
      const updatedAlert = await prisma.alertHistory.update({
        where: { id: alertId },
        data: {
          isResolved: true,
          resolvedAt: new Date(),
        },
      })

      return NextResponse.json({
        message: 'Alert resolved successfully',
        data: updatedAlert,
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    )
  }
}
