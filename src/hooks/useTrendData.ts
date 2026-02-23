'use client'

import { useQuery } from '@tanstack/react-query'
import { DashboardFilters, TrendDataPoint } from '@/types'

interface TrendDataResponse {
  data: TrendDataPoint[]
  meta: {
    period: {
      start: string
      end: string
    }
    dataPoints: number
    filtersApplied: DashboardFilters
  }
}

async function fetchTrendData(filters: DashboardFilters, days: number = 60): Promise<TrendDataResponse> {
  const params = new URLSearchParams()
  params.set('days', days.toString())

  if (filters.startDate) params.set('start_date', filters.startDate.toISOString())
  if (filters.endDate) params.set('end_date', filters.endDate.toISOString())
  if (filters.processor) params.set('processor', filters.processor)
  if (filters.paymentMethod) params.set('payment_method', filters.paymentMethod)
  if (filters.country) params.set('country', filters.country)

  const response = await fetch(`/api/metrics/trends?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch trend data')
  }

  return response.json()
}

export function useTrendData(filters: DashboardFilters = {}, days: number = 60) {
  return useQuery({
    queryKey: ['trend-data', filters, days],
    queryFn: () => fetchTrendData(filters, days),
  })
}
