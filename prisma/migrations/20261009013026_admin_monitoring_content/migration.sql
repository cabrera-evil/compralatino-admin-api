-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "processed_events" (
    "event_id" UUID NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_events_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "order_snapshots" (
    "order_id" INTEGER NOT NULL,
    "user_id" INTEGER,
    "status" "OrderStatus" NOT NULL,
    "status_at" TIMESTAMP(3) NOT NULL,
    "total_amount" DECIMAL(10,2),
    "order_date" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_snapshots_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "registered_users" (
    "user_id" INTEGER NOT NULL,
    "registered_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registered_users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "content_entries" (
    "id" SERIAL NOT NULL,
    "section" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "data" JSONB NOT NULL,

    CONSTRAINT "content_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_snapshots_status_idx" ON "order_snapshots"("status");

-- CreateIndex
CREATE INDEX "order_snapshots_order_date_idx" ON "order_snapshots"("order_date");

-- CreateIndex
CREATE INDEX "content_entries_section_position_idx" ON "content_entries"("section", "position");

-- CreateIndex
CREATE UNIQUE INDEX "content_entries_section_key_key" ON "content_entries"("section", "key");
