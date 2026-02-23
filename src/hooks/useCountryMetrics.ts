'use client'

import { useQuery } from '@tanstack/react-query'
import { DashboardFilters, CountryMetrics } from '@/types'

interface CountryMetricsResponse {
  data: CountryMetrics[]
  meta: {
    period: {
      start: string
      end: string
    }
  }
}

async function fetchCountryMetrics(filters: DashboardFilters): Promise<CountryMetricsResponse> {
  const params = new URLSearchParams()

  if (filters.startDate) params.set('start_date', filters.startDate.toISOString())
  if (filters.endDate) params.set('end_date', filters.endDate.toISOString())
  if (filters.processor) params.set('processor', filters.processor)
  if (filters.paymentMethod) params.set('payment_method', filters.paymentMethod)

  const response = await fetch(`/api/metrics/by-country?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch country metrics')
  }

  return response.json()
}

export function useCountryMetrics(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: ['country-metrics', filters],
    queryFn: () => fetchCountryMetrics(filters),
  })
}
