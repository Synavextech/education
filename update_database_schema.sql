-- ==============================================================================
-- WorldDucationCentre Database Migration & Modernization Script
-- File: update_database_schema.sql
-- Purpose:
--   1. Fix ambiguous 'Booking' <-> 'User' relationship by removing cashCollectedBy FK.
--   2. Remove all Pay-on-Arrival / Cash structures.
--   3. Add M-Pesa STK Push tracking fields (Receipt, Phone, CheckoutRequestId).
--   4. Update default system currency to Kenya Shillings (KES).
--   5. Optimize indexes and Realtime replication.
-- ==============================================================================

-- 1. FIX AMBIGUOUS RELATIONSHIP & REMOVE CASH ON ARRIVAL FROM BOOKINGS
DO $$ 
BEGIN
    -- Drop foreign key constraint on cashCollectedBy if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Booking_cashCollectedBy_fkey' 
        AND table_name = 'Booking'
    ) THEN
        ALTER TABLE "Booking" DROP CONSTRAINT "Booking_cashCollectedBy_fkey";
    END IF;

    -- Drop cashCollectedBy column to prevent PostgREST embedding conflict
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Booking' AND column_name = 'cashCollectedBy'
    ) THEN
        ALTER TABLE "Booking" DROP COLUMN "cashCollectedBy";
    END IF;
END $$;

-- 2. ADD M-PESA TRACKING COLUMNS TO BOOKING
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "mpesaReceiptNumber" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "mpesaPhoneNumber" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "mpesaCheckoutRequestId" TEXT;

-- 3. CLEAN UP & UPDATE PAYMENT METHOD CONSTRAINTS
-- Update any historical CASH_ON_ARRIVAL records to avoid invalid state
UPDATE "Booking" 
SET "paymentMethod" = 'CARD' 
WHERE "paymentMethod" = 'CASH_ON_ARRIVAL';

UPDATE "Booking" 
SET status = 'PENDING' 
WHERE status = 'PENDING_PAYMENT_ON_ARRIVAL';

UPDATE "Booking" 
SET "paymentStatus" = 'UNPAID' 
WHERE "paymentStatus" = 'PAID_IN_CASH';

-- Alter default payment method to MPESA / CARD
ALTER TABLE "Booking" ALTER COLUMN "paymentMethod" SET DEFAULT 'MPESA';
ALTER TABLE "Booking" ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';

-- 4. UPDATE SYSTEM CURRENCY TO KENYA SHILLINGS (KES)
ALTER TABLE "Wallet" ALTER COLUMN currency SET DEFAULT 'KES';

-- Migrate existing USD wallets to KES
UPDATE "Wallet" 
SET currency = 'KES' 
WHERE currency = 'USD' OR currency IS NULL;

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_booking_user_id ON "Booking"("userId");
CREATE INDEX IF NOT EXISTS idx_booking_event_id ON "Booking"("eventId");
CREATE INDEX IF NOT EXISTS idx_booking_mpesa_checkout ON "Booking"("mpesaCheckoutRequestId");
CREATE INDEX IF NOT EXISTS idx_proposals_event_user ON "Proposals"("eventId", "userId");

-- 6. ENSURE REALTIME REPLICATION FOR BOOKINGS & NOTIFICATIONS
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE "Booking";
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Migration complete notification
COMMENT ON TABLE "Booking" IS 'Event bookings streamlined with M-Pesa, Card, and PayPal. Cash on arrival removed.';
