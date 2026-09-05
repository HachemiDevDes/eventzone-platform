import React from "react";
import LegalPageLayout from "../../components/LegalPageLayout";

export const metadata = {
  title: "Enterprise Security | Eventzone",
  description: "Enterprise security architecture, encryption standards, and platform infrastructure safeguards at Eventzone.",
};

export default function EnterpriseSecurityPage() {
  return (
    <LegalPageLayout
      title="Enterprise Security"
      lastUpdated="September 2026"
      description="An overview of the security architecture, controls, and practices safeguarding the Eventzone platform."
      activeHref="/enterprise-security"
    >
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">1. Security Architecture</h2>
        <p>
          Eventzone is engineered with defense-in-depth principles to protect high-profile summits, commercial exhibitions, and sensitive attendee data. Our infrastructure leverages tier-1 cloud providers with ISO 27001, SOC 1, SOC 2, and PCI-DSS compliance certifications.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">2. Encryption Standards</h2>
        <p>
          We enforce end-to-end cryptographic safeguards across all data flows:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li><strong className="text-slate-900">Encryption in Transit:</strong> All communications between clients, mobile check-in apps, and platform APIs require TLS 1.3 with modern, secure cipher suites. Unencrypted HTTP is automatically redirected to HTTPS.</li>
          <li><strong className="text-slate-900">Encryption at Rest:</strong> All database records, user files, event contracts, and floor plan media are encrypted using AES-256 at the storage and filesystem layer.</li>
          <li><strong className="text-slate-900">Secret Management:</strong> API keys, webhook signing secrets, and service credentials are protected via encrypted environment variable stores and never committed to source code.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">3. Authentication & Access Governance</h2>
        <p>
          We implement strict identity and access controls across the platform:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700">
          <li><strong className="text-slate-900">Granular Role-Based Access Control (RBAC):</strong> Organizers can designate staff members with restricted module scopes (e.g. check-in only, agenda editor, VIP viewer) preventing unauthorized exposure.</li>
          <li><strong className="text-slate-900">Password Security:</strong> Passwords are hashed using strong cryptographic key-derivation functions (bcrypt/Argon2) before storage.</li>
          <li><strong className="text-slate-900">Door Check-In Passcodes:</strong> Gate security teams utilize isolated 6-digit dynamic event passcodes, preventing staff from accessing full organizer accounts on scanning devices.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">4. Network Security & DDoS Protection</h2>
        <p>
          Platform traffic is routed through Cloudflare edge proxy networks, providing enterprise-grade DDoS mitigation, automated bot detection, Web Application Firewall (WAF) filtering, and intelligent rate limiting against brute-force attacks.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">5. Backups & Disaster Recovery</h2>
        <p>
          Event databases are continuously replicated with automated daily point-in-time snapshots stored in geographically separated facilities. Redundant failover mechanisms ensure minimal Recovery Time Objective (RTO) and Recovery Point Objective (RPO) in the event of an infrastructure incident.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900">6. Security Vulnerability Reporting</h2>
        <p>
          We welcome responsible disclosure of security issues from researchers and users. If you discover a potential vulnerability, please report it immediately to our security operations team:
        </p>
        <p className="font-mono text-xs text-slate-600">
          Eventzone Security Operations<br />
          Email: security@eventzone.pro<br />
          PGP Key available upon request
        </p>
      </section>
    </LegalPageLayout>
  );
}
