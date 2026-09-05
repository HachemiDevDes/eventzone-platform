import React from "react";
import LegalPageLayout from "../../components/LegalPageLayout";

export const metadata = {
  title: "Terms of Service | Eventzone",
  description: "Terms and conditions governing the use of the Eventzone event management platform.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      title="Terms of Service"
      lastUpdated="September 2026"
      description="These terms outline the rights, responsibilities, and conditions governing the use of Eventzone."
      activeHref="/terms"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">1. Acceptance of Terms</h2>
        <p>
          By accessing or using Eventzone (&ldquo;the platform&rdquo;), whether as an event organizer, attendee, delegate, speaker, or visitor, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must discontinue platform use immediately.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">2. User Accounts & Responsibilities</h2>
        <p>
          To create events or access certain ticketing features, you must register an account:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li>You agree to provide accurate, current, and complete registration details.</li>
          <li>You are responsible for maintaining the confidentiality of your credentials and all activity conducted under your account.</li>
          <li>Organizers must respect attendee capacity limits, tier quotas, and platform publishing standards.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">3. Event Hosting & Ticketing</h2>
        <p>
          Organizers using Eventzone to host events agree to the following obligations:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li><strong className="text-slate-900">Event Legitimacy:</strong> All published summits, conferences, agendas, and speaker details must be genuine and accurately represented.</li>
          <li><strong className="text-slate-900">Ticket Sales & Refunds:</strong> Organizers determine their own ticket prices, admission terms, and refund policies in compliance with applicable commercial consumer laws.</li>
          <li><strong className="text-slate-900">Attendee Data Stewardship:</strong> Organizers must handle attendee registration records in strict compliance with applicable privacy regulations and may not misuse guest information.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">4. Prohibited Activities</h2>
        <p>
          When using Eventzone, you agree not to:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li>Publish fraudulent events, illicit goods, deceptive schemes, or unlawful gatherings.</li>
          <li>Attempt unauthorized access to other user accounts, databases, or API infrastructure.</li>
          <li>Engage in automated scraping, denial-of-service attempts, or bypassing security rate limits.</li>
          <li>Impersonate any individual, organization, or platform administrator.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">5. Platform Availability & Disclaimers</h2>
        <p>
          Eventzone strives for high availability, reliable ticket delivery, and continuous operation. However, the platform is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We are not liable for venue disruptions, cancellations enacted by organizers, third-party internet outages, or force majeure events.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">6. Intellectual Property</h2>
        <p>
          The Eventzone platform, software, designs, trademarks, and documentation are the exclusive property of Eventzone. Organizers retain full ownership of their original event content, session slides, brand logos, and media uploaded to the platform.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">7. Modifications to Terms</h2>
        <p>
          We reserve the right to revise these Terms of Service periodically. Continued use of the platform after changes become effective constitutes acceptance of the modified terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">8. Contact & Legal Notices</h2>
        <p>
          For legal inquiries or notices regarding these terms, please contact:
        </p>
        <p className="font-mono text-xs text-slate-600">
          Eventzone Legal Affairs<br />
          Email: contact@eventzone.pro<br />
          Website: eventzone.pro
        </p>
      </section>
    </LegalPageLayout>
  );
}
