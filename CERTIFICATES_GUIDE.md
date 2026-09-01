# Certificates Module Walkthrough & Features Guide

A comprehensive, production-ready **Certificates & Honors System** has been built into the Eventzone platform. Organizers can select from a curated gallery of domain-tailored templates, customize every aspect with a live visual editor and dynamic placeholder engine, and generate high-precision horizontal A4 certificates individually or in bulk batches.

---

## 🌟 Key Features Added

### 1. New Organizer Dashboard Tab: "Certificates"
- **Location**: Added directly to the left navigation sidebar with an official `Award` icon and live eligible recipient badge count.
- **Access & Permissions**: Fully registered with the platform's granular access control system (`EVENT_MODULES`), supporting Editor and Viewer permissions.
- **Multilingual Support**: Fully translated across **English** (*Certificates*), **French** (*Certificats*), and **Arabic** (*الشهادات والتقديرات*).
- **Quick Access**: Quick-action launch card embedded on the main **Overview** dashboard for 1-click access.

---

### 2. Multi-Domain A4 Horizontal Template Gallery
Organizers can switch between 8 professionally styled, pre-configured horizontal A4 landscape templates:
1. **Classic Executive Gold & Navy**: Double gold beveled foil border, corner rosettes, embossed gold medal seal, and Cinzel Roman typography.
2. **Modern Tech & Cyber Innovation**: Electric cyan & indigo geometric circuit frame, verified cryptographic badge, and tech typography.
3. **Keynote & Distinguished Speaker Honor**: Ornate luxury styling tailored for conference speakers, panelists, and moderators.
4. **Sponsor & Strategic Partner Appreciation**: Corporate navy dual-tone framing with diamond excellence badge for corporate sponsors.
5. **Exhibitor Hall Showcase Excellence**: Emerald luxury border with laurel crest designed for exhibition booths and commercial teams.
6. **Academic & Scholarly Research Diploma**: Traditional academic guilloché diploma border, university crest stamp, and formal Latinate dividers.
7. **Award of Outstanding Excellence**: Innovation and competition award template with jury president signatory blocks.
8. **Executive Masterclass & Training Completion**: Professional training certification with Continuing Education Units (CEU/CPD) credits.
9. **Custom Artwork Canvas**: Full-bleed upload mode allowing organizers to upload custom corporate graphic design artwork (PNG/JPG) with dynamic text and QR overlays.

---

### 3. Live Visual Customizer & Dynamic Placeholder Engine
The customizer provides a 5-tab editor with real-time A4 horizontal preview:
- **Content & Text**:
  - Certificate title, presentation subtitle, recipient subtext, and CPD accreditation tag.
  - Rich body text statement with markdown bold support and 1-click variable insertion chips:
    - `{{name}}` — Recipient Full Name
    - `{{organization}}` / `{{company}}` — Organization / Company
    - `{{role}}` — Attendee / Speaker / Sponsor / Exhibitor
    - `{{job_title}}` — Professional Job Title / Position
    - `{{event_name}}` — Event Title
    - `{{event_location}}` — Venue & City
    - `{{event_date}}` — Event Dates
    - `{{issue_date}}` — Date of Issuance
    - `{{certificate_id}}` — Unique Serial Number
    - `{{custom_notes}}` — Accreditation / Honors Notes
- **Styling & Theme**:
  - Typography font pairings: *Classic Roman (Cinzel)*, *Luxury Editorial (Playfair Display)*, *Modern Tech (Montserrat)*, and *Academic Heritage (Cormorant Garamond)* via `<SearchableSelect>`.
  - Primary & secondary accent color palette + custom color picker.
  - Border frames: *Classic Double Gold*, *Modern Cyber Frame*, *Academic Diploma*, *Emerald Luxe*, *Corporate Bold*, or *None*.
  - Seals & Badges: *Official Gold Foil Seal*, *Crimson Rosette with Gold Edge*, *Scholarly Laurel Crest*, *Diamond Star*, *Digital Verified Seal*, or *Clean (None)*.
  - Background tone: *Classic Ivory*, *Pure White*, *Obsidian Dark*, or *Soft Slate Gradient*.
- **Signatories**:
  - Up to 3 configurable signatories (Name, Title, Organization).
  - Choice of custom uploaded signature image or 6 realistic digital calligraphy scripts (`Great Vibes`, `Alex Brush`, `Dancing Script`, `Sacramento`, `Satisfy`).
- **QR & Security**:
  - Dynamic scannable QR verification code encoding tamper-evident verification metadata.
  - Anti-counterfeiting Guilloché security watermark pattern.
  - Configurable serial number prefix (`EZ-CERT-2026-XXXX`).
- **Template Presets**:
  - Save customized designs as reusable presets, persisted to database and local cache.

---

### 4. Batch & Individual Generation Engine
- **Role-Based Aggregation**: Automatically pulls and synchronizes real event participants:
  - **All Attendees** (registered delegates from database)
  - **All Speakers** (curated keynote speakers and panelists from agenda sessions)
  - **All Sponsors** (partner companies and sponsorship tier delegates)
  - **All Exhibitors** (booth representatives and exhibition teams)
  - **Custom / Ad-Hoc Recipients** (manual entry or CSV bulk upload)
- **Recipients Directory & Filtering**:
  - Role filter pills with live counts (`All`, `Attendees`, `Speakers`, `Sponsors`, `Exhibitors`).
  - Real-time search across names, emails, companies, and certificate serial numbers.
  - Multi-select checkboxes with "Select All Filtered" / "Deselect All".
- **A4 Landscape Print & PDF Export**:
  - Single certificate 1-click print / save to PDF.
  - Batch print selected or batch print all: generates a multi-page A4 landscape print job with exact `@page { size: A4 landscape; margin: 0; }` styling, vector-crisp typography, embedded Google Fonts, and page-breaks.
- **Add Custom Recipient Modal**: Fast manual entry modal for VIPs and special guests.
- **Import CSV Modal**: Paste or upload comma-separated rows (`Name, Email, Role, Company, JobTitle`) for bulk intake.
- **Verification Preview Modal**: Auditor and attendee credential verification preview simulating the QR scan result.

---

## 📂 Modified & Created Files

1. `lib/certificatePresets.js` *(New)* — Complete library of default certificate templates, font pairings, calligraphy signatures, seal styles, and placeholder interpolation helpers.
2. `components/A4CertificateSheet.js` *(New)* — Standalone horizontal A4 certificate component and high-precision browser print engine (`printA4CertificatesDocument`).
3. `components/CertificatesView.js` *(New)* — Flagship certificate workspace with live visual customizer, interactive A4 canvas preview, recipient carousel switcher, and batch selection table.
4. `lib/db.js` — Added certificate template persistence, retrieval, and cache functions (`fetchCertificateTemplates`, `upsertCertificateTemplate`, `deleteCertificateTemplate`, `fetchIssuedCertificates`, `recordIssuedCertificates`).
5. `lib/permissions.js` — Added `certificates` module to `EVENT_MODULES`.
6. `lib/i18n.js` — Added `dash.certificates` translation entries in English, French, and Arabic.
7. `components/SkeletonLoaders.js` — Added `CertificatesSkeleton` for smooth loading transitions.
8. `app/globals.css` — Imported Google Fonts (`Cinzel`, `Playfair Display`, `Cormorant Garamond`, `Montserrat`, `Great Vibes`, `Alex Brush`, `Dancing Script`, `Sacramento`, `Satisfy`).
9. `app/page.js` — Registered `certificates` in `validViews`, added left sidebar navigation button with live counter, and wired skeleton switch.
10. `components/GenericTableView.js` — Wired `CertificatesView` and `CertificatesSkeleton` into the routing switch.
11. `components/Overview.js` — Added quick-launch action card for Certificates.
