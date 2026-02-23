'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Alert } from '@/types'

interface AlertsResponse {
  data: Alert[]
  meta: {
    total: number
    activeCritical: number
    activeWarning: number
    hasActiveAlerts: boolean
  }
}

async function fetchAlerts(includeResolved: boolean = false): Promise<AlertsResponse> {
  const params = new URLSearchParams()
  if (includeResolved) params.set('include_resolved', 'true')

  const response = await fetch(`/api/alerts?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch alerts')
  }

  return response.json()
}

async function resolveAlert(alertId: number): Promise<void> {
  const response = await fetch('/api/alerts', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ alertId, action: 'resolve' }),
  })

  if (!response.ok) {
    throw new Error('Failed to resolve alert')
  }
}

export function useAlerts(includeResolved: boolean = false) {
  return useQuery({
    queryKey: ['alerts', includeResolved],
    queryFn: () => fetchAlerts(includeResolved),
    refetchInterval: 30000, // Refetch every 30 seconds
  })
}

export function useResolveAlert() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: resolveAlert,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}
