import React from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Smartphone, ShieldCheck, Zap } from "lucide-react";
import { formatKES } from "@/lib/currency";

interface PaymentSelectionProps {
    amount: number;
    onSelect: (method: 'mpesa' | 'stripe' | 'paypal') => void;
    isProcessing?: boolean;
}

export default function PaymentSelection({ amount, onSelect, isProcessing }: PaymentSelectionProps) {
    return (
        <div className="space-y-6">
            <div className="text-center space-y-1.5 bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-slate-500 font-semibold text-xs tracking-wider uppercase">Total Payable</p>
                <p className="text-4xl font-black text-primary tracking-tight">{formatKES(amount)}</p>
                <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-medium">
                    <Zap className="h-3.5 w-3.5" />
                    <span>Instant automatic booking confirmation</span>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
                {/* Lipa na M-Pesa STK Push */}
                <Button
                    variant="outline"
                    className="h-20 rounded-2xl flex items-center justify-between px-5 border-2 border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-600 hover:bg-emerald-500/10 transition-all group"
                    onClick={() => onSelect('mpesa')}
                    disabled={isProcessing}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm group-hover:scale-105 transition-transform">
                            <Smartphone className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <div className="flex items-center gap-2">
                                <p className="font-extrabold text-base text-slate-900 dark:text-white">Lipa na M-PESA</p>
                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    STK Push
                                </span>
                            </div>
                            <p className="text-xs text-slate-500">Instant Safaricom prompt sent to your phone</p>
                        </div>
                    </div>
                </Button>

                {/* Pay with Card (Stripe) */}
                <Button
                    variant="outline"
                    className="h-20 rounded-2xl flex items-center justify-between px-5 border-2 border-slate-200 hover:border-primary hover:bg-primary/5 transition-all group"
                    onClick={() => onSelect('stripe')}
                    disabled={isProcessing}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-base text-slate-900 dark:text-white">Credit / Debit Card</p>
                            <p className="text-xs text-slate-500">Visa, MasterCard, or American Express</p>
                        </div>
                    </div>
                </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>256-Bit Bank Grade SSL Encrypted Checkout</span>
            </div>
        </div>
    );
}
