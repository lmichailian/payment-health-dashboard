# CLAUDE.md

This file provides guidance to Claude Code when working with the Payment Health Dashboard codebase.

## Project Overview

Payment Health Dashboard for Meraki Pharmacy - monitors authorization rates, tracks transaction health across 4 PSPs, 3 countries (BR, MX, CO), and multiple payment methods (Cards, PIX, OXXO, PSE).

**Tech Stack:**
- Next.js 16 with App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui components
- PostgreSQL with Prisma ORM
- React Query for data fetching
- Recharts for visualizations
- Docker for database
- next-themes for dark mode

## Common Commands

```bash
# Development
npm run dev              # Start Next.js dev server (http://localhost:3000)

# Database
docker compose up -d     # Start PostgreSQL and Adminer
docker compose down      # Stop containers
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run migrations
npm run db:seed          # Seed with test data
npm run db:studio        # Open Prisma Studio

# Build & Lint
npm run build            # Production build
npm run lint             # ESLint
```

## Project Structure

```
payment-health-dashboard/
├── prisma/
│   ├── schema.prisma    # Database schema (5 tables)
│   └── seed.ts          # Generates 60 days of realistic data
├── src/
│   ├── app/
│   │   ├── api/         # API routes
│   │   │   ├── metrics/ # Authorization rate, trends, by-processor, etc.
│   │   │   ├── alerts/  # Alert management
│   │   │   └── transactions/
│   │   ├── page.tsx     # Main dashboard page
│   │   └── layout.tsx   # Root layout with providers
│   ├── components/
│   │   ├── dashboard/   # Dashboard-specific components
│   │   │   ├── AuthorizationRateCard.tsx
│   │   │   ├── TrendChart.tsx
│   │   │   ├── ProcessorComparisonChart.tsx
│   │   │   ├── PaymentMethodBreakdown.tsx
│   │   │   ├── GeographicBreakdown.tsx
│   │   │   ├── DeclineReasonsChart.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   └── AlertsBanner.tsx
│   │   ├── shared/      # Reusable components (ThemeToggle, ErrorState, etc.)
│   │   └── ui/          # shadcn/ui components
│   ├── hooks/           # React Query hooks
│   ├── lib/             # Utilities (prisma client, health calculations)
│   ├── providers/       # React context providers (QueryProvider, ThemeProvider)
│   └── types/           # TypeScript types
└── docker-compose.yml   # PostgreSQL + Adminer
```

## Database Schema

### Key Tables
- **transactions** - Raw transaction data with indexes
- **aggregated_metrics** - Pre-computed daily summaries (hourBucket=-1 for daily)
- **decline_reason_stats** - Aggregated decline reasons
- **alert_configurations** - Alert rules
- **alert_history** - Triggered alerts

### Important Notes
- `hourBucket: -1` is used as sentinel value for daily aggregations (not null)
- Auth rate formula: `approved / (approved + declined + failed) * 100` (excludes pending)

## API Endpoints

All endpoints support query params: `start_date`, `end_date`, `processor`, `payment_method`, `country`

| Endpoint | Description |
|----------|-------------|
| GET `/api/metrics/authorization-rate` | Overall KPIs with trend |
| GET `/api/metrics/by-processor` | Auth rate per PSP |
| GET `/api/metrics/by-payment-method` | Auth rate per method |
| GET `/api/metrics/by-country` | Auth rate per country |
| GET `/api/metrics/trends` | 60-day time series |
| GET `/api/metrics/decline-reasons` | Top decline reasons |
| GET `/api/alerts` | Active/resolved alerts |
| PATCH `/api/alerts` | Resolve an alert |

## Health Status Thresholds

```typescript
// src/lib/health.ts
if (rate >= 85) return 'excellent'  // Green
if (rate >= 80) return 'warning'    // Yellow/Amber
return 'critical'                    // Red
```

## Environment Variables

Required in `.env`:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/payment_health?schema=public"
```

## Testing Data

The seed script generates:
- ~500 transactions/day for 60 days (~30,000 total)
- 4 PSPs: Stripe, Adyen, dLocal, PayU
- 3 Countries: BR (BRL), MX (MXN), CO (COP)
- Payment Methods: CARD, PIX (BR), OXXO (MX), PSE (CO)
- Auth rate degrades over time to simulate issues
- Realistic decline reasons with weighted distribution

## Development Workflow

1. Ensure Docker is running: `docker compose up -d`
2. Start dev server: `npm run dev`
3. Dashboard at http://localhost:3000
4. Adminer (DB UI) at http://localhost:8080

## Dark Mode / Theming

The dashboard supports Light, Dark, and System themes via `next-themes`.

**Key files:**
- `src/providers/ThemeProvider.tsx` - Theme context wrapper
- `src/components/shared/ThemeToggle.tsx` - Dropdown toggle component
- `src/app/globals.css` - CSS variables for light/dark themes

**Theme toggle location:** Dashboard header (top-right)

**How it works:**
- `ThemeProvider` wraps the app with `attribute="class"`
- Adds `.dark` class to `<html>` element when dark mode is active
- CSS variables in `globals.css` change based on `.dark` class

## Key Dependencies

- `@tanstack/react-query` - Server state management
- `recharts` - Charts and visualizations
- `prisma` / `@prisma/client` - Database ORM
- `date-fns` - Date utilities
- `lucide-react` - Icons
- `next-themes` - Dark mode / theme management
- shadcn/ui components (button, card, select, calendar, dropdown-menu, etc.)
