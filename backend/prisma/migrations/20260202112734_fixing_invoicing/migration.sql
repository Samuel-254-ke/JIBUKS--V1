/*
  Warnings:

  - You are about to drop the `_InvoicePaymentToJournal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_InvoiceToJournal` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "TransactionType" ADD VALUE 'LIABILITY_INC';
ALTER TYPE "TransactionType" ADD VALUE 'LIABILITY_DEC';

-- DropForeignKey
ALTER TABLE "_InvoicePaymentToJournal" DROP CONSTRAINT "_InvoicePaymentToJournal_A_fkey";

-- DropForeignKey
ALTER TABLE "_InvoicePaymentToJournal" DROP CONSTRAINT "_InvoicePaymentToJournal_B_fkey";

-- DropForeignKey
ALTER TABLE "_InvoiceToJournal" DROP CONSTRAINT "_InvoiceToJournal_A_fkey";

-- DropForeignKey
ALTER TABLE "_InvoiceToJournal" DROP CONSTRAINT "_InvoiceToJournal_B_fkey";

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "alternate_phone" TEXT,
ADD COLUMN     "business_type" TEXT,
ADD COLUMN     "company_name" TEXT,
ADD COLUMN     "contact_person" TEXT,
ADD COLUMN     "first_sale_date" TIMESTAMP(3),
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "last_sale_date" TIMESTAMP(3),
ADD COLUMN     "position" TEXT,
ADD COLUMN     "tax_id" TEXT,
ADD COLUMN     "total_sales" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "fixed_assets" ADD COLUMN     "quantity" DECIMAL(65,30) DEFAULT 1,
ADD COLUMN     "unitCost" DECIMAL(65,30);

-- DropTable
DROP TABLE "_InvoicePaymentToJournal";

-- DropTable
DROP TABLE "_InvoiceToJournal";

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "borrower_name" TEXT NOT NULL,
    "phone_number" TEXT,
    "type" TEXT NOT NULL,
    "principal_amount" DECIMAL(10,2) NOT NULL,
    "balance" DECIMAL(10,2) NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3),
    "account_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loan_transactions" (
    "id" TEXT NOT NULL,
    "loan_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "type" TEXT NOT NULL,
    "journal_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loans_tenant_id_idx" ON "loans"("tenant_id");

-- CreateIndex
CREATE INDEX "loan_transactions_loan_id_idx" ON "loan_transactions"("loan_id");

-- CreateIndex
CREATE INDEX "customers_company_name_idx" ON "customers"("company_name");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_tax_number_idx" ON "customers"("tax_number");

-- CreateIndex
CREATE INDEX "customers_business_type_idx" ON "customers"("business_type");

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_transactions" ADD CONSTRAINT "loan_transactions_loan_id_fkey" FOREIGN KEY ("loan_id") REFERENCES "loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loan_transactions" ADD CONSTRAINT "loan_transactions_journal_id_fkey" FOREIGN KEY ("journal_id") REFERENCES "journals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
