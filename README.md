# Payment Health Dashboard

A real-time payment authorization monitoring dashboard for Meraki Pharmacy. Track transaction health across multiple payment processors, countries, and payment methods with actionable insights and alerts.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?logo=tailwind-css)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791?logo=postgresql)

## Features

- **Real-time Authorization Rate Monitoring** - Track overall auth rate with health indicators
- **Multi-PSP Comparison** - Compare performance across Stripe, Adyen, dLocal, and PayU
- **Geographic Insights** - Monitor auth rates by country (Brazil, Mexico, Colombia)
- **Payment Method Analysis** - Track Cards, PIX, OXXO, PSE performance
- **Decline Reason Analysis** - Identify top decline reasons with actionable insights
- **Smart Alerts** - Automated alerts when auth rate drops below thresholds
- **Flexible Filtering** - Filter by date range, processor, payment method, and country
- **60-Day Trend Analysis** - Visualize historical performance trends

## Health Indicators

| Status | Auth Rate | Color | Action |
|--------|-----------|-------|--------|
| Excellent | ≥ 85% | 🟢 Green | Healthy - no action needed |
| Warning | 80-85% | 🟡 Amber | Monitor closely |
| Critical | < 80% | 🔴 Red | Immediate investigation required |

## Quick Start

### Prerequisites

- Node.js 18+
- Docker and Docker Compose
- npm or yarn

### Installation

1. **Clone and install dependencies**
   ```bash
   cd payment-health-dashboard
   npm install
   ```

2. **Start the database**
   ```bash
   docker compose up -d
   ```

3. **Set up environment variables**
   ```bash
   # Create .env file with:
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/payment_health?schema=public"
   ```

4. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

5. **Seed with test data** (generates 60 days of realistic transactions)
   ```bash
   npm run db:seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open the dashboard**
   ```
   http://localhost:3000
   ```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Frontend                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐│
│  │  Dashboard  │ │   Charts    │ │      Filter Bar         ││
│  │    KPIs     │ │  (Recharts) │ │  (Date, PSP, Country)   ││
│  └─────────────┘ └─────────────┘ └─────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Query Layer                         │
│            (Caching, Refetching, Loading States)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js API Routes                         │
│  /api/metrics/authorization-rate  │  /api/metrics/trends    │
│  /api/metrics/by-processor        │  /api/metrics/decline   │
│  /api/alerts                      │  /api/transactions      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   PostgreSQL + Prisma                        │
│  ┌──────────────┐ ┌───────────────────┐ ┌────────────────┐  │
│  │ transactions │ │ aggregated_metrics│ │ alert_history  │  │
│  │   (raw)      │ │  (pre-computed)   │ │   (alerts)     │  │
│  └──────────────┘ └───────────────────┘ └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## API Reference

### Metrics Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/metrics/authorization-rate` | GET | Overall authorization rate with trend |
| `/api/metrics/by-processor` | GET | Auth rate breakdown by PSP |
| `/api/metrics/by-payment-method` | GET | Auth rate breakdown by payment method |
| `/api/metrics/by-country` | GET | Auth rate breakdown by country |
| `/api/metrics/trends` | GET | Daily auth rate for trend chart |
| `/api/metrics/decline-reasons` | GET | Top decline reasons with counts |

### Query Parameters

All metrics endpoints support:

| Parameter | Type | Description |
|-----------|------|-------------|
| `start_date` | ISO Date | Start of date range |
| `end_date` | ISO Date | End of date range |
| `processor` | String | Filter by PSP (Stripe, Adyen, dLocal, PayU) |
| `payment_method` | String | Filter by method (CARD, PIX, OXXO, PSE) |
| `country` | String | Filter by country code (BR, MX, CO) |

### Example Request

```bash
curl "http://localhost:3000/api/metrics/authorization-rate?processor=Stripe&country=BR"
```

### Example Response

```json
{
  "data": {
    "authRate": 90.04,
    "totalAttempts": 7496,
    "approvedCount": 6606,
    "declinedCount": 577,
    "failedCount": 169,
    "pendingCount": 144,
    "trend": {
      "direction": "up",
      "changePercent": 2.3,
      "previousPeriodRate": 87.74
    },
    "healthStatus": "excellent"
  }
}
```

## Configuration

### Payment Processors

| Processor | Base Auth Rate | Notes |
|-----------|---------------|-------|
| Stripe | ~92% | Best performer |
| Adyen | ~88% | Good reliability |
| dLocal | ~85% | LATAM specialist |
| PayU | ~82% | Regional coverage |

### Supported Countries

| Country | Code | Currency | Payment Methods |
|---------|------|----------|-----------------|
| Brazil | BR | BRL | CARD, PIX |
| Mexico | MX | MXN | CARD, OXXO |
| Colombia | CO | COP | CARD, PSE |

### Alert Thresholds

| Severity | Condition | Action |
|----------|-----------|--------|
| Critical | Auth rate < 80% | Immediate investigation |
| Warning | Auth rate < 85% | Monitor closely |

## Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload

# Database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run pending migrations
npm run db:seed      # Seed database with test data
npm run db:studio    # Open Prisma Studio GUI

# Production
npm run build        # Build for production
npm run start        # Start production server

# Quality
npm run lint         # Run ESLint
```

## Project Structure

```
src/
├── app/
│   ├── api/              # API route handlers
│   │   ├── metrics/      # Metrics endpoints
│   │   ├── alerts/       # Alert management
│   │   └── transactions/ # Transaction CRUD
│   ├── page.tsx          # Main dashboard
│   └── layout.tsx        # Root layout
├── components/
│   ├── dashboard/        # Dashboard components
│   │   ├── AuthorizationRateCard.tsx
│   │   ├── TrendChart.tsx
│   │   ├── ProcessorComparisonChart.tsx
│   │   ├── PaymentMethodBreakdown.tsx
│   │   ├── GeographicBreakdown.tsx
│   │   ├── DeclineReasonsChart.tsx
│   │   ├── FilterBar.tsx
│   │   └── AlertsBanner.tsx
│   ├── shared/           # Reusable components
│   └── ui/               # shadcn/ui components
├── hooks/                # React Query hooks
├── lib/                  # Utilities
└── types/                # TypeScript definitions
```

## Database Schema

### Core Tables

| Table | Purpose |
|-------|---------|
| `transactions` | Raw transaction records with full details |
| `aggregated_metrics` | Pre-computed daily summaries for fast queries |
| `decline_reason_stats` | Aggregated decline reasons by category |
| `alert_configurations` | Alert threshold settings |
| `alert_history` | Log of triggered alerts |

### Authorization Rate Formula

```
Auth Rate = approved / (approved + declined + failed) × 100
```

> **Note**: Pending transactions are excluded from the calculation as they haven't reached a terminal state.

## Performance

### Optimization Strategies

1. **Pre-aggregated Metrics** - Daily summaries computed in advance
2. **Composite Indexes** - Optimized for common query patterns
3. **React Query Caching** - 1-minute stale time with background refetching
4. **Skeleton Loading** - Charts load independently for better UX

### Query Performance

| Query | Target | Typical |
|-------|--------|---------|
| Authorization Rate | < 200ms | ~50ms |
| 60-day Trends | < 500ms | ~100ms |
| Processor Comparison | < 300ms | ~80ms |

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps

# View database logs
docker logs payment-health-db

# Restart containers
docker compose down && docker compose up -d
```

### No Data Showing

```bash
# Re-run the seed script
npm run db:seed

# Verify data exists
npm run db:studio
```

### Port Already in Use

```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Next.js 16](https://nextjs.org/) | React framework with App Router |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) | Accessible UI components |
| [Recharts](https://recharts.org/) | Charts and visualizations |
| [React Query](https://tanstack.com/query) | Server state management |
| [Prisma](https://www.prisma.io/) | Type-safe database ORM |
| [PostgreSQL](https://www.postgresql.org/) | Relational database |
| [Docker](https://www.docker.com/) | Container orchestration |

## Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Dashboard | http://localhost:3000 | - |
| PostgreSQL | localhost:5432 | postgres/postgres |
| Adminer (DB UI) | http://localhost:8080 | postgres/postgres |

## License

MIT

---

Built for Meraki Pharmacy
