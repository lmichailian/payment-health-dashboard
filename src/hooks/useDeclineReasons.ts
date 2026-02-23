'use client'

import { useQuery } from '@tanstack/react-query'
import { DashboardFilters, DeclineReason } from '@/types'

interface DeclineReasonsResponse {
  data: (DeclineReason & { label: string })[]
  meta: {
    totalDeclines: number
    period: {
      start: string
      end: string
    }
  }
}

async function fetchDeclineReasons(filters: DashboardFilters): Promise<DeclineReasonsResponse> {
  const params = new URLSearchParams()

  if (filters.startDate) params.set('start_date', filters.startDate.toISOString())
  if (filters.endDate) params.set('end_date', filters.endDate.toISOString())
  if (filters.processor) params.set('processor', filters.processor)
  if (filters.paymentMethod) params.set('payment_method', filters.paymentMethod)
  if (filters.country) params.set('country', filters.country)

  const response = await fetch(`/api/metrics/decline-reasons?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch decline reasons')
  }

  return response.json()
}

export function useDeclineReasons(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: ['decline-reasons', filters],
    queryFn: () => fetchDeclineReasons(filters),
  })
}
