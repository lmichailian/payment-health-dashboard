export type HealthStatus = 'excellent' | 'warning' | 'critical'

export interface HealthInfo {
  status: HealthStatus
  color: string
  bgColor: string
  textColor: string
  label: string
}

/**
 * Determines health status based on authorization rate
 * - Excellent (Green): >= 85%
 * - Warning (Amber): 80-85%
 * - Critical (Red): < 80%
 */
export function getHealthStatus(rate: number): HealthInfo {
  if (rate >= 85) {
    return {
      status: 'excellent',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      label: 'Healthy',
    }
  }
  if (rate >= 80) {
    return {
      status: 'warning',
      color: 'bg-amber-500',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      label: 'Warning',
    }
  }
  return {
    status: 'critical',
    color: 'bg-red-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    label: 'Critical',
  }
}

/**
 * Format percentage with specified decimal places
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`
}

/**
 * Format large numbers with K/M suffix
 */
export function formatNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toString()
}

/**
 * Calculate authorization rate
 * Formula: approved / (total - pending) * 100
 * Returns 0 if no terminal transactions (to avoid division by zero)
 */
export function calculateAuthRate(
  approved: number,
  declined: number,
  failed: number,
  pending: number = 0
): number {
  const terminalCount = approved + declined + failed
  if (terminalCount === 0) return 0
  return (approved / terminalCount) * 100
}

/**
 * Get trend indicator
 */
export function getTrendIndicator(current: number, previous: number): {
  direction: 'up' | 'down' | 'stable'
  change: number
  changePercent: number
} {
  const change = current - previous
  const changePercent = previous !== 0 ? (change / previous) * 100 : 0

  let direction: 'up' | 'down' | 'stable' = 'stable'
  if (change > 0.5) direction = 'up'
  if (change < -0.5) direction = 'down'

  return { direction, change, changePercent }
}
