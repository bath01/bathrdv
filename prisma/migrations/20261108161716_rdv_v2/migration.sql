/*
  Warnings:

  - Added the required column `phone` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "cancelledBy" TEXT,
ADD COLUMN     "phone" TEXT NOT NULL,
ALTER COLUMN "email" DROP NOT NULL;

-- AlterTable
ALTER TABLE "EventType" ADD COLUMN     "location" TEXT;

-- CreateTable
CREATE TABLE "BlockedDate" (
    "id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "reason" TEXT,

    CONSTRAINT "BlockedDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "businessName" TEXT NOT NULL DEFAULT 'BATHRDV',
    "phone" TEXT,
    "minNoticeHours" INTEGER NOT NULL DEFAULT 2,
    "bufferMinutes" INTEGER NOT NULL DEFAULT 0,
    "bookingWindowDays" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BlockedDate_date_key" ON "BlockedDate"("date");
