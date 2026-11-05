import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin, Ticket, ChevronDown, Users, Bell, Info, Globe, HelpCircle, ArrowRight, MessageCircle, CheckCircle, Download, GraduationCap, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isAfter, isToday } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import HeroSection from "@/components/HeroSection";
import Testimonials from "@/components/Testimonials";
import JoinUs from "@/components/JoinUs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { loadStripe } from "@stripe/stripe-js";
import PaymentSelection from "@/components/payments/PaymentSelection";
import { generateTicketPDF } from "@/lib/ticket-generator";
import { ApplicationForm } from "@/components/ApplicationForms";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";
import { usePaymentStore } from "@/stores/usePaymentStore";
import { formatKES, resolvePriceInKES } from "@/lib/currency";

const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.VITE_STRIPE_PUBLIC_KEY || "";
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

export default function UpcomingEvents() {
    const { user, profile, updateProfile, isLoading } = useAuth();
    const { toast } = useToast();
    const [location, setLocation] = useLocation();
    const [bookingEvent, setBookingEvent] = useState<any | null>(null);
    const [bookingCategory, setBookingCategory] = useState<string>('PHYSICAL_SELF_FUNDED');
    const [bookingMode, setBookingMode] = useState<'PHYSICAL' | 'VIRTUAL'>('PHYSICAL');
    const [visaInvitationEvent, setVisaInvitationEvent] = useState<any | null>(null);
    const { openPayment } = usePaymentStore();
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
    const [resumingBookingId, setResumingBookingId] = useState<string | null>(null);
    const [selectedSeason, setSelectedSeason] = useState<string>("ALL");

    // Location & Child Age Streamlining State
    const [selectedLocation, setSelectedLocation] = useState<string>("");
    const [attendeeAge, setAttendeeAge] = useState<number | ''>('');
    const [guardianName, setGuardianName] = useState<string>("");
    const [guardianPhone, setGuardianPhone] = useState<string>("");

    useEffect(() => {
        if (bookingEvent) {
            if (bookingEvent.locations && bookingEvent.locations.length > 0) {
                setSelectedLocation(bookingEvent.locations[0].name);
            } else {
                setSelectedLocation(bookingEvent.location || "");
            }
            if (bookingEvent.is_child_focused) {
                setBookingCategory('FULLY_FUNDED');
                if (bookingEvent.min_age) {
                    setAttendeeAge(bookingEvent.min_age);
                }
            }
        }
    }, [bookingEvent]);

    // Student & Institution Declaration State
    const [declareInstitution, setDeclareInstitution] = useState(false);
    const [institutionName, setInstitutionName] = useState("");
    const [institutionAddress, setInstitutionAddress] = useState("");
    const [headAdminName, setHeadAdminName] = useState("");
    const [institutionContact, setInstitutionContact] = useState("");
    const [saveToProfile, setSaveToProfile] = useState(true);

    useEffect(() => {
        if (profile?.institutionName) {
            setInstitutionName(profile.institutionName);
            setInstitutionAddress(profile.institutionAddress || "");
            setHeadAdminName(profile.headAdminName || "");
            setInstitutionContact(profile.institutionContact || "");
            setDeclareInstitution(true);
        }
    }, [profile]);

    // Application Form State
    const [applicationModal, setApplicationModal] = useState<{ open: boolean; type: 'SPEAKER' | 'SPONSOR' | 'NEXTGEN' | 'GLOBAL_FORUM'; title: string } | null>(null);

    // Proposal State (Inline with Event Booking)
    const [hasProposal, setHasProposal] = useState(false);
    const [proposalModal, setProposalModal] = useState<boolean>(false);
    const [proposalDescription, setProposalDescription] = useState("");
    const [proposalFile, setProposalFile] = useState<File | null>(null);
    const [existingProposal, setExistingProposal] = useState<any>(null);
    const [submittingProposal, setSubmittingProposal] = useState(false);
    const [currentImageIdx, setCurrentImageIdx] = useState(0);

    // Countdown state
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

    // Parse event ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlEventId = urlParams.get('id');
    const paymentStatus = urlParams.get('status');
    const bookingIdFromUrl = urlParams.get('bookingId');

    const { data: events, isLoading: eventsLoading, error: fetchError } = useQuery({
        queryKey: ["events"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('Event')
                .select('*')
                .order('date', { ascending: true });
            if (error) {
                console.error("[Events] Supabase Fetch Error:", error);
                throw error;
            }
            return data;
        },
        retry: 1,
    });




    useEffect(() => {
        if (fetchError) {
            toast({
                title: "Failed to load events",
                description: "There was a problem connecting to the database. Please refresh or check your connection.",
                variant: "destructive"
            });
        }
    }, [fetchError, toast]);

    // Check for successful payment redirect
    useEffect(() => {
        if (paymentStatus === 'success' && bookingIdFromUrl) {
            const searchParams = new URLSearchParams(window.location.search);
            const type = searchParams.get('type') || 'event';
            handleSuccessfulPayment(bookingIdFromUrl, type);
            // Clear status from URL
            const newUrl = window.location.pathname + (urlEventId ? `?id=${urlEventId}` : '');
            window.history.replaceState({}, '', newUrl);
        } else if (paymentStatus === 'cancelled') {
            toast({ title: "Payment Cancelled", description: "Your booking was not completed.", variant: "destructive" });
        }
    }, [paymentStatus, bookingIdFromUrl, urlEventId]);

    // Handle Resume Request
    useEffect(() => {
        const resume = urlParams.get('resume');
        const bookingId = urlParams.get('bookingId');

        if (resume === 'true' && urlEventId && events) {
            const event = events.find((e: any) => e.id === urlEventId);
            if (event) {
                setBookingEvent(event);
                if (bookingId) {
                    setResumingBookingId(bookingId);
                }
            }
        }
    }, [events, urlEventId]);

    async function handleSuccessfulPayment(bookingId: string, type: string = 'event') {
        setIsPaymentProcessing(true);
        try {
            // Note: We no longer update the database directly from the frontend to prevent RLS violations.
            // We rely on the Stripe/PayPal Webhook to update the status to CONFIRMED or PAID.

            if (type === 'event') {
                const { data: booking, error: bookingError } = await supabase
                    .from('Booking')
                    .select('*, Event(*)')
                    .eq('id', bookingId)
                    .single();

                if (bookingError) throw bookingError;

                // Optimistically generate the ticket for the user (the backend will confirm payment independently)
                generateTicketPDF({
                    eventTitle: booking.Event.title,
                    eventDate: format(new Date(booking.Event.date), 'PPPP'),
                    eventLocation: booking.Event.location,
                    userName: profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'Attendee',
                    userEmail: user?.email || '',
                    category: booking.category,
                    amountPaid: Number(booking.amountPaid),
                    bookingId: booking.id
                });

                toast({ title: "Booking Confirmation Processed!", description: "Your ticket has been generated. Your booking state will update shortly." });
            } else if (type === 'visa') {
                toast({ title: "Visa Request Processed!", description: "Your payment has been captured and your request is now being processed." });
            } else if (type === 'application') {
                toast({ title: "Application Processed!", description: "Your payment has been captured and your application is now under review." });
            }
        } catch (error: any) {
            console.error("Error generating receipt or verifying booking:", error);
            toast({ title: "Error", description: "Failed to load booking details after payment. Please contact support.", variant: "destructive" });
        } finally {
            setIsPaymentProcessing(false);
        }
    }

    const handleApplicationSuccess = (applicationId: string, amount: number) => {
        openPayment({
            amount,
            bookingId: applicationId,
            type: 'application',
            title: 'Application Donation',
            returnUrl: '/upcoming-events'
        });
    };

    const submitProposal = async () => {
        if (!user || !bookingEvent) return;

        // Ensure session is valid before performing RLS-restricted actions
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            toast({ title: "Session Expired", description: "Please log in again to upload documents and submit proposals.", variant: "destructive" });
            setLocation(`/auth?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
            return;
        }

        setSubmittingProposal(true);
        try {
            let docUrl = null;
            if (proposalFile) {
                const fileExt = proposalFile.name.split('.').pop();
                const fileName = `proposals/${user.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, proposalFile);
                if (uploadError) throw uploadError;
                const { data } = supabase.storage.from('documents').getPublicUrl(fileName);
                docUrl = data.publicUrl;
            }

            const { error } = await supabase.from('Proposals').insert({
                userId: user.id,
                eventId: bookingEvent.id,
                description: proposalDescription,
                documentUrl: docUrl,
                status: 'PENDING'
            });

            if (error) throw error;

            toast({ title: "Proposal Submitted", description: "Your proposal is under review. You will be notified typically within 5 days." });
            setProposalModal(false);
            setBookingEvent(null); // Close booking modal
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSubmittingProposal(false);
        }
    };


    const upcomingEvents = useMemo(() => {
        if (!events) return [];
        const now = new Date();
        return (events as any[]).filter(event => {
            const eventDate = new Date(event.date);
            return isAfter(eventDate, now) || isToday(eventDate);
        });
    }, [events]);

    const filteredUpcomingEvents = useMemo(() => {
        if (selectedSeason === "ALL") return upcomingEvents;
        return upcomingEvents.filter((ev: any) => {
            const m = new Date(ev.date).getMonth();
            if (selectedSeason === "SPRING") return m >= 2 && m <= 4;
            if (selectedSeason === "SUMMER") return m >= 5 && m <= 7;
            if (selectedSeason === "AUTUMN") return m >= 8 && m <= 10;
            if (selectedSeason === "WINTER") return m === 11 || m === 0 || m === 1;
            return true;
        });
    }, [upcomingEvents, selectedSeason]);

    const selectedEvent = useMemo(() => {
        if (!urlEventId || !events) return null;
        return events.find((e: any) => e.id === urlEventId);
    }, [urlEventId, events]);

    // Fetch user's existing proposal for the selected event
    useEffect(() => {
        if (!user || !selectedEvent) {
            setExistingProposal(null);
            return;
        }

        const fetchProposal = async () => {
            const { data } = await supabase
                .from('Proposals')
                .select('*')
                .eq('userId', user.id)
                .eq('eventId', selectedEvent.id)
                .maybeSingle();
            setExistingProposal(data);
        };
        fetchProposal();
    }, [user, selectedEvent]);

    useEffect(() => {
        if (!selectedEvent) return;

        const timer = setInterval(() => {
            const eventDate = new Date(selectedEvent.date);
            const now = new Date();
            const difference = eventDate.getTime() - now.getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            } else {
                setTimeLeft(null);
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [selectedEvent]);

    // Media Gallery Shuffle Effect
    useEffect(() => {
        if (!selectedEvent?.imageUrls?.length) return;

        const interval = setInterval(() => {
            setCurrentImageIdx(prev => (prev + 1) % selectedEvent.imageUrls.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [selectedEvent?.imageUrls?.length]);

    const bookingMutation = useMutation({
        mutationFn: async ({ eventId, category, amount, selectedLocation, attendeeAge, guardianName, guardianPhone, institutionData }: {
            eventId: string;
            category: string;
            amount: number;
            selectedLocation?: string;
            attendeeAge?: number;
            guardianName?: string;
            guardianPhone?: string;
            institutionData?: {
                institutionName?: string;
                institutionAddress?: string;
                headAdminName?: string;
                institutionContact?: string;
            }
        }) => {
            if (!user) throw new Error("User not authenticated");

            // Validate strict session to prevent Row Level Violations
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Session expired. Please log in again.");

            const bookingPayload: any = {
                eventId: eventId,
                userId: user.id,
                category: category,
                amountPaid: amount,
                status: 'PENDING',
                mode: bookingMode,
                selectedLocation: selectedLocation || null,
                attendeeAge: attendeeAge !== undefined ? attendeeAge : null,
                guardianName: guardianName || null,
                guardianPhone: guardianPhone || null,
                institutionName: institutionData?.institutionName || null,
                institutionAddress: institutionData?.institutionAddress || null,
                headAdminName: institutionData?.headAdminName || null,
                institutionContact: institutionData?.institutionContact || null,
                updatedAt: new Date().toISOString()
            };

            // Save to profile if requested
            if (saveToProfile && institutionData?.institutionName && updateProfile) {
                updateProfile(institutionData).catch((e) => console.warn("Background profile save:", e));
            }

            if (resumingBookingId) {
                const { data, error } = await supabase
                    .from('Booking')
                    .update(bookingPayload)
                    .eq('id', resumingBookingId)
                    .select()
                    .single();
                if (error) throw error;
                return data;
            } else {
                const { data, error } = await supabase
                    .from('Booking')
                    .insert(bookingPayload)
                    .select()
                    .single();
                if (error) throw error;
                return data;
            }
        },
        onSuccess: (data) => {
            const bookedTitle = bookingEvent?.title || selectedEvent?.title || 'Event Booking';
            setBookingEvent(null);
            openPayment({
                amount: Number(data.amountPaid),
                bookingId: data.id,
                type: 'event',
                eventId: selectedEvent?.id || bookingEvent?.id,
                category: bookingCategory,
                title: `Event Booking: ${bookedTitle}`,
                returnUrl: '/upcoming-events'
            });
        },
        onError: (error: any) => {
            toast({ title: "Booking failed", description: error.message, variant: "destructive" });
        }
    });

    const visaMutation = useMutation({
        mutationFn: async ({ eventId, amount }: { eventId: string, amount: number }) => {
            if (!user) throw new Error("User not authenticated");

            // Validate strict session to prevent Row Level Violations
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Session expired. Please log in again.");

            const { data, error } = await supabase
                .from('VisaInvitation')
                .insert({
                    eventId: eventId,
                    userId: user.id,
                    amountPaid: amount,
                    status: 'PENDING',
                    paymentStatus: 'PENDING'
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            setVisaInvitationEvent(null);
            openPayment({
                amount: Number(data.amountPaid),
                bookingId: data.id,
                type: 'visa',
                eventId: visaInvitationEvent?.id,
                title: 'Visa Invitation Letter Payment',
                returnUrl: '/upcoming-events'
            });
        },
        onError: (error: any) => {
            toast({ title: "Request failed", description: error.message, variant: "destructive" });
        }
    });

    if (eventsLoading || isLoading) return <div className="flex justify-center py-40"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

    const mainContent = (
        <div className="flex flex-col min-h-screen">
            {selectedEvent ? (
                <div className="flex flex-col min-h-screen">
                    {/* 1. Hero Section */}
                    <section className="relative min-h-[80vh] flex items-center pt-20 overflow-hidden bg-slate-900">
                        <div className="absolute inset-0 opacity-40">
                            <img src={selectedEvent.heroImageUrl || selectedEvent.imageUrls?.[0] || "/images/event.png"} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                        <div className="container mx-auto px-4 relative z-10 text-white">
                            <div className="w-full">
                                {selectedEvent.theme && (
                                    <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-primary font-bold mb-6">
                                        {selectedEvent.theme}
                                    </span>
                                )}
                                <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tighter">
                                    {selectedEvent.title}
                                </h1>
                                <p className="text-xl md:text-2xl text-slate-300 mb-10 leading-relaxed w-full">
                                    {selectedEvent.description}
                                </p>
                                <div className="flex flex-wrap gap-6 text-lg mb-10">
                                    <div className="flex items-center gap-2"><Calendar className="text-primary" /> {format(new Date(selectedEvent.date), 'PPPP')}</div>
                                    <div className="flex items-center gap-2"><MapPin className="text-primary" /> {selectedEvent.location}</div>
                                </div>

                                {/* Countdown Timer */}
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 max-w-2xl">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <Bell className="text-primary animate-bounce" /> Time To Application Deadline
                                    </h3>
                                    {timeLeft ? (
                                        <div className="grid grid-cols-4 gap-4">
                                            {[
                                                { label: 'Days', value: timeLeft.days },
                                                { label: 'Hrs', value: timeLeft.hours },
                                                { label: 'Min', value: timeLeft.minutes },
                                                { label: 'Sec', value: timeLeft.seconds }
                                            ].map((unit, idx) => (
                                                <div key={idx} className="flex flex-col items-center">
                                                    <span className="text-4xl md:text-5xl font-bold tracking-tighter">{unit.value.toString().padStart(2, '0')}</span>
                                                    <span className="text-xs uppercase tracking-widest text-slate-400 mt-1">{unit.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-2xl font-bold text-red-500">Registration Closed</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. Admission Categories & Selection Criteria */}
                    <section className="py-24 bg-white dark:bg-slate-950">
                        <div className="container mx-auto px-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                <div>
                                    <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                                        <span className="w-2 h-10 bg-primary rounded-full" />
                                        Event Admission Categories
                                    </h2>
                                    <div className="space-y-6">
                                        {(() => {
                                            const basePrice = resolvePriceInKES(selectedEvent.price);
                                            return [
                                                { 
                                                    title: "Self Funded", 
                                                    p: basePrice, 
                                                    seats: selectedEvent.self_funded_seats, 
                                                    desc: "Standard admission for individual delegates - 18 years and above." 
                                                },
                                                { 
                                                    title: "Partially Funded", 
                                                    p: Math.round(basePrice * 0.75), 
                                                    seats: selectedEvent.partially_funded_seats, 
                                                    desc: "Special rate for students (75% of total) - for students 15 - 17 years and above." 
                                                },
                                                { 
                                                    title: "Exclusively Funded", 
                                                    p: Math.round(basePrice * 0.5), 
                                                    seats: selectedEvent.fully_funded_seats, 
                                                    desc: "Scholarship-based admission (50% of total) - for children under the age of 7 - 15 years." 
                                                }
                                            ];
                                        })().map((cat, i) => (
                                            <div key={i} className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-primary/30 transition-all group">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="font-bold text-xl group-hover:text-primary transition-colors">{cat.title}</h4>
                                                        <p className="text-slate-500 text-sm max-w-[260px] leading-relaxed mt-1">{cat.desc}</p>
                                                    </div>
                                                    <div className="text-right space-y-1">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className="text-xs font-medium text-slate-400">Physical:</span>
                                                            <span className="text-xl font-bold text-primary">{formatKES(cat.p)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className="text-xs font-medium text-slate-400">Virtual:</span>
                                                            <span className="text-lg font-bold text-emerald-600">{formatKES(Math.round(cat.p * 0.65))}</span>
                                                        </div>
                                                        <p className="text-[10px] text-slate-400 mt-1">{cat.seats} seats available</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                                        <span className="w-2 h-10 bg-emerald-500 rounded-full" />
                                        Selection Criteria
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { title: "Become a Speaker", icon: MessageCircle, color: "bg-blue-500", desc: "Share your expertise with a global audience.", type: 'SPEAKER' },
                                            { title: "Join as Sponsor", icon: Globe, color: "bg-purple-500", desc: "Support the next generation of digital leaders.", type: 'SPONSOR' },
                                            { title: "NextGenLeaders", icon: Users, color: "bg-amber-500", desc: "Our premium technology and digital incubator program.", type: 'NEXTGEN' },
                                            { title: "#worlducationHub Global Forum", icon: Globe, color: "bg-emerald-500", desc: "Champion digital learning & education empowerment in your region.", type: 'GLOBAL_FORUM' }
                                        ].map((item, i) => (
                                            <div key={i} className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all">
                                                <div className={`${item.color} w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4`}>
                                                    <item.icon className="h-5 w-5" />
                                                </div>
                                                <h4 className="font-bold mb-2">{item.title}</h4>
                                                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                                                <Button
                                                    variant="link"
                                                    className="p-0 h-auto mt-4 text-primary font-bold"
                                                    onClick={() => {
                                                        if (!user) {
                                                            setLocation(`/auth?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                                                            return;
                                                        }
                                                        setApplicationModal({ open: true, type: item.type as any, title: item.title });
                                                    }}
                                                >
                                                    Apply Now <ArrowRight className="ml-1 h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}

                                    </div>
                                </div>
                            </div>

                            <div className="mt-16 p-8 bg-primary/5 rounded-3xl border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary text-white p-3 rounded-2xl">
                                        <Globe className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Visa Invitation Letter</h3>
                                        <p className="text-slate-500 max-w-md">Required for international delegates. Request your official invitation letter managed independently from event booking.</p>
                                    </div>
                                </div>
                                <Button
                                    size="lg"
                                    className="rounded-2xl h-auto py-4 px-8 text-lg font-bold flex flex-col items-center gap-1"
                                    onClick={() => setVisaInvitationEvent(selectedEvent)}
                                    disabled={!timeLeft}
                                >
                                    {timeLeft ? (
                                        <>
                                            <span className="flex items-center gap-2">
                                                Request Visa Letter
                                                <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">PROMO</span>
                                            </span>
                                            <span className="text-sm font-normal opacity-90">
                                                <span className="line-through opacity-75 mr-2 text-slate-300">{formatKES(17000)}</span>
                                                <span className="font-bold text-xl">{formatKES(8500)}</span>
                                            </span>
                                        </>
                                    ) : "Registration Closed"}
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* 3. Activities Section */}
                    {selectedEvent.activities?.length > 0 && (
                        <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
                            <div className="container mx-auto px-4">
                                <h2 className="text-4xl font-bold mb-16 text-center">Event Itinerary</h2>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    {selectedEvent.activities.map((day: any) => (
                                        <div key={day.day} className="space-y-6">
                                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-primary">
                                                <h3 className="text-2xl font-bold">Day {day.day}</h3>
                                                <p className="text-primary font-semibold">{day.date}</p>
                                            </div>
                                            <div className="space-y-4">
                                                {day.items?.map((item: any, idx: number) => (
                                                    <div key={idx} className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors">
                                                        <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                                                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{item.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 4. Booking CTA */}
                    <section className="py-24 bg-slate-900 text-white text-center">
                        <div className="container mx-auto px-4">
                            <h2 className="text-4xl md:text-6xl font-black mb-16 tracking-tighter">Ready to Join Us?</h2>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto">
                                {/* Physical Attendance Section */}
                                <div className="space-y-8 bg-white/5 p-8 rounded-[3rem] border border-white/10 flex flex-col">
                                    <h3 className="text-3xl font-bold flex items-center justify-center gap-3">
                                        <MapPin className="text-primary h-8 w-8" /> Physical Attendance
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-4 flex-grow">
                                        {(() => {
                                            const base = resolvePriceInKES(selectedEvent.price);
                                            return [
                                                { category: 'SELF_FUNDED', label: 'Self Funded', p: base, desc: '18 yrs & above • Register now' },
                                                { category: 'PARTIALLY_FUNDED', label: 'Partially Funded', p: Math.round(base * 0.75), desc: '15 - 17 yrs • 25% discount' },
                                                { category: 'FULLY_FUNDED', label: 'Exclusively Funded', p: Math.round(base * 0.5), desc: '7 - 15 yrs • 50% scholarship' }
                                            ];
                                        })().map((opt) => (
                                            <Button
                                                key={opt.category}
                                                size="lg"
                                                className="bg-white text-primary hover:bg-slate-50 h-auto py-8 flex flex-col items-center justify-start rounded-3xl group relative overflow-hidden shadow-lg border-2 border-transparent hover:border-primary/20 transition-all"
                                                onClick={() => {
                                                    setBookingMode('PHYSICAL');
                                                    setBookingCategory(opt.category as any);
                                                    setBookingEvent(selectedEvent);
                                                }}
                                                disabled={!timeLeft}
                                            >
                                                <span className="text-2xl font-black mb-1">{formatKES(opt.p)}</span>
                                                <span className="text-lg font-bold mb-2">{opt.label}</span>
                                                <div className="w-12 h-1 bg-primary/20 rounded-full mb-4" />
                                                <span className="text-xs font-medium opacity-70 mb-4">{timeLeft ? opt.desc : "Closed"}</span>

                                                <ul className="text-left w-full space-y-2 px-2 mt-auto">
                                                    {selectedEvent.benefits?.filter((b: any) => b.category === opt.category).slice(0, 2).map((b: any, i: number) => (
                                                        <li key={i} className="text-[10px] text-slate-600 flex items-start gap-1 leading-tight">
                                                             <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                                                             <span>{b.description}</span>
                                                         </li>
                                                    ))}
                                                </ul>
                                                <Ticket className="absolute bottom-2 right-2 h-12 w-12 text-primary/5 -rotate-12 group-hover:scale-110 transition-transform pointer-events-none" />
                                            </Button>
                                        ))}
                                    </div>
                                    <p className="text-sm text-slate-400 mt-6 italic">Attend in person to experience the full energy of the event.</p>
                                </div>

                                {/* Virtual Attendance Section */}
                                <div className="space-y-8 bg-white/5 p-8 rounded-[3rem] border border-white/10 flex flex-col">
                                    <h3 className="text-3xl font-bold flex items-center justify-center gap-3">
                                        <Globe className="text-primary h-8 w-8" /> Virtual Attendance
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-4 flex-grow">
                                        {(() => {
                                            const base = resolvePriceInKES(selectedEvent.price);
                                            return [
                                                { category: 'SELF_FUNDED', label: 'Self Funded', p: Math.round(base * 0.65), desc: '18 yrs & above • Virtual Access' },
                                                { category: 'PARTIALLY_FUNDED', label: 'Partially Funded', p: Math.round(base * 0.75 * 0.65), desc: '15 - 17 yrs • Virtual Discount' },
                                                { category: 'FULLY_FUNDED', label: 'Exclusively Funded', p: Math.round(base * 0.5 * 0.65), desc: '7 - 15 yrs • Virtual Scholar' }
                                            ];
                                        })().map((opt) => (
                                            <Button
                                                key={opt.category}
                                                size="lg"
                                                className="bg-primary/20 text-white hover:bg-primary/30 h-auto py-8 flex flex-col items-center justify-start rounded-3xl group relative overflow-hidden shadow-lg border-2 border-white/10 hover:border-primary/40 transition-all"
                                                onClick={() => {
                                                    setBookingMode('VIRTUAL');
                                                    setBookingCategory(opt.category);
                                                    setBookingEvent(selectedEvent);
                                                }}
                                                disabled={!timeLeft}
                                            >
                                                <span className="text-2xl font-black mb-1">{formatKES(opt.p)}</span>
                                                <span className="text-lg font-bold mb-2">{opt.label}</span>
                                                <div className="w-12 h-1 bg-white/20 rounded-full mb-4" />
                                                <span className="text-xs font-medium opacity-70 mb-4">{timeLeft ? opt.desc : "Closed"}</span>

                                                <ul className="text-left w-full space-y-2 px-2 mt-auto">
                                                    <li className="text-[10px] text-slate-300 flex items-start gap-1 leading-tight">
                                                        <CheckCircle className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                                                        <span>Full Digital Access</span>
                                                    </li>
                                                </ul>
                                                <Globe className="absolute bottom-2 right-2 h-12 w-12 text-white/5 -rotate-12 group-hover:scale-110 transition-transform pointer-events-none" />
                                            </Button>
                                        ))}
                                    </div>
                                    <p className="text-sm text-slate-400 mt-6 italic">Empowering global reach through digital excellence.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 5. Alignment Section */}
                    {selectedEvent.alignment?.title && (
                        <section className="py-24 bg-white dark:bg-slate-950">
                            <div className="container mx-auto px-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                                    <div>
                                        <h2 className="text-4xl font-bold mb-8">{selectedEvent.alignment.title}</h2>
                                        <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                                            {selectedEvent.alignment.description}
                                        </p>
                                    </div>
                                    <div className="p-10 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                            <Globe className="text-primary" /> Global Priorities
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            This summit is shaped around core objectives of leading international youth frameworks, ensuring high impact and global relevance.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 6. Key Features */}
                    {selectedEvent.features?.length > 0 && (
                        <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
                            <div className="container mx-auto px-4">
                                <h2 className="text-3xl font-bold mb-12 text-center">Event Highlights</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {selectedEvent.features.map((feature: string, idx: number) => (
                                        <div key={idx} className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 font-bold">
                                                {idx + 1}
                                            </div>
                                            <h4 className="font-bold leading-tight">{feature}</h4>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 7. Speakers Section */}
                    {selectedEvent.speakers?.length > 0 && (
                        <section className="py-24 bg-white dark:bg-slate-950">
                            <div className="container mx-auto px-4">
                                <div className="text-center max-w-2xl mx-auto mb-16">
                                    <h2 className="text-4xl font-bold mb-4">Featured Speakers</h2>
                                    <p className="text-slate-600 dark:text-slate-400">Hear from global state persons, CEOs, and public intellectuals.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    {selectedEvent.speakers.map((s: any, idx: number) => (
                                        <div key={idx} className="group relative overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-900">
                                            <div className="aspect-[3/4] overflow-hidden">
                                                <img
                                                    src={s.imageUrl || "/images/event.png"}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    alt={s.name}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s.name)}`;
                                                    }}
                                                />
                                            </div>
                                            <div className="p-8 space-y-2">
                                                <h4 className="text-2xl font-bold">{s.name}</h4>
                                                <p className="text-primary font-bold">{s.role}</p>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{s.bio}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 8. User Journey */}
                    {selectedEvent.journey?.arrival && (
                        <section className="py-24 bg-slate-900 text-white">
                            <div className="container mx-auto px-4">
                                <h2 className="text-4xl font-bold mb-16 text-center">In Preparation for the Event</h2>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div className="p-10 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
                                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><MapPin className="text-primary" /> Arrival & Logistics</h3>
                                        <p className="text-slate-300 leading-relaxed whitespace-pre-line">{selectedEvent.journey.arrival}</p>
                                    </div>
                                    <div className="p-10 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
                                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><Bell className="text-primary" /> What to Expect</h3>
                                        <p className="text-slate-300 leading-relaxed whitespace-pre-line">{selectedEvent.journey.expectations}</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 9. FAQ Section */}
                    {selectedEvent.faqs?.length > 0 && (
                        <section className="py-24 bg-white dark:bg-slate-950">
                            <div className="container mx-auto px-4">
                                <h2 className="text-4xl font-bold mb-16 text-center">Frequently Asked Questions</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {selectedEvent.faqs.map((faq: any, idx: number) => (
                                        <div key={idx} className="p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl hover:shadow-xl transition-shadow border border-transparent hover:border-primary/20">
                                            <div className="flex items-start gap-3 mb-4">
                                                <HelpCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                                                <h4 className="text-lg font-bold leading-tight">{faq.question}</h4>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{faq.answer}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 10. Media Gallery Shuffle */}
                    {selectedEvent.imageUrls?.length > 0 && (
                        <section className="py-24 overflow-hidden bg-slate-50 dark:bg-slate-900/40">
                            <div className="container mx-auto px-4">
                                <div className="text-center mb-16">
                                    <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Event Gallery</h2>
                                    <p className="text-slate-500 text-lg">A window into our vibrant global community and transformative gatherings.</p>
                                </div>
                                <div className="max-w-7xl mx-auto aspect-[16/7] relative rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] bg-slate-950 group">
                                    <AnimatePresence mode="wait">
                                        <motion.img
                                            key={currentImageIdx}
                                            src={selectedEvent.imageUrls[currentImageIdx]}
                                            initial={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                                            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    </AnimatePresence>

                                    {/* Overlay for depth */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />

                                    {/* Progress indicator */}
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                                        {selectedEvent.imageUrls.map((_: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className={`h-1.5 rounded-full transition-all duration-700 ${currentImageIdx === idx ? 'w-10 bg-white' : 'w-2 bg-white/40'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    <JoinUs />
                </div>
            ) : (
                <div className="flex flex-col min-h-screen">
                    <HeroSection
                        backgroundImageUrl="/images/hero_Events.gif"
                        title="Seasonal Summits & Digital Labs"
                        subtitle="We run various events during various seasons of the year as our system is structured to shape future knowledge and digital skills."
                        showShortcuts={true}
                    />

                    <section className="py-24 bg-background">
                        <div className="container mx-auto px-4 sm:px-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                                <div>
                                    <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full">
                                        Annual Schedule
                                    </span>
                                    <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight mt-2 mb-2">Upcoming Seasonal Events</h2>
                                    <p className="text-base text-muted-foreground">Select a season or browse all scheduled workshops and tech labs.</p>
                                </div>

                                {/* Seasonal Filter Tabs */}
                                <div className="flex flex-wrap gap-2 bg-muted p-1.5 rounded-2xl border border-border">
                                    {[
                                        { id: "ALL", label: "All Seasons", icon: "✨" },
                                        { id: "SPRING", label: "Spring", icon: "🌸" },
                                        { id: "SUMMER", label: "Summer", icon: "☀️" },
                                        { id: "AUTUMN", label: "Autumn", icon: "🍂" },
                                        { id: "WINTER", label: "Winter", icon: "❄️" }
                                    ].map((s) => (
                                        <button
                                            key={s.id}
                                            onClick={() => setSelectedSeason(s.id)}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5",
                                                selectedSeason === s.id
                                                    ? "bg-primary text-white shadow-md"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-card"
                                            )}
                                        >
                                            <span>{s.icon}</span>
                                            <span>{s.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {filteredUpcomingEvents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {filteredUpcomingEvents.map((event: any) => (
                                        <Card key={event.id} className="group flex flex-col h-full border border-border bg-card shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer rounded-3xl" onClick={() => setLocation(`/upcoming-events?id=${event.id}`)}>
                                            <div className="aspect-video relative overflow-hidden bg-slate-900">
                                                <img
                                                    src={event.heroImageUrl || event.imageUrls?.[0] || "/images/IMG-20260618-WA0008.jpg"}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = "/images/IMG-20260618-WA0008.jpg";
                                                    }}
                                                />
                                                <div className="absolute top-4 right-4 bg-primary text-white px-3.5 py-1.5 rounded-full font-black shadow-xl text-sm">
                                                    ${event.price}
                                                </div>
                                                <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold border border-border">
                                                    {event.category || "Seasonal Workshop"}
                                                </div>
                                            </div>
                                            <CardHeader className="p-6 pb-3">
                                                <CardTitle className="text-xl font-bold text-foreground group-hover:text-primary transition-colors mb-3 line-clamp-1">{event.title}</CardTitle>
                                                <div className="space-y-2">
                                                    <CardDescription className="flex items-center gap-2.5 text-muted-foreground text-xs font-medium">
                                                        <div className="h-7 w-7 rounded-lg bg-indigo-500/10 flex items-center justify-center text-primary shrink-0">
                                                            <Calendar className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span>{format(new Date(event.date), 'PPPP')}</span>
                                                    </CardDescription>
                                                    <CardDescription className="flex items-center gap-2.5 text-muted-foreground text-xs font-medium">
                                                        <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                                                            <MapPin className="h-3.5 w-3.5" />
                                                        </div>
                                                        <span className="line-clamp-1">{event.location}</span>
                                                    </CardDescription>
                                                </div>
                                            </CardHeader>
                                            <CardContent className="p-6 py-2 flex-grow">
                                                <p className="text-muted-foreground text-xs sm:text-sm line-clamp-3 leading-relaxed">{event.description}</p>
                                            </CardContent>
                                            <CardFooter className="p-6 pt-3 border-t border-border">
                                                <Button
                                                    className="w-full h-11 text-sm font-bold group/btn rounded-xl"
                                                    onClick={(e) => { e.stopPropagation(); setBookingEvent(event); }}
                                                >
                                                    Book Your Spot
                                                    <Ticket className="ml-2 h-4 w-4 transition-transform group-hover/btn:rotate-12" />
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-card rounded-3xl border border-dashed border-border p-8">
                                    <Calendar className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-foreground mb-2">No Events Found for this Season</h3>
                                    <p className="text-muted-foreground text-sm">Switch seasons or check back as new seasonal lab dates are announced.</p>
                                    <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={() => setSelectedSeason("ALL")}>
                                        View All Seasons
                                    </Button>
                                </div>
                            )}
                        </div>
                    </section>

                    <Testimonials />
                    <JoinUs />
                </div>
            )}

            {/* Booking Selection Dialog */}
            <Dialog open={!!bookingEvent} onOpenChange={(open) => {
                if (!open) {
                    setBookingEvent(null);
                    setResumingBookingId(null);
                }
            }}>
                <DialogContent className="sm:max-w-lg rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Confirm Your Booking</DialogTitle>
                        <DialogDescription>
                            Review the details below and select your preferred registration tier.
                        </DialogDescription>
                    </DialogHeader>
                    {bookingEvent && (
                        <div className="space-y-6 pt-4">
                            <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl">
                                <img src={bookingEvent.heroImageUrl || bookingEvent.imageUrls?.[0] || "/images/event.png"} className="h-20 w-20 rounded-xl object-cover" alt="" />
                                <div>
                                    <h4 className="font-bold text-lg">{bookingEvent.title}</h4>
                                    <p className="text-sm text-slate-500">{format(new Date(bookingEvent.date), 'PP')}</p>
                                    <p className="text-primary font-bold">{formatKES(resolvePriceInKES(bookingEvent.price))}</p>
                                </div>
                            </div>

                            <div className="space-y-3 font-medium text-slate-600">
                                <p>Select attendance mode & tier:</p>
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    {[
                                        { id: 'PHYSICAL', label: 'Physical', icon: MapPin },
                                        { id: 'VIRTUAL', label: 'Virtual', icon: Globe }
                                    ].map(mode => (
                                        <div
                                            key={mode.id}
                                            className={cn(
                                                "p-3 border rounded-2xl cursor-pointer flex flex-col items-center gap-2 transition-all",
                                                bookingMode === mode.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary'
                                            )}
                                            onClick={() => setBookingMode(mode.id as any)}
                                        >
                                            <mode.icon className={cn("h-5 w-5", bookingMode === mode.id ? "text-primary" : "text-slate-400")} />
                                            <span className={cn("text-xs font-bold", bookingMode === mode.id ? "text-primary" : "text-slate-600")}>{mode.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Location Selection when Physical Mode */}
                                {bookingMode === 'PHYSICAL' && (
                                    <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                                <MapPin className="h-4 w-4 text-primary" />
                                                Choose Event Location to Attend:
                                            </Label>
                                            {bookingEvent.locations && bookingEvent.locations.length > 0 && (
                                                <span className="text-[10px] text-primary font-semibold">
                                                    {bookingEvent.locations.length} Same-Day Venues
                                                </span>
                                            )}
                                        </div>

                                        {bookingEvent.locations && bookingEvent.locations.length > 0 ? (
                                            <div className="grid grid-cols-1 gap-2 pt-1">
                                                {bookingEvent.locations.map((loc: any, lIdx: number) => {
                                                    const isLocSelected = (selectedLocation === loc.name) || (!selectedLocation && lIdx === 0);
                                                    return (
                                                        <div
                                                            key={loc.id || lIdx}
                                                            onClick={() => setSelectedLocation(loc.name)}
                                                            className={cn(
                                                                "p-3 rounded-xl border text-left cursor-pointer transition-all flex justify-between items-start",
                                                                isLocSelected
                                                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                                                    : "bg-background hover:border-slate-300"
                                                            )}
                                                        >
                                                            <div className="space-y-0.5">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-xs font-bold text-slate-900 dark:text-white">{loc.name}</p>
                                                                    {loc.time && (
                                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                                                                            {loc.time}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {loc.address && <p className="text-[11px] text-slate-500">{loc.address}</p>}
                                                            </div>
                                                            {isLocSelected && <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 p-2 bg-background rounded-xl border border-slate-200 text-xs text-slate-700">
                                                <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                                                <span>Venue: <strong>{bookingEvent.location || "Main Center"}</strong></span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Attendee Age Declaration & Child Streamlining */}
                                <div className="space-y-3 p-4 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 mb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                                <Users className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100">Attendee Age Declaration</h5>
                                                <p className="text-[11px] text-slate-500">
                                                    {bookingEvent.is_child_focused
                                                        ? "Child-Focused Summit: Specially streamlined for children (7-15 yrs)"
                                                        : "Declare age to streamline appropriate scholarship / student tier"}
                                                </p>
                                            </div>
                                        </div>
                                        {bookingEvent.is_child_focused && (
                                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                                                👶 Child Track
                                            </span>
                                        )}
                                    </div>

                                    <div className="pt-1">
                                        <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                            Attendee Age (in years) *
                                        </Label>
                                        <div className="flex items-center gap-3 mt-1">
                                            <Input
                                                type="number"
                                                min="1"
                                                max="120"
                                                placeholder="e.g. 10"
                                                value={attendeeAge}
                                                onChange={e => {
                                                    const val = e.target.value === '' ? '' : Number(e.target.value);
                                                    setAttendeeAge(val);
                                                    if (typeof val === 'number') {
                                                        if (val >= 7 && val <= 15) {
                                                            setBookingCategory('FULLY_FUNDED');
                                                        } else if (val > 15 && val <= 17) {
                                                            setBookingCategory('PARTIALLY_FUNDED');
                                                        } else if (val >= 18) {
                                                            setBookingCategory('SELF_FUNDED');
                                                        }
                                                    }
                                                }}
                                                className="h-9 text-sm rounded-xl max-w-[110px] bg-background font-bold text-primary"
                                                required
                                            />
                                            <div className="text-xs">
                                                {typeof attendeeAge === 'number' && attendeeAge >= 7 && attendeeAge <= 15 && (
                                                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                                                        <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                                        Child Age (7–15 yrs): Exclusively Funded 50% Scholarship Selected!
                                                    </span>
                                                )}
                                                {typeof attendeeAge === 'number' && attendeeAge > 15 && attendeeAge <= 17 && (
                                                    <span className="text-blue-600 font-semibold flex items-center gap-1">
                                                        <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                                        Student Age (15–17 yrs): Partially Funded 25% Discount Selected!
                                                    </span>
                                                )}
                                                {typeof attendeeAge === 'number' && attendeeAge >= 18 && (
                                                    <span className="text-slate-600">Adult / General Delegate (18+ yrs)</span>
                                                )}
                                                {attendeeAge === '' && (
                                                    <span className="text-slate-500 italic">Enter attendee age to auto-verify eligibility</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Parent / Guardian section for minors (under 18) */}
                                    {((typeof attendeeAge === 'number' && attendeeAge < 18) || bookingEvent.is_child_focused) && (
                                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-400">
                                                <span>Parent / Guardian Details (For Attendees Under 18)</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                <div>
                                                    <Label className="text-[11px] font-semibold text-slate-700">Parent / Guardian Name</Label>
                                                    <Input
                                                        placeholder="e.g. Jane Doe"
                                                        value={guardianName}
                                                        onChange={e => setGuardianName(e.target.value)}
                                                        className="h-8 text-xs rounded-xl mt-0.5 bg-background"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-[11px] font-semibold text-slate-700">Guardian Phone</Label>
                                                    <Input
                                                        placeholder="e.g. +254 712 345 678"
                                                        value={guardianPhone}
                                                        onChange={e => setGuardianPhone(e.target.value)}
                                                        className="h-8 text-xs rounded-xl mt-0.5 bg-background"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {(() => {
                                        const baseEventPrice = resolvePriceInKES(bookingEvent.price);
                                        return [
                                            { 
                                                id: 'SELF_FUNDED', 
                                                label: 'Self Funded', 
                                                ageBracket: '18 years and above',
                                                p: baseEventPrice 
                                            },
                                            { 
                                                id: 'PARTIALLY_FUNDED', 
                                                label: 'Partially Funded', 
                                                ageBracket: 'Students 15 - 17 years and above',
                                                p: Math.round(baseEventPrice * 0.75) 
                                            },
                                            { 
                                                id: 'FULLY_FUNDED', 
                                                label: 'Exclusively Funded', 
                                                ageBracket: 'Children under 7 - 15 years (50% Scholarship)',
                                                p: Math.round(baseEventPrice * 0.5) 
                                            }
                                        ];
                                    })().map(tier => {
                                        const finalPrice = bookingMode === 'VIRTUAL' ? Math.round(tier.p * 0.65) : tier.p;
                                        return (
                                            <div
                                                key={tier.id}
                                                className={cn(
                                                    "p-4 border rounded-2xl cursor-pointer flex justify-between items-center group transition-all",
                                                    bookingCategory === tier.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary'
                                                )}
                                                onClick={() => setBookingCategory(tier.id)}
                                            >
                                                <div>
                                                    <span className="font-bold text-slate-900">{tier.label}</span>
                                                    <p className="text-[11px] text-slate-500">{tier.ageBracket}</p>
                                                    <p className="text-xs font-semibold text-primary mt-0.5">{formatKES(finalPrice)}</p>
                                                </div>
                                                {bookingCategory === tier.id && <CheckCircle className="h-5 w-5 text-primary" />}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                                    <h5 className="font-bold text-sm mb-2">Benefits for {bookingCategory.replace('_', ' ')}:</h5>
                                    <div className="space-y-2">
                                        {bookingEvent.benefits?.filter((b: any) => b.category === bookingCategory).map((b: any, i: number) => (
                                            <div key={i} className="flex gap-2 text-sm text-slate-600 items-start">
                                                <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                <span>{b.description}</span>
                                            </div>
                                        ))}
                                        {(!bookingEvent.benefits || bookingEvent.benefits.filter((b: any) => b.category === bookingCategory).length === 0) && (
                                            <p className="text-xs text-slate-500 italic">Standard benefits apply.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Student Institution Declaration Section */}
                                <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/80 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                                                <GraduationCap className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-sm text-slate-900">Student & Institution Information</h5>
                                                <p className="text-[11px] text-slate-500">Declare school or university credentials for your official pass</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setDeclareInstitution(!declareInstitution)}
                                            className="text-xs font-semibold text-primary hover:underline"
                                        >
                                            {declareInstitution ? "Minimize" : "+ Declare School"}
                                        </button>
                                    </div>

                                    {declareInstitution && (
                                        <div className="space-y-3 pt-2 border-t border-slate-200">
                                            <div>
                                                <Label className="text-xs font-semibold text-slate-700">School / Institution Name *</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="e.g. Stanford University / Oxford Academy"
                                                    value={institutionName}
                                                    onChange={(e) => setInstitutionName(e.target.value)}
                                                    className="h-9 text-xs rounded-xl mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold text-slate-700">Institution Address *</Label>
                                                <Input
                                                    type="text"
                                                    placeholder="e.g. 450 Serra Mall, Stanford, CA 94305"
                                                    value={institutionAddress}
                                                    onChange={(e) => setInstitutionAddress(e.target.value)}
                                                    className="h-9 text-xs rounded-xl mt-1"
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                <div>
                                                    <Label className="text-xs font-semibold text-slate-700">Head Administrator / Dean *</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="e.g. Dr. Robert Vance"
                                                        value={headAdminName}
                                                        onChange={(e) => setHeadAdminName(e.target.value)}
                                                        className="h-9 text-xs rounded-xl mt-1"
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs font-semibold text-slate-700">Official Contact (Email/Phone optional)</Label>
                                                    <Input
                                                        type="text"
                                                        placeholder="e.g. admissions@school.edu"
                                                        value={institutionContact}
                                                        onChange={(e) => setInstitutionContact(e.target.value)}
                                                        className="h-9 text-xs rounded-xl mt-1"
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 pt-1">
                                                <input
                                                    type="checkbox"
                                                    id="save_inst_profile"
                                                    checked={saveToProfile}
                                                    onChange={(e) => setSaveToProfile(e.target.checked)}
                                                    className="rounded text-primary focus:ring-primary h-3.5 w-3.5"
                                                />
                                                <label htmlFor="save_inst_profile" className="text-xs text-slate-600 cursor-pointer">
                                                    Save institution credentials to my profile for future events
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Proposal Submission Section (Optional for Donors, Speakers, Leaders; Never required for Students) */}
                                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/80 dark:bg-slate-900/40 space-y-3">
                                    <div className="flex items-center gap-2.5">
                                        <input
                                            type="checkbox"
                                            id="has_proposal_toggle"
                                            checked={hasProposal}
                                            onChange={(e) => setHasProposal(e.target.checked)}
                                            className="rounded text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                                        />
                                        <label htmlFor="has_proposal_toggle" className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                                            I have a proposal to submit <span className="text-xs font-normal text-muted-foreground">(Optional for Donors, Speakers & Leaders)</span>
                                        </label>
                                    </div>

                                    {hasProposal && (
                                        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                                            <div>
                                                <Label className="text-xs font-semibold">Proposal Summary / Idea Description *</Label>
                                                <Textarea
                                                    placeholder="Outline your project idea, research proposal, or speaking topic..."
                                                    value={proposalDescription}
                                                    onChange={(e) => setProposalDescription(e.target.value)}
                                                    className="min-h-[80px] text-xs rounded-xl mt-1"
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs font-semibold">Attach Proposal Document (Optional)</Label>
                                                <Input
                                                    type="file"
                                                    onChange={(e) => setProposalFile(e.target.files?.[0] || null)}
                                                    className="h-9 text-xs rounded-xl mt-1 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4 mt-6">
                                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setBookingEvent(null)}>Cancel</Button>
                                <Button className="flex-1 h-12 rounded-xl" onClick={async () => {
                                    if (!user) {
                                        setLocation(`/auth?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                                        return;
                                    }

                                    // If user checked proposal, ensure description is entered
                                    if (hasProposal && !proposalDescription.trim()) {
                                        toast({
                                            title: "Proposal Description Required",
                                            description: "Please write a brief summary of your proposal before proceeding.",
                                            variant: "destructive"
                                        });
                                        return;
                                    }

                                    if (attendeeAge === '') {
                                        toast({
                                            title: "Attendee Age Required",
                                            description: "Please declare the attendee's age so we can streamline your pass & benefits.",
                                            variant: "destructive"
                                        });
                                        return;
                                    }

                                    setSubmittingProposal(true);

                                    try {
                                        // Submit proposal if toggled
                                        if (hasProposal && proposalDescription.trim()) {
                                            let documentUrl = null;
                                            if (proposalFile) {
                                                const fileExt = proposalFile.name.split('.').pop();
                                                const fileName = `proposals/${user.id}/${Date.now()}.${fileExt}`;
                                                const { error: uploadError } = await supabase.storage.from('documents').upload(fileName, proposalFile);
                                                if (!uploadError) {
                                                    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);
                                                    documentUrl = publicUrl;
                                                }
                                            }

                                            await supabase.from('Proposals').insert({
                                                userId: user.id,
                                                eventId: bookingEvent.id,
                                                description: proposalDescription.trim(),
                                                documentUrl: documentUrl,
                                                status: 'PENDING'
                                            });

                                            toast({
                                                title: "Proposal Attached",
                                                description: "Your proposal has been logged and linked to your booking."
                                            });
                                        }

                                        // Calculate KES amounts
                                        const baseEventPrice = resolvePriceInKES(bookingEvent.price);
                                        const basePrice = bookingCategory === 'SELF_FUNDED' ? baseEventPrice :
                                            bookingCategory === 'PARTIALLY_FUNDED' ? Math.round(baseEventPrice * 0.75) :
                                                Math.round(baseEventPrice * 0.5);
                                        const finalPrice = bookingMode === 'VIRTUAL' ? Math.round(basePrice * 0.65) : basePrice;
                                        const finalCategory = `${bookingMode}_${bookingCategory}`;

                                        bookingMutation.mutate({
                                            eventId: bookingEvent.id,
                                            category: finalCategory,
                                            amount: finalPrice,
                                            selectedLocation: bookingMode === 'PHYSICAL'
                                                ? (selectedLocation || (bookingEvent.locations?.[0]?.name) || bookingEvent.location || "Main Venue")
                                                : "Virtual Online Hub",
                                            attendeeAge: Number(attendeeAge),
                                            guardianName: guardianName.trim() || undefined,
                                            guardianPhone: guardianPhone.trim() || undefined,
                                            institutionData: declareInstitution && institutionName.trim() ? {
                                                institutionName: institutionName.trim(),
                                                institutionAddress: institutionAddress.trim(),
                                                headAdminName: headAdminName.trim(),
                                                institutionContact: institutionContact.trim()
                                            } : undefined
                                        });
                                    } catch (err: any) {
                                        toast({
                                            title: "Error submitting details",
                                            description: err.message || "Failed to finalize booking.",
                                            variant: "destructive"
                                        });
                                    } finally {
                                        setSubmittingProposal(false);
                                    }
                                }} disabled={bookingMutation.isPending || submittingProposal}>
                                    {bookingMutation.isPending || submittingProposal ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Securing Booking...
                                        </>
                                    ) : (
                                        "Proceed to Payment"
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>



            {applicationModal && (
                <ApplicationForm
                    open={applicationModal.open}
                    onOpenChange={(val) => !val && setApplicationModal(null)}
                    type={applicationModal.type}
                    title={applicationModal.title}
                    onSuccess={handleApplicationSuccess}
                />
            )}


            {/* Visa Invitation Dialog */}
            <Dialog open={!!visaInvitationEvent} onOpenChange={() => setVisaInvitationEvent(null)}>
                <DialogContent className="sm:max-w-md rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">Visa Invitation Request</DialogTitle>
                        <DialogDescription className="text-center">
                            Request an official invitation letter for your visa application.
                        </DialogDescription>
                    </DialogHeader>
                    {visaInvitationEvent && (
                        <div className="space-y-6 pt-4">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                                <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
                                <h4 className="font-bold text-lg mb-2">Invitation Letter for {visaInvitationEvent.title}</h4>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    This official letter is required for visa applications at embassies. Processing fee is non-refundable.
                                </p>
                            </div>
                            <div className="flex justify-between items-center p-4 border rounded-2xl">
                                <span className="font-bold">Processing Fee</span>
                                <span className="text-xl font-bold text-primary">{formatKES(8500)}</span>
                            </div>
                            <div className="flex gap-4">
                                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setVisaInvitationEvent(null)}>Cancel</Button>
                                <Button className="flex-1 h-12 rounded-xl" onClick={() => {
                                    if (!user) {
                                        setLocation(`/auth?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                                        return;
                                    }
                                    visaMutation.mutate({ eventId: visaInvitationEvent.id, amount: 8500 });
                                }} disabled={visaMutation.isPending}>
                                    {visaMutation.isPending ? "Processing..." : "Confirm & Pay"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );

    return (
        <PayPalScriptProvider options={{ clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID }}>
            {mainContent}
        </PayPalScriptProvider>
    );
}