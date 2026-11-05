import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePaymentStore } from "@/stores/usePaymentStore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import PaymentSelection from "./PaymentSelection";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { supabase } from "@/lib/supabase";
import { generateTicketPDF } from "@/lib/ticket-generator";
import { format } from "date-fns";
import { formatKES, kesToUsd } from "@/lib/currency";
import { Smartphone, Loader2, CheckCircle2, ArrowLeft, AlertCircle } from "lucide-react";

export default function UniversalPaymentModal() {
    const { isOpen, paymentData, isProcessing, closePayment, setIsProcessing } = usePaymentStore();
    const { user, profile } = useAuth();
    const { toast } = useToast();

    // M-Pesa State
    const [mpesaView, setMpesaView] = useState<'input' | 'waiting' | 'success' | null>(null);
    const [phoneNumber, setPhoneNumber] = useState<string>("");
    const [stkMessage, setStkMessage] = useState<string>("");
    const pollIntervalRef = useRef<any>(null);

    // Initialize phone number from profile if available
    useEffect(() => {
        if (profile?.phone && !phoneNumber) {
            setPhoneNumber(profile.phone);
        }
    }, [profile]);

    // Clean up polling timer
    useEffect(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, []);

    if (!isOpen || !paymentData) return null;

    const handleStripePayment = async () => {
        setIsProcessing(true);
        try {
            const currentPath = window.location.pathname + window.location.search;
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: paymentData.eventId || null,
                    category: paymentData.category || 'GENERAL',
                    amount: paymentData.amount,
                    userId: user?.id,
                    bookingId: paymentData.bookingId,
                    type: paymentData.type,
                    returnUrl: paymentData.returnUrl || currentPath
                }),
            });
            const session = await response.json();
            if (session.error) throw new Error(session.error);

            if (session.url) {
                window.location.href = session.url;
            } else {
                throw new Error("Stripe session URL is missing");
            }
        } catch (error: any) {
            toast({
                title: "Card Payment Error",
                description: error.message || "Failed to initiate card payment.",
                variant: "destructive"
            });
            setIsProcessing(false);
        }
    };

    const handleInitiateMpesa = async () => {
        if (!phoneNumber.trim()) {
            toast({
                title: "Phone Required",
                description: "Please enter your M-Pesa registered mobile number (e.g. 0712345678).",
                variant: "destructive"
            });
            return;
        }

        setIsProcessing(true);
        try {
            const res = await fetch('/api/mpesa/stkpush', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: paymentData.bookingId,
                    phone: phoneNumber.trim(),
                    amount: paymentData.amount,
                    eventId: paymentData.eventId,
                    type: paymentData.type
                })
            });

            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.error || "Failed to send STK push");
            }

            setStkMessage(result.customerMessage || "Please enter your M-Pesa PIN on your phone to complete payment.");
            setMpesaView('waiting');
            setIsProcessing(false);

            // Start polling for payment confirmation
            startMpesaPolling(paymentData.bookingId);
        } catch (err: any) {
            setIsProcessing(false);
            toast({
                title: "M-Pesa STK Push Failed",
                description: err.message || "Could not reach Safaricom service. Please verify your phone number and try again.",
                variant: "destructive"
            });
        }
    };

    const startMpesaPolling = (bookingId: string) => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

        let attempts = 0;
        const maxAttempts = 30; // 30 * 2.5s = ~75 seconds

        pollIntervalRef.current = setInterval(async () => {
            attempts++;
            try {
                const res = await fetch(`/api/mpesa/status/${bookingId}`);
                const data = await res.json();

                if (data.confirmed) {
                    clearInterval(pollIntervalRef.current);
                    setMpesaView('success');
                    await handlePaymentSuccess(bookingId, paymentData.type, 'MPESA', data.mpesaReceiptNumber);
                } else if (attempts >= maxAttempts) {
                    clearInterval(pollIntervalRef.current);
                    toast({
                        title: "Payment Pending",
                        description: "We are still waiting for M-Pesa confirmation. Your booking will update automatically once confirmed.",
                    });
                }
            } catch (pollErr) {
                console.warn("Polling error:", pollErr);
            }
        }, 2500);
    };

    const handlePaymentSuccess = async (bookingId: string, type: string, method: string, receiptNumber?: string) => {
        setIsProcessing(true);
        try {
            if (type === 'event') {
                const { data: booking, error: bookingError } = await supabase
                    .from('Booking')
                    .select('*, Event(*), User:userId(*)')
                    .eq('id', bookingId)
                    .maybeSingle();

                if (!bookingError && booking) {
                    await generateTicketPDF({
                        eventTitle: booking.Event?.title || "worlducationHub Global Summit",
                        eventDate: booking.Event?.date ? format(new Date(booking.Event.date), 'PPPP') : "TBA",
                        eventLocation: booking.Event?.location || "Event Venue",
                        selectedLocation: booking.selectedLocation || booking.Event?.location,
                        attendeeAge: booking.attendeeAge,
                        guardianName: booking.guardianName,
                        userName: profile?.name || user?.email?.split('@')[0] || "Attendee",
                        userEmail: user?.email || "",
                        category: booking.category,
                        amountPaid: Number(booking.amountPaid || paymentData.amount),
                        bookingId: booking.id,
                        paymentMethod: method,
                        paymentStatus: 'PAID'
                    });
                }
                toast({
                    title: "Booking Confirmed!",
                    description: `Your payment was verified (${receiptNumber || method}) and your official event ticket has been downloaded.`
                });
            } else if (type === 'visa') {
                toast({
                    title: "Visa Request Processed!",
                    description: "Your payment has been captured and your official invitation letter is under processing."
                });
            } else if (type === 'application') {
                toast({
                    title: "Application Processed!",
                    description: "Your donation has been received and your application is now under review."
                });
            }

            setTimeout(() => {
                closePayment();
                setMpesaView(null);
            }, 2500);
        } catch (err: any) {
            console.error("Payment post-processing error:", err);
            closePayment();
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePayPalSuccess = async (bookingId: string, type: string, orderId?: string) => {
        try {
            await fetch('/api/paypal/capture-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, bookingId, type })
            });
        } catch (captureErr) {
            console.warn("Backend PayPal capture sync error:", captureErr);
        }
        await handlePaymentSuccess(bookingId, type, 'PAYPAL', orderId);
    };

    const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID || "test";
    const usdEquivalent = kesToUsd(paymentData.amount);

    return (
        <Dialog open={isOpen} onOpenChange={() => !isProcessing && closePayment()}>
            <DialogContent className="sm:max-w-md rounded-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-center">
                        {paymentData.title || "Secure Checkout"}
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        {paymentData.description || "Choose a secure payment method to finalize your transaction."}
                    </DialogDescription>
                </DialogHeader>

                {/* VIEW 1: M-PESA PHONE INPUT */}
                {mpesaView === 'input' && (
                    <div className="space-y-5 pt-2">
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
                            <div className="p-2 bg-emerald-600 text-white rounded-xl">
                                <Smartphone className="h-5 w-5" />
                            </div>
                            <div className="text-xs space-y-1">
                                <p className="font-bold text-emerald-950 dark:text-emerald-100 text-sm">Lipa na M-PESA STK Push</p>
                                <p className="text-emerald-800 dark:text-emerald-300">
                                    You will receive a prompt on your phone for <strong className="font-bold">{formatKES(paymentData.amount)}</strong>.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="mpesaPhone" className="text-sm font-semibold">
                                Safaricom M-Pesa Mobile Number
                            </Label>
                            <Input
                                id="mpesaPhone"
                                type="tel"
                                placeholder="07XXXXXXXX or 01XXXXXXXX"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                className="h-12 rounded-xl text-base font-medium tracking-wide"
                                autoFocus
                            />
                            <p className="text-[11px] text-slate-500">
                                Ensure your phone is unlocked and ready to input your M-Pesa PIN.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 h-12 rounded-xl"
                                onClick={() => setMpesaView(null)}
                                disabled={isProcessing}
                            >
                                <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                            </Button>
                            <Button
                                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                onClick={handleInitiateMpesa}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Sending Prompt...
                                    </>
                                ) : (
                                    `Pay ${formatKES(paymentData.amount)}`
                                )}
                            </Button>
                        </div>
                    </div>
                )}

                {/* VIEW 2: M-PESA WAITING / STK PROMPT SENT */}
                {mpesaView === 'waiting' && (
                    <div className="space-y-6 pt-4 text-center">
                        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                            <div className="relative p-5 bg-emerald-600 text-white rounded-full shadow-lg">
                                <Smartphone className="h-10 w-10 animate-bounce" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                                Check Your Mobile Phone
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                                An M-Pesa STK push prompt has been sent to <strong className="text-emerald-600 font-mono">{phoneNumber}</strong>.
                            </p>
                            <p className="text-xs text-slate-400">
                                Enter your M-Pesa PIN to complete payment of <strong>{formatKES(paymentData.amount)}</strong>.
                            </p>
                        </div>

                        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2 text-left">
                            <AlertCircle className="h-4 w-4 flex-shrink-0 text-amber-600" />
                            <span>Do not close this modal. It will update automatically once verified.</span>
                        </div>

                        <Button
                            variant="ghost"
                            className="text-xs text-slate-500 hover:text-slate-800"
                            onClick={() => {
                                if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                                setMpesaView('input');
                            }}
                        >
                            Change Number / Resend
                        </Button>
                    </div>
                )}

                {/* VIEW 3: M-PESA SUCCESS CONFIRMATION */}
                {mpesaView === 'success' && (
                    <div className="space-y-5 pt-4 text-center">
                        <div className="mx-auto w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Payment Verified!</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300">
                                Thank you! Your booking is confirmed and your official pass has been generated.
                            </p>
                        </div>
                    </div>
                )}

                {/* VIEW 0: DEFAULT PAYMENT SELECTION */}
                {!mpesaView && (
                    <div className="space-y-6 pt-2">
                        <PaymentSelection
                            amount={paymentData.amount}
                            onSelect={(method) => {
                                if (method === 'mpesa') {
                                    setMpesaView('input');
                                } else if (method === 'stripe') {
                                    handleStripePayment();
                                }
                            }}
                            isProcessing={isProcessing}
                        />

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-slate-200"></span>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white dark:bg-slate-950 px-2 text-slate-500 font-semibold tracking-wider">
                                    Or Pay via PayPal
                                </span>
                            </div>
                        </div>

                        <PayPalScriptProvider options={{ clientId: paypalClientId }}>
                            <PayPalButtons
                                style={{ layout: 'vertical', shape: 'pill', label: 'pay' }}
                                disabled={isProcessing}
                                createOrder={(data, actions) => {
                                    return actions.order.create({
                                        intent: 'CAPTURE',
                                        purchase_units: [{
                                            description: `Payment for ${paymentData.type}: ${paymentData.bookingId} (${formatKES(paymentData.amount)})`,
                                            amount: {
                                                currency_code: 'USD',
                                                value: usdEquivalent.toString()
                                            },
                                            custom_id: paymentData.bookingId
                                        }]
                                    });
                                }}
                                onApprove={async (data, actions) => {
                                    if (actions.order) {
                                        const details = await actions.order.capture();
                                        await handlePayPalSuccess(paymentData.bookingId, paymentData.type, details?.id || data.orderID);
                                    }
                                }}
                                onError={(err) => {
                                    console.error("PayPal Error:", err);
                                    toast({
                                        title: "PayPal Error",
                                        description: "Payment failed or was cancelled. Please try again.",
                                        variant: "destructive"
                                    });
                                }}
                            />
                        </PayPalScriptProvider>

                        <Button
                            variant="ghost"
                            className="w-full text-slate-500 hover:text-slate-800"
                            onClick={closePayment}
                            disabled={isProcessing}
                        >
                            Cancel & Return
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
