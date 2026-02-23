'use client'

import { AlertTriangle, X, Bell } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Alert as AlertType } from '@/types'
import { cn } from '@/lib/utils'

interface AlertsBannerProps {
  alerts: AlertType[]
  onDismiss?: (alertId: number) => void
}

export function AlertsBanner({ alerts, onDismiss }: AlertsBannerProps) {
  const activeAlerts = alerts.filter((alert) => !alert.isResolved)

  if (activeAlerts.length === 0) {
    return null
  }

  const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical')
  const warningAlerts = activeAlerts.filter((a) => a.severity === 'warning')

  return (
    <div className="space-y-2" role="alert" aria-live="polite">
      {criticalAlerts.map((alert) => (
        <Alert
          key={alert.id}
          variant="destructive"
          className="border-red-500 bg-red-50"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-semibold">Critical Alert</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{alert.message}</span>
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(alert.id)}
                className="ml-4 h-6 px-2 text-red-700 hover:bg-red-100"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Dismiss alert</span>
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ))}

      {warningAlerts.map((alert) => (
        <Alert
          key={alert.id}
          className="border-amber-500 bg-amber-50"
        >
          <Bell className="h-4 w-4 text-amber-600" />
          <AlertTitle className="font-semibold text-amber-800">
            Warning
          </AlertTitle>
          <AlertDescription className="flex items-center justify-between text-amber-700">
            <span>{alert.message}</span>
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(alert.id)}
                className="ml-4 h-6 px-2 text-amber-700 hover:bg-amber-100"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Dismiss alert</span>
              </Button>
            )}
          </AlertDescription>
        </Alert>
      ))}

      {/* Summary badge */}
      {activeAlerts.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span
            className={cn(
              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
              criticalAlerts.length > 0
                ? 'bg-red-100 text-red-800'
                : 'bg-amber-100 text-amber-800'
            )}
          >
            {activeAlerts.length} active alert{activeAlerts.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  )
}
