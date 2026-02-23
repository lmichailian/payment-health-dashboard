'use client'

import { useState } from 'react'
import { subDays } from 'date-fns'
import { Activity, TrendingDown, XCircle } from 'lucide-react'

// Components
import { AuthorizationRateCard } from '@/components/dashboard/AuthorizationRateCard'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { TrendChart } from '@/components/dashboard/TrendChart'
import { ProcessorComparisonChart } from '@/components/dashboard/ProcessorComparisonChart'
import { PaymentMethodBreakdown } from '@/components/dashboard/PaymentMethodBreakdown'
import { GeographicBreakdown } from '@/components/dashboard/GeographicBreakdown'
import { DeclineReasonsChart } from '@/components/dashboard/DeclineReasonsChart'
import { FilterBar } from '@/components/dashboard/FilterBar'
import { AlertsBanner } from '@/components/dashboard/AlertsBanner'
import {
  KPICardSkeleton,
  ChartSkeleton,
  TableSkeleton,
} from '@/components/shared/Skeletons'
import { ErrorState } from '@/components/shared/ErrorState'

// Hooks
import { useAuthorizationMetrics } from '@/hooks/useAuthorizationMetrics'
import { useProcessorComparison } from '@/hooks/useProcessorComparison'
import { useTrendData } from '@/hooks/useTrendData'
import { usePaymentMethods } from '@/hooks/usePaymentMethods'
import { useCountryMetrics } from '@/hooks/useCountryMetrics'
import { useDeclineReasons } from '@/hooks/useDeclineReasons'
import { useAlerts, useResolveAlert } from '@/hooks/useAlerts'

// Types
import { DashboardFilters } from '@/types'

export default function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({
    startDate: subDays(new Date(), 60),
    endDate: new Date(),
  })

  // Fetch data with filters
  const {
    data: metricsData,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
  } = useAuthorizationMetrics(filters)

  const {
    data: processorData,
    isLoading: processorLoading,
    error: processorError,
  } = useProcessorComparison(filters)

  const {
    data: trendData,
    isLoading: trendLoading,
    error: trendError,
  } = useTrendData(filters, 60)

  const {
    data: paymentMethodData,
    isLoading: paymentMethodLoading,
    error: paymentMethodError,
  } = usePaymentMethods(filters)

  const {
    data: countryData,
    isLoading: countryLoading,
    error: countryError,
  } = useCountryMetrics(filters)

  const {
    data: declineData,
    isLoading: declineLoading,
    error: declineError,
  } = useDeclineReasons(filters)

  const { data: alertsData } = useAlerts(false)
  const resolveAlert = useResolveAlert()

  const handleFilterChange = (newFilters: DashboardFilters) => {
    setFilters(newFilters)
  }

  const handleDismissAlert = (alertId: number) => {
    resolveAlert.mutate(alertId)
  }

  // Calculate additional metrics
  const declineRate =
    metricsData?.data?.totalAttempts && metricsData?.data?.declinedCount
      ? (metricsData.data.declinedCount /
          (metricsData.data.totalAttempts - (metricsData.data.pendingCount || 0))) *
        100
      : 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Payment Health Dashboard
              </h1>
              <p className="text-muted-foreground">
                Meraki Pharmacy | Authorization Rate Monitoring
              </p>
            </div>
            <div className="text-sm text-muted-foreground">
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Alerts Banner */}
        {alertsData?.data && alertsData.data.length > 0 && (
          <AlertsBanner
            alerts={alertsData.data}
            onDismiss={handleDismissAlert}
          />
        )}

        {/* Filters */}
        <FilterBar filters={filters} onFilterChange={handleFilterChange} />

        {/* KPI Section */}
        <section aria-label="Key Performance Indicators">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {metricsLoading ? (
              <>
                <KPICardSkeleton />
                <KPICardSkeleton />
                <KPICardSkeleton />
              </>
            ) : metricsError ? (
              <div className="col-span-full">
                <ErrorState
                  message="Failed to load authorization metrics"
                  onRetry={() => refetchMetrics()}
                />
              </div>
            ) : metricsData?.data ? (
              <>
                <AuthorizationRateCard
                  authRate={metricsData.data.authRate}
                  totalAttempts={metricsData.data.totalAttempts}
                  approvedCount={metricsData.data.approvedCount}
                  declinedCount={metricsData.data.declinedCount}
                  trend={metricsData.data.trend}
                />
                <MetricCard
                  title="Transaction Volume"
                  value={metricsData.data.totalAttempts}
                  subtitle="Total transactions in period"
                  icon={Activity}
                />
                <MetricCard
                  title="Decline Rate"
                  value={`${declineRate.toFixed(1)}%`}
                  subtitle={`${metricsData.data.declinedCount.toLocaleString()} declined`}
                  icon={XCircle}
                  variant="danger"
                />
              </>
            ) : null}
          </div>
        </section>

        {/* Trend Chart */}
        <section aria-label="Authorization Rate Trend">
          {trendLoading ? (
            <ChartSkeleton height={300} />
          ) : trendError ? (
            <ErrorState message="Failed to load trend data" />
          ) : trendData?.data && trendData.data.length > 0 ? (
            <TrendChart data={trendData.data} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No trend data available for the selected period
            </div>
          )}
        </section>

        {/* Processor & Payment Method Comparison */}
        <section aria-label="Performance Breakdown">
          <div className="grid gap-6 lg:grid-cols-2">
            {processorLoading ? (
              <ChartSkeleton height={280} />
            ) : processorError ? (
              <ErrorState message="Failed to load processor data" />
            ) : processorData?.data && processorData.data.length > 0 ? (
              <ProcessorComparisonChart data={processorData.data} />
            ) : null}

            {paymentMethodLoading ? (
              <ChartSkeleton height={280} />
            ) : paymentMethodError ? (
              <ErrorState message="Failed to load payment method data" />
            ) : paymentMethodData?.data && paymentMethodData.data.length > 0 ? (
              <PaymentMethodBreakdown data={paymentMethodData.data} />
            ) : null}
          </div>
        </section>

        {/* Geographic Breakdown */}
        <section aria-label="Geographic Performance">
          {countryLoading ? (
            <TableSkeleton rows={3} />
          ) : countryError ? (
            <ErrorState message="Failed to load country data" />
          ) : countryData?.data && countryData.data.length > 0 ? (
            <GeographicBreakdown data={countryData.data} />
          ) : null}
        </section>

        {/* Decline Reasons */}
        <section aria-label="Decline Analysis">
          {declineLoading ? (
            <ChartSkeleton height={280} />
          ) : declineError ? (
            <ErrorState message="Failed to load decline reasons" />
          ) : declineData?.data && declineData.data.length > 0 ? (
            <DeclineReasonsChart
              data={declineData.data}
              totalDeclines={declineData.meta.totalDeclines}
            />
          ) : null}
        </section>

        {/* Footer */}
        <footer className="border-t pt-6 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
            <p>Payment Health Dashboard - Meraki Pharmacy</p>
            <p>Data refreshes automatically every minute</p>
          </div>
        </footer>
      </main>
    </div>
  )
}
