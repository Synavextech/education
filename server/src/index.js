import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import cookieParser from 'cookie-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Stripe Setup
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// API Routes
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Auth Persistence Endpoints
app.post('/api/auth/set-session', (req, res) => {
    const { access_token, refresh_token } = req.body;

    if (!access_token || !refresh_token) {
        return res.status(400).json({ error: 'Missing tokens' });
    }

    const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/', // Ensure cookie is available for all routes
        maxAge: 60 * 60 * 24 * 7 * 1000 // 1 week
    };

    console.log(`[Server] Setting auth cookies for session (Production: ${process.env.NODE_ENV === 'production'})`);
    res.cookie('sb-access-token', access_token, cookieOptions);
    res.cookie('sb-refresh-token', refresh_token, cookieOptions);

    res.json({ status: 'Session set in cookies' });
});

app.get('/api/auth/get-session', (req, res) => {
    const accessToken = req.cookies['sb-access-token'];
    const refreshToken = req.cookies['sb-refresh-token'];

    if (!accessToken || !refreshToken) {
        console.log('[Server] No auth cookies found');
        return res.status(401).json({ error: 'No session found' });
    }

    console.log('[Server] Auth cookies retrieved successfully');
    res.json({ access_token: accessToken, refresh_token: refreshToken });
});

app.post('/api/auth/clear-session', (req, res) => {
    console.log('[Server] Clearing auth cookies');
    res.clearCookie('sb-access-token', { path: '/' });
    res.clearCookie('sb-refresh-token', { path: '/' });
    res.json({ status: 'Session cleared' });
});

// Stripe Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
    const { eventId, category, amount, userId, bookingId, type = 'event', returnUrl } = req.body;
    try {
        const stripeKey = process.env.STRIPE_SECRET_KEY || '';
        if (!stripeKey || stripeKey.includes('placeholder')) {
            return res.status(400).json({
                error: 'Card/Stripe gateway is currently undergoing credential configuration. Please use Lipa Na M-PESA or PayPal to complete your registration.'
            });
        }
        let productData = {};

        if (type === 'event') {
            // Check if event has already passed
            const { data: eventData, error: eventError } = await supabase
                .from('Event')
                .select('date')
                .eq('id', eventId)
                .single();

            if (eventError || !eventData) {
                console.error('Event fetch error:', eventError);
                return res.status(404).json({ error: "Event not found" });
            }

            const eventDate = new Date(eventData.date);
            const now = new Date();
            if (eventDate < now) {
                return res.status(400).json({ error: "This event has already passed. Registration is closed." });
            }

            productData = {
                name: `Event Booking: ${eventId}`,
                description: `Category: ${category}`,
            };
        } else if (type === 'visa') {
            productData = {
                name: `Visa Invitation Request: ${eventId}`,
                description: 'Official Visa Invitation Letter',
            };
        } else if (type === 'application') {
            productData = {
                name: `Application Donation`,
                description: `Donation for Application`,
            };
        }

        const metadata = {
            bookingId,
            userId: userId || 'N/A',
            eventId: eventId || 'N/A',
            type
        };

        const frontendBase = process.env.VITE_FRONTEND_URL || 'http://localhost:3000';
        let basePath = '/upcoming-events';
        if (returnUrl && typeof returnUrl === 'string') {
            const cleanPath = returnUrl.split('?')[0];
            if (cleanPath.startsWith('/')) {
                basePath = cleanPath;
            }
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: req.body.email,
            line_items: [{
                price_data: {
                    currency: 'kes',
                    product_data: productData,
                    unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `${frontendBase}${basePath}?status=success&bookingId=${bookingId}&type=${type}`,
            cancel_url: `${frontendBase}${basePath}?status=cancelled&bookingId=${bookingId}&type=${type}&resume=true`,
            metadata
        });
        res.json({ id: session.id, url: session.url });
    } catch (error) {
        console.error('Stripe session error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Stripe Webhook for async confirmation
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const { bookingId, type, userId } = session.metadata || {};

        try {
            let targetUserId = userId && userId !== 'N/A' ? userId : null;
            let notificationTitle = "Payment Confirmed";
            let notificationMsg = `Your payment for ${type || 'service'} was confirmed.`;

            if (type === 'event') {
                const { data: booking } = await supabase
                    .from('Booking')
                    .update({ status: 'CONFIRMED' })
                    .eq('id', bookingId)
                    .select('userId, Event(title)')
                    .maybeSingle();

                if (booking) {
                    targetUserId = targetUserId || booking.userId;
                    notificationTitle = "Event Booking Confirmed";
                    notificationMsg = `Your booking for "${booking.Event?.title || 'the event'}" has been confirmed!`;
                }
            } else if (type === 'visa') {
                const { data: visa } = await supabase
                    .from('VisaInvitation')
                    .update({ status: 'PAID', paymentStatus: 'PAID' })
                    .eq('id', bookingId)
                    .select('userId')
                    .maybeSingle();

                if (visa) {
                    targetUserId = targetUserId || visa.userId;
                    notificationTitle = "Visa Invitation Request Confirmed";
                    notificationMsg = `Your payment for the Visa Invitation Letter has been confirmed and is now under processing.`;
                }
            } else if (type === 'application') {
                const { data: appData } = await supabase
                    .from('Applications')
                    .update({ status: 'APPROVED', paymentStatus: 'PAID' })
                    .eq('id', bookingId)
                    .select('userId, type')
                    .maybeSingle();

                if (appData) {
                    targetUserId = targetUserId || appData.userId;
                    notificationTitle = "Application Donation Confirmed";
                    notificationMsg = `Your application (${appData.type}) and donation have been confirmed.`;
                }
            }

            if (targetUserId) {
                await supabase.from('Notification').insert({
                    userId: targetUserId,
                    title: notificationTitle,
                    message: notificationMsg,
                    type: 'SUCCESS',
                    isRead: false
                });
            }

            console.log(`Payment confirmed, DB updated, and notification created for ${type} ${bookingId}`);
        } catch (dbError) {
            console.error('Database update error in webhook:', dbError);
        }
    }

    res.json({ received: true });
});

// PayPal Webhook for async confirmation
app.post('/api/webhook/paypal', async (req, res) => {
    try {
        const event = req.body;

        if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED' || event.event_type === 'CHECKOUT.ORDER.APPROVED') {
            const resource = event.resource;
            // Depending on PAYPAL setup, the custom_id is usually tracked in purchase_units
            // but webhook payload structure varies a bit depending on order vs capture.
            // Let's check for custom_id commonly placed in resource.custom_id or resource.purchase_units[0].custom_id

            let bookingId = resource.custom_id;

            // If it's an order approved event, custom_id is in purchase_units
            if (!bookingId && resource.purchase_units && resource.purchase_units.length > 0) {
                bookingId = resource.purchase_units[0].custom_id;
            }

            if (bookingId) {
                // Update corresponding tables safely
                const { data: bData } = await supabase.from('Booking').update({ status: 'CONFIRMED' }).eq('id', bookingId).select('userId, Event(title)').maybeSingle();
                const { data: vData } = await supabase.from('VisaInvitation').update({ status: 'PAID', paymentStatus: 'PAID' }).eq('id', bookingId).select('userId').maybeSingle();
                const { data: aData } = await supabase.from('Applications').update({ status: 'APPROVED', paymentStatus: 'PAID' }).eq('id', bookingId).select('userId, type').maybeSingle();

                const targetUserId = bData?.userId || vData?.userId || aData?.userId;
                if (targetUserId) {
                    await supabase.from('Notification').insert({
                        userId: targetUserId,
                        title: "Payment Confirmed (PayPal)",
                        message: "Your PayPal transaction was successfully verified and confirmed.",
                        type: 'SUCCESS',
                        isRead: false
                    });
                }

                console.log(`PayPal webhook payment confirmed and DB updated for bookingId: ${bookingId}`);
            } else {
                console.log('PayPal webhook received but no custom_id (bookingId) found in payload', resource);
            }
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('PayPal webhook error:', error);
        res.status(500).json({ error: error.message });
    }
});

// PayPal Order Instant Confirmation Endpoint
app.post('/api/paypal/capture-order', async (req, res) => {
    try {
        const { orderId, bookingId, type = 'event' } = req.body;
        if (!bookingId) {
            return res.status(400).json({ error: 'Missing bookingId' });
        }

        let targetUserId = null;
        let notificationTitle = "Payment Confirmed (PayPal)";
        let notificationMsg = `Your PayPal transaction (${orderId || 'Verified'}) was successfully confirmed.`;

        if (type === 'event') {
            const { data: booking, error: bError } = await supabase
                .from('Booking')
                .update({
                    status: 'CONFIRMED',
                    paymentStatus: 'PAID',
                    paymentMethod: 'PAYPAL',
                    updatedAt: new Date().toISOString()
                })
                .eq('id', bookingId)
                .select('userId, Event(title)')
                .maybeSingle();

            if (bError) throw bError;
            if (booking) {
                targetUserId = booking.userId;
                notificationTitle = "Event Booking Confirmed";
                notificationMsg = `Your booking for "${booking.Event?.title || 'the event'}" has been confirmed via PayPal!`;
            }
        } else if (type === 'visa') {
            const { data: visa, error: vError } = await supabase
                .from('VisaInvitation')
                .update({ status: 'PAID', paymentStatus: 'PAID', updatedAt: new Date().toISOString() })
                .eq('id', bookingId)
                .select('userId')
                .maybeSingle();

            if (vError) throw vError;
            if (visa) {
                targetUserId = visa.userId;
                notificationTitle = "Visa Invitation Confirmed";
                notificationMsg = `Your payment for the official Visa Invitation Letter has been confirmed via PayPal.`;
            }
        } else if (type === 'application') {
            const { data: appData, error: aError } = await supabase
                .from('Applications')
                .update({ status: 'APPROVED', paymentStatus: 'PAID', updatedAt: new Date().toISOString() })
                .eq('id', bookingId)
                .select('userId, type')
                .maybeSingle();

            if (aError) throw aError;
            if (appData) {
                targetUserId = appData.userId;
                notificationTitle = "Application Donation Confirmed";
                notificationMsg = `Your application (${appData.type}) donation was confirmed via PayPal.`;
            }
        }

        if (targetUserId) {
            await supabase.from('Notification').insert({
                userId: targetUserId,
                title: notificationTitle,
                message: notificationMsg,
                type: 'SUCCESS',
                isRead: false
            });
        }

        console.log(`[PayPal Capture] Confirmed ${type} ${bookingId} for order ${orderId}`);
        res.json({ success: true, bookingId, message: 'PayPal payment confirmed successfully' });
    } catch (err) {
        console.error('[PayPal capture error]:', err);
        res.status(500).json({ error: err.message || 'Failed to capture PayPal order' });
    }
});

// Safaricom Daraja API (M-Pesa) Helper Functions
async function getMpesaAccessToken() {
    const consumerKey = (process.env.MPESA_CONSUMER_KEY || '').trim();
    const consumerSecret = (process.env.MPESA_CONSUMER_SECRET || '').trim();
    const env = process.env.MPESA_ENV || 'production';
    const authUrl = env === 'production'
        ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const response = await fetch(authUrl, {
        method: 'GET',
        headers: {
            Authorization: `Basic ${auth}`
        }
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to obtain M-Pesa access token: ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
}

function formatMpesaPhoneNumber(phone) {
    if (!phone) return null;
    let cleaned = phone.toString().replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
        cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
        cleaned = '254' + cleaned;
    }
    return cleaned;
}

// M-Pesa STK Push Endpoint
app.post('/api/mpesa/stkpush', async (req, res) => {
    try {
        const { bookingId, phone, amount } = req.body;
        if (!bookingId || !phone || !amount) {
            return res.status(400).json({ error: 'Missing bookingId, phone, or amount' });
        }

        const formattedPhone = formatMpesaPhoneNumber(phone);
        if (!formattedPhone || formattedPhone.length !== 12) {
            return res.status(400).json({ error: 'Please enter a valid Kenyan mobile number (e.g. 0712345678 or 254712345678)' });
        }

        const accessToken = await getMpesaAccessToken();
        const env = process.env.MPESA_ENV || 'production';
        const stkUrl = env === 'production'
            ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
            : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

        const shortcode = (process.env.MPESA_HO_SHORTCODE || process.env.MPESA_SHORTCODE || '3538799').trim();
        const tillNumber = (process.env.MPESA_TILL_NUMBER || shortcode).trim();
        const passkey = (process.env.MPESA_PASSKEY || '').trim();

        const date = new Date();
        const timestamp = date.getFullYear() +
            ('0' + (date.getMonth() + 1)).slice(-2) +
            ('0' + date.getDate()).slice(-2) +
            ('0' + date.getHours()).slice(-2) +
            ('0' + date.getMinutes()).slice(-2) +
            ('0' + date.getSeconds()).slice(-2);

        const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
        const callbackUrl = process.env.MPESA_CALLBACK_URL || `${process.env.VITE_FRONTEND_URL || 'http://localhost:5000'}/api/mpesa/callback`;

        // If paying to Buy Goods Till Number with a Head Office Shortcode
        const isTill = tillNumber && tillNumber !== shortcode;
        const transactionType = isTill ? 'CustomerBuyGoodsOnline' : 'CustomerPayBillOnline';
        const partyB = isTill ? tillNumber : shortcode;

        const payload = {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: transactionType,
            Amount: Math.max(1, Math.round(Number(amount))),
            PartyA: formattedPhone,
            PartyB: partyB,
            PhoneNumber: formattedPhone,
            CallBackURL: callbackUrl,
            AccountReference: `WUH-${bookingId.slice(0, 6).toUpperCase()}`,
            TransactionDesc: `worlducationHub Event Booking`
        };

        const response = await fetch(stkUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (data.ResponseCode === '0') {
            const updatePayload = {
                mpesaCheckoutRequestId: data.CheckoutRequestID,
                mpesaPhoneNumber: formattedPhone,
                paymentMethod: 'MPESA',
                updatedAt: new Date().toISOString()
            };
            const targetTable = req.body.type === 'visa' ? 'VisaInvitation' : req.body.type === 'application' ? 'Applications' : 'Booking';
            await supabase
                .from(targetTable)
                .update(updatePayload)
                .eq('id', bookingId);

            res.json({
                success: true,
                message: 'STK push prompt sent to your phone. Enter your M-Pesa PIN to complete payment.',
                checkoutRequestId: data.CheckoutRequestID,
                customerMessage: data.CustomerMessage
            });
        } else {
            console.error('[M-Pesa STK Push error]:', data);
            res.status(400).json({
                error: data.errorMessage || data.ResponseDescription || 'Failed to initiate M-Pesa STK push'
            });
        }
    } catch (err) {
        console.error('[M-Pesa STK Push Exception]:', err);
        res.status(500).json({ error: err.message || 'M-Pesa service unavailable' });
    }
});

// M-Pesa Callback Webhook
app.post('/api/mpesa/callback', async (req, res) => {
    try {
        console.log('[M-Pesa Callback] Body:', JSON.stringify(req.body));
        const callback = req.body?.Body?.stkCallback;
        if (!callback) {
            return res.status(400).json({ error: 'Invalid callback payload' });
        }

        const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

        if (ResultCode === 0 && CallbackMetadata) {
            let mpesaReceiptNumber = '';
            let amountPaid = 0;
            let phoneNumber = '';

            for (const item of CallbackMetadata.Item || []) {
                if (item.Name === 'MpesaReceiptNumber') mpesaReceiptNumber = item.Value;
                if (item.Name === 'Amount') amountPaid = item.Value;
                if (item.Name === 'PhoneNumber') phoneNumber = item.Value?.toString();
            }

            const { data: booking } = await supabase
                .from('Booking')
                .update({
                    status: 'CONFIRMED',
                    paymentStatus: 'PAID',
                    paymentMethod: 'MPESA',
                    mpesaReceiptNumber: mpesaReceiptNumber,
                    updatedAt: new Date().toISOString()
                })
                .eq('mpesaCheckoutRequestId', CheckoutRequestID)
                .select('id, userId, Event(title)')
                .maybeSingle();

            if (booking) {
                await supabase.from('Notification').insert({
                    userId: booking.userId,
                    title: 'M-Pesa Payment Confirmed',
                    message: `Your payment of KSh ${amountPaid} (M-Pesa Receipt: ${mpesaReceiptNumber}) for "${booking.Event?.title || 'the event'}" has been confirmed!`,
                    type: 'SUCCESS',
                    isRead: false
                });
                console.log(`[M-Pesa] Confirmed booking ${booking.id} with receipt ${mpesaReceiptNumber}`);
            }
        } else {
            console.log(`[M-Pesa] STK Push failed or cancelled: ${ResultDesc}`);
        }

        res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    } catch (err) {
        console.error('[M-Pesa Callback Error]:', err);
        res.status(500).json({ error: err.message });
    }
});

// M-Pesa Booking Status Poll Endpoint
app.get('/api/mpesa/status/:bookingId', async (req, res) => {
    try {
        const { bookingId } = req.params;
        let { data: booking } = await supabase
            .from('Booking')
            .select('id, status, paymentStatus, paymentMethod, mpesaReceiptNumber')
            .eq('id', bookingId)
            .maybeSingle();

        if (!booking) {
            const { data: visa } = await supabase
                .from('VisaInvitation')
                .select('id, status, paymentStatus, paymentMethod')
                .eq('id', bookingId)
                .maybeSingle();
            booking = visa;
        }

        if (!booking) {
            const { data: appData } = await supabase
                .from('Applications')
                .select('id, status, paymentStatus')
                .eq('id', bookingId)
                .maybeSingle();
            booking = appData;
        }

        if (!booking) {
            return res.status(404).json({ error: 'Record not found' });
        }

        const isConfirmed = (booking.status === 'CONFIRMED' || booking.status === 'PAID' || booking.status === 'APPROVED') &&
            (booking.paymentStatus === 'PAID');

        res.json({
            confirmed: isConfirmed,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            mpesaReceiptNumber: booking.mpesaReceiptNumber
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../dist')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../../dist/index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
