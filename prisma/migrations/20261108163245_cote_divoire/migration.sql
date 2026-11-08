-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "address" TEXT,
ADD COLUMN     "attended" BOOLEAN,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "paymentRef" TEXT;

-- AlterTable
ALTER TABLE "EventType" ADD COLUMN     "atHome" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deposit" INTEGER,
ADD COLUMN     "price" INTEGER;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "address" TEXT,
ADD COLUMN     "moovMoneyNumber" TEXT,
ADD COLUMN     "mtnMoneyNumber" TEXT,
ADD COLUMN     "orangeMoneyNumber" TEXT,
ADD COLUMN     "pendingMinutes" INTEGER NOT NULL DEFAULT 60,
ADD COLUMN     "waveNumber" TEXT;

-- CreateIndex
CREATE INDEX "Booking_phone_idx" ON "Booking"("phone");
