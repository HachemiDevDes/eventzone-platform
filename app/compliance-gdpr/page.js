import React from "react";
import LegalPageLayout from "../../components/LegalPageLayout";

export const metadata = {
  title: "Compliance & GDPR | Eventzone",
  description: "Eventzone data protection compliance, GDPR alignment, and privacy framework for event organizers and attendees.",
};

export default function ComplianceGdprPage() {
  return (
    <LegalPageLayout
      title="Compliance & GDPR"
      lastUpdated="September 2026"
      description="Our commitment to data protection laws, European Union General Data Protection Regulation (GDPR), and attendee privacy."
      activeHref="/compliance-gdpr"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">1. Regulatory Commitment</h2>
        <p>
          Eventzone operates in adherence to international data protection principles, including the European Union General Data Protection Regulation (GDPR - Regulation EU 2016/679) and regional privacy frameworks. We ensure all personal data collected during event registration and attendance is processed lawfully, transparently, and securely.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">2. Controller & Processor Roles</h2>
        <p>
          Under the GDPR data protection framework:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li><strong className="text-slate-900">Event Organizers as Data Controllers:</strong> The organizer determines what attendee fields are collected (e.g. registration questions, dietary preferences, passport numbers for foreign delegates) and is responsible for establishing a lawful basis for that collection.</li>
          <li><strong className="text-slate-900">Eventzone as Data Processor:</strong> Eventzone processes attendee registration data solely on behalf of, and according to the instructions of, the event organizer.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">3. Lawful Basis for Processing</h2>
        <p>
          Data processed through Eventzone relies on the following lawful bases:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li><strong className="text-slate-900">Contractual Performance:</strong> Processing required to issue event passes, process ticket transactions, and grant venue admission.</li>
          <li><strong className="text-slate-900">Consent:</strong> Where attendees explicitly opt-in to receive organizer marketing updates, summit bulletins, or sponsor contact requests.</li>
          <li><strong className="text-slate-900">Legitimate Interests:</strong> Preventing fraud, ensuring physical event gate safety, and maintaining system availability.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">4. Attendee & Delegate Rights</h2>
        <p>
          Under GDPR, attendees whose data is processed through Eventzone enjoy clear enforceable rights:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li><strong className="text-slate-900">Right of Access:</strong> Request a copy of all personal records stored in connection with your event registrations.</li>
          <li><strong className="text-slate-900">Right to Rectification:</strong> Request correction of inaccurate contact details, spelling errors, or company affiliations.</li>
          <li><strong className="text-slate-900">Right to Erasure (&ldquo;Right to be Forgotten&rdquo;):</strong> Request deletion of your registration profile once an event has concluded, subject to statutory legal record-keeping obligations.</li>
          <li><strong className="text-slate-900">Right to Restrict Processing:</strong> Request temporary restriction of data processing during verification disputes.</li>
          <li><strong className="text-slate-900">Right to Data Portability:</strong> Obtain your registration history in a structured, machine-readable format (e.g., CSV or JSON export).</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">5. International Data Transfers</h2>
        <p>
          When data is transferred across international borders, Eventzone relies on Standard Contractual Clauses (SCCs) approved by the European Commission, ensuring equivalent levels of data protection regardless of where cloud compute and storage clusters reside.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">6. Data Processing Agreement (DPA)</h2>
        <p>
          We offer a standard Data Processing Agreement (DPA) incorporating European Standard Contractual Clauses for institutional and enterprise event organizers requiring formal compliance documentation.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">7. Data Protection Office Contact</h2>
        <p>
          To submit a data subject access request (DSAR), request a signed DPA, or reach our compliance office:
        </p>
        <p className="font-mono text-xs text-slate-600">
          Eventzone Data Protection Officer<br />
          Email: compliance@eventzone.pro<br />
          General: contact@eventzone.pro
        </p>
      </section>
    </LegalPageLayout>
  );
}
