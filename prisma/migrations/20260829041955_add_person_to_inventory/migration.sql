-- AlterTable
ALTER TABLE "InventoryBatch" ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerUserId" TEXT,
ADD COLUMN     "registeredByEmail" TEXT,
ADD COLUMN     "registeredByName" TEXT,
ADD COLUMN     "registeredByUserId" TEXT;

-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerUserId" TEXT,
ADD COLUMN     "registeredByEmail" TEXT,
ADD COLUMN     "registeredByName" TEXT,
ADD COLUMN     "registeredByUserId" TEXT;

-- CreateIndex
CREATE INDEX "InventoryMovement_registeredByUserId_idx" ON "InventoryMovement"("registeredByUserId");

-- CreateIndex
CREATE INDEX "InventoryMovement_customerUserId_idx" ON "InventoryMovement"("customerUserId");

-- AddForeignKey
ALTER TABLE "InventoryBatch" ADD CONSTRAINT "InventoryBatch_registeredByUserId_fkey" FOREIGN KEY ("registeredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBatch" ADD CONSTRAINT "InventoryBatch_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_registeredByUserId_fkey" FOREIGN KEY ("registeredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
