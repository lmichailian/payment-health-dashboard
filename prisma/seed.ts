import { PrismaClient, TransactionStatus } from '@prisma/client'
import { subDays, startOfDay, addHours, format } from 'date-fns'

const prisma = new PrismaClient()

// Configuration
const DAYS_TO_GENERATE = 60
const TRANSACTIONS_PER_DAY = 500 // Reduced for faster seeding (scale up to 15000 for production)
const BATCH_SIZE = 1000

// PSPs with their base authorization rates (will degrade over time)
const PROCESSORS = [
  { name: 'Stripe', baseAuthRate: 0.92 },
  { name: 'Adyen', baseAuthRate: 0.88 },
  { name: 'dLocal', baseAuthRate: 0.85 },
  { name: 'PayU', baseAuthRate: 0.82 },
]

// Countries with currencies and weights
const COUNTRIES = [
  { code: 'BR', currency: 'BRL', weight: 0.4 },
  { code: 'MX', currency: 'MXN', weight: 0.35 },
  { code: 'CO', currency: 'COP', weight: 0.25 },
]

// Payment methods with their availability by country
const PAYMENT_METHODS = [
  { name: 'CARD', countries: ['BR', 'MX', 'CO'], weight: 0.6 },
  { name: 'PIX', countries: ['BR'], weight: 0.25 },
  { name: 'OXXO', countries: ['MX'], weight: 0.25 },
  { name: 'PSE', countries: ['CO'], weight: 0.25 },
]

// Decline reasons with weights
const DECLINE_REASONS = [
  { reason: 'insufficient_funds', weight: 0.35 },
  { reason: 'do_not_honor', weight: 0.2 },
  { reason: 'expired_card', weight: 0.12 },
  { reason: 'invalid_card', weight: 0.1 },
  { reason: 'fraud_suspected', weight: 0.08 },
  { reason: 'card_not_supported', weight: 0.05 },
  { reason: 'processing_error', weight: 0.04 },
  { reason: 'limit_exceeded', weight: 0.03 },
  { reason: 'stolen_card', weight: 0.02 },
  { reason: 'lost_card', weight: 0.01 },
]

// Helper functions
function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0)
  let random = Math.random() * totalWeight
  for (const item of items) {
    random -= item.weight
    if (random <= 0) return item
  }
  return items[items.length - 1]
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateTransactionId(): string {
  return `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 11).toUpperCase()}`
}

function getPaymentMethodsForCountry(country: string) {
  return PAYMENT_METHODS.filter((pm) => pm.countries.includes(country))
}

function getDeclineReason(): string {
  return weightedRandom(DECLINE_REASONS).reason
}

// Calculate auth rate with time decay (to simulate degradation)
function getAdjustedAuthRate(baseRate: number, dayIndex: number, totalDays: number): number {
  // Degrade auth rate over time (newer days = lower rate)
  // This simulates a problem that needs investigation
  const degradationFactor = 1 - (dayIndex / totalDays) * 0.08 // Up to 8% degradation
  const dailyVariance = (Math.random() - 0.5) * 0.04 // +/- 2% daily variance
  return Math.max(0.7, Math.min(0.98, baseRate * degradationFactor + dailyVariance))
}

// Generate amount based on payment method and country
function generateAmount(paymentMethod: string, currency: string): number {
  const baseAmounts: Record<string, { min: number; max: number }> = {
    BRL: { min: 50, max: 5000 },
    MXN: { min: 200, max: 20000 },
    COP: { min: 20000, max: 2000000 },
  }
  const range = baseAmounts[currency] || { min: 10, max: 1000 }

  // Cards tend to have higher values
  const multiplier = paymentMethod === 'CARD' ? 1.5 : 1
  return parseFloat((randomInRange(range.min, range.max) * multiplier).toFixed(4))
}

async function generateTransactions() {
  console.log('Starting seed data generation...')
  console.log(`Generating ${DAYS_TO_GENERATE} days of data with ~${TRANSACTIONS_PER_DAY} transactions/day`)

  const now = new Date()
  let totalTransactions = 0
  let batch: Parameters<typeof prisma.transaction.createMany>[0]['data'] = []

  for (let dayOffset = DAYS_TO_GENERATE - 1; dayOffset >= 0; dayOffset--) {
    const dayDate = startOfDay(subDays(now, dayOffset))
    const dayIndex = DAYS_TO_GENERATE - 1 - dayOffset // 0 = oldest, DAYS_TO_GENERATE-1 = newest

    // Vary transactions per day (+/- 20%)
    const dailyTransactions = Math.floor(TRANSACTIONS_PER_DAY * (0.8 + Math.random() * 0.4))

    for (let i = 0; i < dailyTransactions; i++) {
      const processor = weightedRandom(PROCESSORS.map((p) => ({ ...p, weight: 1 })))
      const country = weightedRandom(COUNTRIES)
      const availablePaymentMethods = getPaymentMethodsForCountry(country.code)
      const paymentMethod = weightedRandom(availablePaymentMethods)

      // Calculate adjusted auth rate for this processor/day combination
      const adjustedAuthRate = getAdjustedAuthRate(processor.baseAuthRate, dayIndex, DAYS_TO_GENERATE)

      // Determine status based on adjusted auth rate
      let status: TransactionStatus
      let declineReason: string | null = null

      const rand = Math.random()
      if (rand < adjustedAuthRate) {
        status = 'approved'
      } else if (rand < adjustedAuthRate + 0.02) {
        status = 'pending' // Small percentage stays pending
      } else if (rand < adjustedAuthRate + 0.04) {
        status = 'failed'
        declineReason = 'processing_error'
      } else {
        status = 'declined'
        declineReason = getDeclineReason()
      }

      // Generate timestamp within the day (distributed across 24 hours)
      const hourOffset = Math.floor(Math.random() * 24)
      const minuteOffset = Math.floor(Math.random() * 60)
      const timestamp = addHours(dayDate, hourOffset + minuteOffset / 60)

      batch.push({
        transactionId: generateTransactionId(),
        amount: generateAmount(paymentMethod.name, country.currency),
        currency: country.currency,
        status,
        processor: processor.name,
        paymentMethod: paymentMethod.name,
        country: country.code,
        declineReason,
        createdAt: timestamp,
        receivedAt: timestamp,
      })

      // Insert in batches
      if (batch.length >= BATCH_SIZE) {
        await prisma.transaction.createMany({ data: batch })
        totalTransactions += batch.length
        console.log(`  Inserted ${totalTransactions} transactions...`)
        batch = []
      }
    }

    console.log(`Day ${format(dayDate, 'yyyy-MM-dd')}: Generated ${dailyTransactions} transactions`)
  }

  // Insert remaining transactions
  if (batch.length > 0) {
    await prisma.transaction.createMany({ data: batch })
    totalTransactions += batch.length
  }

  console.log(`\nTotal transactions created: ${totalTransactions}`)
  return totalTransactions
}

async function generateAggregatedMetrics() {
  console.log('\nGenerating aggregated metrics...')

  // Get date range
  const oldestTransaction = await prisma.transaction.findFirst({
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  })

  if (!oldestTransaction) {
    console.log('No transactions found, skipping aggregation')
    return
  }

  const startDate = startOfDay(oldestTransaction.createdAt)
  const endDate = startOfDay(new Date())

  // Aggregate by day, processor, payment method, and country
  const aggregations = await prisma.$queryRaw<Array<{
    date_bucket: Date
    processor: string
    payment_method: string
    country: string
    total_attempts: bigint
    approved_count: bigint
    declined_count: bigint
    failed_count: bigint
    pending_count: bigint
    total_amount: number
    approved_amount: number
  }>>`
    SELECT
      DATE(created_at) as date_bucket,
      processor,
      payment_method,
      country,
      COUNT(*) as total_attempts,
      COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
      COUNT(*) FILTER (WHERE status = 'declined') as declined_count,
      COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
      COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
      COALESCE(SUM(amount), 0) as total_amount,
      COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0) as approved_amount
    FROM transactions
    GROUP BY DATE(created_at), processor, payment_method, country
    ORDER BY date_bucket DESC, processor, payment_method, country
  `

  console.log(`Found ${aggregations.length} aggregation groups`)

  // Insert aggregated metrics using createMany for better performance
  // Use -1 for hourBucket to represent daily aggregations (hourBucket is nullable but unique constraint needs a value)
  const metricsToInsert = aggregations.map((agg) => ({
    dateBucket: agg.date_bucket,
    hourBucket: -1, // Sentinel value for daily aggregations
    processor: agg.processor,
    paymentMethod: agg.payment_method,
    country: agg.country,
    totalAttempts: Number(agg.total_attempts),
    approvedCount: Number(agg.approved_count),
    declinedCount: Number(agg.declined_count),
    failedCount: Number(agg.failed_count),
    pendingCount: Number(agg.pending_count),
    totalAmount: agg.total_amount,
    approvedAmount: agg.approved_amount,
  }))

  // Insert in batches
  const METRICS_BATCH_SIZE = 500
  for (let i = 0; i < metricsToInsert.length; i += METRICS_BATCH_SIZE) {
    const batch = metricsToInsert.slice(i, i + METRICS_BATCH_SIZE)
    await prisma.aggregatedMetric.createMany({
      data: batch,
      skipDuplicates: true,
    })
  }

  console.log('Aggregated metrics generated successfully')
}

async function generateDeclineReasonStats() {
  console.log('\nGenerating decline reason statistics...')

  const declineStats = await prisma.$queryRaw<Array<{
    date_bucket: Date
    processor: string
    payment_method: string
    country: string
    decline_reason: string
    occurrences: bigint
  }>>`
    SELECT
      DATE(created_at) as date_bucket,
      processor,
      payment_method,
      country,
      decline_reason,
      COUNT(*) as occurrences
    FROM transactions
    WHERE status = 'declined' AND decline_reason IS NOT NULL
    GROUP BY DATE(created_at), processor, payment_method, country, decline_reason
    ORDER BY date_bucket DESC, occurrences DESC
  `

  console.log(`Found ${declineStats.length} decline reason groups`)

  // Calculate percentages per day
  const dailyTotals = new Map<string, number>()
  for (const stat of declineStats) {
    const key = `${format(stat.date_bucket, 'yyyy-MM-dd')}-${stat.processor}-${stat.payment_method}-${stat.country}`
    dailyTotals.set(key, (dailyTotals.get(key) || 0) + Number(stat.occurrences))
  }

  // Build data for createMany
  const declineStatsToInsert = declineStats.map((stat) => {
    const key = `${format(stat.date_bucket, 'yyyy-MM-dd')}-${stat.processor}-${stat.payment_method}-${stat.country}`
    const total = dailyTotals.get(key) || 1
    const percentage = (Number(stat.occurrences) / total) * 100

    return {
      dateBucket: stat.date_bucket,
      processor: stat.processor,
      paymentMethod: stat.payment_method,
      country: stat.country,
      declineReason: stat.decline_reason,
      occurrences: Number(stat.occurrences),
      percentage,
    }
  })

  // Insert in batches
  const DECLINE_BATCH_SIZE = 500
  for (let i = 0; i < declineStatsToInsert.length; i += DECLINE_BATCH_SIZE) {
    const batch = declineStatsToInsert.slice(i, i + DECLINE_BATCH_SIZE)
    await prisma.declineReasonStat.createMany({
      data: batch,
      skipDuplicates: true,
    })
  }

  console.log('Decline reason statistics generated successfully')
}

async function createDefaultAlertConfiguration() {
  console.log('\nCreating default alert configurations...')

  const alertConfigs = [
    {
      alertName: 'Low Authorization Rate - Critical',
      metricType: 'auth_rate',
      threshold: 80.0,
      evaluationWindowMinutes: 15,
      cooldownMinutes: 30,
    },
    {
      alertName: 'Low Authorization Rate - Warning',
      metricType: 'auth_rate',
      threshold: 85.0,
      evaluationWindowMinutes: 60,
      cooldownMinutes: 60,
    },
  ]

  for (const config of alertConfigs) {
    await prisma.alertConfiguration.upsert({
      where: { id: alertConfigs.indexOf(config) + 1 },
      create: config,
      update: config,
    })
  }

  console.log('Alert configurations created successfully')
}

async function checkAndGenerateAlerts() {
  console.log('\nChecking for alert conditions...')

  // Get current auth rate from recent transactions
  const recentMetrics = await prisma.$queryRaw<Array<{
    auth_rate: number
    total_attempts: bigint
  }>>`
    SELECT
      ROUND(
        COUNT(*) FILTER (WHERE status = 'approved')::numeric /
        NULLIF(COUNT(*) FILTER (WHERE status IN ('approved', 'declined', 'failed')), 0) * 100,
        2
      ) as auth_rate,
      COUNT(*) as total_attempts
    FROM transactions
    WHERE created_at >= NOW() - INTERVAL '24 hours'
  `

  if (recentMetrics.length > 0 && recentMetrics[0].auth_rate !== null) {
    const currentRate = Number(recentMetrics[0].auth_rate)
    console.log(`Current 24h authorization rate: ${currentRate}%`)

    // Check against alert thresholds
    const criticalThreshold = 80
    const warningThreshold = 85

    if (currentRate < criticalThreshold) {
      await prisma.alertHistory.create({
        data: {
          alertConfigId: 1,
          metricValue: currentRate,
          thresholdValue: criticalThreshold,
          severity: 'critical',
          message: `Authorization rate (${currentRate}%) has dropped below critical threshold (${criticalThreshold}%)`,
          isResolved: false,
        },
      })
      console.log('Created critical alert for low auth rate')
    } else if (currentRate < warningThreshold) {
      await prisma.alertHistory.create({
        data: {
          alertConfigId: 2,
          metricValue: currentRate,
          thresholdValue: warningThreshold,
          severity: 'warning',
          message: `Authorization rate (${currentRate}%) has dropped below warning threshold (${warningThreshold}%)`,
          isResolved: false,
        },
      })
      console.log('Created warning alert for low auth rate')
    }
  }
}

async function main() {
  console.log('='.repeat(60))
  console.log('Payment Health Dashboard - Seed Data Generator')
  console.log('='.repeat(60))

  try {
    // Clear existing data
    console.log('\nClearing existing data...')
    await prisma.alertHistory.deleteMany()
    await prisma.alertConfiguration.deleteMany()
    await prisma.declineReasonStat.deleteMany()
    await prisma.aggregatedMetric.deleteMany()
    await prisma.transaction.deleteMany()
    console.log('Existing data cleared')

    // Generate data
    await generateTransactions()
    await generateAggregatedMetrics()
    await generateDeclineReasonStats()
    await createDefaultAlertConfiguration()
    await checkAndGenerateAlerts()

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('Seed data generation complete!')
    console.log('='.repeat(60))

    const transactionCount = await prisma.transaction.count()
    const metricsCount = await prisma.aggregatedMetric.count()
    const declineStatsCount = await prisma.declineReasonStat.count()
    const alertCount = await prisma.alertHistory.count()

    console.log(`\nSummary:`)
    console.log(`  - Transactions: ${transactionCount}`)
    console.log(`  - Aggregated Metrics: ${metricsCount}`)
    console.log(`  - Decline Reason Stats: ${declineStatsCount}`)
    console.log(`  - Active Alerts: ${alertCount}`)

  } catch (error) {
    console.error('Error during seeding:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
