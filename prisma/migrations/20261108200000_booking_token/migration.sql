-- Random secret for visitor links. Existing bookings get a random UUID (built into PostgreSQL 13+).
ALTER TABLE "Booking" ADD COLUMN "token" TEXT;
UPDATE "Booking" SET "token" = gen_random_uuid()::text WHERE "token" IS NULL;
ALTER TABLE "Booking" ALTER COLUMN "token" SET NOT NULL;
CREATE UNIQUE INDEX "Booking_token_key" ON "Booking"("token");
