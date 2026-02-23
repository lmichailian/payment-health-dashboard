'use client'

import { useQuery } from '@tanstack/react-query'
import { DashboardFilters, ProcessorMetrics } from '@/types'

interface ProcessorComparisonResponse {
  data: ProcessorMetrics[]
  meta: {
    period: {
      start: string
      end: string
    }
  }
}

async function fetchProcessorComparison(filters: DashboardFilters): Promise<ProcessorComparisonResponse> {
  const params = new URLSearchParams()

  if (filters.startDate) params.set('start_date', filters.startDate.toISOString())
  if (filters.endDate) params.set('end_date', filters.endDate.toISOString())
  if (filters.paymentMethod) params.set('payment_method', filters.paymentMethod)
  if (filters.country) params.set('country', filters.country)

  const response = await fetch(`/api/metrics/by-processor?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch processor comparison')
  }

  return response.json()
}

export function useProcessorComparison(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: ['processor-comparison', filters],
    queryFn: () => fetchProcessorComparison(filters),
  })
}
