-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('approved', 'declined', 'pending', 'failed');

-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('critical', 'warning', 'info');

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "amount" DECIMAL(20,4) NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "processor" VARCHAR(100) NOT NULL,
    "payment_method" VARCHAR(50) NOT NULL,
    "country" CHAR(2) NOT NULL,
    "decline_reason" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aggregated_metrics" (
    "id" SERIAL NOT NULL,
    "date_bucket" DATE NOT NULL,
    "hour_bucket" SMALLINT,
    "processor" VARCHAR(100),
    "payment_method" VARCHAR(50),
    "country" CHAR(2),
    "total_attempts" INTEGER NOT NULL DEFAULT 0,
    "approved_count" INTEGER NOT NULL DEFAULT 0,
    "declined_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "pending_count" INTEGER NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(20,4),
    "approved_amount" DECIMAL(20,4),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aggregated_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decline_reason_stats" (
    "id" SERIAL NOT NULL,
    "date_bucket" DATE NOT NULL,
    "processor" VARCHAR(100),
    "payment_method" VARCHAR(50),
    "country" CHAR(2),
    "decline_reason" VARCHAR(255) NOT NULL,
    "occurrences" INTEGER NOT NULL DEFAULT 0,
    "percentage" DECIMAL(5,2),
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decline_reason_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_configurations" (
    "id" SERIAL NOT NULL,
    "alert_name" VARCHAR(255) NOT NULL,
    "metric_type" VARCHAR(50) NOT NULL,
    "threshold" DECIMAL(5,2) NOT NULL,
    "processor" VARCHAR(100),
    "payment_method" VARCHAR(50),
    "country" CHAR(2),
    "evaluation_window_minutes" INTEGER NOT NULL DEFAULT 60,
    "cooldown_minutes" INTEGER NOT NULL DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alert_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alert_history" (
    "id" SERIAL NOT NULL,
    "alert_config_id" INTEGER NOT NULL,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "metric_value" DECIMAL(5,2),
    "threshold_value" DECIMAL(5,2),
    "processor" VARCHAR(100),
    "payment_method" VARCHAR(50),
    "country" CHAR(2),
    "severity" "AlertSeverity" NOT NULL DEFAULT 'warning',
    "message" TEXT,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "alert_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transaction_id_key" ON "transactions"("transaction_id");

-- CreateIndex
CREATE INDEX "transactions_created_at_idx" ON "transactions"("created_at" DESC);

-- CreateIndex
CREATE INDEX "transactions_processor_created_at_idx" ON "transactions"("processor", "created_at");

-- CreateIndex
CREATE INDEX "transactions_payment_method_created_at_idx" ON "transactions"("payment_method", "created_at");

-- CreateIndex
CREATE INDEX "transactions_country_created_at_idx" ON "transactions"("country", "created_at");

-- CreateIndex
CREATE INDEX "transactions_status_created_at_idx" ON "transactions"("status", "created_at");

-- CreateIndex
CREATE INDEX "aggregated_metrics_date_bucket_processor_idx" ON "aggregated_metrics"("date_bucket" DESC, "processor");

-- CreateIndex
CREATE INDEX "aggregated_metrics_date_bucket_payment_method_idx" ON "aggregated_metrics"("date_bucket" DESC, "payment_method");

-- CreateIndex
CREATE INDEX "aggregated_metrics_date_bucket_country_idx" ON "aggregated_metrics"("date_bucket" DESC, "country");

-- CreateIndex
CREATE UNIQUE INDEX "aggregated_metrics_date_bucket_hour_bucket_processor_paymen_key" ON "aggregated_metrics"("date_bucket", "hour_bucket", "processor", "payment_method", "country");

-- CreateIndex
CREATE INDEX "decline_reason_stats_date_bucket_occurrences_idx" ON "decline_reason_stats"("date_bucket" DESC, "occurrences" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "decline_reason_stats_date_bucket_processor_payment_method_c_key" ON "decline_reason_stats"("date_bucket", "processor", "payment_method", "country", "decline_reason");

-- CreateIndex
CREATE INDEX "alert_history_triggered_at_idx" ON "alert_history"("triggered_at" DESC);

-- CreateIndex
CREATE INDEX "alert_history_is_resolved_triggered_at_idx" ON "alert_history"("is_resolved", "triggered_at" DESC);

-- AddForeignKey
ALTER TABLE "alert_history" ADD CONSTRAINT "alert_history_alert_config_id_fkey" FOREIGN KEY ("alert_config_id") REFERENCES "alert_configurations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
