import React from 'react';

export default function CompliancePolicy() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-6 text-foreground">Compliance Policy</h1>

            <div className="bg-primary/10 border-l-4 border-primary p-5 mb-8 rounded-r-2xl">
                <p className="text-primary font-medium">
                    At WorldDucationCentre (WDC), we are committed to conducting our operations with integrity and in compliance with all applicable laws, regulations, and global ethical standards.
                </p>
            </div>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Our Commitment</h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
                WorldDucationCentre is dedicated to maintaining the highest standards of compliance in all educational, lab infrastructure, and seasonal event activities. We expect all our employees, volunteers, educational partners, and stakeholders to adhere strictly to these standards.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Key Areas of Compliance</h2>
            <ul className="list-disc pl-6 mb-6 text-muted-foreground space-y-3">
                <li><strong>Data Protection & Student Privacy:</strong> We strictly adhere to student data protection laws to ensure the absolute security and privacy of student and educator information.</li>
                <li><strong>Financial Integrity:</strong> We are committed to transparency in our operational and sponsorship reporting, ensuring all funds are utilized exclusively for educational transformation and lab digitization.</li>
                <li><strong>Equal Access & Inclusivity:</strong> We foster an inclusive environment ensuring equal digital opportunities for all students regardless of background or region.</li>
                <li><strong>Student & Child Safety:</strong> The safety and physical and digital well-being of all learners participating in our digital labs and workshops is our top priority.</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground">Reporting Concerns</h2>
            <p className="mb-4 text-muted-foreground leading-relaxed">
                If you suspect any violation of our compliance policy or legal obligations, we encourage you to report it immediately. All reports will be handled confidentially and investigated thoroughly.
            </p>
            <p className="mb-4 text-muted-foreground">
                You can report concerns to: <a href="mailto:support@worldducationcentre.org" className="text-primary hover:underline font-bold">support@worldducationcentre.org</a>
            </p>
        </div>
    );
}