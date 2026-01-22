-- CreateTable
CREATE TABLE "vendor_tags" (
    "id" SERIAL NOT NULL,
    "tenant_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "vendor_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_stats" (
    "id" SERIAL NOT NULL,
    "vendor_id" INTEGER NOT NULL,
    "total_purchases" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_paid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "last_purchase_date" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_VendorToVendorTag" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "vendor_tags_tenant_id_name_key" ON "vendor_tags"("tenant_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_stats_vendor_id_key" ON "vendor_stats"("vendor_id");

-- CreateIndex
CREATE UNIQUE INDEX "_VendorToVendorTag_AB_unique" ON "_VendorToVendorTag"("A", "B");

-- CreateIndex
CREATE INDEX "_VendorToVendorTag_B_index" ON "_VendorToVendorTag"("B");

-- CreateIndex
CREATE INDEX "vendors_name_idx" ON "vendors"("name");

-- AddForeignKey
ALTER TABLE "vendor_tags" ADD CONSTRAINT "vendor_tags_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_stats" ADD CONSTRAINT "vendor_stats_vendor_id_fkey" FOREIGN KEY ("vendor_id") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VendorToVendorTag" ADD CONSTRAINT "_VendorToVendorTag_A_fkey" FOREIGN KEY ("A") REFERENCES "vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_VendorToVendorTag" ADD CONSTRAINT "_VendorToVendorTag_B_fkey" FOREIGN KEY ("B") REFERENCES "vendor_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
