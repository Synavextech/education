import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { formatKES } from './currency';

export interface TicketData {
    eventTitle: string;
    eventDate: string;
    eventLocation: string;
    selectedLocation?: string;
    attendeeAge?: number;
    guardianName?: string;
    userName: string;
    userEmail: string;
    category: string;
    amountPaid: number;
    bookingId: string;
    paymentMethod?: string; // 'MPESA' | 'CARD' | 'PAYPAL'
    paymentStatus?: string; // 'PAID' | 'CONFIRMED' | 'PENDING'
    institutionName?: string;
    institutionAddress?: string;
    headAdminName?: string;
    institutionContact?: string;
    checkedIn?: boolean;
}

export const generateTicketPDF = async (data: TicketData): Promise<void> => {
    const doc = new jsPDF();

    // Dark Background for Header
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 60, 'F');

    // Website Title / Branding
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('worlducationHub', 20, 30);

    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Delivering Knowledge & Skills Shaping the Future', 20, 39);
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Global Education & Digital Skills Network', 20, 46);

    // Ticket Header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('OFFICIAL PASS & RECEIPT', 120, 30);
    doc.setFontSize(9);
    doc.setTextColor(56, 189, 248); // sky-400
    doc.text('AUTHENTICATED ENTRY CREDENTIAL', 120, 38);

    // Payment Status Badge in Header
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.roundedRect(120, 44, 75, 9, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT VERIFIED & CONFIRMED', 157.5, 50, { align: 'center' });

    // Event Details Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('EVENT DETAILS', 20, 75);

    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.5);
    doc.line(20, 79, 190, 79);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.text(data.eventTitle, 20, 89);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(`Date & Time: ${data.eventDate}`, 20, 97);
    const venueText = data.selectedLocation
        ? `${data.selectedLocation} (${data.eventLocation})`
        : data.eventLocation;
    doc.text(`Venue / Location: ${venueText}`, 20, 104);

    // Attendee & Institution Details Section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ATTENDEE & REGISTRATION DETAILS', 20, 120);
    doc.line(20, 124, 190, 124);

    // Details Column
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);

    let yPos = 134;

    doc.setFont('helvetica', 'bold');
    doc.text('Attendee Name:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.userName, 65, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Contact Email:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.userEmail, 65, yPos);

    if (data.attendeeAge !== undefined && data.attendeeAge !== null) {
        yPos += 7;
        doc.setFont('helvetica', 'bold');
        doc.text('Declared Age:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${data.attendeeAge} years${data.guardianName ? ` (Guardian: ${data.guardianName})` : ''}`, 65, yPos);
    }

    if (data.institutionName) {
        yPos += 7;
        doc.setFont('helvetica', 'bold');
        doc.text('Institution / School:', 20, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(data.institutionName, 65, yPos);

        if (data.headAdminName) {
            yPos += 7;
            doc.setFont('helvetica', 'bold');
            doc.text('Head Administrator:', 20, yPos);
            doc.setFont('helvetica', 'normal');
            doc.text(data.headAdminName, 65, yPos);
        }
    }

    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Pass Category:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.category, 65, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Method:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    const paymentMethodDisplay = data.paymentMethod === 'MPESA'
        ? 'Lipa Na M-PESA'
        : (data.paymentMethod === 'PAYPAL' ? 'PayPal' : 'Card / Stripe');
    doc.text(paymentMethodDisplay, 65, yPos);

    yPos += 7;
    doc.setFont('helvetica', 'bold');
    doc.text('Settlement Status:', 20, yPos);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // emerald-600
    doc.text(`${formatKES(data.amountPaid)} Settled & Confirmed`, 65, yPos);

    yPos += 7;
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.text('Booking Reference:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.bookingId, 65, yPos);

    // Right Column: Official QR Code Container
    try {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://worlducationhub.org';
        const verifyUrl = `${origin}/verify-ticket?bookingId=${encodeURIComponent(data.bookingId)}`;

        const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 250,
            color: {
                dark: '#0f172a',
                light: '#ffffff'
            }
        });

        // Frame
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(135, 128, 55, 68, 3, 3, 'FD');

        // Draw QR Image
        doc.addImage(qrDataUrl, 'PNG', 140, 132, 45, 45);

        // QR Code Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text('SCAN TO VERIFY PASS', 162.5, 185, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text('Official Security Barcode', 162.5, 190, { align: 'center' });
    } catch (err) {
        console.error('Failed to generate QR code for ticket PDF:', err);
    }

    // Security Notice Box
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(20, 210, 170, 28, 2, 2, 'F');
    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('EVENT ENTRY GUIDELINES:', 25, 218);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('• Present this official pass (printed or on your mobile device) for QR code scanning at check-in.', 25, 224);
    doc.text('• Your registration fee is fully settled. Fast-track admission will be granted upon scanning.', 25, 229);
    doc.text('• A valid student/institutional or government photo ID matching the attendee name may be requested.', 25, 234);

    // Footer
    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(0, 260, 210, 37, 'F');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text('worlducationHub — Shaping the Future through Knowledge & Digital Skills', 105, 274, { align: 'center' });
    doc.setFontSize(8);
    doc.text('Support: support@worlducationhub.org • Web: www.worlducationhub.org', 105, 281, { align: 'center' });

    // Save the PDF
    const safeTitle = data.eventTitle.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
    doc.save(`worlducationHub_Pass_${safeTitle}_${data.bookingId.slice(0, 8)}.pdf`);
};
