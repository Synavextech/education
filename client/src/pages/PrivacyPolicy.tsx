import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 text-foreground">Privacy Policy for worlducationHub</h1>

            <p className="mb-4 text-muted-foreground leading-relaxed">
                worlducationHub (hereinafter referred to as “we,” “our,” or “us”) values your privacy and is dedicated to safeguarding your personal and educational information. This privacy policy outlines how we collect, process, and protect the data you provide when visiting our website (www.worlducationhub.org), registering for seasonal summits, or utilizing our digitized learning tools.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Automatically-Collected Data</h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
                We, along with our verified technical partners, utilize secure technologies to collect operational analytics regarding interactions with our learning portals. This data is utilized solely to enhance educational service delivery, maintain high availability of digital curriculums, and secure user sessions.
            </p>

            <ul className="list-disc pl-6 mb-6 text-muted-foreground space-y-2">
                <li><strong>System Logs:</strong> IP address, device telemetry, browser type, and timestamps to secure learning sessions.</li>
                <li><strong>Essential Cookies:</strong> Encrypted session tokens to maintain authorized student and educator logins.</li>
                <li><strong>Analytics:</strong> Aggregated, non-personally identifiable metrics on educational module completion and event inquiries.</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Security of Payment Information</h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
                When you register for paid workshops, summits, or laboratory sessions, all financial transactions are processed directly by certified tier-1 payment gateways (Stripe & PayPal) with end-to-end encryption. worlducationHub never stores raw credit or debit card numbers on its servers.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Child & Student Data Safeguards</h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
                Student data is held to the highest standard of international protection. We do not sell, rent, or monetize student information to any third parties. All classroom and tablet data is strictly protected under educational privacy guidelines.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">worlducationHub Refund & Credit Voucher Policy</h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
                We are committed to providing an exceptional experience for our participants across all seasonal summits. In cases where rescheduling is requested with at least 14 days notice, delegates are eligible for a worlducationHub Credit Voucher (CVV) applicable to any future seasonal summit or bootcamp within 12 months.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Contact Our Data Privacy Officer</h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
                If you have questions regarding this privacy policy or wish to review your stored profile information, please contact:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
                <li>Email: <a href="mailto:support@worlducationhub.org" className="text-primary hover:underline font-bold">support@worlducationhub.org</a></li>
                <li>Official Website: <a href="https://www.worlducationhub.org" className="text-primary hover:underline font-bold">www.worlducationhub.org</a></li>
            </ul>
        </div>
    );
}