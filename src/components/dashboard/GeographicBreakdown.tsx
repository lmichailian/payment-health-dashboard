'use client'

import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { HealthIndicator } from '@/components/shared/HealthIndicator'
import { CountryMetrics } from '@/types'
import { formatNumber } from '@/lib/health'
import { cn } from '@/lib/utils'

interface GeographicBreakdownProps {
  data: CountryMetrics[]
}

const COUNTRY_FLAGS: Record<string, string> = {
  BR: '🇧🇷',
  MX: '🇲🇽',
  CO: '🇨🇴',
}

export function GeographicBreakdown({ data }: GeographicBreakdownProps) {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="text-base font-medium">
          Performance by Country
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Country</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead className="text-right">Auth Rate</TableHead>
              <TableHead className="text-right">Volume</TableHead>
              <TableHead className="text-right">Approved</TableHead>
              <TableHead className="text-right">Trend</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((country) => {
              const TrendIcon =
                country.trend.direction === 'up'
                  ? ArrowUp
                  : country.trend.direction === 'down'
                  ? ArrowDown
                  : Minus

              const trendColorClass =
                country.trend.direction === 'up'
                  ? 'text-green-600'
                  : country.trend.direction === 'down'
                  ? 'text-red-600'
                  : 'text-gray-500'

              return (
                <TableRow key={country.country}>
                  <TableCell className="font-medium">
                    <span className="mr-2">
                      {COUNTRY_FLAGS[country.country] || '🌐'}
                    </span>
                    {country.countryName}
                  </TableCell>
                  <TableCell>{country.currency}</TableCell>
                  <TableCell className="text-right font-semibold">
                    {country.authRate.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(country.totalAttempts)}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    {formatNumber(country.approvedCount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div
                      className={cn(
                        'flex items-center justify-end gap-1',
                        trendColorClass
                      )}
                    >
                      <TrendIcon className="h-4 w-4" />
                      <span>{Math.abs(country.trend.changePercent).toFixed(1)}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <HealthIndicator rate={country.authRate} size="sm" />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
