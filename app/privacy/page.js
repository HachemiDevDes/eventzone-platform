import React from "react";
import LegalPageLayout from "../../components/LegalPageLayout";

export const metadata = {
  title: "Privacy Policy | Eventzone",
  description: "Learn how Eventzone collects, protects, and manages attendee and organizer data.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      lastUpdated="September 2026"
      description="This policy outlines how Eventzone handles personal information across our event management and ticketing platform."
      activeHref="/privacy"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">1. Overview & Scope</h2>
        <p>
          Eventzone (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;platform&rdquo;) provides software for organizing conferences, summits, and exhibitions. This Privacy Policy explains what personal data we collect from organizers, delegates, attendees, speakers, and exhibitors, and how that information is utilized and secured.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">2. Information We Collect</h2>
        <p>
          We collect information strictly necessary to provide event management and ticketing services:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li><strong className="text-slate-900">Account Credentials:</strong> Name, email address, password hashes, and company affiliation when registering as an organizer or attendee.</li>
          <li><strong className="text-slate-900">Event Registration Data:</strong> Pass selections, custom questionnaire responses, dietary preferences, and check-in status.</li>
          <li><strong className="text-slate-900">Payment Information:</strong> Transaction identifiers and payment status processed securely through authorized gateway partners (such as Chargily). Eventzone does not store complete credit card or banking numbers.</li>
          <li><strong className="text-slate-900">Technical Logs:</strong> IP address, device browser type, and access timestamps required for system security, fraud prevention, and session management.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">3. How We Use Your Data</h2>
        <p>
          Personal information is used solely for the following legitimate purposes:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li>Issuing digital QR passes, tickets, and official attendee credentials.</li>
          <li>Enabling organizers to manage door check-ins, floor plans, and session capacities.</li>
          <li>Delivering critical transactional communications (pass confirmations, schedule changes, receipts).</li>
          <li>Ensuring platform integrity, preventing bot abuse, and diagnosing operational errors.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">4. Data Sharing & Third Parties</h2>
        <p>
          We do not sell, rent, or trade personal data to third parties or marketing brokers. Data is shared exclusively with:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li><strong className="text-slate-900">Event Organizers:</strong> Organizers receive registration and pass details for attendees who voluntarily register for their specific events.</li>
          <li><strong className="text-slate-900">Infrastructure Providers:</strong> Encrypted hosting and database providers (Supabase, Cloudflare) operating under strict data processing agreements.</li>
          <li><strong className="text-slate-900">Legal Compliance:</strong> When required by binding legal process, court orders, or applicable regulations.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">5. Data Retention & Protection</h2>
        <p>
          Data is encrypted in transit using TLS 1.3 and at rest using industry-standard AES-256 encryption. We retain personal data only as long as necessary to fulfill event management services and comply with statutory accounting requirements.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">6. Your Rights</h2>
        <p>
          Depending on your location, you have rights to access, review, rectify, or request deletion of your personal data. To exercise these rights, please contact your event organizer or reach out to our team at{" "}
          <a href="mailto:privacy@eventzone.pro" className="text-blue-600 font-medium hover:underline">
            privacy@eventzone.pro
          </a>.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">7. Contact Us</h2>
        <p>
          If you have questions regarding this Privacy Policy, contact us at:
        </p>
        <p className="font-mono text-xs text-slate-600">
          Eventzone Data Privacy Team<br />
          Email: privacy@eventzone.pro<br />
          Website: eventzone.pro
        </p>
      </section>
    </LegalPageLayout>
  );
}
