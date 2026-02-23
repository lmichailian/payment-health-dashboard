'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PaymentMethodMetrics } from '@/types'

interface PaymentMethodBreakdownProps {
  data: PaymentMethodMetrics[]
}

const PAYMENT_METHOD_COLORS: Record<string, string> = {
  CARD: '#3b82f6',
  PIX: '#10b981',
  OXXO: '#f59e0b',
  PSE: '#8b5cf6',
  OTHER: '#6b7280',
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CARD: 'Cards',
  PIX: 'PIX',
  OXXO: 'OXXO',
  PSE: 'PSE',
  OTHER: 'Other',
}

export function PaymentMethodBreakdown({ data }: PaymentMethodBreakdownProps) {
  const formattedData = data.map((method) => ({
    ...method,
    name: PAYMENT_METHOD_LABELS[method.paymentMethod] || method.paymentMethod,
    fill: PAYMENT_METHOD_COLORS[method.paymentMethod] || '#6b7280',
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">
          Payment Method Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={formattedData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                dataKey="totalAttempts"
                nameKey="name"
                paddingAngle={2}
              >
                {formattedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as PaymentMethodMetrics & {
                      name: string
                    }
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="font-medium">{data.name}</p>
                        <p className="text-sm">
                          Volume:{' '}
                          <span className="font-semibold">
                            {data.volumePercentage.toFixed(1)}%
                          </span>
                        </p>
                        <p className="text-sm">
                          Auth Rate:{' '}
                          <span className="font-semibold">
                            {data.authRate.toFixed(1)}%
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {data.totalAttempts.toLocaleString()} transactions
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend
                formatter={(value, entry) => (
                  <span className="text-sm">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary table */}
        <div className="mt-4 space-y-2">
          {formattedData.map((method) => (
            <div
              key={method.paymentMethod}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: method.fill }}
                />
                <span>{method.name}</span>
              </div>
              <div className="flex gap-4">
                <span className="text-muted-foreground">
                  {method.volumePercentage.toFixed(1)}%
                </span>
                <span className="font-medium">{method.authRate.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
