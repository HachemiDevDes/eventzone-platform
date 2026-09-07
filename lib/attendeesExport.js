import * as XLSX from "xlsx";

/**
 * Standard normalized column mappings for multi-language or common header variants
 */
const HEADER_KEY_MAPPING = {
  // First Name
  firstname: "firstName",
  first_name: "firstName",
  "first name": "firstName",
  prenom: "firstName",
  prénom: "firstName",
  "الاسم الاول": "firstName",
  "الاسم الأول": "firstName",

  // Last Name
  lastname: "lastName",
  last_name: "lastName",
  "last name": "lastName",
  nom: "lastName",
  "nom de famille": "lastName",
  familyname: "lastName",
  "family name": "lastName",
  اللقب: "lastName",
  "اسم العائلة": "lastName",

  // Full Name
  name: "fullName",
  fullname: "fullName",
  "full name": "fullName",
  "nom complet": "fullName",
  "الاسم الكامل": "fullName",

  // Email
  email: "email",
  "email address": "email",
  "e-mail": "email",
  courriel: "email",
  البريد: "email",
  "البريد الإلكتروني": "email",

  // Phone
  phone: "phone",
  phonenumber: "phone",
  "phone number": "phone",
  telephone: "phone",
  téléphone: "phone",
  tel: "phone",
  mobile: "phone",
  الهاتف: "phone",
  "رقم الهاتف": "phone",

  // Company
  company: "company",
  organization: "company",
  organisation: "company",
  "company / organization": "company",
  "company/org": "company",
  societe: "company",
  société: "company",
  entreprise: "company",
  الشركة: "company",
  المؤسسة: "company",

  // Job Title
  jobtitle: "jobTitle",
  "job title": "jobTitle",
  title: "jobTitle",
  role: "jobTitle",
  position: "jobTitle",
  profession: "jobTitle",
  poste: "jobTitle",
  fonction: "jobTitle",
  "job function": "jobTitle",
  المهنة: "jobTitle",
  "المسمى الوظيفي": "jobTitle",

  // Booth
  booth: "booth",
  boothnumber: "booth",
  "booth number": "booth",
  stand: "booth",
  "numero de stand": "booth",
  "numéro de stand": "booth",
  الجناح: "booth",
  "رقم الجناح": "booth",

  // Sponsor Tier
  sponsortier: "sponsorTier",
  "sponsor tier": "sponsorTier",
  sponsorship: "sponsorTier",
  "sponsorship tier": "sponsorTier",
  "niveau de sponsor": "sponsorTier",
  "فئة الرعاية": "sponsorTier",

  // Speaker Topic / Bio
  topic: "topic",
  bio: "bio",
  "speaker bio": "bio",
  "session title": "sessionTitle",
  session: "sessionTitle",
};

/**
 * Normalizes a raw string into a lookup key
 */
function normalizeHeaderKey(rawHeader) {
  if (!rawHeader || typeof rawHeader !== "string") return "";
  return rawHeader.trim().toLowerCase().replace(/[\r\n\t]+/g, " ");
}

/**
 * Generates an empty category-tailored Excel template (.xlsx) with guidelines & sample row
 */
export function generateAttendeeTemplate(category = "Standard Admission", ticketObj = null, formObj = null) {
  const catLower = (category || "").toLowerCase();
  const isSpeaker = catLower.includes("speaker");
  const isExhibitor = catLower.includes("exhibitor");
  const isSponsor = catLower.includes("sponsor");

  // Base required headers
  const headers = [
    "First Name *",
    "Last Name *",
    "Email *",
    "Phone Number",
    "Company / Organization",
    "Job Title",
  ];

  const sampleRow = [
    "John",
    "Doe",
    "john.doe@example.com",
    "+213 550 12 34 56",
    "Acme Corp",
    "Senior Consultant",
  ];

  // Category specific columns
  if (isExhibitor) {
    headers.push("Booth Number");
    sampleRow.push("A-12");
  } else if (isSponsor) {
    headers.push("Sponsor Tier");
    sampleRow.push("Gold");
  } else if (isSpeaker) {
    headers.push("Session Title");
    sampleRow.push("Keynote: The Future of AI in Event Management");
    headers.push("Speaker Bio / Topic");
    sampleRow.push("Industry leader with 15+ years experience in digital transformation.");
  }

  // Custom ticket form fields (if a custom form is attached to this ticket)
  if (formObj && Array.isArray(formObj.fields)) {
    formObj.fields.forEach((field) => {
      if (!field || !field.id || field.type === "section") return;
      const fType = (field.type || "").toLowerCase();
      if (["picture", "photo", "image", "avatar", "file", "file_upload"].includes(fType)) return;

      const fLabelNorm = (field.label || "").toLowerCase();
      // Skip if already in standard headers
      if (
        fLabelNorm.includes("first name") ||
        fLabelNorm.includes("last name") ||
        fLabelNorm.includes("email") ||
        fLabelNorm.includes("phone") ||
        fLabelNorm.includes("company") ||
        fLabelNorm.includes("job")
      ) {
        return;
      }

      const colHeader = `${field.label || field.id}${field.required ? " *" : ""}`;
      headers.push(colHeader);
      sampleRow.push(field.placeholder || "Sample Answer");
    });
  }

  // Create workbook
  const wb = XLSX.utils.book_new();
  const wsData = [headers, sampleRow];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  ws["!cols"] = headers.map((h) => ({
    wch: Math.max(h.length + 5, 20),
  }));

  const sheetName = (category || "Attendees").slice(0, 31).replace(/[\\/?*[\]]/g, "_");
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate binary output
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const cleanCategoryName = (category || "Attendee").replace(/[^a-zA-Z0-9_-]/g, "_");
  const fileName = `Eventzone_Template_${cleanCategoryName}.xlsx`;

  downloadBlob(blob, fileName);
}

/**
 * Parses an uploaded .xlsx or .csv File and validates rows
 */
export async function parseAttendeeSpreadsheet(file, existingEmails = new Set()) {
  if (!file) throw new Error("No file provided");

  const data = await file.arrayBuffer();
  const wb = XLSX.read(data, { type: "array" });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) throw new Error("The uploaded spreadsheet contains no sheets.");

  const ws = wb.Sheets[firstSheetName];
  // Parse rows as raw array of objects
  const rawRows = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });

  if (!rawRows || rawRows.length === 0) {
    return {
      totalCount: 0,
      validRows: [],
      invalidRows: [],
    };
  }

  const validRows = [];
  const invalidRows = [];
  const seenFileEmails = new Set();

  rawRows.forEach((row, rowIndex) => {
    // Map raw headers to normalized fields
    const normalized = {
      _rowIndex: rowIndex + 2, // 1-indexed, row 1 is header
      raw: row,
      customAnswers: {},
    };

    Object.entries(row).forEach(([rawCol, val]) => {
      const cleanVal = typeof val === "string" ? val.trim() : String(val || "").trim();
      const normKey = normalizeHeaderKey(rawCol);

      // Check direct mapping
      const mappedField = HEADER_KEY_MAPPING[normKey] || HEADER_KEY_MAPPING[normKey.replace(/\s*\*/g, "")];

      if (mappedField) {
        normalized[mappedField] = cleanVal;
      } else {
        // Save as custom answer
        const cleanColName = rawCol.replace(/\s*\*/g, "").trim();
        normalized.customAnswers[cleanColName] = cleanVal;
      }
    });

    // Resolve full name
    let firstName = normalized.firstName || "";
    let lastName = normalized.lastName || "";
    let fullName = normalized.fullName || "";

    if (!fullName && (firstName || lastName)) {
      fullName = `${firstName} ${lastName}`.trim();
    } else if (fullName && (!firstName && !lastName)) {
      const parts = fullName.split(" ");
      firstName = parts[0] || "";
      lastName = parts.slice(1).join(" ") || "";
    }

    normalized.firstName = firstName;
    normalized.lastName = lastName;
    normalized.name = fullName;

    // Check validation errors
    const errors = [];

    // Email validation
    const email = (normalized.email || "").toLowerCase().trim();
    normalized.email = email;

    if (!email) {
      errors.push("Missing email address");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push("Invalid email format");
    } else if (seenFileEmails.has(email)) {
      errors.push("Duplicate email in spreadsheet");
    } else if (existingEmails && existingEmails.has(email)) {
      errors.push("Attendee already registered with this email");
    }

    if (email && !errors.includes("Duplicate email in spreadsheet")) {
      seenFileEmails.add(email);
    }

    // Name validation
    if (!fullName) {
      errors.push("Missing name (First or Last name required)");
    }

    if (errors.length === 0) {
      validRows.push(normalized);
    } else {
      invalidRows.push({
        ...normalized,
        errors,
      });
    }
  });

  return {
    totalCount: rawRows.length,
    validRows,
    invalidRows,
  };
}

/**
 * Exports currently filtered attendee list to a clean .xlsx spreadsheet
 */
export function exportAttendeesToExcel(attendees = [], dynamicCols = [], eventDetails = null) {
  if (!attendees || attendees.length === 0) {
    throw new Error("No attendees to export.");
  }

  // Define column headers
  const baseHeaders = [
    "Full Name",
    "First Name",
    "Last Name",
    "Email",
    "Phone Number",
    "Company / Organization",
    "Job Title",
    "Ticket Tier / Category",
    "Status",
    "Checked In",
    "Check-in Time",
    "Registration Date",
    "Is Speaker",
  ];

  // Dynamic custom form question headers
  const dynamicHeaders = (dynamicCols || []).map(
    (c) => c.label || c.baseLabel || c.id
  );

  const allHeaders = [...baseHeaders, ...dynamicHeaders];

  // Build rows
  const rows = attendees.map((a) => {
    const nameParts = (a.name || "").trim().split(" ");
    const firstName = a.firstName || a.first_name || nameParts[0] || "";
    const lastName = a.lastName || a.last_name || nameParts.slice(1).join(" ") || "";

    const ans = a.answers || a.customAnswers || a.formAnswers || {};

    const baseData = [
      a.name || `${firstName} ${lastName}`.trim(),
      firstName,
      lastName,
      a.email || "",
      a.phone || ans.phone || ans.f_core_phone || "",
      a.company || ans.company || ans.f_company || "",
      a.jobTitle || a.job_title || ans.jobTitle || ans.f_job_title || "",
      a.ticketType || a.ticket_type || "Standard Admission",
      a.isArchived ? "Archived" : (a.checkedIn || a.status === "checked_in" ? "Checked In" : "Registered"),
      a.checkedIn || a.status === "checked_in" ? "Yes" : "No",
      a.checkedInAt || a.checked_in_at || "",
      a.registeredDate || a.registered_at || a.date || "",
      a.isSpeaker || a.is_speaker ? "Yes" : "No",
    ];

    // Dynamic custom answers
    const dynamicData = (dynamicCols || []).map((col) => {
      let val = ans[col.id] ?? ans[col.label] ?? ans[col.baseLabel] ?? "";
      if (typeof val === "boolean") return val ? "Yes" : "No";
      if (Array.isArray(val)) return val.join(", ");
      return String(val || "");
    });

    return [...baseData, ...dynamicData];
  });

  const wb = XLSX.utils.book_new();
  const wsData = [allHeaders, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Column width formatting
  ws["!cols"] = allHeaders.map((h, i) => {
    let maxLen = h.length;
    for (let r = 0; r < Math.min(rows.length, 50); r++) {
      const cellVal = String(rows[r][i] || "");
      if (cellVal.length > maxLen) maxLen = cellVal.length;
    }
    return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
  });

  XLSX.utils.book_append_sheet(wb, ws, "Attendees");

  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const eventTitleClean = (eventDetails?.title || "Event").replace(/[^a-zA-Z0-9_-]/g, "_");
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `Eventzone_${eventTitleClean}_Attendees_${dateStr}.xlsx`;

  downloadBlob(blob, fileName);
}

/**
 * Helper to trigger browser download of a Blob
 */
function downloadBlob(blob, fileName) {
  if (typeof window === "undefined") return;
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 150);
}
