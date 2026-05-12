/*
  Warnings:

  - A unique constraint covering the columns `[tenant_id,barcode]` on the table `inventory_items` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('SERVICE', 'INVENTORY_ITEM', 'NON_INVENTORY_ITEM', 'BUNDLE', 'GOODS');

-- CreateEnum
CREATE TYPE "MovementReason" AS ENUM ('PURCHASE', 'SALE', 'CUSTOMER_RETURN', 'SUPPLIER_RETURN', 'DAMAGED', 'EXPIRED', 'THEFT', 'LOST', 'FOUND', 'COUNT_ADJUSTMENT', 'OPENING_STOCK', 'PRODUCTION', 'SAMPLE', 'TRANSFER_IN', 'TRANSFER_OUT');

-- CreateEnum
CREATE TYPE "MessagingSenderRole" AS ENUM ('ADMIN', 'CLIENT');

-- AlterEnum
ALTER TYPE "MovementType" ADD VALUE 'RETURN';

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- DropForeignKey
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_parent_id_fkey";

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "detail_type" TEXT;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "is_sub_category" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parent_id" INTEGER;

-- AlterTable
ALTER TABLE "inventory_items" ADD COLUMN     "barcode" TEXT,
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "created_by_id" INTEGER,
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "income_account_id" INTEGER,
ADD COLUMN     "is_purchasable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_sellable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_tax_inclusive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "max_stock_level" DECIMAL(65,30),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "min_selling_price" DECIMAL(65,30),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "product_type" "ProductType" NOT NULL DEFAULT 'INVENTORY_ITEM',
ADD COLUMN     "reorder_quantity" DECIMAL(65,30),
ADD COLUMN     "reserved_qty" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "tax_rate" DECIMAL(65,30) NOT NULL DEFAULT 16,
ADD COLUMN     "weighted_avg_cost" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "wholesale_price" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "stock_movements" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "qty_after" DECIMAL(65,30),
ADD COLUMN     "qty_before" DECIMAL(65,30),
ADD COLUMN     "reason" "MovementReason",
ADD COLUMN     "source_id" INTEGER,
ADD COLUMN     "source_type" TEXT,
ADD COLUMN     "total_value" DECIMAL(65,30),
ADD COLUMN     "wac_after" DECIMAL(65,30),
ADD COLUMN     "wac_before" DECIMAL(65,30);

-- CreateTable
CREATE TABLE "item_types" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_valuations" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "qty_before" DECIMAL(65,30) NOT NULL,
    "qty_after" DECIMAL(65,30) NOT NULL,
    "cost_before" DECIMAL(65,30) NOT NULL,
    "cost_after" DECIMAL(65,30) NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_valuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "organization" TEXT,
    "is_super_admin" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_messaging_conversations" (
    "id" TEXT NOT NULL,
    "client_user_id" INTEGER NOT NULL,
    "admin_last_read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_messaging_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_messaging_messages" (
    "id" SERIAL NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_role" "MessagingSenderRole" NOT NULL,
    "admin_id" INTEGER,
    "body" TEXT NOT NULL,
    "attachments" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_messaging_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_tasks" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'todo',
    "label" TEXT NOT NULL DEFAULT 'feature',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assignee" TEXT,
    "description" TEXT,
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "item_types_tenant_id_name_key" ON "item_types"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "item_types_tenant_id_code_key" ON "item_types"("tenant_id", "code");

-- CreateIndex
CREATE INDEX "inventory_valuations_item_id_idx" ON "inventory_valuations"("item_id");

-- CreateIndex
CREATE INDEX "inventory_valuations_date_idx" ON "inventory_valuations"("date");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_messaging_conversations_client_user_id_key" ON "admin_messaging_conversations"("client_user_id");

-- CreateIndex
CREATE INDEX "admin_messaging_conversations_updated_at_idx" ON "admin_messaging_conversations"("updated_at");

-- CreateIndex
CREATE INDEX "admin_messaging_messages_conversation_id_created_at_idx" ON "admin_messaging_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "inventory_items_product_type_idx" ON "inventory_items"("product_type");

-- CreateIndex
CREATE INDEX "inventory_items_category_idx" ON "inventory_items"("category");

-- CreateIndex
CREATE INDEX "inventory_items_is_active_idx" ON "inventory_items"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_tenant_id_barcode_key" ON "inventory_items"("tenant_id", "barcode");

-- CreateIndex
CREATE INDEX "stock_movements_source_type_source_id_idx" ON "stock_movements"("source_type", "source_id");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "accounts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_types" ADD CONSTRAINT "item_types_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_valuations" ADD CONSTRAINT "inventory_valuations_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_messaging_conversations" ADD CONSTRAINT "admin_messaging_conversations_client_user_id_fkey" FOREIGN KEY ("client_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_messaging_messages" ADD CONSTRAINT "admin_messaging_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "admin_messaging_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_messaging_messages" ADD CONSTRAINT "admin_messaging_messages_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
