'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProcessorMetrics } from '@/types'
import { getHealthStatus } from '@/lib/health'

interface ProcessorComparisonChartProps {
  data: ProcessorMetrics[]
}

const PROCESSOR_COLORS: Record<string, string> = {
  Stripe: '#635BFF',
  Adyen: '#0ABF53',
  dLocal: '#0099FF',
  PayU: '#FF6D00',
}

export function ProcessorComparisonChart({ data }: ProcessorComparisonChartProps) {
  const formattedData = data.map((processor) => ({
    ...processor,
    fill: PROCESSOR_COLORS[processor.processor] || '#6b7280',
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">
          Authorization Rate by Processor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={formattedData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis
                type="category"
                dataKey="processor"
                tick={{ fontSize: 12 }}
                width={50}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as ProcessorMetrics
                    const health = getHealthStatus(data.authRate)
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="font-medium">{data.processor}</p>
                        <p className="text-sm">
                          Auth Rate:{' '}
                          <span className="font-semibold">
                            {data.authRate.toFixed(1)}%
                          </span>
                          <span
                            className={`ml-2 text-xs px-1.5 py-0.5 rounded ${health.bgColor} ${health.textColor}`}
                          >
                            {health.label}
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {data.totalAttempts.toLocaleString()} transactions
                        </p>
                        <p className="text-sm">
                          <span className="text-green-600">
                            {data.approvedCount.toLocaleString()}
                          </span>{' '}
                          approved /{' '}
                          <span className="text-red-600">
                            {data.declinedCount.toLocaleString()}
                          </span>{' '}
                          declined
                        </p>
                        {data.trend && (
                          <p
                            className={`text-xs ${
                              data.trend.direction === 'up'
                                ? 'text-green-600'
                                : data.trend.direction === 'down'
                                ? 'text-red-600'
                                : 'text-gray-500'
                            }`}
                          >
                            {data.trend.direction === 'up' ? '+' : ''}
                            {data.trend.changePercent.toFixed(1)}% vs previous
                          </p>
                        )}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <ReferenceLine x={80} stroke="#ef4444" strokeDasharray="5 5" />
              <ReferenceLine x={85} stroke="#f59e0b" strokeDasharray="5 5" />
              <Bar dataKey="authRate" radius={[0, 4, 4, 0]}>
                {formattedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 justify-center">
          {data.map((processor) => (
            <div key={processor.processor} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{
                  backgroundColor:
                    PROCESSOR_COLORS[processor.processor] || '#6b7280',
                }}
              />
              <span className="text-xs">{processor.processor}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
