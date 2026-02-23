'use client'

import { useQuery } from '@tanstack/react-query'
import { DashboardFilters, PaymentMethodMetrics } from '@/types'

interface PaymentMethodResponse {
  data: PaymentMethodMetrics[]
  meta: {
    totalVolume: number
    period: {
      start: string
      end: string
    }
  }
}

async function fetchPaymentMethods(filters: DashboardFilters): Promise<PaymentMethodResponse> {
  const params = new URLSearchParams()

  if (filters.startDate) params.set('start_date', filters.startDate.toISOString())
  if (filters.endDate) params.set('end_date', filters.endDate.toISOString())
  if (filters.processor) params.set('processor', filters.processor)
  if (filters.country) params.set('country', filters.country)

  const response = await fetch(`/api/metrics/by-payment-method?${params.toString()}`)

  if (!response.ok) {
    throw new Error('Failed to fetch payment methods')
  }

  return response.json()
}

export function usePaymentMethods(filters: DashboardFilters = {}) {
  return useQuery({
    queryKey: ['payment-methods', filters],
    queryFn: () => fetchPaymentMethods(filters),
  })
}
