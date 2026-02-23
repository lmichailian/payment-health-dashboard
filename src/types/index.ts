// Transaction types
export type TransactionStatus = 'approved' | 'declined' | 'pending' | 'failed'

export interface Transaction {
  id: string
  transactionId: string
  amount: number
  currency: string
  status: TransactionStatus
  processor: string
  paymentMethod: string
  country: string
  declineReason?: string | null
  createdAt: Date
  receivedAt: Date
}

// Metrics types
export interface AuthorizationMetrics {
  authRate: number
  totalAttempts: number
  approvedCount: number
  declinedCount: number
  failedCount: number
  pendingCount: number
  trend: {
    direction: 'up' | 'down' | 'stable'
    changePercent: number
    previousPeriodRate: number
  }
  healthStatus: 'excellent' | 'warning' | 'critical'
}

export interface ProcessorMetrics {
  processor: string
  authRate: number
  totalAttempts: number
  approvedCount: number
  declinedCount: number
  trend: {
    direction: 'up' | 'down' | 'stable'
    changePercent: number
  }
}

export interface PaymentMethodMetrics {
  paymentMethod: string
  authRate: number
  totalAttempts: number
  approvedCount: number
  volumePercentage: number
}

export interface CountryMetrics {
  country: string
  currency: string
  authRate: number
  totalAttempts: number
  approvedCount: number
  trend: {
    direction: 'up' | 'down' | 'stable'
    changePercent: number
  }
}

export interface TrendDataPoint {
  date: string
  authRate: number
  totalAttempts: number
  approvedCount: number
}

export interface DeclineReason {
  reason: string
  count: number
  percentage: number
}

// Alert types
export type AlertSeverity = 'critical' | 'warning' | 'info'

export interface Alert {
  id: number
  alertName: string
  metricType: string
  metricValue: number
  thresholdValue: number
  severity: AlertSeverity
  message: string
  triggeredAt: Date
  isResolved: boolean
  processor?: string
  paymentMethod?: string
  country?: string
}

// Filter types
export interface DashboardFilters {
  startDate?: Date
  endDate?: Date
  processor?: string
  paymentMethod?: string
  country?: string
}

// API response types
export interface ApiResponse<T> {
  data: T
  meta?: {
    filtersApplied?: DashboardFilters
    queryTimeMs?: number
    cacheStatus?: 'hit' | 'miss'
  }
}

// Constants
export const PROCESSORS = ['Stripe', 'Adyen', 'dLocal', 'PayU'] as const
export type Processor = typeof PROCESSORS[number]

export const PAYMENT_METHODS = ['CARD', 'PIX', 'OXXO', 'PSE'] as const
export type PaymentMethod = typeof PAYMENT_METHODS[number]

export const COUNTRIES = [
  { code: 'BR', name: 'Brazil', currency: 'BRL' },
  { code: 'MX', name: 'Mexico', currency: 'MXN' },
  { code: 'CO', name: 'Colombia', currency: 'COP' },
] as const

export type CountryCode = typeof COUNTRIES[number]['code']

export const DECLINE_REASONS = [
  'insufficient_funds',
  'do_not_honor',
  'expired_card',
  'invalid_card',
  'fraud_suspected',
  'card_not_supported',
  'processing_error',
  'limit_exceeded',
  'stolen_card',
  'lost_card',
] as const
