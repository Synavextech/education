import { z } from 'zod';

export const insertEventSchema = z.object({
    title: z.string().min(1, "Title is required"),
    theme: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    date: z.string(),
    location: z.string(),
    locations: z.array(z.any()).default([]),
    target_age_group: z.string().default('ALL'),
    min_age: z.coerce.number().optional().nullable(),
    max_age: z.coerce.number().optional().nullable(),
    is_child_focused: z.boolean().default(false),
    price: z.coerce.number().min(0),
    heroImageUrl: z.string().optional(),
    imageUrls: z.array(z.string()).default([]),
    activities: z.array(z.any()).default([]),
    alignment: z.any().default({}),
    features: z.array(z.any()).default([]),
    speakers: z.array(z.any()).default([]),
    journey: z.any().default({}),
    faqs: z.array(z.any()).default([]),
    self_funded_seats: z.number().default(0),
    partially_funded_seats: z.number().default(0),
    fully_funded_seats: z.number().default(0),
    benefits: z.array(z.any()).default([]),
    requires_proposal: z.boolean().default(false),
    type: z.enum(['PHYSICAL', 'VIRTUAL', 'BOTH']).default('PHYSICAL'),
    meeting_link: z.string().optional(),
});

export type InsertEvent = z.infer<typeof insertEventSchema>;

export interface EventLocation {
    id: string;
    name: string;
    address?: string;
    time?: string;
    capacity?: number;
}

export interface EventActivity {
    day: number;
    date: string;
    items: {
        time?: string;
        title: string;
        description: string;
    }[];
}

export interface EventSpeaker {
    name: string;
    role: string;
    bio: string;
    imageUrl?: string;
}

export interface EventFAQ {
    question: string;
    answer: string;
}

export interface Event extends InsertEvent {
    id: string;
    locations: EventLocation[];
    target_age_group: string;
    min_age?: number | null;
    max_age?: number | null;
    is_child_focused: boolean;
    activities: EventActivity[];
    speakers: EventSpeaker[];
    faqs: EventFAQ[];
    self_funded_seats: number;
    partially_funded_seats: number;
    fully_funded_seats: number;
    benefits: any[]; // Or specify a more detailed type if needed
    type: 'PHYSICAL' | 'VIRTUAL' | 'BOTH';
    meeting_link?: string;
}

export interface Booking {
    id: string;
    userId: string;
    eventId: string;
    category: string;
    amountPaid: number;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED';
    mode: 'PHYSICAL' | 'VIRTUAL';
    paymentMethod?: 'MPESA' | 'CARD' | 'PAYPAL';
    paymentStatus?: 'PENDING' | 'PAID' | 'UNPAID' | 'REFUNDED';
    mpesaReceiptNumber?: string;
    mpesaPhoneNumber?: string;
    mpesaCheckoutRequestId?: string;
    institutionName?: string;
    institutionAddress?: string;
    headAdminName?: string;
    institutionContact?: string;
    institutionDetails?: Record<string, any>;
    selectedLocation?: string;
    attendeeAge?: number;
    guardianName?: string;
    guardianPhone?: string;
    checkedIn?: boolean;
    checkedInAt?: string;
    createdAt: string;
    updatedAt?: string;
    event?: Event;
    user?: User;
}

export interface User {
    id: string;
    email: string;
    name: string;
    phone?: string;
    country?: string;
    city?: string;
    address?: string;
    role: 'USER' | 'ADMIN';
    institutionName?: string;
    institutionAddress?: string;
    headAdminName?: string;
    institutionContact?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface SupportConversation {
    id: string;
    userId?: string;
    guestName?: string;
    guestEmail?: string;
    guestSessionId?: string;
    status: 'OPEN' | 'PENDING' | 'RESOLVED';
    unreadUserCount?: number;
    unreadAdminCount?: number;
    lastMessageAt?: string;
    createdAt?: string;
    updatedAt?: string;
    user?: User;
}

export interface SupportMessage {
    id: string;
    conversationId: string;
    senderId?: string;
    senderRole: 'USER' | 'ADMIN' | 'GUEST';
    senderName: string;
    message: string;
    isRead?: boolean;
    createdAt?: string;
}

export const insertBlogPostSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    imageUrl: z.string().optional(),
    authorId: z.string(),
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export interface BlogPost extends InsertBlogPost {
    id: string;
    createdAt: string;
    updatedAt: string;
}

export interface VisaInvitation {
    id: string;
    userId: string;
    eventId: string;
    status: 'PENDING' | 'PAID' | 'APPROVED' | 'REJECTED';
    amountPaid: number;
    paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
    letterUrl?: string;
    createdAt: string;
    updatedAt: string;
    user?: User;
    event?: Event;
}

// Proposals
export const insertProposalSchema = z.object({
    eventId: z.string().optional().nullable(),
    title: z.string().min(5, "Title must be at least 5 characters").optional(),
    category: z.string().default('GENERAL'),
    description: z.string().min(30, "Description must be at least 30 characters"),
    documentUrl: z.string().optional().nullable(),
});

export type InsertProposal = z.infer<typeof insertProposalSchema>;

export interface Proposal {
    id: string;
    userId: string;
    eventId?: string | null;
    title?: string;
    category?: string;
    description: string;
    documentUrl?: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UNDER_REVIEW';
    adminNotes?: string | null;
    autoApproveAt?: string;
    createdAt: string;
    updatedAt: string;
    user?: User;
    event?: Event;
}

// Applications (Sponsors, NextGen, Global Forum)
export const insertApplicationSchema = z.object({
    type: z.enum(['SPEAKER', 'SPONSOR', 'NEXTGEN', 'GLOBAL_FORUM']),
    description: z.string().min(30, "Description must be at least 30 characters"),
    documentUrl: z.string().optional().nullable(),
    donationAmount: z.number().min(10, "Minimum donation is KSh 1,300"),
});

export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export interface Application {
    id: string;
    userId: string;
    type: 'SPEAKER' | 'SPONSOR' | 'NEXTGEN' | 'GLOBAL_FORUM';
    description: string;
    documentUrl?: string | null;
    donationAmount: number;
    paymentStatus: 'PENDING' | 'PAID';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    createdAt: string;
    updatedAt: string;
    user?: User;
}

// Tech Exhibitions (Sell a Technology During Event)
export const insertTechExhibitionSchema = z.object({
    eventId: z.string().optional().nullable(),
    companyName: z.string().min(2, "Company or organization name is required"),
    productName: z.string().min(2, "Product or technology name is required"),
    category: z.string().default('EDTECH_HARDWARE'),
    description: z.string().min(30, "Please provide a detailed product overview"),
    demoRequirements: z.string().optional().nullable(),
    boothType: z.enum(['STANDARD', 'VIRTUAL_BOOTH', 'PREMIUM_DEMO_STAGE']).default('STANDARD'),
    productUrl: z.string().url().optional().or(z.literal('')).nullable(),
    brochureUrl: z.string().optional().nullable(),
    contactEmail: z.string().email("Valid email required").optional().nullable(),
    contactPhone: z.string().optional().nullable(),
});

export type InsertTechExhibition = z.infer<typeof insertTechExhibitionSchema>;

export interface TechExhibition {
    id: string;
    userId: string;
    eventId?: string | null;
    companyName: string;
    productName: string;
    category: string;
    description: string;
    demoRequirements?: string | null;
    boothType: 'STANDARD' | 'VIRTUAL_BOOTH' | 'PREMIUM_DEMO_STAGE';
    productUrl?: string | null;
    brochureUrl?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONFIRMED';
    adminNotes?: string | null;
    createdAt: string;
    updatedAt: string;
    user?: User;
    event?: Event;
}

// Event Presentations (Make Presentations / Speak)
export const insertEventPresentationSchema = z.object({
    eventId: z.string().optional().nullable(),
    presenterName: z.string().min(2, "Presenter name is required"),
    title: z.string().min(5, "Presentation title is required"),
    topic: z.string().min(3, "Topic is required"),
    sessionType: z.enum(['KEYNOTE', 'WORKSHOP', 'PANEL', 'LIGHTNING_TALK', 'PAPER_PRESENTATION']).default('KEYNOTE'),
    durationMinutes: z.number().min(10).max(120).default(30),
    abstract: z.string().min(30, "Abstract must be at least 30 characters"),
    bio: z.string().min(15, "Speaker bio is required"),
    slidesUrl: z.string().optional().nullable(),
    equipmentRequirements: z.string().optional().nullable(),
});

export type InsertEventPresentation = z.infer<typeof insertEventPresentationSchema>;

export interface EventPresentation {
    id: string;
    userId: string;
    eventId?: string | null;
    presenterName: string;
    title: string;
    topic: string;
    sessionType: 'KEYNOTE' | 'WORKSHOP' | 'PANEL' | 'LIGHTNING_TALK' | 'PAPER_PRESENTATION';
    durationMinutes: number;
    abstract: string;
    bio: string;
    slidesUrl?: string | null;
    equipmentRequirements?: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SCHEDULED';
    adminNotes?: string | null;
    createdAt: string;
    updatedAt: string;
    user?: User;
    event?: Event;
}

// Interview Bookings (Book an Interview With Us)
export const insertInterviewBookingSchema = z.object({
    eventId: z.string().optional().nullable(),
    applicantName: z.string().min(2, "Applicant name is required"),
    email: z.string().email("Valid email is required"),
    phone: z.string().optional().nullable(),
    organization: z.string().optional().nullable(),
    track: z.enum(['MEDIA_PRESS', 'PARTNERSHIP', 'CAREER_MENTORSHIP', 'RESEARCH_COLLABORATION', 'FOUNDER_SPOTLIGHT', 'GENERAL']).default('PARTNERSHIP'),
    preferredDate: z.string().min(1, "Preferred date is required"),
    preferredTime: z.string().min(1, "Preferred time is required"),
    format: z.enum(['VIRTUAL', 'PHYSICAL']).default('VIRTUAL'),
    agenda: z.string().min(20, "Please briefly summarize the interview agenda"),
    documentUrl: z.string().optional().nullable(),
});

export type InsertInterviewBooking = z.infer<typeof insertInterviewBookingSchema>;

export interface InterviewBooking {
    id: string;
    userId: string;
    eventId?: string | null;
    applicantName: string;
    email: string;
    phone?: string | null;
    organization?: string | null;
    track: 'MEDIA_PRESS' | 'PARTNERSHIP' | 'CAREER_MENTORSHIP' | 'RESEARCH_COLLABORATION' | 'FOUNDER_SPOTLIGHT' | 'GENERAL';
    preferredDate: string;
    preferredTime: string;
    format: 'VIRTUAL' | 'PHYSICAL';
    agenda: string;
    documentUrl?: string | null;
    status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
    adminNotes?: string | null;
    meetingLink?: string | null;
    createdAt: string;
    updatedAt: string;
    user?: User;
    event?: Event;
}
