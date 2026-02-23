'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DeclineReason } from '@/types'

interface DeclineReasonsChartProps {
  data: (DeclineReason & { label: string })[]
  totalDeclines: number
}

export function DeclineReasonsChart({
  data,
  totalDeclines,
}: DeclineReasonsChartProps) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
            Top Decline Reasons
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {totalDeclines.toLocaleString()} total declines
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 140, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fontSize: 12 }}
                width={130}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload as DeclineReason & {
                      label: string
                    }
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-3">
                        <p className="font-medium">{data.label}</p>
                        <p className="text-sm">
                          Percentage:{' '}
                          <span className="font-semibold">
                            {data.percentage.toFixed(1)}%
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {data.count.toLocaleString()} occurrences
                        </p>
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Bar
                dataKey="percentage"
                fill="#ef4444"
                radius={[0, 4, 4, 0]}
                maxBarSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary list */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          {data.slice(0, 6).map((reason, index) => (
            <div
              key={reason.reason}
              className="flex items-center justify-between p-2 rounded bg-muted/50"
            >
              <span className="text-muted-foreground">
                {index + 1}. {reason.label}
              </span>
              <span className="font-medium">{reason.percentage.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
