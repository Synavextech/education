import React from 'react';

export default function TermsAndConditions() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 text-foreground">Terms and Conditions</h1>

            <p className="mb-4 text-muted-foreground leading-relaxed">
                Welcome to WorldDucationCentre (WDC). These terms and conditions outline the rules and regulations for the use of WorldDucationCentre's website, platforms, and educational registration services located at www.worldducationcentre.org.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">1. Acceptance of Terms</h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
                By accessing this website, registering for seasonal summits, or utilizing our digital learning tools, you accept and agree to be bound by these terms and conditions. If you do not agree with any part of these terms, please discontinue using WorldDucationCentre services immediately.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">2. Digital Services & Event Registrations</h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
                WorldDucationCentre provides digitized learning ecosystems, educational tablet services (U-Tab), and seasonal learning workshops. Registered participants and attendees are responsible for maintaining the accuracy of their profile credentials and respecting digital classroom codes of conduct.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">3. Intellectual Property</h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
                Unless otherwise stated, WorldDucationCentre and/or its educational licensors own all intellectual property rights for curricula, digital courses, tablet software modules, and event media published on this platform. All rights are reserved worldwide.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">4. Contact Information</h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
                For questions regarding these Terms and Conditions or our educational policies, you may contact our administration:
            </p>
            <ul className="list-disc pl-6 mb-4 text-muted-foreground space-y-2">
                <li>By email: <a href="mailto:support@worldducationcentre.org" className="text-primary hover:underline font-bold">support@worldducationcentre.org</a></li>
                <li>Website: <a href="https://www.worldducationcentre.org" className="text-primary hover:underline font-bold">www.worldducationcentre.org</a></li>
            </ul>
        </div>
    );
}
