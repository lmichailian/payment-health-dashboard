'use client'

import { useQuery } from '@tanstack/react-query'
import { DashboardFilters, AuthorizationMetrics } from '@/types'

interface AuthorizationRateResponse {
  data: AuthorizationMetrics & {
    period: {
      start: string
      end: string
    }
  }
  meta: {
    filtersApplied: DashboardFilters
  }
}

async function fetchAuthorizationRate(filters: DashboardFilters): Promise<AuthorizationRateResponse> {
  const params = new URLSearchParams()

  if (filters.startDate) params.set('start_date', filters.startDate.toISOString())
  if (filters.endDate) params.set('end_date', filters.endDate.toISOString())
  if (filters.processor) params.set('processor', filters.processor)
  if (filters.paymentMethod) params.set('payment_method', filters.paymentMethod)
  if (filters.country) params.set('country', filters.country)

  const response = await fetch(`/api/metrics/authorization-rate?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch authorization rate')
  }

  return response.json()
}

export function useAuthorizationMetrics(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: ['authorization-rate', filters],
    queryFn: () => fetchAuthorizationRate(filters),
  })
}
