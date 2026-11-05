import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
    CheckCircle2,
    XCircle,
    AlertCircle,
    ShieldCheck,
    Calendar,
    MapPin,
    User,
    Mail,
    Search,
    Sparkles,
    GraduationCap,
    Banknote,
    Download,
    Building2,
    PhoneCall
} from "lucide-react";
import { format } from "date-fns";
import { generateTicketPDF } from "@/lib/ticket-generator";
import { formatKES } from "@/lib/currency";

export default function VerifyTicket() {
    const [location] = useLocation();
    const { user, profile } = useAuth();
    const { toast } = useToast();

    const [searchInput, setSearchInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [bookingData, setBookingData] = useState<any | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isUpdatingCash, setIsUpdatingCash] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const queryId = params.get("bookingId");
        if (queryId) {
            setSearchInput(queryId);
            fetchTicket(queryId);
        }
    }, [location]);

    const fetchTicket = async (id: string) => {
        const trimmed = id.trim();
        if (!trimmed) return;

        setLoading(true);
        setErrorMsg(null);
        setBookingData(null);

        try {
            const { data, error } = await supabase
                .from("Booking")
                .select("*, Event(*), User:userId(*)")
                .eq("id", trimmed)
                .maybeSingle();

            if (error) {
                console.error("Ticket verification query error:", error);
                throw new Error("Unable to query verification database.");
            }

            if (!data) {
                setErrorMsg("No ticket found with this reference code. Please verify the code and try again.");
            } else {
                setBookingData(data);
            }
        } catch (err: any) {
            setErrorMsg(err.message || "An unexpected error occurred during ticket verification.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim()) {
            fetchTicket(searchInput.trim());
        }
    };

    // Standard check in for verified bookings
    const handleCheckInOnly = async () => {
        if (!bookingData) return;
        setIsUpdatingCash(true);
        try {
            const nowIso = new Date().toISOString();
            const { data: updatedBooking, error } = await supabase
                .from("Booking")
                .update({
                    checkedIn: true,
                    checkedInAt: nowIso,
                    updatedAt: nowIso
                })
                .eq("id", bookingData.id)
                .select("*, Event(*), user:userId(*)")
                .single();

            if (error) throw error;
            setBookingData(updatedBooking);

            toast({
                title: "Attendee Checked In",
                description: `Successfully admitted ${updatedBooking.user?.name || "Attendee"} to the event.`
            });
        } catch (err: any) {
            toast({
                title: "Check-In Error",
                description: err.message || "Failed to check in attendee.",
                variant: "destructive"
            });
        } finally {
            setIsUpdatingCash(false);
        }
    };

    // Download current official receipt
    const handleDownloadCurrentReceipt = async () => {
        if (!bookingData) return;
        const attendee = bookingData.User || bookingData.user;
        await generateTicketPDF({
            eventTitle: bookingData.Event?.title || "worlducationHub Global Summit",
            eventDate: bookingData.Event?.date ? format(new Date(bookingData.Event.date), "PPPP") : "TBA",
            eventLocation: bookingData.Event?.location || "Event Venue",
            selectedLocation: bookingData.selectedLocation || bookingData.Event?.location,
            attendeeAge: bookingData.attendeeAge,
            guardianName: bookingData.guardianName,
            userName: attendee?.name || "Attendee",
            userEmail: attendee?.email || "",
            category: bookingData.category,
            amountPaid: Number(bookingData.amountPaid || 0),
            bookingId: bookingData.id,
            paymentMethod: bookingData.paymentMethod || "CARD",
            paymentStatus: bookingData.paymentStatus || (bookingData.status === "CONFIRMED" ? "PAID" : "UNPAID"),
            institutionName: bookingData.institutionName || attendee?.institutionName,
            institutionAddress: bookingData.institutionAddress || attendee?.institutionAddress,
            headAdminName: bookingData.headAdminName || attendee?.headAdminName,
            institutionContact: bookingData.institutionContact || attendee?.institutionContact,
            checkedIn: bookingData.checkedIn
        });
    };

    const isConfirmed = bookingData?.status === "CONFIRMED";
    const isCancelled = bookingData?.status === "CANCELLED";
    const isCheckedIn = bookingData?.checkedIn;

    return (
        <div className="min-h-screen bg-background py-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                        <ShieldCheck className="h-4 w-4" />
                        Official Ticket Verification Portal
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                        Ticket & Receipt Authenticator
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        worlducationHub official cryptographic pass verification and payment settlement system
                    </p>
                </div>

                {/* Search Bar */}
                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                    <Input
                        type="text"
                        placeholder="Scan QR or enter Booking ID (UUID)..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="h-12 bg-card rounded-xl border-border text-sm"
                    />
                    <Button type="submit" disabled={loading} className="h-12 px-6 rounded-xl font-semibold gap-2">
                        <Search className="h-4 w-4" />
                        Verify
                    </Button>
                </form>

                {/* Loading State */}
                {loading && (
                    <Card className="p-12 text-center border-border shadow-sm rounded-3xl">
                        <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-sm font-medium text-muted-foreground">Validating event ticket cryptographic signature...</p>
                        </div>
                    </Card>
                )}

                {/* Error / Not Found */}
                {errorMsg && !loading && (
                    <Card className="border-destructive/30 bg-destructive/5 p-6 rounded-2xl shadow-sm">
                        <div className="flex items-start gap-4">
                            <XCircle className="h-8 w-8 text-destructive flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <h3 className="font-bold text-destructive text-base">Invalid or Unverified Ticket</h3>
                                <p className="text-sm text-muted-foreground">{errorMsg}</p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Valid Ticket Display */}
                {bookingData && !loading && (
                    <Card className="overflow-hidden border-border shadow-xl rounded-3xl bg-card">
                        {/* Status Banner */}
                        <div className={`p-6 text-white flex items-center justify-between ${
                            isConfirmed
                                ? "bg-emerald-600"
                                : isCancelled
                                ? "bg-red-600"
                                : "bg-amber-500"
                        }`}>
                            <div className="flex items-center gap-3">
                                {isConfirmed ? (
                                    <CheckCircle2 className="h-8 w-8" />
                                ) : isCancelled ? (
                                    <XCircle className="h-8 w-8" />
                                ) : (
                                    <ShieldCheck className="h-8 w-8 animate-pulse" />
                                )}
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-white/80">
                                        Verification Result
                                    </p>
                                    <h2 className="text-xl font-black">
                                        {isConfirmed
                                            ? "AUTHENTICATED ENTRY PASS"
                                            : isCancelled
                                            ? "CANCELLED PASS"
                                            : "PENDING CONFIRMATION"}
                                    </h2>
                                </div>
                            </div>
                            <span className="text-xs bg-white/20 px-3 py-1 rounded-full font-mono uppercase font-bold">
                                {bookingData.status}
                            </span>
                        </div>

                        <CardContent className="p-6 sm:p-8 space-y-6">

                            {/* Event Information */}
                            <div className="space-y-3 pb-6 border-b border-border">
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">Event Details</span>
                                <h3 className="text-2xl font-bold text-foreground">
                                    {bookingData.Event?.title || "worlducationHub Global Event"}
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        <span>
                                            {bookingData.Event?.date ? format(new Date(bookingData.Event.date), "PPP") : "TBA"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary" />
                                        <span>
                                            {bookingData.selectedLocation
                                                ? `${bookingData.selectedLocation} (${bookingData.Event?.location || "Main Venue"})`
                                                : (bookingData.Event?.location || "Event Venue")}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Attendee Information */}
                            <div className="space-y-4 pb-6 border-b border-border">
                                <span className="text-xs font-bold text-primary uppercase tracking-wider">Attendee & Pass Information</span>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-muted text-muted-foreground">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Attendee Name</p>
                                            <p className="text-sm font-bold text-foreground">
                                                {bookingData.User?.name || bookingData.user?.name || "Registered Attendee"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-muted text-muted-foreground">
                                            <Mail className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Email Address</p>
                                            <p className="text-sm font-bold text-foreground">
                                                {bookingData.User?.email || bookingData.user?.email || "Attendee Email"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-muted text-muted-foreground">
                                            <Sparkles className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Ticket Category / Mode</p>
                                            <p className="text-sm font-bold text-foreground">
                                                {bookingData.category} • {bookingData.mode}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-muted text-muted-foreground">
                                            <Sparkles className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground font-medium">Registration Fee & Method</p>
                                            <p className="text-sm font-bold text-foreground">
                                                {formatKES(bookingData.amountPaid)} • {
                                                    bookingData.paymentMethod === 'MPESA'
                                                        ? 'Lipa Na M-PESA'
                                                        : (bookingData.paymentMethod === 'PAYPAL' ? 'PayPal' : 'Card / Stripe')
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {(bookingData.attendeeAge !== undefined && bookingData.attendeeAge !== null) && (
                                        <div className="flex items-start gap-3 sm:col-span-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border">
                                            <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium">Declared Attendee Age</p>
                                                <p className="text-sm font-bold text-foreground">
                                                    {bookingData.attendeeAge} years old
                                                    {bookingData.guardianName && ` • Guardian: ${bookingData.guardianName}${bookingData.guardianPhone ? ` (${bookingData.guardianPhone})` : ''}`}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Declared Institution / School Details */}
                            {(bookingData.institutionName || bookingData.User?.institutionName || bookingData.user?.institutionName) && (
                                <div className="space-y-3 pb-6 border-b border-border bg-slate-50/60 dark:bg-slate-900/40 p-4 rounded-2xl">
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-bold text-primary uppercase tracking-wider">
                                            Declared School & Institution Credentials
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <p className="text-muted-foreground font-medium">Institution Name</p>
                                            <p className="font-bold text-foreground">
                                                {bookingData.institutionName || bookingData.User?.institutionName || bookingData.user?.institutionName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground font-medium">Address</p>
                                            <p className="font-bold text-foreground">
                                                {bookingData.institutionAddress || bookingData.User?.institutionAddress || bookingData.user?.institutionAddress || "On file"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground font-medium">Head Administrator</p>
                                            <p className="font-bold text-foreground">
                                                {bookingData.headAdminName || bookingData.User?.headAdminName || bookingData.user?.headAdminName || "Not specified"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground font-medium">Official Contact</p>
                                            <p className="font-bold text-foreground">
                                                {bookingData.institutionContact || bookingData.User?.institutionContact || bookingData.user?.institutionContact || "Not specified"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Booking ID & Check-in Details */}
                            <div className="bg-muted/50 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">Booking ID</p>
                                    <p className="font-mono text-xs font-bold text-foreground">{bookingData.id}</p>
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="text-xs text-muted-foreground font-medium">Admission Status</p>
                                    <p className="text-xs font-bold text-foreground">
                                        {isCheckedIn ? (
                                            <span className="text-emerald-600 font-bold">Admitted & Checked-In</span>
                                        ) : (
                                            <span className="text-amber-600">Pending Check-In</span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            {/* Actions Toolbar */}
                            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                                <Button
                                    variant="outline"
                                    onClick={handleDownloadCurrentReceipt}
                                    className="gap-2 rounded-xl text-xs font-semibold"
                                >
                                    <Download className="h-4 w-4" />
                                    Download Official Receipt / Pass
                                </Button>

                                <div className="flex gap-2">
                                    {!isCheckedIn ? (
                                        <Button
                                            onClick={handleCheckInOnly}
                                            disabled={isUpdatingCash}
                                            className="bg-primary hover:bg-primary/90 text-white rounded-xl font-bold text-xs gap-1.5"
                                        >
                                            <CheckCircle2 className="h-4 w-4" />
                                            Admit Attendee / Check In
                                        </Button>
                                    ) : (
                                        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 px-4 py-2 rounded-xl font-bold text-xs">
                                            <CheckCircle2 className="h-4 w-4" /> Admitted to Event
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
