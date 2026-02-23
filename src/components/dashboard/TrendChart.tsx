'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendDataPoint } from '@/types'
import { format, parseISO } from 'date-fns'

interface TrendChartProps {
  data: TrendDataPoint[]
  title?: string
}

export function TrendChart({
  data,
  title = '60-Day Authorization Rate Trend',
}: TrendChartProps) {
  const formattedData = data.map((point) => ({
    ...point,
    dateFormatted: format(parseISO(point.date), 'MMM d'),
  }))

  const minRate = Math.min(...data.map((d) => d.authRate))
  const maxRate = Math.max(...data.map((d) => d.authRate))
  const yDomain = [Math.max(0, minRate - 5), Math.min(100, maxRate + 5)]

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="dateFormatted"
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={yDomain}
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as TrendDataPoint & {
                      dateFormatted: string
                    }
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="font-medium">{data.dateFormatted}</p>
                        <p className="text-sm">
                          Auth Rate:{' '}
                          <span className="font-semibold">
                            {data.authRate.toFixed(1)}%
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {data.totalAttempts.toLocaleString()} transactions
                        </p>
                        <p className="text-sm text-green-600">
                          {data.approvedCount.toLocaleString()} approved
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              {/* Warning threshold line at 85% */}
              <ReferenceLine
                y={85}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                label={{
                  value: 'Warning: 85%',
                  position: 'insideTopRight',
                  fill: '#f59e0b',
                  fontSize: 10,
                }}
              />
              {/* Critical threshold line at 80% */}
              <ReferenceLine
                y={80}
                stroke="#ef4444"
                strokeDasharray="5 5"
                label={{
                  value: 'Critical: 80%',
                  position: 'insideTopRight',
                  fill: '#ef4444',
                  fontSize: 10,
                }}
              />
              <Line
                type="monotone"
                dataKey="authRate"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6, fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Dashed lines indicate warning (85%) and critical (80%) thresholds
        </p>
      </CardContent>
    </Card>
  )
}
