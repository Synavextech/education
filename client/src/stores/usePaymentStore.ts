import { create } from "zustand";

export interface PaymentData {
    amount: number;
    bookingId: string;
    type: 'event' | 'visa' | 'application';
    eventId?: string;
    category?: string;
    returnUrl?: string;
    title?: string;
    description?: string;
}

interface PaymentStore {
    isOpen: boolean;
    paymentData: PaymentData | null;
    isProcessing: boolean;
    error: string | null;
    selectedMethod: 'mpesa' | 'stripe' | 'paypal' | null;

    openPayment: (data: PaymentData) => void;
    closePayment: () => void;
    setIsProcessing: (isProcessing: boolean) => void;
    setError: (error: string | null) => void;
    setSelectedMethod: (method: 'mpesa' | 'stripe' | 'paypal' | null) => void;
    reset: () => void;
}

export const usePaymentStore = create<PaymentStore>((set) => ({
    isOpen: false,
    paymentData: null,
    isProcessing: false,
    error: null,
    selectedMethod: null,

    openPayment: (data: PaymentData) =>
        set({
            isOpen: true,
            paymentData: data,
            isProcessing: false,
            error: null,
            selectedMethod: null
        }),

    closePayment: () =>
        set({
            isOpen: false,
            paymentData: null,
            isProcessing: false,
            error: null,
            selectedMethod: null
        }),

    setIsProcessing: (isProcessing: boolean) => set({ isProcessing }),

    setError: (error: string | null) => set({ error }),

    setSelectedMethod: (method: 'mpesa' | 'stripe' | 'paypal' | null) => set({ selectedMethod: method }),

    reset: () =>
        set({
            isOpen: false,
            paymentData: null,
            isProcessing: false,
            error: null,
            selectedMethod: null
        })
}));
