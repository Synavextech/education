-- ==============================================================================
-- worlducationHub Master Database Schema & Production Setup Script
-- File: database_schema.sql
-- Description: Central single-source-of-truth SQL script for Supabase:
--   1. Extensions & Storage Buckets
--   2. Enums & Core Master Tables (User, Event, Booking)
--   3. Engagement Tracks (Proposals, Tech Exhibitions, Event Presentations, Interview Bookings, Applications)
--   4. Community, Media & Finance (Blog, Testimonial, Visa, Notifications, Wallet, Stats, Identity Verification)
--   5. Live Support Chat (SupportConversation, SupportMessage)
--   6. Schema Evolution & Migration Alignments (Safe for existing & new databases)
--   7. High-Performance Indexes
--   8. Automated Functions & Triggers
--   9. Row Level Security (RLS) & Granular Access Policies
--  10. Critical Initial Sync & Realtime Publications
-- ==============================================================================

-- ==============================================================================
-- 1. EXTENSIONS
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 2. STORAGE BUCKETS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('event-media', 'event-media', true),
  ('user-documents', 'user-documents', false),
  ('documents', 'documents', true),
  ('visa-documents', 'visa-documents', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- ==============================================================================
-- 3. ENUMS
-- ==============================================================================
DO $$ BEGIN
    CREATE TYPE role AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ==============================================================================
-- 4. CORE APPLICATION TABLES
-- ==============================================================================

-- User Profiles Table
CREATE TABLE IF NOT EXISTS "User" (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    country TEXT,
    city TEXT,
    address TEXT,
    role role DEFAULT 'USER',
    "institutionName" TEXT,
    "institutionAddress" TEXT,
    "headAdminName" TEXT,
    "institutionContact" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Events Table (Supports Multi-Locations, Child Age Streamlining, Proposals & Tracks)
CREATE TABLE IF NOT EXISTS "Event" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    theme TEXT,
    description TEXT NOT NULL,
    date TIMESTAMP NOT NULL,
    location TEXT NOT NULL,
    locations JSONB DEFAULT '[]'::JSONB,
    target_age_group TEXT DEFAULT 'ALL',
    min_age INTEGER DEFAULT NULL,
    max_age INTEGER DEFAULT NULL,
    is_child_focused BOOLEAN DEFAULT FALSE,
    price DECIMAL(10,2) NOT NULL,
    "heroImageUrl" TEXT,
    "imageUrls" TEXT[] DEFAULT '{}',
    activities JSONB DEFAULT '[]'::JSONB,
    alignment JSONB DEFAULT '{}'::JSONB,
    features JSONB DEFAULT '[]'::JSONB,
    speakers JSONB DEFAULT '[]'::JSONB,
    journey JSONB DEFAULT '{}'::JSONB,
    faqs JSONB DEFAULT '[]'::JSONB,
    self_funded_seats INTEGER DEFAULT 0,
    partially_funded_seats INTEGER DEFAULT 0,
    fully_funded_seats INTEGER DEFAULT 0,
    benefits JSONB DEFAULT '[]'::JSONB,
    requires_proposal BOOLEAN DEFAULT FALSE,
    type TEXT DEFAULT 'PHYSICAL', -- PHYSICAL, VIRTUAL, BOTH
    meeting_link TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Bookings Table (Streamlined for M-Pesa, Card, PayPal; Multi-Location & Age / Guardian details)
CREATE TABLE IF NOT EXISTS "Booking" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL DEFAULT auth.uid() REFERENCES "User"(id) ON DELETE CASCADE,
    "eventId" UUID NOT NULL REFERENCES "Event"(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'SELF_FUNDED',
    "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING',
    mode TEXT DEFAULT 'PHYSICAL',
    "paymentMethod" TEXT DEFAULT 'MPESA', -- MPESA, CARD, PAYPAL
    "paymentStatus" TEXT DEFAULT 'PENDING', -- PENDING, PAID, UNPAID, REFUNDED
    "mpesaReceiptNumber" TEXT,
    "mpesaPhoneNumber" TEXT,
    "mpesaCheckoutRequestId" TEXT,
    "selectedLocation" TEXT,
    "attendeeAge" INTEGER,
    "guardianName" TEXT,
    "guardianPhone" TEXT,
    "institutionName" TEXT,
    "institutionAddress" TEXT,
    "headAdminName" TEXT,
    "institutionContact" TEXT,
    "institutionDetails" JSONB DEFAULT '{}'::JSONB,
    "checkedIn" BOOLEAN DEFAULT FALSE,
    "checkedInAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Proposals Table (Project, Research & Community Review)
CREATE TABLE IF NOT EXISTS "Proposals" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID DEFAULT auth.uid() REFERENCES "User"("id") ON DELETE CASCADE,
    "eventId" UUID REFERENCES "Event"("id") ON DELETE CASCADE,
    title TEXT,
    category TEXT DEFAULT 'GENERAL', -- GENERAL, RESEARCH, CURRICULUM, GRANT, COMMUNITY
    description TEXT NOT NULL,
    "documentUrl" TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW')),
    "adminNotes" TEXT,
    "autoApproveAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tech Exhibitions Table (Sell & Showcase Technology During Event)
CREATE TABLE IF NOT EXISTS "TechExhibitions" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL DEFAULT auth.uid() REFERENCES "User"(id) ON DELETE CASCADE,
    "eventId" UUID REFERENCES "Event"(id) ON DELETE SET NULL,
    "companyName" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'EDTECH_HARDWARE', -- EDTECH_HARDWARE, CLASSROOM_SOFTWARE, AI_TOOL, STEM_KIT, ROBOTICS, CLOUD_INFRA
    description TEXT NOT NULL,
    "demoRequirements" TEXT,
    "boothType" TEXT DEFAULT 'STANDARD', -- VIRTUAL_BOOTH, STANDARD_BOOTH, PREMIUM_DEMO_STAGE
    "productUrl" TEXT,
    "brochureUrl" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CONFIRMED')),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event Presentations Table (Presentations, Keynotes & Workshops)
CREATE TABLE IF NOT EXISTS "EventPresentations" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL DEFAULT auth.uid() REFERENCES "User"(id) ON DELETE CASCADE,
    "eventId" UUID REFERENCES "Event"(id) ON DELETE SET NULL,
    "presenterName" TEXT NOT NULL,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    "sessionType" TEXT NOT NULL DEFAULT 'KEYNOTE' CHECK ("sessionType" IN ('KEYNOTE', 'WORKSHOP', 'PANEL', 'LIGHTNING_TALK', 'PAPER_PRESENTATION')),
    "durationMinutes" INTEGER DEFAULT 30,
    abstract TEXT NOT NULL,
    bio TEXT NOT NULL,
    "slidesUrl" TEXT,
    "equipmentRequirements" TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SCHEDULED')),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interview Bookings Table (1-on-1 Interview Bookings)
CREATE TABLE IF NOT EXISTS "InterviewBookings" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL DEFAULT auth.uid() REFERENCES "User"(id) ON DELETE CASCADE,
    "eventId" UUID REFERENCES "Event"(id) ON DELETE SET NULL,
    "applicantName" TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    organization TEXT,
    track TEXT NOT NULL DEFAULT 'PARTNERSHIP' CHECK (track IN ('MEDIA_PRESS', 'PARTNERSHIP', 'CAREER_MENTORSHIP', 'RESEARCH_COLLABORATION', 'FOUNDER_SPOTLIGHT', 'GENERAL')),
    "preferredDate" DATE NOT NULL,
    "preferredTime" TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'VIRTUAL' CHECK (format IN ('VIRTUAL', 'PHYSICAL')),
    agenda TEXT NOT NULL,
    "documentUrl" TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
    "adminNotes" TEXT,
    "meetingLink" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- General Applications Table (Speakers, Sponsors, NextGen)
CREATE TABLE IF NOT EXISTS "Applications" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID DEFAULT auth.uid() REFERENCES "User"("id") ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('SPEAKER', 'SPONSOR', 'NEXTGEN', 'GLOBAL_FORUM')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    description TEXT NOT NULL,
    "documentUrl" TEXT,
    "donationAmount" DECIMAL(10, 2) DEFAULT 0,
    "paymentStatus" TEXT DEFAULT 'PENDING' CHECK ("paymentStatus" IN ('PENDING', 'PAID')),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BlogPosts Table
CREATE TABLE IF NOT EXISTS "BlogPost" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    "imageUrl" TEXT,
    "authorId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Testimonials Table
CREATE TABLE IF NOT EXISTS "Testimonial" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    "authorId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Visa Invitations Table
CREATE TABLE IF NOT EXISTS "VisaInvitation" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL DEFAULT auth.uid() REFERENCES "User"(id) ON DELETE CASCADE,
    "eventId" UUID NOT NULL REFERENCES "Event"(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING',
    "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "letterUrl" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS "Notification" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO',
    "isRead" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Wallets Table (Default currency Kenya Shillings - KES)
CREATE TABLE IF NOT EXISTS "Wallet" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    balance DECIMAL(12,2) DEFAULT 0,
    currency TEXT DEFAULT 'KES',
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Stats Table
CREATE TABLE IF NOT EXISTS "Stats" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    "eventsAttended" INTEGER DEFAULT 0,
    "blogPostsCount" INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Identity Verification Table
CREATE TABLE IF NOT EXISTS "IdentityVerification" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING',
    "documentUrls" TEXT[] DEFAULT '{}',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Support Conversations Table
CREATE TABLE IF NOT EXISTS "SupportConversation" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES "User"(id) ON DELETE CASCADE,
    "guestName" TEXT,
    "guestEmail" TEXT,
    "guestSessionId" TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PENDING', 'RESOLVED')),
    "unreadUserCount" INTEGER DEFAULT 0,
    "unreadAdminCount" INTEGER DEFAULT 0,
    "lastMessageAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support Messages Table
CREATE TABLE IF NOT EXISTS "SupportMessage" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "conversationId" UUID NOT NULL REFERENCES "SupportConversation"(id) ON DELETE CASCADE,
    "senderId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
    "senderRole" TEXT NOT NULL DEFAULT 'USER' CHECK ("senderRole" IN ('USER', 'ADMIN', 'GUEST')),
    "senderName" TEXT NOT NULL,
    message TEXT NOT NULL,
    "isRead" BOOLEAN DEFAULT FALSE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- 5. SCHEMA EVOLUTION & MIGRATION ALIGNMENTS (Safe for Existing Databases)
-- ==============================================================================

-- Clean up any historical cashCollectedBy foreign keys/columns to avoid PostgREST embedding conflicts
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'Booking_cashCollectedBy_fkey' 
        AND table_name = 'Booking'
    ) THEN
        ALTER TABLE "Booking" DROP CONSTRAINT "Booking_cashCollectedBy_fkey";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Booking' AND column_name = 'cashCollectedBy'
    ) THEN
        ALTER TABLE "Booking" DROP COLUMN "cashCollectedBy";
    END IF;
END $$;

-- Align User columns
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "institutionName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "institutionAddress" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "headAdminName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "institutionContact" TEXT;

-- Align Event columns
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "locations" JSONB DEFAULT '[]'::JSONB;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "target_age_group" TEXT DEFAULT 'ALL';
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "min_age" INTEGER DEFAULT NULL;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "max_age" INTEGER DEFAULT NULL;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "is_child_focused" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "benefits" JSONB DEFAULT '[]'::JSONB;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "requires_proposal" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "type" TEXT DEFAULT 'PHYSICAL';
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "meeting_link" TEXT;
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "heroImageUrl" TEXT;

-- Align Booking columns & defaults
ALTER TABLE "Booking" ALTER COLUMN "userId" SET DEFAULT auth.uid();
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "mode" TEXT DEFAULT 'PHYSICAL';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT DEFAULT 'MPESA';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'PENDING';
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "mpesaReceiptNumber" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "mpesaPhoneNumber" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "mpesaCheckoutRequestId" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "selectedLocation" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "attendeeAge" INTEGER;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "guardianName" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "guardianPhone" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "institutionName" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "institutionAddress" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "headAdminName" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "institutionContact" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "institutionDetails" JSONB DEFAULT '{}'::JSONB;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "checkedIn" BOOLEAN DEFAULT FALSE;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "checkedInAt" TIMESTAMP;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT NOW();

-- Standardize payment status & remove legacy cash-on-arrival values
UPDATE "Booking" SET "paymentMethod" = 'CARD' WHERE "paymentMethod" = 'CASH_ON_ARRIVAL';
UPDATE "Booking" SET status = 'PENDING' WHERE status = 'PENDING_PAYMENT_ON_ARRIVAL';
UPDATE "Booking" SET "paymentStatus" = 'UNPAID' WHERE "paymentStatus" = 'PAID_IN_CASH';
ALTER TABLE "Booking" ALTER COLUMN "paymentMethod" SET DEFAULT 'MPESA';
ALTER TABLE "Booking" ALTER COLUMN "paymentStatus" SET DEFAULT 'PENDING';

-- Align Proposal / Visa columns
ALTER TABLE "Proposals" ALTER COLUMN "userId" SET DEFAULT auth.uid();
ALTER TABLE "Proposals" ADD COLUMN IF NOT EXISTS "title" TEXT;
ALTER TABLE "Proposals" ADD COLUMN IF NOT EXISTS "category" TEXT DEFAULT 'GENERAL';
ALTER TABLE "Proposals" ADD COLUMN IF NOT EXISTS "adminNotes" TEXT;
ALTER TABLE "VisaInvitation" ALTER COLUMN "userId" SET DEFAULT auth.uid();
ALTER TABLE "VisaInvitation" ADD COLUMN IF NOT EXISTS "letterUrl" TEXT;

-- Align Wallet default currency
ALTER TABLE "Wallet" ALTER COLUMN currency SET DEFAULT 'KES';
UPDATE "Wallet" SET currency = 'KES' WHERE currency = 'USD' OR currency IS NULL;

-- ==============================================================================
-- 6. INDEXES FOR HIGH-PERFORMANCE QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_event_date ON "Event"(date);
CREATE INDEX IF NOT EXISTS idx_booking_user_id ON "Booking"("userId");
CREATE INDEX IF NOT EXISTS idx_booking_event_id ON "Booking"("eventId");
CREATE INDEX IF NOT EXISTS idx_booking_status ON "Booking"(status);
CREATE INDEX IF NOT EXISTS idx_booking_payment_method ON "Booking"("paymentMethod");
CREATE INDEX IF NOT EXISTS idx_booking_mpesa_checkout ON "Booking"("mpesaCheckoutRequestId");

CREATE INDEX IF NOT EXISTS idx_proposals_event_user ON "Proposals"("eventId", "userId");
CREATE INDEX IF NOT EXISTS idx_proposals_status ON "Proposals"(status);

CREATE INDEX IF NOT EXISTS idx_tech_exhibitions_user ON "TechExhibitions"("userId");
CREATE INDEX IF NOT EXISTS idx_tech_exhibitions_event ON "TechExhibitions"("eventId");
CREATE INDEX IF NOT EXISTS idx_tech_exhibitions_status ON "TechExhibitions"(status);

CREATE INDEX IF NOT EXISTS idx_event_presentations_user ON "EventPresentations"("userId");
CREATE INDEX IF NOT EXISTS idx_event_presentations_event ON "EventPresentations"("eventId");
CREATE INDEX IF NOT EXISTS idx_event_presentations_status ON "EventPresentations"(status);

CREATE INDEX IF NOT EXISTS idx_interview_bookings_user ON "InterviewBookings"("userId");
CREATE INDEX IF NOT EXISTS idx_interview_bookings_event ON "InterviewBookings"("eventId");
CREATE INDEX IF NOT EXISTS idx_interview_bookings_status ON "InterviewBookings"(status);

CREATE INDEX IF NOT EXISTS idx_support_conv_user_id ON "SupportConversation"("userId");
CREATE INDEX IF NOT EXISTS idx_support_conv_guest_id ON "SupportConversation"("guestSessionId");
CREATE INDEX IF NOT EXISTS idx_support_conv_status ON "SupportConversation"(status);
CREATE INDEX IF NOT EXISTS idx_support_msg_conv_id ON "SupportMessage"("conversationId");
CREATE INDEX IF NOT EXISTS idx_support_msg_created_at ON "SupportMessage"("createdAt");

-- ==============================================================================
-- 7. FUNCTIONS & AUTOMATED TRIGGERS
-- ==============================================================================

-- Timestamp Update Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply UpdatedAt Triggers across all updated entities
DROP TRIGGER IF EXISTS update_user_updated_at ON "User";
CREATE TRIGGER update_user_updated_at BEFORE UPDATE ON "User" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_updated_at ON "Event";
CREATE TRIGGER update_event_updated_at BEFORE UPDATE ON "Event" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_booking_updated_at ON "Booking";
CREATE TRIGGER update_booking_updated_at BEFORE UPDATE ON "Booking" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_proposals_updated_at ON "Proposals";
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON "Proposals" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tech_exhibitions_updated_at ON "TechExhibitions";
CREATE TRIGGER update_tech_exhibitions_updated_at BEFORE UPDATE ON "TechExhibitions" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_presentations_updated_at ON "EventPresentations";
CREATE TRIGGER update_event_presentations_updated_at BEFORE UPDATE ON "EventPresentations" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interview_bookings_updated_at ON "InterviewBookings";
CREATE TRIGGER update_interview_bookings_updated_at BEFORE UPDATE ON "InterviewBookings" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blog_post_updated_at ON "BlogPost";
CREATE TRIGGER update_blog_post_updated_at BEFORE UPDATE ON "BlogPost" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_visa_invitation_updated_at ON "VisaInvitation";
CREATE TRIGGER update_visa_invitation_updated_at BEFORE UPDATE ON "VisaInvitation" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallet_updated_at ON "Wallet";
CREATE TRIGGER update_wallet_updated_at BEFORE UPDATE ON "Wallet" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stats_updated_at ON "Stats";
CREATE TRIGGER update_stats_updated_at BEFORE UPDATE ON "Stats" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_identity_verification_updated_at ON "IdentityVerification";
CREATE TRIGGER update_identity_verification_updated_at BEFORE UPDATE ON "IdentityVerification" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_support_conversation_updated_at ON "SupportConversation";
CREATE TRIGGER update_support_conversation_updated_at BEFORE UPDATE ON "SupportConversation" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User Profile Sync on Signup (Authenticated Auth Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    user_phone TEXT;
    user_country TEXT;
    user_city TEXT;
    user_address TEXT;
    user_institution_name TEXT;
    user_institution_address TEXT;
    user_head_admin_name TEXT;
    user_institution_contact TEXT;
BEGIN
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', 'User');
    user_phone := NEW.raw_user_meta_data->>'phone';
    user_country := NEW.raw_user_meta_data->>'country';
    user_city := NEW.raw_user_meta_data->>'city';
    user_address := NEW.raw_user_meta_data->>'address';
    user_institution_name := NEW.raw_user_meta_data->>'institutionName';
    user_institution_address := NEW.raw_user_meta_data->>'institutionAddress';
    user_head_admin_name := NEW.raw_user_meta_data->>'headAdminName';
    user_institution_contact := NEW.raw_user_meta_data->>'institutionContact';

    INSERT INTO public."User" (
        id, email, name, role, phone, country, city, address,
        "institutionName", "institutionAddress", "headAdminName", "institutionContact"
    )
    VALUES (
        NEW.id, NEW.email, user_name, 'USER', user_phone, user_country, user_city, user_address,
        user_institution_name, user_institution_address, user_head_admin_name, user_institution_contact
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = COALESCE(EXCLUDED.name, public."User".name),
        "institutionName" = COALESCE(EXCLUDED."institutionName", public."User"."institutionName"),
        "institutionAddress" = COALESCE(EXCLUDED."institutionAddress", public."User"."institutionAddress"),
        "headAdminName" = COALESCE(EXCLUDED."headAdminName", public."User"."headAdminName"),
        "institutionContact" = COALESCE(EXCLUDED."institutionContact", public."User"."institutionContact");

    INSERT INTO public."Wallet" ("userId", currency) VALUES (NEW.id, 'KES') ON CONFLICT DO NOTHING;
    INSERT INTO public."Stats" ("userId") VALUES (NEW.id) ON CONFLICT DO NOTHING;
    
    INSERT INTO public."Notification" ("userId", title, message, type)
    VALUES (NEW.id, 'Welcome to worlducationHub!', 'Welcome to our global educational community!', 'WELCOME');
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Security Admin Check Function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public."User"
    WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- 8. ENABLE ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Booking" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BlogPost" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Testimonial" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VisaInvitation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Wallet" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Stats" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IdentityVerification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Proposals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TechExhibitions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EventPresentations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "InterviewBookings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportConversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SupportMessage" ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 9. ROW LEVEL SECURITY POLICIES
-- ==============================================================================

-- >>> USERS
DROP POLICY IF EXISTS "Users can read own data" ON "User";
DROP POLICY IF EXISTS "Users can update own profile" ON "User";
DROP POLICY IF EXISTS "Admins can read all users" ON "User";
DROP POLICY IF EXISTS "Admins can update all users" ON "User";

CREATE POLICY "Users can read own data" ON "User" FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON "User" FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can read all users" ON "User" FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all users" ON "User" FOR UPDATE USING (is_admin());

-- >>> EVENTS (Public Read, Admin Full Management)
DROP POLICY IF EXISTS "Public events are viewable by everyone" ON "Event";
DROP POLICY IF EXISTS "Admins can manage all events" ON "Event";

CREATE POLICY "Public events are viewable by everyone" ON "Event" FOR SELECT USING (true);
CREATE POLICY "Admins can manage all events" ON "Event" FOR ALL USING (is_admin());

-- >>> BOOKINGS
DROP POLICY IF EXISTS "Users can read own bookings" ON "Booking";
DROP POLICY IF EXISTS "Users can insert own bookings" ON "Booking";
DROP POLICY IF EXISTS "Users can update own bookings" ON "Booking";
DROP POLICY IF EXISTS "Admins can view all bookings" ON "Booking";
DROP POLICY IF EXISTS "Admins can update all bookings" ON "Booking";
DROP POLICY IF EXISTS "Public can verify booking by id" ON "Booking";

CREATE POLICY "Users can read own bookings" ON "Booking" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert own bookings" ON "Booking" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update own bookings" ON "Booking" FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Admins can view all bookings" ON "Booking" FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all bookings" ON "Booking" FOR UPDATE USING (is_admin());
CREATE POLICY "Public can verify booking by id" ON "Booking" FOR SELECT USING (true);

-- >>> PROPOSALS
DROP POLICY IF EXISTS "Users can view their own proposals" ON "Proposals";
DROP POLICY IF EXISTS "Users can insert their own proposals" ON "Proposals";
DROP POLICY IF EXISTS "Users can update their own proposals" ON "Proposals";
DROP POLICY IF EXISTS "Admins can view all proposals" ON "Proposals";
DROP POLICY IF EXISTS "Admins can update proposals" ON "Proposals";

CREATE POLICY "Users can view their own proposals" ON "Proposals" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert their own proposals" ON "Proposals" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update their own proposals" ON "Proposals" FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Admins can view all proposals" ON "Proposals" FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update proposals" ON "Proposals" FOR UPDATE USING (is_admin());

-- >>> TECH EXHIBITIONS (Sell Technology During Event)
DROP POLICY IF EXISTS "Users can view own tech exhibitions" ON "TechExhibitions";
DROP POLICY IF EXISTS "Users can insert own tech exhibitions" ON "TechExhibitions";
DROP POLICY IF EXISTS "Users can update own tech exhibitions" ON "TechExhibitions";
DROP POLICY IF EXISTS "Admins can view all tech exhibitions" ON "TechExhibitions";
DROP POLICY IF EXISTS "Admins can update all tech exhibitions" ON "TechExhibitions";

CREATE POLICY "Users can view own tech exhibitions" ON "TechExhibitions" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert own tech exhibitions" ON "TechExhibitions" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update own tech exhibitions" ON "TechExhibitions" FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Admins can view all tech exhibitions" ON "TechExhibitions" FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all tech exhibitions" ON "TechExhibitions" FOR UPDATE USING (is_admin());

-- >>> EVENT PRESENTATIONS (Presentations & Speaker Submissions)
DROP POLICY IF EXISTS "Users can view own event presentations" ON "EventPresentations";
DROP POLICY IF EXISTS "Users can insert own event presentations" ON "EventPresentations";
DROP POLICY IF EXISTS "Users can update own event presentations" ON "EventPresentations";
DROP POLICY IF EXISTS "Admins can view all event presentations" ON "EventPresentations";
DROP POLICY IF EXISTS "Admins can update all event presentations" ON "EventPresentations";

CREATE POLICY "Users can view own event presentations" ON "EventPresentations" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert own event presentations" ON "EventPresentations" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update own event presentations" ON "EventPresentations" FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Admins can view all event presentations" ON "EventPresentations" FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all event presentations" ON "EventPresentations" FOR UPDATE USING (is_admin());

-- >>> INTERVIEW BOOKINGS (Book an Interview With Us)
DROP POLICY IF EXISTS "Users can view own interview bookings" ON "InterviewBookings";
DROP POLICY IF EXISTS "Users can insert own interview bookings" ON "InterviewBookings";
DROP POLICY IF EXISTS "Users can update own interview bookings" ON "InterviewBookings";
DROP POLICY IF EXISTS "Admins can view all interview bookings" ON "InterviewBookings";
DROP POLICY IF EXISTS "Admins can update all interview bookings" ON "InterviewBookings";

CREATE POLICY "Users can view own interview bookings" ON "InterviewBookings" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert own interview bookings" ON "InterviewBookings" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update own interview bookings" ON "InterviewBookings" FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Admins can view all interview bookings" ON "InterviewBookings" FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all interview bookings" ON "InterviewBookings" FOR UPDATE USING (is_admin());

-- >>> APPLICATIONS
DROP POLICY IF EXISTS "Users can view their own applications" ON "Applications";
DROP POLICY IF EXISTS "Users can insert their own applications" ON "Applications";
DROP POLICY IF EXISTS "Admins can view all applications" ON "Applications";
DROP POLICY IF EXISTS "Admins can update applications" ON "Applications";

CREATE POLICY "Users can view their own applications" ON "Applications" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert their own applications" ON "Applications" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Admins can view all applications" ON "Applications" FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update applications" ON "Applications" FOR UPDATE USING (is_admin());

-- >>> VISA INVITATIONS
DROP POLICY IF EXISTS "Users can read own visa invitations" ON "VisaInvitation";
DROP POLICY IF EXISTS "Users can insert own visa invitations" ON "VisaInvitation";
DROP POLICY IF EXISTS "Users can update own visa invitations" ON "VisaInvitation";
DROP POLICY IF EXISTS "Admins can view all visa invitations" ON "VisaInvitation";
DROP POLICY IF EXISTS "Admins can update all visa invitations" ON "VisaInvitation";

CREATE POLICY "Users can read own visa invitations" ON "VisaInvitation" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert own visa invitations" ON "VisaInvitation" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Users can update own visa invitations" ON "VisaInvitation" FOR UPDATE USING (auth.uid() = "userId");
CREATE POLICY "Admins can view all visa invitations" ON "VisaInvitation" FOR SELECT USING (is_admin());
CREATE POLICY "Admins can update all visa invitations" ON "VisaInvitation" FOR UPDATE USING (is_admin());

-- >>> NOTIFICATIONS, WALLET, STATS, IDENTITY VERIFICATION
DROP POLICY IF EXISTS "Users can read own notifications" ON "Notification";
DROP POLICY IF EXISTS "Admins can manage all notifications" ON "Notification";
CREATE POLICY "Users can read own notifications" ON "Notification" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Admins can manage all notifications" ON "Notification" FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Users can read own wallet" ON "Wallet";
DROP POLICY IF EXISTS "Admins can manage all wallets" ON "Wallet";
CREATE POLICY "Users can read own wallet" ON "Wallet" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Admins can manage all wallets" ON "Wallet" FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Users can read own stats" ON "Stats";
DROP POLICY IF EXISTS "Admins can manage all stats" ON "Stats";
CREATE POLICY "Users can read own stats" ON "Stats" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Admins can manage all stats" ON "Stats" FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Users can read own identity verification" ON "IdentityVerification";
DROP POLICY IF EXISTS "Users can insert own identity verification" ON "IdentityVerification";
DROP POLICY IF EXISTS "Admins can manage all identity verifications" ON "IdentityVerification";
CREATE POLICY "Users can read own identity verification" ON "IdentityVerification" FOR SELECT USING (auth.uid() = "userId");
CREATE POLICY "Users can insert own identity verification" ON "IdentityVerification" FOR INSERT WITH CHECK (auth.uid() = "userId");
CREATE POLICY "Admins can manage all identity verifications" ON "IdentityVerification" FOR ALL USING (is_admin());

-- >>> BLOG POSTS & TESTIMONIALS
DROP POLICY IF EXISTS "Blog posts are publicly readable" ON "BlogPost";
DROP POLICY IF EXISTS "Admins can manage all blog posts" ON "BlogPost";
CREATE POLICY "Blog posts are publicly readable" ON "BlogPost" FOR SELECT USING (true);
CREATE POLICY "Admins can manage all blog posts" ON "BlogPost" FOR ALL USING (is_admin());

DROP POLICY IF EXISTS "Testimonials are publicly readable" ON "Testimonial";
DROP POLICY IF EXISTS "Users can insert own testimonials" ON "Testimonial";
DROP POLICY IF EXISTS "Users can update own testimonials" ON "Testimonial";
DROP POLICY IF EXISTS "Users can delete own testimonials" ON "Testimonial";
CREATE POLICY "Testimonials are publicly readable" ON "Testimonial" FOR SELECT USING (true);
CREATE POLICY "Users can insert own testimonials" ON "Testimonial" FOR INSERT WITH CHECK (auth.uid() = "authorId");
CREATE POLICY "Users can update own testimonials" ON "Testimonial" FOR UPDATE USING (auth.uid() = "authorId");
CREATE POLICY "Users can delete own testimonials" ON "Testimonial" FOR DELETE USING (auth.uid() = "authorId");

-- >>> LIVE SUPPORT CHAT
DROP POLICY IF EXISTS "Admins can manage all support conversations" ON "SupportConversation";
DROP POLICY IF EXISTS "Users and guests can select own support conversations" ON "SupportConversation";
DROP POLICY IF EXISTS "Users and guests can insert own support conversations" ON "SupportConversation";
DROP POLICY IF EXISTS "Users and guests can update own support conversations" ON "SupportConversation";

CREATE POLICY "Admins can manage all support conversations" ON "SupportConversation" FOR ALL USING (public.is_admin());
CREATE POLICY "Users and guests can select own support conversations" ON "SupportConversation" FOR SELECT USING (auth.uid() = "userId" OR "guestSessionId" IS NOT NULL);
CREATE POLICY "Users and guests can insert own support conversations" ON "SupportConversation" FOR INSERT WITH CHECK (auth.uid() = "userId" OR "guestSessionId" IS NOT NULL);
CREATE POLICY "Users and guests can update own support conversations" ON "SupportConversation" FOR UPDATE USING (auth.uid() = "userId" OR "guestSessionId" IS NOT NULL);

DROP POLICY IF EXISTS "Admins can manage all support messages" ON "SupportMessage";
DROP POLICY IF EXISTS "Users and guests can select support messages" ON "SupportMessage";
DROP POLICY IF EXISTS "Users and guests can insert support messages" ON "SupportMessage";

CREATE POLICY "Admins can manage all support messages" ON "SupportMessage" FOR ALL USING (public.is_admin());
CREATE POLICY "Users and guests can select support messages" ON "SupportMessage" FOR SELECT USING (
  EXISTS (SELECT 1 FROM "SupportConversation" sc WHERE sc.id = "conversationId" AND (sc."userId" = auth.uid() OR sc."guestSessionId" IS NOT NULL))
);
CREATE POLICY "Users and guests can insert support messages" ON "SupportMessage" FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM "SupportConversation" sc WHERE sc.id = "conversationId" AND (sc."userId" = auth.uid() OR sc."guestSessionId" IS NOT NULL))
);

-- >>> STORAGE POLICIES
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Visa" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage own objects" ON storage.objects;

CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT
USING ( bucket_id IN ('documents', 'event-media', 'visa-documents') );

CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT
WITH CHECK ( 
  auth.role() = 'authenticated' AND 
  (bucket_id = 'documents' OR bucket_id = 'event-media' OR bucket_id = 'user-documents')
);

CREATE POLICY "Admin Upload Visa" ON storage.objects FOR INSERT
WITH CHECK ( 
  bucket_id = 'visa-documents' AND 
  public.is_admin()
);

CREATE POLICY "Users can manage own objects" ON storage.objects 
FOR ALL 
USING ( auth.uid()::text = (storage.foldername(name))[1] )
WITH CHECK ( auth.uid()::text = (storage.foldername(name))[1] );

-- ==============================================================================
-- 10. CRITICAL DATA INITIALIZATION & SYNC
-- ==============================================================================
DO $$
BEGIN
    INSERT INTO public."User" (id, email, name, role, "createdAt")
    SELECT 
        au.id, 
        au.email, 
        COALESCE(au.raw_user_meta_data->>'name', 'User'),
        'USER',
        au.created_at
    FROM auth.users au
    LEFT JOIN public."User" u ON au.id = u.id
    WHERE u.id IS NULL
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public."Wallet" ("userId", currency) 
    SELECT id, 'KES' FROM public."User" WHERE id NOT IN (SELECT "userId" FROM public."Wallet");

    INSERT INTO public."Stats" ("userId") 
    SELECT id FROM public."User" WHERE id NOT IN (SELECT "userId" FROM public."Stats");
END
$$;

-- ==============================================================================
-- 11. REALTIME REPLICATION ENABLEMENT
-- ==============================================================================
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE "SupportConversation";
        ALTER PUBLICATION supabase_realtime ADD TABLE "SupportMessage";
        ALTER PUBLICATION supabase_realtime ADD TABLE "Booking";
        ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";
        ALTER PUBLICATION supabase_realtime ADD TABLE "Proposals";
        ALTER PUBLICATION supabase_realtime ADD TABLE "TechExhibitions";
        ALTER PUBLICATION supabase_realtime ADD TABLE "EventPresentations";
        ALTER PUBLICATION supabase_realtime ADD TABLE "InterviewBookings";
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Document comments
COMMENT ON TABLE "Event" IS 'Events with multi-location same-day scheduling and child-focused age tier declarations.';
COMMENT ON TABLE "Booking" IS 'Event bookings streamlined with M-Pesa, Card, and PayPal. Cash on arrival removed.';
COMMENT ON TABLE "Proposals" IS 'Proposals submitted for committee review.';
COMMENT ON TABLE "TechExhibitions" IS 'Technology exhibition & commercial booth requests.';
COMMENT ON TABLE "EventPresentations" IS 'Speaker and presentation abstracts for events.';
COMMENT ON TABLE "InterviewBookings" IS '1-on-1 official interview bookings with worlducationHub.';
