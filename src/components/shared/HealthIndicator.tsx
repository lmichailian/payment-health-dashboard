'use client'

import { Badge } from '@/components/ui/badge'
import { getHealthStatus, type HealthStatus } from '@/lib/health'
import { cn } from '@/lib/utils'

interface HealthIndicatorProps {
  rate: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function HealthIndicator({
  rate,
  showLabel = true,
  size = 'md',
  className,
}: HealthIndicatorProps) {
  const health = getHealthStatus(rate)

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const colorClasses: Record<HealthStatus, string> = {
    excellent: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-amber-100 text-amber-800 border-amber-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        sizeClasses[size],
        colorClasses[health.status],
        'font-medium',
        className
      )}
    >
      <span
        className={cn(
          'inline-block w-2 h-2 rounded-full mr-1.5',
          health.color
        )}
        aria-hidden="true"
      />
      {showLabel && <span>{health.label}</span>}
      <span className="sr-only">
        Authorization rate is {rate.toFixed(1)}%, status: {health.label}
      </span>
    </Badge>
  )
}
