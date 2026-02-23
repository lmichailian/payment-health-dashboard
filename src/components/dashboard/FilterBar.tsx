'use client'

import { useState } from 'react'
import { CalendarIcon, X } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DashboardFilters, PROCESSORS, COUNTRIES, PAYMENT_METHODS } from '@/types'
import { cn } from '@/lib/utils'

interface FilterBarProps {
  filters: DashboardFilters
  onFilterChange: (filters: DashboardFilters) => void
}

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: filters.startDate || subDays(new Date(), 60),
    to: filters.endDate || new Date(),
  })

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setDateRange({ from: range.from, to: range.to })
    if (range.from && range.to) {
      onFilterChange({
        ...filters,
        startDate: range.from,
        endDate: range.to,
      })
    }
  }

  const handleProcessorChange = (value: string) => {
    onFilterChange({
      ...filters,
      processor: value === 'all' ? undefined : value,
    })
  }

  const handlePaymentMethodChange = (value: string) => {
    onFilterChange({
      ...filters,
      paymentMethod: value === 'all' ? undefined : value,
    })
  }

  const handleCountryChange = (value: string) => {
    onFilterChange({
      ...filters,
      country: value === 'all' ? undefined : value,
    })
  }

  const clearFilters = () => {
    const defaultFilters: DashboardFilters = {
      startDate: subDays(new Date(), 60),
      endDate: new Date(),
      processor: undefined,
      paymentMethod: undefined,
      country: undefined,
    }
    setDateRange({ from: defaultFilters.startDate, to: defaultFilters.endDate })
    onFilterChange(defaultFilters)
  }

  const hasActiveFilters =
    filters.processor || filters.paymentMethod || filters.country

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
      {/* Date Range Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[280px] justify-start text-left font-normal',
              !dateRange.from && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'LLL dd, y')} -{' '}
                  {format(dateRange.to, 'LLL dd, y')}
                </>
              ) : (
                format(dateRange.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={dateRange.from}
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={(range) =>
              handleDateRangeChange({ from: range?.from, to: range?.to })
            }
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {/* Processor Filter */}
      <Select
        value={filters.processor || 'all'}
        onValueChange={handleProcessorChange}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Processor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Processors</SelectItem>
          {PROCESSORS.map((processor) => (
            <SelectItem key={processor} value={processor}>
              {processor}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Payment Method Filter */}
      <Select
        value={filters.paymentMethod || 'all'}
        onValueChange={handlePaymentMethodChange}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Payment Method" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Methods</SelectItem>
          {PAYMENT_METHODS.map((method) => (
            <SelectItem key={method} value={method}>
              {method}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Country Filter */}
      <Select
        value={filters.country || 'all'}
        onValueChange={handleCountryChange}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Country" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Countries</SelectItem>
          {COUNTRIES.map((country) => (
            <SelectItem key={country.code} value={country.code}>
              {country.name} ({country.currency})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="text-muted-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  )
}
