'use client'

import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HealthIndicator } from '@/components/shared/HealthIndicator'
import { formatNumber, formatPercent } from '@/lib/health'
import { cn } from '@/lib/utils'

interface AuthorizationRateCardProps {
  authRate: number
  totalAttempts: number
  approvedCount: number
  declinedCount: number
  trend: {
    direction: 'up' | 'down' | 'stable'
    changePercent: number
  }
}

export function AuthorizationRateCard({
  authRate,
  totalAttempts,
  approvedCount,
  declinedCount,
  trend,
}: AuthorizationRateCardProps) {
  const TrendIcon =
    trend.direction === 'up'
      ? ArrowUp
      : trend.direction === 'down'
      ? ArrowDown
      : Minus

  const trendColorClass =
    trend.direction === 'up'
      ? 'text-green-600'
      : trend.direction === 'down'
      ? 'text-red-600'
      : 'text-gray-500'

  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Authorization Rate
          </CardTitle>
          <HealthIndicator rate={authRate} size="sm" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight">
            {formatPercent(authRate)}
          </span>
          <div className={cn('flex items-center text-sm', trendColorClass)}>
            <TrendIcon className="h-4 w-4" />
            <span>{Math.abs(trend.changePercent).toFixed(1)}%</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-1">
          vs. previous period
        </p>

        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-semibold">{formatNumber(totalAttempts)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Approved</p>
            <p className="text-lg font-semibold text-green-600">
              {formatNumber(approvedCount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Declined</p>
            <p className="text-lg font-semibold text-red-600">
              {formatNumber(declinedCount)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
