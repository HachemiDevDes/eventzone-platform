import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Boxes, Truck, Plane, Clock, ClipboardCheck, AlertTriangle,
  Search, Plus, Download, Printer, Filter, CheckCircle2,
  XCircle, ArrowRight, Phone, Mail, MapPin, Building2,
  User, ShieldCheck, RefreshCw, Trash2, Edit3, Sparkles,
  Layers, ChevronRight, Check, X, Calendar, DollarSign,
  Info, ExternalLink, HelpCircle, FileText, AlertCircle,
  Package, ChevronDown
} from "lucide-react";
import { useLanguage } from "../lib/i18n";
import SearchableSelect from "./SearchableSelect";
import CountryPhoneInput from "./CountryPhoneInput";
import { LogisticsSkeleton } from "./SkeletonLoaders";

// ─────────────────────────────────────────────
//  CONSTANTS & SELECTOR OPTIONS
// ─────────────────────────────────────────────

export const INVENTORY_CATEGORIES = [
  "AV & Audio",
  "Lighting & Stage",
  "Displays & Projectors",
  "Furniture & Decor",
  "Signage & Rollups",
  "Collateral & Swag",
  "Tech & Cabling",
  "Badges & Lanyards",
  "Power & Electrical",
  "Other Equipment"
];

export const INVENTORY_CONDITIONS = [
  "New / Sealed",
  "Good",
  "Fair",
  "Needs Inspection",
  "Damaged / Repair"
];

export const VENDOR_SERVICE_TYPES = [
  "Catering & F&B",
  "AV & Production",
  "Staging & Rigging",
  "Security & Safety",
  "Cleaning & Sanitation",
  "Photography & Video",
  "Live Streaming & Broadcasting",
  "Hostesses & Staffing",
  "Translation & Interpretation",
  "Courier & Freight Transport",
  "Floral & Plant Decor",
  "Other Services"
];

export const VENDOR_STATUSES = [
  { value: "scheduled", label: "Scheduled", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "confirmed", label: "Confirmed", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "on-site", label: "On-Site / Loading", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "completed", label: "Completed / Delivered", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { value: "delayed", label: "Delayed / Issue", color: "bg-rose-50 text-rose-700 border-rose-200" }
];

export const TRAVEL_ROLES = [
  "Keynote Speaker",
  "Panelist / Speaker",
  "VIP Delegate",
  "Executive / Sponsor Guest",
  "Workshop Lead",
  "Moderator / Host",
  "Event Staff / Crew",
  "Judge / Evaluator"
];

export const TRAVEL_TYPES = [
  "Flight",
  "Train / High-Speed Rail",
  "Private Shuttle / Driver",
  "Rental Car",
  "Personal Vehicle",
  "Hotel Walking Distance"
];

export const PICKUP_STATUSES = [
  { value: "scheduled", label: "Scheduled", color: "bg-slate-100 text-slate-700" },
  { value: "confirmed", label: "Confirmed Driver", color: "bg-blue-50 text-blue-700" },
  { value: "in_transit", label: "In Transit", color: "bg-amber-50 text-amber-700" },
  { value: "completed", label: "Arrived at Venue / Hotel", color: "bg-emerald-50 text-emerald-700" },
  { value: "cancelled", label: "Cancelled", color: "bg-rose-50 text-rose-700" }
];

export const ACTION_TYPES = [
  "Load-in",
  "AV Check",
  "Registration Desk",
  "VIP Escort",
  "Stage Cue",
  "Catering Break",
  "Workshop Prep",
  "Photo / Press Op",
  "Teardown",
  "Security Sweep"
];

export const CHECKLIST_CATEGORIES = [
  "AV & Tech",
  "Signage & Wayfinding",
  "VIP Lounge",
  "Catering & F&B",
  "Safety & Security",
  "Check-in Desks",
  "Stage & Lectern",
  "Exhibitor Hall"
];

export const INCIDENT_SEVERITIES = [
  { value: "low", label: "Low Priority", badge: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "medium", label: "Medium", badge: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "high", label: "High Urgency", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "urgent", label: "Critical / Showstopper", badge: "bg-rose-50 text-rose-700 border-rose-200" }
];

export const INCIDENT_STATUSES = [
  { value: "open", label: "Open / Reported", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { value: "in_progress", label: "In Progress / Working", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "resolved", label: "Resolved", color: "bg-emerald-50 text-emerald-700 border-emerald-200" }
];

// ─────────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────────

export default function LogisticsView({
  logisticsData = {},
  isLoading = false,
  onSaveLogisticsItem,
  onDeleteLogisticsItem,
  onSaveFullLogistics,
  speakers = [],
  team = [],
  floorPlans = [],
  eventDetails = {},
  onSwitchView,
  onRefreshData
}) {
  const { t, isRTL } = useLanguage();

  const getCategoryLabel = (cat) => {
    const map = {
      "AV & Audio": "logistics.catAvAudio",
      "Lighting & Stage": "logistics.catLightingStage",
      "Displays & Projectors": "logistics.catDisplaysProjectors",
      "Furniture & Decor": "logistics.catFurnitureDecor",
      "Signage & Rollups": "logistics.catSignageRollups",
      "Collateral & Swag": "logistics.catCollateralSwag",
      "Tech & Cabling": "logistics.catTechCabling",
      "Badges & Lanyards": "logistics.catBadgesLanyards",
      "Power & Electrical": "logistics.catPowerElectrical",
      "Other Equipment": "logistics.catOtherEquipment"
    };
    return map[cat] ? t(map[cat], cat) : cat;
  };

  const getConditionLabel = (cond) => {
    const map = {
      "New / Sealed": "logistics.condNewSealed",
      "Good": "logistics.condGood",
      "Fair": "logistics.condFair",
      "Needs Inspection": "logistics.condNeedsInspection",
      "Damaged / Repair": "logistics.condDamagedRepair"
    };
    return map[cond] ? t(map[cond], cond) : cond;
  };

  const getServiceTypeLabel = (st) => {
    const map = {
      "Catering & F&B": "logistics.serviceCatering",
      "AV & Production": "logistics.serviceAvProduction",
      "Staging & Rigging": "logistics.serviceStagingRigging",
      "Security & Safety": "logistics.serviceSecuritySafety",
      "Cleaning & Sanitation": "logistics.serviceCleaningSanitation",
      "Photography & Video": "logistics.servicePhotoVideo",
      "Live Streaming & Broadcasting": "logistics.serviceLiveStreaming",
      "Hostesses & Staffing": "logistics.serviceHostessesStaffing",
      "Translation & Interpretation": "logistics.serviceTranslation",
      "Courier & Freight Transport": "logistics.serviceCourierTransport",
      "Floral & Plant Decor": "logistics.serviceFloralDecor",
      "Other Services": "logistics.serviceOther"
    };
    return map[st] ? t(map[st], st) : st;
  };

  const getVendorStatusLabel = (val) => {
    const map = {
      "scheduled": "logistics.statusScheduled",
      "confirmed": "logistics.statusConfirmed",
      "on-site": "logistics.statusOnSiteLoading",
      "completed": "logistics.statusCompletedDelivered",
      "delayed": "logistics.statusDelayedIssue"
    };
    return map[val] ? t(map[val], val) : val;
  };

  const getTravelRoleLabel = (role) => {
    const map = {
      "Keynote Speaker": "logistics.roleKeynoteSpeaker",
      "Panelist / Speaker": "logistics.rolePanelist",
      "VIP Delegate": "logistics.roleVipDelegate",
      "Executive / Sponsor Guest": "logistics.roleExecutiveSponsor",
      "Workshop Lead": "logistics.roleWorkshopLead",
      "Moderator / Host": "logistics.roleModeratorHost",
      "Event Staff / Crew": "logistics.roleEventStaff",
      "Judge / Evaluator": "logistics.roleJudgeEvaluator"
    };
    return map[role] ? t(map[role], role) : role;
  };

  const getTravelTypeLabel = (type) => {
    const map = {
      "Flight": "logistics.travelFlight",
      "Train / High-Speed Rail": "logistics.travelTrain",
      "Private Shuttle / Driver": "logistics.travelPrivateShuttle",
      "Rental Car": "logistics.travelRentalCar",
      "Personal Vehicle": "logistics.travelPersonalVehicle",
      "Hotel Walking Distance": "logistics.travelHotelWalking"
    };
    return map[type] ? t(map[type], type) : type;
  };

  const getPickupStatusLabel = (val) => {
    const map = {
      "scheduled": "logistics.pickupScheduled",
      "confirmed": "logistics.pickupConfirmed",
      "in_transit": "logistics.pickupInTransit",
      "completed": "logistics.pickupCompleted",
      "cancelled": "logistics.pickupCancelled"
    };
    return map[val] ? t(map[val], val) : val;
  };

  const getActionTypeLabel = (act) => {
    const map = {
      "Load-in": "logistics.actLoadIn",
      "AV Check": "logistics.actAvCheck",
      "Registration Desk": "logistics.actRegDesk",
      "VIP Escort": "logistics.actVipEscort",
      "Stage Cue": "logistics.actStageCue",
      "Catering Break": "logistics.actCateringBreak",
      "Workshop Prep": "logistics.actWorkshopPrep",
      "Photo / Press Op": "logistics.actPhotoPress",
      "Teardown": "logistics.actTeardown",
      "Security Sweep": "logistics.actSecuritySweep"
    };
    return map[act] ? t(map[act], act) : act;
  };

  const getChecklistCategoryLabel = (cat) => {
    const map = {
      "AV & Tech": "logistics.chkAvTech",
      "Signage & Wayfinding": "logistics.chkSignage",
      "VIP Lounge": "logistics.chkVipLounge",
      "Catering & F&B": "logistics.chkCatering",
      "Safety & Security": "logistics.chkSafetySecurity",
      "Check-in Desks": "logistics.chkCheckinDesks",
      "Stage & Lectern": "logistics.chkStageLectern",
      "Exhibitor Hall": "logistics.chkExhibitorHall"
    };
    return map[cat] ? t(map[cat], cat) : cat;
  };

  const getIncidentSeverityLabel = (val) => {
    const map = {
      "low": "logistics.sevLow",
      "medium": "logistics.sevMedium",
      "high": "logistics.sevHigh",
      "urgent": "logistics.sevUrgent"
    };
    return map[val] ? t(map[val], val) : val;
  };

  const getIncidentStatusLabel = (val) => {
    const map = {
      "open": "logistics.incOpen",
      "in_progress": "logistics.incInProgress",
      "resolved": "logistics.incResolved"
    };
    return map[val] ? t(map[val], val) : val;
  };

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Active sub-tab state
  const [activeTab, setActiveTab] = useState("inventory"); // "inventory" | "vendors" | "travel" | "runOfShow" | "checklists"

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [modalType, setModalType] = useState(null); // 'inventory' | 'vendor' | 'travel' | 'cue' | 'checklist' | 'incident' | null
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [inventoryForm, setInventoryForm] = useState({
    name: "",
    category: "AV & Audio",
    quantity: 1,
    inUse: 0,
    location: "Main Stage",
    condition: "Good",
    supplier: "",
    notes: ""
  });

  const [vendorForm, setVendorForm] = useState({
    name: "",
    serviceType: "Catering & F&B",
    contactName: "",
    phone: "",
    email: "",
    deliveryTime: "08:00 AM",
    loadInLocation: "Loading Dock",
    vehiclePlate: "",
    status: "confirmed",
    contractAmount: "",
    notes: ""
  });

  const [travelForm, setTravelForm] = useState({
    personName: "",
    role: "Keynote Speaker",
    travelType: "Flight",
    flightNumber: "",
    arrivalTime: "",
    departureTime: "",
    hotelName: "",
    roomNumber: "",
    checkInDate: "",
    checkOutDate: "",
    driverName: "",
    driverPhone: "",
    pickupStatus: "scheduled",
    specialRequests: ""
  });

  const [cueForm, setCueForm] = useState({
    time: "09:00 AM",
    title: "",
    stageOrLocation: "Main Auditorium",
    responsiblePerson: "Stage Manager",
    actionType: "Stage Cue",
    status: "pending",
    notes: ""
  });

  const [checklistForm, setChecklistForm] = useState({
    title: "",
    category: "AV & Tech",
    dueDate: "08:00 AM",
    completedBy: "",
    isCompleted: false
  });

  const [incidentForm, setIncidentForm] = useState({
    title: "",
    location: "Main Auditorium",
    severity: "medium",
    status: "open",
    reportedBy: "Operations Staff",
    assignedTo: "",
    description: ""
  });

  // Extract lists safely
  const inventory = useMemo(() => logisticsData.inventory || [], [logisticsData.inventory]);
  const vendors = useMemo(() => logisticsData.vendors || [], [logisticsData.vendors]);
  const travel = useMemo(() => logisticsData.travel || [], [logisticsData.travel]);
  const runOfShow = useMemo(() => logisticsData.runOfShow || [], [logisticsData.runOfShow]);
  const checklists = useMemo(() => logisticsData.checklists || [], [logisticsData.checklists]);
  const incidents = useMemo(() => logisticsData.incidents || [], [logisticsData.incidents]);

  // Available room locations from floor plans or presets
  const availableLocations = useMemo(() => {
    const locSet = new Set(["Main Auditorium", "Hall A Stage", "Hall B Stage", "VIP Green Room", "Exhibition Floor", "Registration Lobby", "Loading Dock", "Workshop Room 101", "Workshop Room 102", "Press Room"]);
    floorPlans.forEach(fp => {
      if (fp.name) locSet.add(fp.name);
      if (Array.isArray(fp.elements)) {
        fp.elements.forEach(el => {
          if (el.label) locSet.add(el.label);
        });
      }
    });
    return Array.from(locSet);
  }, [floorPlans]);

  // Available team/staff members for assignees
  const availableStaff = useMemo(() => {
    const staffSet = new Set(["Operations Lead", "Stage Manager", "AV Technical Director", "VIP Concierge", "Guest Experience Lead", "Security Lead", "Floor Staff"]);
    team.forEach(t => {
      const name = t.name || t.fullName;
      if (name) staffSet.add(name);
    });
    return Array.from(staffSet);
  }, [team]);

  // ─────────────────────────────────────────────
  //  KPI METRICS
  // ─────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalInventoryCount = inventory.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
    const inUseInventoryCount = inventory.reduce((acc, i) => acc + (Number(i.inUse) || 0), 0);
    const activeVendorsCount = vendors.filter(v => v.status !== "delayed").length;
    const vipTravelCount = travel.length;
    const completedCuesCount = runOfShow.filter(r => r.status === "completed").length;
    const completedChecks = checklists.filter(c => c.isCompleted).length;
    const totalChecks = checklists.length;
    const readinessPct = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;
    const openIncidentsCount = incidents.filter(i => i.status !== "resolved").length;

    return {
      totalInventoryCount,
      inUseInventoryCount,
      activeVendorsCount,
      vipTravelCount,
      completedCuesCount,
      totalCues: runOfShow.length,
      readinessPct,
      completedChecks,
      totalChecks,
      openIncidentsCount
    };
  }, [inventory, vendors, travel, runOfShow, checklists, incidents]);

  // Drawer Title and Action Label Generators
  const getDrawerTitle = () => {
    if (editingItem) {
      switch (modalType) {
        case "inventory": return t("logistics.editInventory", "Edit Equipment Item");
        case "vendor": return t("logistics.editVendor", "Edit Vendor & Supplier");
        case "travel": return t("logistics.editTravel", "Edit VIP Travel & Lodging");
        case "cue": return t("logistics.editCue", "Edit Run of Show Cue");
        case "checklist": return t("logistics.editChecklist", "Edit Checklist Task");
        case "incident": return t("logistics.editIncident", "Edit Incident Report");
        default: return t("common.edit", "Edit");
      }
    } else {
      switch (modalType) {
        case "inventory": return t("logistics.addInventory", "Add Equipment Item");
        case "vendor": return t("logistics.addVendor", "Add Vendor & Supplier");
        case "travel": return t("logistics.addTravel", "Add VIP Travel & Lodging");
        case "cue": return t("logistics.addCue", "Add Run of Show Cue");
        case "checklist": return t("logistics.addChecklist", "Add Checklist Task");
        case "incident": return t("logistics.addIncident", "Report Incident");
        default: return t("common.add", "Add");
      }
    }
  };

  const getDrawerButtonLabel = () => {
    if (editingItem) {
      return t("common.saveChanges", "Save Changes");
    }
    switch (modalType) {
      case "inventory": return t("logistics.addEquipmentBtn", "Add Equipment");
      case "vendor": return t("logistics.addSupplierBtn", "Add Supplier");
      case "travel": return t("logistics.saveTravelBtn", "Save Travel Record");
      case "cue": return t("logistics.addCueBtn", "Add Cue");
      case "checklist": return t("logistics.addTaskBtn", "Add Task");
      case "incident": return t("logistics.submitIncidentBtn", "Submit Incident");
      default: return t("logistics.createRecordBtn", "Create Record");
    }
  };

  // ─────────────────────────────────────────────
  //  MODAL OPEN HANDLERS
  // ─────────────────────────────────────────────
  const handleOpenAddModal = () => {
    setEditingItem(null);
    if (activeTab === "inventory") {
      setInventoryForm({
        name: "",
        category: "AV & Audio",
        quantity: 1,
        inUse: 0,
        location: availableLocations[0] || "Main Stage",
        condition: "Good",
        supplier: "",
        notes: ""
      });
      setModalType("inventory");
    } else if (activeTab === "vendors") {
      setVendorForm({
        name: "",
        serviceType: "Catering & F&B",
        contactName: "",
        phone: "",
        email: "",
        deliveryTime: "08:00 AM",
        loadInLocation: "Loading Dock",
        vehiclePlate: "",
        status: "confirmed",
        contractAmount: "",
        notes: ""
      });
      setModalType("vendor");
    } else if (activeTab === "travel") {
      setTravelForm({
        personName: "",
        role: "Keynote Speaker",
        travelType: "Flight",
        flightNumber: "",
        arrivalTime: "",
        departureTime: "",
        hotelName: "Grand Hyatt Regency",
        roomNumber: "",
        checkInDate: "",
        checkOutDate: "",
        driverName: "",
        driverPhone: "",
        pickupStatus: "scheduled",
        specialRequests: ""
      });
      setModalType("travel");
    } else if (activeTab === "runOfShow") {
      setCueForm({
        time: "09:00 AM",
        title: "",
        stageOrLocation: availableLocations[0] || "Main Auditorium",
        responsiblePerson: availableStaff[0] || "Stage Manager",
        actionType: "Stage Cue",
        status: "pending",
        notes: ""
      });
      setModalType("cue");
    } else if (activeTab === "checklists") {
      setChecklistForm({
        title: "",
        category: "AV & Tech",
        dueDate: "08:00 AM",
        completedBy: "",
        isCompleted: false
      });
      setModalType("checklist");
    }
  };

  const handleEditItem = (type, item) => {
    setEditingItem(item);
    if (type === "inventory") {
      setInventoryForm({
        name: item.name || "",
        category: item.category || "AV & Audio",
        quantity: item.quantity || 1,
        inUse: item.inUse || 0,
        location: item.location || "",
        condition: item.condition || "Good",
        supplier: item.supplier || "",
        notes: item.notes || ""
      });
      setModalType("inventory");
    } else if (type === "vendor") {
      setVendorForm({
        name: item.name || "",
        serviceType: item.serviceType || "Catering & F&B",
        contactName: item.contactName || "",
        phone: item.phone || "",
        email: item.email || "",
        deliveryTime: item.deliveryTime || "08:00 AM",
        loadInLocation: item.loadInLocation || "Loading Dock",
        vehiclePlate: item.vehiclePlate || "",
        status: item.status || "confirmed",
        contractAmount: item.contractAmount || "",
        notes: item.notes || ""
      });
      setModalType("vendor");
    } else if (type === "travel") {
      setTravelForm({
        personName: item.personName || "",
        role: item.role || "Keynote Speaker",
        travelType: item.travelType || "Flight",
        flightNumber: item.flightNumber || "",
        arrivalTime: item.arrivalTime || "",
        departureTime: item.departureTime || "",
        hotelName: item.hotelName || "",
        roomNumber: item.roomNumber || "",
        checkInDate: item.checkInDate || "",
        checkOutDate: item.checkOutDate || "",
        driverName: item.driverName || "",
        driverPhone: item.driverPhone || "",
        pickupStatus: item.pickupStatus || "scheduled",
        specialRequests: item.specialRequests || ""
      });
      setModalType("travel");
    } else if (type === "cue") {
      setCueForm({
        time: item.time || "09:00 AM",
        title: item.title || "",
        stageOrLocation: item.stageOrLocation || "Main Auditorium",
        responsiblePerson: item.responsiblePerson || "Stage Manager",
        actionType: item.actionType || "Stage Cue",
        status: item.status || "pending",
        notes: item.notes || ""
      });
      setModalType("cue");
    } else if (type === "incident") {
      setIncidentForm({
        title: item.title || "",
        location: item.location || "Main Auditorium",
        severity: item.severity || "medium",
        status: item.status || "open",
        reportedBy: item.reportedBy || "",
        assignedTo: item.assignedTo || "",
        description: item.description || ""
      });
      setModalType("incident");
    }
  };

  // ─────────────────────────────────────────────
  //  SAVE FORM SUBMISSION
  // ─────────────────────────────────────────────
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!onSaveLogisticsItem) return;

    if (modalType === "inventory") {
      await onSaveLogisticsItem("inventory", {
        ...(editingItem || {}),
        ...inventoryForm,
        quantity: Number(inventoryForm.quantity) || 1,
        inUse: Number(inventoryForm.inUse) || 0
      });
    } else if (modalType === "vendor") {
      await onSaveLogisticsItem("vendors", {
        ...(editingItem || {}),
        ...vendorForm,
        contractAmount: Number(vendorForm.contractAmount) || 0
      });
    } else if (modalType === "travel") {
      await onSaveLogisticsItem("travel", {
        ...(editingItem || {}),
        ...travelForm
      });
    } else if (modalType === "cue") {
      await onSaveLogisticsItem("runOfShow", {
        ...(editingItem || {}),
        ...cueForm
      });
    } else if (modalType === "checklist") {
      await onSaveLogisticsItem("checklists", {
        ...(editingItem || {}),
        ...checklistForm
      });
    } else if (modalType === "incident") {
      await onSaveLogisticsItem("incidents", {
        ...(editingItem || {}),
        ...incidentForm
      });
    }

    setModalType(null);
    setEditingItem(null);
  };

  // Toggle checklist completed
  const handleToggleChecklist = async (item) => {
    if (!onSaveLogisticsItem) return;
    await onSaveLogisticsItem("checklists", {
      ...item,
      isCompleted: !item.isCompleted,
      completedBy: !item.isCompleted ? (eventDetails?.organizerName || "Staff") : ""
    });
  };

  // Toggle incident status
  const handleUpdateIncidentStatus = async (item, newStatus) => {
    if (!onSaveLogisticsItem) return;
    await onSaveLogisticsItem("incidents", {
      ...item,
      status: newStatus,
      resolvedAt: newStatus === "resolved" ? new Date().toISOString() : null
    });
  };

  // Adjust inventory quantities on the fly
  const handleAdjustInventoryStock = async (item, deltaInUse) => {
    if (!onSaveLogisticsItem) return;
    const currentInUse = Number(item.inUse) || 0;
    const totalQty = Number(item.quantity) || 0;
    const nextInUse = Math.max(0, Math.min(totalQty, currentInUse + deltaInUse));
    await onSaveLogisticsItem("inventory", {
      ...item,
      inUse: nextInUse
    });
  };

  // ─────────────────────────────────────────────
  //  EXPORT CSV MANIFEST
  // ─────────────────────────────────────────────
  const handleExportCSV = () => {
    let rows = [];
    let filename = `Eventzone_Logistics_${activeTab}_${new Date().toISOString().split("T")[0]}.csv`;

    if (activeTab === "inventory") {
      rows.push(["Item Name", "Category", "Quantity Total", "In Use", "Available", "Location", "Condition", "Supplier", "Notes"]);
      inventory.forEach(i => {
        rows.push([
          `"${i.name || ''}"`,
          `"${i.category || ''}"`,
          i.quantity || 0,
          i.inUse || 0,
          (i.quantity || 0) - (i.inUse || 0),
          `"${i.location || ''}"`,
          `"${i.condition || ''}"`,
          `"${i.supplier || ''}"`,
          `"${(i.notes || '').replace(/"/g, '""')}"`
        ]);
      });
    } else if (activeTab === "vendors") {
      rows.push(["Vendor Name", "Service Category", "Contact Person", "Phone", "Email", "Delivery Time", "Load-in Dock", "Vehicle Plate", "Status", "Contract Budget", "Notes"]);
      vendors.forEach(v => {
        rows.push([
          `"${v.name || ''}"`,
          `"${v.serviceType || ''}"`,
          `"${v.contactName || ''}"`,
          `"${v.phone || ''}"`,
          `"${v.email || ''}"`,
          `"${v.deliveryTime || ''}"`,
          `"${v.loadInLocation || ''}"`,
          `"${v.vehiclePlate || ''}"`,
          `"${v.status || ''}"`,
          v.contractAmount || 0,
          `"${(v.notes || '').replace(/"/g, '""')}"`
        ]);
      });
    } else if (activeTab === "travel") {
      rows.push(["VIP / Speaker Name", "Role", "Travel Mode", "Flight/Train #", "Arrival Time", "Departure Time", "Hotel", "Room #", "Check-in", "Check-out", "Driver Name", "Driver Phone", "Pickup Status", "Special Requests"]);
      travel.forEach(t => {
        rows.push([
          `"${t.personName || ''}"`,
          `"${t.role || ''}"`,
          `"${t.travelType || ''}"`,
          `"${t.flightNumber || ''}"`,
          `"${t.arrivalTime || ''}"`,
          `"${t.departureTime || ''}"`,
          `"${t.hotelName || ''}"`,
          `"${t.roomNumber || ''}"`,
          `"${t.checkInDate || ''}"`,
          `"${t.checkOutDate || ''}"`,
          `"${t.driverName || ''}"`,
          `"${t.driverPhone || ''}"`,
          `"${t.pickupStatus || ''}"`,
          `"${(t.specialRequests || '').replace(/"/g, '""')}"`
        ]);
      });
    } else {
      rows.push(["Time", "Cue Action / Title", "Stage / Location", "Responsible Lead", "Action Type", "Status", "Notes"]);
      runOfShow.forEach(r => {
        rows.push([
          `"${r.time || ''}"`,
          `"${r.title || ''}"`,
          `"${r.stageOrLocation || ''}"`,
          `"${r.responsiblePerson || ''}"`,
          `"${r.actionType || ''}"`,
          `"${r.status || ''}"`,
          `"${(r.notes || '').replace(/"/g, '""')}"`
        ]);
      });
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Run of Show
  const handlePrintRunOfShow = () => {
    window.print();
  };

  // ─────────────────────────────────────────────
  //  FILTERED LISTS
  // ─────────────────────────────────────────────
  const filteredInventory = useMemo(() => {
    return inventory.filter(i => {
      const matchQuery = !searchQuery || i.name?.toLowerCase().includes(searchQuery.toLowerCase()) || i.location?.toLowerCase().includes(searchQuery.toLowerCase()) || i.supplier?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === "all" || i.category === categoryFilter;
      const matchStatus = statusFilter === "all" || i.condition === statusFilter;
      return matchQuery && matchCat && matchStatus;
    });
  }, [inventory, searchQuery, categoryFilter, statusFilter]);

  const filteredVendors = useMemo(() => {
    return vendors.filter(v => {
      const matchQuery = !searchQuery || v.name?.toLowerCase().includes(searchQuery.toLowerCase()) || v.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) || v.serviceType?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === "all" || v.serviceType === categoryFilter;
      const matchStatus = statusFilter === "all" || v.status === statusFilter;
      return matchQuery && matchCat && matchStatus;
    });
  }, [vendors, searchQuery, categoryFilter, statusFilter]);

  const filteredTravel = useMemo(() => {
    return travel.filter(t => {
      const matchQuery = !searchQuery || t.personName?.toLowerCase().includes(searchQuery.toLowerCase()) || t.hotelName?.toLowerCase().includes(searchQuery.toLowerCase()) || t.driverName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === "all" || t.role === categoryFilter || t.travelType === categoryFilter;
      const matchStatus = statusFilter === "all" || t.pickupStatus === statusFilter;
      return matchQuery && matchCat && matchStatus;
    });
  }, [travel, searchQuery, categoryFilter, statusFilter]);

  const filteredRunOfShow = useMemo(() => {
    return runOfShow.filter(r => {
      const matchQuery = !searchQuery || r.title?.toLowerCase().includes(searchQuery.toLowerCase()) || r.stageOrLocation?.toLowerCase().includes(searchQuery.toLowerCase()) || r.responsiblePerson?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = categoryFilter === "all" || r.actionType === categoryFilter;
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      return matchQuery && matchCat && matchStatus;
    });
  }, [runOfShow, searchQuery, categoryFilter, statusFilter]);

  if (isLoading) {
    return <LogisticsSkeleton />;
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="space-y-6 animate-fade-in text-slate-800 pb-16">
      
      {/* ─────────────────────────────────────────────
          1. HEADER & GLOBAL ACTIONS
      ───────────────────────────────────────────── */}
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 select-none">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {t("logistics.title", "Logistics & Backstage Operations")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {t("logistics.subtitle", "Command center for physical equipment, vendor deliveries, VIP travel hospitality, backstage run-of-show, and venue readiness.")}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleExportCSV}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            title={t("logistics.exportManifest", "Export Manifest (CSV)")}
          >
            <Download size={14} />
            <span>{t("logistics.exportManifest", "Export Manifest (CSV)")}</span>
          </button>

          {activeTab === "runOfShow" && (
            <button
              onClick={handlePrintRunOfShow}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Printer size={14} />
              <span>{t("logistics.printRunOfShow", "Print Run of Show")}</span>
            </button>
          )}

          {activeTab === "checklists" && (
            <button
              onClick={() => {
                setEditingItem(null);
                setIncidentForm({
                  title: "",
                  location: availableLocations[0] || "Main Auditorium",
                  severity: "medium",
                  status: "open",
                  reportedBy: "Operations Staff",
                  assignedTo: availableStaff[0] || "",
                  description: ""
                });
                setModalType("incident");
              }}
              className="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <AlertCircle size={14} />
              <span>{t("logistics.addIncident", "Report Incident")}</span>
            </button>
          )}

          <button
            onClick={handleOpenAddModal}
            className="bg-indigo-650 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus size={16} />
            <span>
              {activeTab === "inventory" && t("logistics.addItem", "Add Equipment")}
              {activeTab === "vendors" && t("logistics.addVendor", "Add Supplier")}
              {activeTab === "travel" && t("logistics.addTravel", "Add VIP Travel")}
              {activeTab === "runOfShow" && t("logistics.addCue", "Add Run of Show Cue")}
              {activeTab === "checklists" && t("logistics.addChecklist", "Add Checklist Task")}
            </span>
          </button>
        </div>
      </header>

      {/* ─────────────────────────────────────────────
          2. EXECUTIVE KPI CARDS
      ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Card 1: Equipment */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("logistics.totalEquipment", "Total Equipment")}</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900"><bdi dir="ltr">{stats.totalInventoryCount}</bdi></div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-slate-500">
              <span className="text-blue-600 font-bold"><bdi dir="ltr">{stats.inUseInventoryCount}</bdi></span> {t("logistics.inUseAcrossStages", "in-use across stages")}
            </div>
          </div>
        </div>

        {/* Card 2: Vendors */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("logistics.activeVendors", "Suppliers & Load-In")}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Truck size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900"><bdi dir="ltr">{vendors.length}</bdi></div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-emerald-600">
              <CheckCircle2 size={12} /> <bdi dir="ltr">{stats.activeVendorsCount}</bdi> {t("logistics.confirmedDeliveries", "confirmed deliveries")}
            </div>
          </div>
        </div>

        {/* Card 3: VIP Hospitality */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("logistics.vipTravelers", "VIP & Speaker Travel")}</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Plane size={16} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900"><bdi dir="ltr">{stats.vipTravelCount}</bdi></div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-indigo-600">
              {t("logistics.hotelAirportTransfersActive", "Hotel & Airport Transfers Active")}
            </div>
          </div>
        </div>

        {/* Card 4: Readiness / Issues */}
        <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">{t("logistics.venueReadiness", "Venue Readiness")}</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stats.openIncidentsCount > 0 ? "bg-rose-50 text-rose-600" : "bg-teal-50 text-teal-600"}`}>
              {stats.openIncidentsCount > 0 ? <AlertTriangle size={16} /> : <ShieldCheck size={16} />}
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-slate-900"><bdi dir="ltr">{stats.readinessPct}%</bdi></span>
              {stats.openIncidentsCount > 0 ? (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  <bdi dir="ltr">{stats.openIncidentsCount}</bdi> {t("logistics.openIssues", "Open Issues")}
                </span>
              ) : (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">
                  {t("logistics.allSystemsClear", "All Systems Clear")}
                </span>
              )}
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-150 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${stats.readinessPct === 100 ? "bg-teal-500" : "bg-blue-600"}`}
                style={{ width: `${stats.readinessPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────
          3. SUB-MODULE TABS NAVIGATION
      ───────────────────────────────────────────── */}
      <div className="flex items-center border-b border-slate-200 gap-1 overflow-x-auto">
        <button
          onClick={() => { setActiveTab("inventory"); setCategoryFilter("all"); setStatusFilter("all"); }}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "inventory"
              ? "text-blue-600 font-black bg-blue-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Package size={15} />
          <span>{t("logistics.tabInventory", "Inventory & Equipment")}</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeTab === "inventory" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            <bdi dir="ltr">{inventory.length}</bdi>
          </span>
          {activeTab === "inventory" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => { setActiveTab("vendors"); setCategoryFilter("all"); setStatusFilter("all"); }}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "vendors"
              ? "text-blue-600 font-black bg-blue-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Truck size={15} />
          <span>{t("logistics.tabVendors", "Vendors & Deliveries")}</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeTab === "vendors" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            <bdi dir="ltr">{vendors.length}</bdi>
          </span>
          {activeTab === "vendors" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => { setActiveTab("travel"); setCategoryFilter("all"); setStatusFilter("all"); }}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "travel"
              ? "text-blue-600 font-black bg-blue-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Plane size={15} />
          <span>{t("logistics.tabTravel", "VIP Travel & Lodging")}</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeTab === "travel" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            <bdi dir="ltr">{travel.length}</bdi>
          </span>
          {activeTab === "travel" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => { setActiveTab("runOfShow"); setCategoryFilter("all"); setStatusFilter("all"); }}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "runOfShow"
              ? "text-blue-600 font-black bg-blue-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Clock size={15} />
          <span>{t("logistics.tabRunOfShow", "Run of Show & Schedule")}</span>
          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${activeTab === "runOfShow" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
            <bdi dir="ltr">{runOfShow.length}</bdi>
          </span>
          {activeTab === "runOfShow" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
          )}
        </button>

        <button
          onClick={() => { setActiveTab("checklists"); setCategoryFilter("all"); setStatusFilter("all"); }}
          className={`relative flex items-center gap-2 px-4 py-3 font-bold text-xs transition-all cursor-pointer !rounded-none ${
            activeTab === "checklists"
              ? "text-blue-600 font-black bg-blue-50/50"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <ClipboardCheck size={15} />
          <span>{t("logistics.tabChecklists", "Checklists & Issues")}</span>
          {stats.openIncidentsCount > 0 && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
              <bdi dir="ltr">{stats.openIncidentsCount}</bdi>
            </span>
          )}
          {activeTab === "checklists" && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600" />
          )}
        </button>
      </div>

      {/* ─────────────────────────────────────────────
          4. SEARCH & FILTER TOOLBAR
      ───────────────────────────────────────────── */}
      {activeTab !== "checklists" && (
        <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-150 shadow-xs">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("logistics.searchPlaceholder", "Search items, suppliers, drivers, cues, or locations...")}
              className="w-full ps-9 pe-8 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick Category / Status filters */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {activeTab === "inventory" && (
              <div className="w-48">
                <SearchableSelect
                  value={categoryFilter}
                  onChange={(val) => setCategoryFilter(val || "all")}
                  options={[
                    { value: "all", label: t("logistics.allCategories", "All Categories") },
                    ...INVENTORY_CATEGORIES.map(c => ({ value: c, label: getCategoryLabel(c) }))
                  ]}
                  placeholder={t("logistics.allCategories", "All Categories")}
                  buttonClassName="py-1.5 text-xs bg-slate-50 border-slate-200"
                />
              </div>
            )}

            {activeTab === "vendors" && (
              <div className="w-48">
                <SearchableSelect
                  value={categoryFilter}
                  onChange={(val) => setCategoryFilter(val || "all")}
                  options={[
                    { value: "all", label: t("logistics.allServices", "All Services") },
                    ...VENDOR_SERVICE_TYPES.map(v => ({ value: v, label: getServiceTypeLabel(v) }))
                  ]}
                  placeholder={t("logistics.allServices", "All Services")}
                  buttonClassName="py-1.5 text-xs bg-slate-50 border-slate-200"
                />
              </div>
            )}

            {activeTab === "travel" && (
              <div className="w-48">
                <SearchableSelect
                  value={categoryFilter}
                  onChange={(val) => setCategoryFilter(val || "all")}
                  options={[
                    { value: "all", label: t("logistics.allRoles", "All Roles") },
                    ...TRAVEL_ROLES.map(r => ({ value: r, label: getTravelRoleLabel(r) }))
                  ]}
                  placeholder={t("logistics.allRoles", "All Roles")}
                  buttonClassName="py-1.5 text-xs bg-slate-50 border-slate-200"
                />
              </div>
            )}

            {activeTab === "runOfShow" && (
              <div className="w-48">
                <SearchableSelect
                  value={categoryFilter}
                  onChange={(val) => setCategoryFilter(val || "all")}
                  options={[
                    { value: "all", label: t("logistics.allActionTypes", "All Action Types") },
                    ...ACTION_TYPES.map(a => ({ value: a, label: getActionTypeLabel(a) }))
                  ]}
                  placeholder={t("logistics.allActionTypes", "All Action Types")}
                  buttonClassName="py-1.5 text-xs bg-slate-50 border-slate-200"
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          5. TAB 1: INVENTORY & ASSETS
      ───────────────────────────────────────────── */}
      {activeTab === "inventory" && (
        <div className="space-y-4">
          {filteredInventory.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-150 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Package size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800">{t("logistics.noEquipmentFound", "No equipment items found")}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {t("logistics.noEquipmentDesc", "Track sound systems, laser projectors, microphones, roll-ups, and merchandise in real-time.")}
              </p>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> {t("logistics.addFirstItem", "Add First Item")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInventory.map((item) => {
                const total = Number(item.quantity) || 1;
                const inUse = Number(item.inUse) || 0;
                const available = Math.max(0, total - inUse);
                const percentUsed = Math.round((inUse / total) * 100);

                return (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {getCategoryLabel(item.category) || t("logistics.typeEquipment", "Equipment")}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.condition === "Good" || item.condition === "New / Sealed"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : item.condition === "Needs Inspection"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}>
                          {getConditionLabel(item.condition) || t("logistics.condGood", "Good")}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-700">{item.location || t("logistics.unassigned", "Unassigned")}</span>
                          {item.supplier && (
                            <>
                              <span className="text-slate-300">•</span>
                              <span className="truncate">{item.supplier}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {item.notes && (
                        <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl line-clamp-2 border border-slate-100">
                          {item.notes}
                        </p>
                      )}
                    </div>

                    {/* Stock Meter & Adjust Buttons */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-500">{t("logistics.allocation", "Allocation:")}</span>
                        <span className="text-slate-800">
                          <span className="text-blue-600 font-extrabold"><bdi dir="ltr">{inUse}</bdi> {t("logistics.inUse", "in-use")}</span> / <bdi dir="ltr">{total}</bdi> {t("logistics.total", "total")}
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${percentUsed > 80 ? "bg-amber-500" : "bg-blue-600"}`}
                          style={{ width: `${percentUsed}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAdjustInventoryStock(item, -1)}
                            disabled={inUse <= 0}
                            title={t("logistics.returnItemTooltip", "Return 1 item")}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center disabled:opacity-30 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="text-[11px] font-bold text-slate-600 px-1"><bdi dir="ltr">{available}</bdi> {t("logistics.left", "left")}</span>
                          <button
                            onClick={() => handleAdjustInventoryStock(item, 1)}
                            disabled={inUse >= total}
                            title={t("logistics.deployItemTooltip", "Deploy 1 item")}
                            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs flex items-center justify-center disabled:opacity-30 cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditItem("inventory", item)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                            title={t("common.edit", "Edit")}
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => onDeleteLogisticsItem && onDeleteLogisticsItem("inventory", item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title={t("common.delete", "Delete")}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────
          6. TAB 2: VENDORS & DELIVERIES
      ───────────────────────────────────────────── */}
      {activeTab === "vendors" && (
        <div className="space-y-4">
          {filteredVendors.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-150 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Truck size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800">{t("logistics.noVendorsFound", "No vendor delivery records")}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {t("logistics.noVendorsDesc", "Keep track of caterers, AV production rigs, staging contractors, and cleaning teams with strict load-in windows.")}
              </p>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> {t("logistics.addSupplier", "Add Supplier")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredVendors.map((vendor) => {
                const statusObj = VENDOR_STATUSES.find(s => s.value === vendor.status) || VENDOR_STATUSES[0];

                return (
                  <div
                    key={vendor.id}
                    className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {getServiceTypeLabel(vendor.serviceType) || t("logistics.typeSupplier", "Supplier")}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 mt-2">
                            {vendor.name}
                          </h4>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${statusObj.color}`}>
                          {getVendorStatusLabel(statusObj.value)}
                        </span>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("logistics.loadInSlot", "Load-in Slot")}</span>
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            <Clock size={13} className="text-blue-600 shrink-0" />
                            <span><bdi dir="ltr">{vendor.deliveryTime || "08:00 AM"}</bdi></span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t("logistics.dockVehicle", "Dock & Vehicle")}</span>
                          <div className="flex items-center gap-1.5 font-bold text-slate-800 truncate">
                            <MapPin size={13} className="text-emerald-600 shrink-0" />
                            <span className="truncate">{vendor.loadInLocation || "Dock A"} (<bdi dir="ltr">{vendor.vehiclePlate || "Plate N/A"}</bdi>)</span>
                          </div>
                        </div>

                        {vendor.contactName && (
                          <div className="col-span-2 pt-1 border-t border-slate-200/60 flex items-center justify-between text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <User size={12} className="text-slate-400" />
                              <span className="font-semibold">{vendor.contactName}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {vendor.phone && (
                                <a href={`tel:${vendor.phone}`} className="text-blue-600 hover:underline flex items-center gap-1 font-bold">
                                  <Phone size={11} className="shrink-0" /> <bdi dir="ltr">{vendor.phone}</bdi>
                                </a>
                              )}
                              {vendor.email && (
                                <a href={`mailto:${vendor.email}`} className="text-slate-500 hover:text-blue-600">
                                  <Mail size={12} />
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {vendor.notes && (
                        <p className="text-[11px] text-slate-500 italic">
                          {vendor.notes}
                        </p>
                      )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="text-xs font-semibold text-slate-500">
                        {vendor.contractAmount ? (
                          <span className="font-black text-slate-900"><bdi dir="ltr">${Number(vendor.contractAmount).toLocaleString()}</bdi> {t("logistics.budget", "budget")}</span>
                        ) : (
                          <span>{t("logistics.contractOnFile", "Contract on file")}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditItem("vendor", vendor)}
                          className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        >
                          {t("common.edit", "Edit")}
                        </button>
                        <button
                          onClick={() => onDeleteLogisticsItem && onDeleteLogisticsItem("vendors", vendor.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────
          7. TAB 3: VIP TRAVEL & LODGING
      ───────────────────────────────────────────── */}
      {activeTab === "travel" && (
        <div className="space-y-4">
          {filteredTravel.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-150 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                <Plane size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800">{t("logistics.noVipTravelFound", "No VIP travel records")}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {t("logistics.noVipTravelDesc", "Manage keynote speaker flights, airport pickup drivers, luxury hotel room allocations, and rider requirements.")}
              </p>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> {t("logistics.addVipTravel", "Add VIP Travel")}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTravel.map((item) => {
                const statusObj = PICKUP_STATUSES.find(s => s.value === item.pickupStatus) || PICKUP_STATUSES[0];

                return (
                  <div
                    key={item.id}
                    className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {getTravelRoleLabel(item.role) || t("logistics.roleVipDelegate", "VIP Guest")}
                          </span>
                          <h4 className="text-base font-bold text-slate-900 mt-2">
                            {item.personName}
                          </h4>
                        </div>
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${statusObj.color}`}>
                          {getPickupStatusLabel(statusObj.value)}
                        </span>
                      </div>

                      {/* Travel & Flight details */}
                      <div className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold text-[10px] uppercase">{getTravelTypeLabel(item.travelType) || t("logistics.travelFlight", "Flight")}</span>
                          <span className="font-bold text-slate-800"><bdi dir="ltr">{item.flightNumber || t("logistics.flightPending", "Flight Pending")}</bdi></span>
                        </div>

                        {item.arrivalTime && (
                          <div className="flex items-center justify-between text-slate-600">
                            <span>{t("logistics.arrival", "Arrival:")}</span>
                            <span className="font-semibold text-slate-800"><bdi dir="ltr">{item.arrivalTime}</bdi></span>
                          </div>
                        )}

                        {item.hotelName && (
                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-slate-600">
                            <span className="font-medium truncate">{item.hotelName}</span>
                            <span className="font-bold text-slate-900">{item.roomNumber || t("logistics.reserved", "Reserved")}</span>
                          </div>
                        )}

                        {item.driverName && (
                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <User size={12} className="text-indigo-600" />
                              <span className="font-semibold">{t("logistics.driver", "Driver:")} {item.driverName}</span>
                            </div>
                            {item.driverPhone && (
                              <a href={`tel:${item.driverPhone}`} className="text-blue-600 hover:underline font-bold text-[11px]">
                                <bdi dir="ltr">{item.driverPhone}</bdi>
                              </a>
                            )}
                          </div>
                        )}
                      </div>

                      {item.specialRequests && (
                        <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100 text-[11px] text-amber-900 space-y-0.5">
                          <span className="font-bold text-[10px] uppercase text-amber-700 tracking-wider">{t("logistics.riderNotes", "Rider / Notes:")}</span>
                          <p>{item.specialRequests}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleEditItem("travel", item)}
                        className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        {t("common.edit", "Edit")}
                      </button>
                      <button
                        onClick={() => onDeleteLogisticsItem && onDeleteLogisticsItem("travel", item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────
          8. TAB 4: RUN OF SHOW (BACKSTAGE TIMELINE)
      ───────────────────────────────────────────── */}
      {activeTab === "runOfShow" && (
        <div className="space-y-4">
          {filteredRunOfShow.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-150 shadow-xs space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <Clock size={24} />
              </div>
              <h3 className="text-base font-bold text-slate-800">{t("logistics.noCuesFound", "No operational cues yet")}</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {t("logistics.noCuesDesc", "Create minute-by-minute technical cues for stage managers, mic technicians, VIP escorts, and catering dispatches.")}
              </p>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus size={14} /> {t("logistics.addFirstCue", "Add First Cue")}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-150 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-blue-600" />
                  <span className="text-xs font-bold text-slate-800">{t("logistics.masterCueSheet", "Master Operational Cue Sheet")}</span>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  <bdi dir="ltr">{stats.completedCuesCount}</bdi> {t("common.of", "of")} <bdi dir="ltr">{stats.totalCues}</bdi> {t("logistics.cuesCompleted", "Cues Completed")}
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {filteredRunOfShow.map((cue, index) => {
                  const isCompleted = cue.status === "completed";
                  const isInProgress = cue.status === "in_progress";

                  return (
                    <div
                      key={cue.id}
                      className={`p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isCompleted ? "bg-slate-50/40 opacity-70" : isInProgress ? "bg-blue-50/30" : "hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        {/* Time Stamp Badge */}
                        <div className="flex flex-col items-center justify-center w-20 py-2 rounded-2xl bg-slate-100 border border-slate-200 shrink-0">
                          <span className="text-xs font-black text-slate-900 tracking-tight"><bdi dir="ltr">{cue.time || "00:00"}</bdi></span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{t("logistics.cueNumber", "Cue #")}<bdi dir="ltr">{index + 1}</bdi></span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                              {getActionTypeLabel(cue.actionType) || t("logistics.cueAction", "Action")}
                            </span>
                            <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                              <MapPin size={11} className="text-slate-400" /> {cue.stageOrLocation}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1">
                              <User size={11} className="text-slate-400" /> {cue.responsiblePerson}
                            </span>
                          </div>

                          <h4 className={`text-sm font-bold ${isCompleted ? "line-through text-slate-500" : "text-slate-900"}`}>
                            {cue.title}
                          </h4>

                          {cue.notes && (
                            <p className="text-xs text-slate-500 italic">{cue.notes}</p>
                          )}
                        </div>
                      </div>

                      {/* Status Selector & Controls */}
                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          onClick={() => {
                            const nextStatus = isCompleted ? "pending" : isInProgress ? "completed" : "in_progress";
                            onSaveLogisticsItem && onSaveLogisticsItem("runOfShow", { ...cue, status: nextStatus });
                          }}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                            isCompleted
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : isInProgress
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-200 animate-pulse"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {isCompleted && <CheckCircle2 size={13} />}
                          {isInProgress && <Clock size={13} />}
                          <span>{isCompleted ? t("logistics.completed", "Completed") : isInProgress ? t("logistics.liveActive", "Live / Active") : t("logistics.markActive", "Mark Active")}</span>
                        </button>

                        <button
                          onClick={() => handleEditItem("cue", cue)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => onDeleteLogisticsItem && onDeleteLogisticsItem("runOfShow", cue.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────
          9. TAB 5: CHECKLISTS & INCIDENTS
      ───────────────────────────────────────────── */}
      {activeTab === "checklists" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Venue Readiness Checklist (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <ClipboardCheck size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{t("logistics.venueReadinessChecklists", "Venue Readiness Checklists")}</h3>
                    <p className="text-[11px] text-slate-500">{t("logistics.venueReadinessSubtitle", "Interactive operational checks before doors open")}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditingItem(null);
                    setChecklistForm({
                      title: "",
                      category: "AV & Tech",
                      dueDate: "08:00 AM",
                      completedBy: "",
                      isCompleted: false
                    });
                    setModalType("checklist");
                  }}
                  className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> {t("logistics.addTask", "Add Task")}
                </button>
              </div>

              {/* Progress Summary */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">{t("logistics.completionStatus", "Completion Status")}</span>
                <span className="font-extrabold text-blue-600"><bdi dir="ltr">{stats.completedChecks} / {stats.totalChecks}</bdi> {t("logistics.done", "Done")} (<bdi dir="ltr">{stats.readinessPct}%</bdi>)</span>
              </div>

              {/* Tasks List */}
              <div className="space-y-2">
                {checklists.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleToggleChecklist(task)}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                      task.isCompleted ? "bg-emerald-50/30 border-emerald-100 text-slate-500" : "bg-white border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                        task.isCompleted ? "bg-emerald-600 border-emerald-600 text-white" : "border-slate-300 group-hover:border-blue-500 bg-white"
                      }`}>
                        {task.isCompleted && <Check size={12} className="stroke-[3]" />}
                      </div>

                      <div className="space-y-0.5">
                        <span className={`text-xs font-bold block ${task.isCompleted ? "line-through text-slate-400" : "text-slate-800"}`}>
                          {task.title}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">{getChecklistCategoryLabel(task.category)}</span>
                          {task.dueDate && <span>{t("logistics.due", "Due:")} <bdi dir="ltr">{task.dueDate}</bdi></span>}
                          {task.completedBy && <span className="text-emerald-700">{t("logistics.doneBy", "Done by:")} {task.completedBy}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteLogisticsItem && onDeleteLogisticsItem("checklists", task.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Real-Time Incident / Issue Tracker (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{t("logistics.onSiteIncidentDispatch", "On-Site Incident Dispatch")}</h3>
                    <p className="text-[11px] text-slate-500">{t("logistics.incidentDispatchSubtitle", "Live operational issues & equipment fixes")}</p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setEditingItem(null);
                    setIncidentForm({
                      title: "",
                      location: availableLocations[0] || "Main Auditorium",
                      severity: "medium",
                      status: "open",
                      reportedBy: "Operations Staff",
                      assignedTo: availableStaff[0] || "",
                      description: ""
                    });
                    setModalType("incident");
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} /> {t("logistics.report", "Report")}
                </button>
              </div>

              {/* Incidents List */}
              <div className="space-y-3">
                {incidents.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-500 space-y-1">
                    <CheckCircle2 size={24} className="text-teal-500 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">{t("logistics.noIncidentsFound", "Zero active incidents")}</p>
                    <p className="text-[11px] text-slate-400">{t("logistics.noIncidentsDesc", "All equipment and venue spaces are operating normally.")}</p>
                  </div>
                ) : (
                  incidents.map((inc) => {
                    const isResolved = inc.status === "resolved";
                    const sevObj = INCIDENT_SEVERITIES.find(s => s.value === inc.severity) || INCIDENT_SEVERITIES[1];

                    return (
                      <div
                        key={inc.id}
                        className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                          isResolved ? "bg-slate-50 border-slate-150 opacity-70" : "bg-white border-slate-200 shadow-xs"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${sevObj.badge}`}>
                            {getIncidentSeverityLabel(sevObj.value)}
                          </span>
                          
                          {/* Status toggle buttons */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateIncidentStatus(inc, isResolved ? "open" : "resolved")}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                                isResolved ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              }`}
                            >
                              {isResolved ? t("logistics.reopen", "Reopen") : t("logistics.markFixed", "Mark Fixed")}
                            </button>

                            <button
                              onClick={() => onDeleteLogisticsItem && onDeleteLogisticsItem("incidents", inc.id)}
                              className="p-1 text-slate-400 hover:text-rose-600"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <h4 className={`text-xs font-bold ${isResolved ? "line-through text-slate-500" : "text-slate-900"}`}>
                            {inc.title}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                            <MapPin size={11} className="text-slate-400 shrink-0" />
                            <span>{inc.location}</span>
                            {inc.assignedTo && (
                              <>
                                <span className="text-slate-300">•</span>
                                <span className="font-semibold text-blue-600">{t("logistics.assigned", "Assigned:")} {inc.assignedTo}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {inc.description && (
                          <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl border border-slate-100">
                            {inc.description}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          10. SLIDE-OVER DRAWER (MOUNTED TO DOCUMENT.BODY VIA PORTAL)
      ───────────────────────────────────────────── */}
      {modalType && mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-end z-[100] animate-fade-in font-sans">
          {/* Backdrop Click */}
          <div 
            className="absolute inset-0 cursor-pointer" 
            onClick={() => { setModalType(null); setEditingItem(null); }} 
          />
          
          {/* Slide-over Panel on the Right */}
          <div dir={isRTL ? "rtl" : "ltr"} className="relative bg-white w-full max-w-xl md:max-w-2xl h-full shadow-2xl z-10 flex flex-col justify-between animate-slide-in-right overflow-hidden border-inline-start border-slate-200">
            
            {/* Drawer Sticky Header */}
            <header className="p-6 border-b border-slate-150 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10 select-none">
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  {getDrawerTitle()}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {modalType === "inventory" && t("logistics.drawerSubtitleInventory", "Audio/Visual, Furniture, Decor, Signage & Swag Inventory")}
                  {modalType === "vendor" && t("logistics.drawerSubtitleVendor", "External Supplier Contract, Delivery Window & Dock Access")}
                  {modalType === "travel" && t("logistics.drawerSubtitleTravel", "Speaker Flights, Hotel Reservations & Driver Pickup")}
                  {modalType === "cue" && t("logistics.drawerSubtitleCue", "Minute-by-minute Backstage Operational Timeline Cue")}
                  {modalType === "checklist" && t("logistics.drawerSubtitleChecklist", "Venue Readiness Verification Task")}
                  {modalType === "incident" && t("logistics.drawerSubtitleIncident", "On-Site Incident Ticket & Technical Dispatch")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => { setModalType(null); setEditingItem(null); }}
                className="w-9 h-9 rounded-full border border-slate-200 bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </header>

            {/* Segmented Mode Selector Tabs (only when creating a new record) */}
            {!editingItem && (
              <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 select-none overflow-x-auto">
                <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl min-w-max">
                  <button
                    type="button"
                    onClick={() => setModalType("inventory")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      modalType === "inventory" ? "bg-white text-blue-700 shadow-xs font-extrabold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Package size={13} />
                    <span>{t("logistics.typeEquipment", "Equipment")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalType("vendor")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      modalType === "vendor" ? "bg-white text-blue-700 shadow-xs font-extrabold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Truck size={13} />
                    <span>{t("logistics.typeSupplier", "Supplier")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalType("travel")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      modalType === "travel" ? "bg-white text-blue-700 shadow-xs font-extrabold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Plane size={13} />
                    <span>{t("logistics.typeVipTravel", "VIP Travel")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalType("cue")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      modalType === "cue" ? "bg-white text-blue-700 shadow-xs font-extrabold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Clock size={13} />
                    <span>{t("logistics.typeRunOfShow", "Run of Show")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalType("checklist")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      modalType === "checklist" ? "bg-white text-blue-700 shadow-xs font-extrabold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <ClipboardCheck size={13} />
                    <span>{t("logistics.typeChecklist", "Checklist")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalType("incident")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      modalType === "incident" ? "bg-white text-rose-700 shadow-xs font-extrabold" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <AlertTriangle size={13} />
                    <span>{t("logistics.typeIncident", "Incident")}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Scrollable Form Body */}
            <form id="logistics-drawer-form" onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-5 text-xs">
              
              {/* --- 1. INVENTORY FORM --- */}
              {modalType === "inventory" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">{t("logistics.itemNameLabel", "Equipment / Item Name *")}</label>
                    <input
                      type="text"
                      required
                      value={inventoryForm.name}
                      onChange={(e) => setInventoryForm({ ...inventoryForm, name: e.target.value })}
                      placeholder={t("logistics.itemNamePlaceholder", "e.g. Shure Wireless Lapel Mic Set")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.categoryLabel", "Category")}</label>
                      <SearchableSelect
                        value={inventoryForm.category}
                        onChange={(val) => setInventoryForm({ ...inventoryForm, category: val })}
                        options={INVENTORY_CATEGORIES.map(c => ({ value: c, label: getCategoryLabel(c) }))}
                        placeholder={t("logistics.selectCategoryPlaceholder", "Select Category")}
                        buttonClassName="py-2 text-xs bg-white border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.conditionStatusLabel", "Condition Status")}</label>
                      <SearchableSelect
                        value={inventoryForm.condition}
                        onChange={(val) => setInventoryForm({ ...inventoryForm, condition: val })}
                        options={INVENTORY_CONDITIONS.map(c => ({ value: c, label: getConditionLabel(c) }))}
                        placeholder={t("logistics.selectConditionPlaceholder", "Select Condition")}
                        buttonClassName="py-2 text-xs bg-white border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.totalQuantityLabel", "Total Quantity Available")}</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={inventoryForm.quantity}
                        onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.currentlyDeployedLabel", "Currently Deployed / In-Use")}</label>
                      <input
                        type="number"
                        min="0"
                        value={inventoryForm.inUse}
                        onChange={(e) => setInventoryForm({ ...inventoryForm, inUse: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">{t("logistics.assignedRoomLabel", "Assigned Room / Stage Location")}</label>
                    <SearchableSelect
                      value={inventoryForm.location}
                      onChange={(val) => setInventoryForm({ ...inventoryForm, location: val })}
                      options={availableLocations.map(l => ({ value: l, label: l }))}
                      placeholder={t("logistics.selectLocationPlaceholder", "Select Location")}
                      buttonClassName="py-2 text-xs bg-white border-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">{t("logistics.supplierCompanyLabel", "Supplier / Rental Company")}</label>
                    <input
                      type="text"
                      value={inventoryForm.supplier}
                      onChange={(e) => setInventoryForm({ ...inventoryForm, supplier: e.target.value })}
                      placeholder={t("logistics.supplierPlaceholder", "e.g. Apex AV Solutions")}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">{t("logistics.operationalNotesLabel", "Operational Notes & Specs")}</label>
                    <textarea
                      rows={3}
                      value={inventoryForm.notes}
                      onChange={(e) => setInventoryForm({ ...inventoryForm, notes: e.target.value })}
                      placeholder={t("logistics.operationalNotesPlaceholder", "e.g. Includes charging station, spare batteries, and 10m XLR cable")}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>
              )}

              {/* --- 2. VENDOR FORM --- */}
              {modalType === "vendor" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">{t("logistics.supplierNameLabel", "Company / Supplier Name *")}</label>
                    <input
                      type="text"
                      required
                      value={vendorForm.name}
                      onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                      placeholder={t("logistics.supplierNamePlaceholder", "e.g. Gourmet Bistro Catering Inc.")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.serviceCategoryLabel", "Service Category")}</label>
                      <SearchableSelect
                        value={vendorForm.serviceType}
                        onChange={(val) => setVendorForm({ ...vendorForm, serviceType: val })}
                        options={VENDOR_SERVICE_TYPES.map(v => ({ value: v, label: getServiceTypeLabel(v) }))}
                        placeholder={t("logistics.selectServicePlaceholder", "Select Service")}
                        buttonClassName="py-2 text-xs bg-white border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.deliveryStatusLabel", "Delivery / Contract Status")}</label>
                      <SearchableSelect
                        value={vendorForm.status}
                        onChange={(val) => setVendorForm({ ...vendorForm, status: val })}
                        options={VENDOR_STATUSES.map(s => ({ value: s.value, label: getVendorStatusLabel(s.value) }))}
                        placeholder={t("logistics.selectStatusPlaceholder", "Select Status")}
                        buttonClassName="py-2 text-xs bg-white border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.onSiteContactLabel", "On-Site Contact Person")}</label>
                      <input
                        type="text"
                        value={vendorForm.contactName}
                        onChange={(e) => setVendorForm({ ...vendorForm, contactName: e.target.value })}
                        placeholder={t("logistics.onSiteContactPlaceholder", "e.g. Sarah Jenkins")}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.directPhoneLabel", "Direct Phone Number")}</label>
                      <CountryPhoneInput
                        value={vendorForm.phone}
                        onChange={(val) => setVendorForm({ ...vendorForm, phone: val })}
                        defaultCountry="DZ"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.loadInWindowLabel", "Load-In Window Time")}</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={vendorForm.deliveryTime}
                        onChange={(e) => setVendorForm({ ...vendorForm, deliveryTime: e.target.value })}
                        placeholder={t("logistics.loadInWindowPlaceholder", "e.g. 07:30 AM")}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.vehiclePlateLabel", "Vehicle Plate / Loading Dock")}</label>
                      <input
                        type="text"
                        value={vendorForm.vehiclePlate}
                        onChange={(e) => setVendorForm({ ...vendorForm, vehiclePlate: e.target.value })}
                        placeholder={t("logistics.vehiclePlatePlaceholder", "e.g. Dock B / Plate NY-8492-LG")}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">{t("logistics.contractBudgetLabel", "Contract Budget / Value ($)")}</label>
                    <input
                      type="number"
                      value={vendorForm.contractAmount}
                      onChange={(e) => setVendorForm({ ...vendorForm, contractAmount: e.target.value })}
                      placeholder="e.g. 4500"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">{t("logistics.scopeDeliverablesLabel", "Scope of Deliverables & Notes")}</label>
                    <textarea
                      rows={3}
                      value={vendorForm.notes}
                      onChange={(e) => setVendorForm({ ...vendorForm, notes: e.target.value })}
                      placeholder={t("logistics.scopeDeliverablesPlaceholder", "e.g. Morning coffee break for 200 VIPs, hot buffet lunch, and teardown cleanup")}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>
              )}

              {/* --- 3. TRAVEL & LODGING FORM --- */}
              {modalType === "travel" && (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Speaker quick autofill if available */}
                  {speakers.length > 0 && !editingItem && (
                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-1.5">
                      <span className="text-[10px] font-extrabold uppercase text-blue-700 tracking-wider">
                        {t("logistics.quickAutofillSpeakers", "Quick Autofill from Event Speakers:")}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {speakers.slice(0, 5).map((spk, idx) => {
                          const sName = typeof spk === "string" ? spk : spk.name || spk.fullName;
                          if (!sName) return null;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setTravelForm(prev => ({
                                  ...prev,
                                  personName: sName,
                                  role: "Keynote Speaker"
                                }));
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white border border-blue-200 text-[11px] font-bold text-blue-800 hover:bg-blue-600 hover:text-white transition-all cursor-pointer shadow-xs"
                            >
                              + {sName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">{t("logistics.guestNameLabel", "Guest / Speaker Full Name *")}</label>
                    <input
                      type="text"
                      required
                      value={travelForm.personName}
                      onChange={(e) => setTravelForm({ ...travelForm, personName: e.target.value })}
                      placeholder={t("logistics.guestNamePlaceholder", "e.g. Dr. Elena Vance")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.eventRoleLabel", "Event Role")}</label>
                      <SearchableSelect
                        value={travelForm.role}
                        onChange={(val) => setTravelForm({ ...travelForm, role: val })}
                        options={TRAVEL_ROLES.map(r => ({ value: r, label: getTravelRoleLabel(r) }))}
                        placeholder={t("logistics.selectRolePlaceholder", "Select Role")}
                        buttonClassName="py-2 text-xs bg-white border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.travelModeLabel", "Travel Mode")}</label>
                      <SearchableSelect
                        value={travelForm.travelType}
                        onChange={(val) => setTravelForm({ ...travelForm, travelType: val })}
                        options={TRAVEL_TYPES.map(t => ({ value: t, label: getTravelTypeLabel(t) }))}
                        placeholder={t("logistics.selectModePlaceholder", "Select Mode")}
                        buttonClassName="py-2 text-xs bg-white border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.flightNumberLabel", "Flight / Train Number")}</label>
                      <input
                        type="text"
                        value={travelForm.flightNumber}
                        onChange={(e) => setTravelForm({ ...travelForm, flightNumber: e.target.value })}
                        placeholder={t("logistics.flightNumberPlaceholder", "e.g. AF 1492")}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.airportPickupLabel", "Airport Pickup Status")}</label>
                      <SearchableSelect
                        value={travelForm.pickupStatus}
                        onChange={(val) => setTravelForm({ ...travelForm, pickupStatus: val })}
                        options={PICKUP_STATUSES.map(s => ({ value: s.value, label: getPickupStatusLabel(s.value) }))}
                        placeholder={t("logistics.selectStatusPlaceholder", "Select Status")}
                        buttonClassName="py-2 text-xs bg-white border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.hotelPartnerLabel", "Hotel Partner")}</label>
                      <input
                        type="text"
                        value={travelForm.hotelName}
                        onChange={(e) => setTravelForm({ ...travelForm, hotelName: e.target.value })}
                        placeholder={t("logistics.hotelPartnerPlaceholder", "e.g. Grand Hyatt Regency")}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.roomSuiteLabel", "Room / Suite #")}</label>
                      <input
                        type="text"
                        value={travelForm.roomNumber}
                        onChange={(e) => setTravelForm({ ...travelForm, roomNumber: e.target.value })}
                        placeholder={t("logistics.roomSuitePlaceholder", "e.g. Suite 804")}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.assignedDriverLabel", "Assigned Driver Name")}</label>
                      <input
                        type="text"
                        value={travelForm.driverName}
                        onChange={(e) => setTravelForm({ ...travelForm, driverName: e.target.value })}
                        placeholder={t("logistics.assignedDriverPlaceholder", "e.g. Karim Meziani")}
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.driverPhoneLabel", "Driver Contact Phone")}</label>
                      <CountryPhoneInput
                        value={travelForm.driverPhone}
                        onChange={(val) => setTravelForm({ ...travelForm, driverPhone: val })}
                        defaultCountry="DZ"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">{t("logistics.specialRiderLabel", "Special Rider / Green Room Requests")}</label>
                    <textarea
                      rows={3}
                      value={travelForm.specialRequests}
                      onChange={(e) => setTravelForm({ ...travelForm, specialRequests: e.target.value })}
                      placeholder={t("logistics.specialRiderPlaceholder", "e.g. Halal meal preference, lactose-free milk in speaker lounge, early check-in")}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>
              )}

              {/* --- 4. RUN OF SHOW CUE FORM --- */}
              {modalType === "cue" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">{t("logistics.cueTitleLabel", "Cue Title / Action Description *")}</label>
                    <input
                      type="text"
                      required
                      value={cueForm.title}
                      onChange={(e) => setCueForm({ ...cueForm, title: e.target.value })}
                      placeholder={t("logistics.cueTitlePlaceholder", "e.g. Stage Sound Check & Mic Dr. Elena Vance")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.cueTimeLabel", "Cue Time (HH:MM AM/PM)")}</label>
                      <input
                        type="text"
                        dir="ltr"
                        required
                        value={cueForm.time}
                        onChange={(e) => setCueForm({ ...cueForm, time: e.target.value })}
                        placeholder="09:00 AM"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.actionTypeLabel", "Action Type")}</label>
                      <SearchableSelect
                        value={cueForm.actionType}
                        onChange={(val) => setCueForm({ ...cueForm, actionType: val })}
                        options={ACTION_TYPES.map(a => ({ value: a, label: getActionTypeLabel(a) }))}
                        placeholder={t("logistics.selectActionTypePlaceholder", "Select Action Type")}
                        buttonClassName="py-2 text-xs bg-white border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.stageRoomLocationLabel", "Stage / Room Location")}</label>
                      <SearchableSelect
                        value={cueForm.stageOrLocation}
                        onChange={(val) => setCueForm({ ...cueForm, stageOrLocation: val })}
                        options={availableLocations.map(l => ({ value: l, label: l }))}
                        placeholder={t("logistics.selectStagePlaceholder", "Select Stage")}
                        buttonClassName="py-2 text-xs bg-white border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.responsiblePersonLabel", "Responsible Person")}</label>
                      <SearchableSelect
                        value={cueForm.responsiblePerson}
                        onChange={(val) => setCueForm({ ...cueForm, responsiblePerson: val })}
                        options={availableStaff.map(s => ({ value: s, label: s }))}
                        placeholder={t("logistics.selectPersonPlaceholder", "Select Person")}
                        buttonClassName="py-2 text-xs bg-white border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">{t("logistics.technicalNotesLabel", "Technical Notes & Instructions")}</label>
                    <textarea
                      rows={3}
                      value={cueForm.notes}
                      onChange={(e) => setCueForm({ ...cueForm, notes: e.target.value })}
                      placeholder={t("logistics.technicalNotesPlaceholder", "e.g. Ensure slide clicker is tested with primary laptop before speaker introduction")}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>
              )}

              {/* --- 5. CHECKLIST TASK FORM --- */}
              {modalType === "checklist" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">{t("logistics.checklistTaskTitleLabel", "Checklist Task Title *")}</label>
                    <input
                      type="text"
                      required
                      value={checklistForm.title}
                      onChange={(e) => setChecklistForm({ ...checklistForm, title: e.target.value })}
                      placeholder={t("logistics.checklistTaskTitlePlaceholder", "e.g. Test audio feedback on Main Stage wireless lapels")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.checklistCategoryLabel", "Checklist Category")}</label>
                      <SearchableSelect
                        value={checklistForm.category}
                        onChange={(val) => setChecklistForm({ ...checklistForm, category: val })}
                        options={CHECKLIST_CATEGORIES.map(c => ({ value: c, label: getChecklistCategoryLabel(c) }))}
                        placeholder={t("logistics.selectCategoryPlaceholder", "Select Category")}
                        buttonClassName="py-2 text-xs bg-white border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.dueTimeLabel", "Due Time (Pre-Opening)")}</label>
                      <input
                        type="text"
                        dir="ltr"
                        value={checklistForm.dueDate}
                        onChange={(e) => setChecklistForm({ ...checklistForm, dueDate: e.target.value })}
                        placeholder="08:00 AM"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* --- 6. INCIDENT FORM --- */}
              {modalType === "incident" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">{t("logistics.incidentTitleLabel", "Incident / Issue Summary *")}</label>
                    <input
                      type="text"
                      required
                      value={incidentForm.title}
                      onChange={(e) => setIncidentForm({ ...incidentForm, title: e.target.value })}
                      placeholder={t("logistics.incidentTitlePlaceholder", "e.g. Projector flicker on Main Auditorium Stage")}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.urgencyLevelLabel", "Urgency Level")}</label>
                      <SearchableSelect
                        value={incidentForm.severity}
                        onChange={(val) => setIncidentForm({ ...incidentForm, severity: val })}
                        options={INCIDENT_SEVERITIES.map(s => ({ value: s.value, label: getIncidentSeverityLabel(s.value) }))}
                        placeholder={t("logistics.selectUrgencyPlaceholder", "Select Urgency")}
                        buttonClassName="py-2 text-xs bg-white border-slate-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">{t("logistics.venueLocationLabel", "Venue Location")}</label>
                      <SearchableSelect
                        value={incidentForm.location}
                        onChange={(val) => setIncidentForm({ ...incidentForm, location: val })}
                        options={availableLocations.map(l => ({ value: l, label: l }))}
                        placeholder={t("logistics.selectLocationPlaceholder", "Select Location")}
                        buttonClassName="py-2 text-xs bg-white border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">{t("logistics.assignToStaffLabel", "Assign To Staff / AV Technician")}</label>
                    <SearchableSelect
                      value={incidentForm.assignedTo}
                      onChange={(val) => setIncidentForm({ ...incidentForm, assignedTo: val })}
                      options={availableStaff.map(s => ({ value: s, label: s }))}
                      placeholder={t("logistics.selectAssigneePlaceholder", "Select Assignee")}
                      buttonClassName="py-2 text-xs bg-white border-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">{t("logistics.detailedDescriptionLabel", "Detailed Description & Symptoms")}</label>
                    <textarea
                      rows={3}
                      value={incidentForm.description}
                      onChange={(e) => setIncidentForm({ ...incidentForm, description: e.target.value })}
                      placeholder={t("logistics.detailedDescriptionPlaceholder", "Explain symptoms, cable swaps, or equipment needed to resolve the incident...")}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none font-medium"
                    />
                  </div>
                </div>
              )}
            </form>

            {/* Sticky Drawer Footer */}
            <footer className="p-5 md:p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 z-10">
              <button
                type="button"
                onClick={() => { setModalType(null); setEditingItem(null); }}
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                {t("common.cancel", "Cancel")}
              </button>
              <button
                type="submit"
                form="logistics-drawer-form"
                className="px-6 py-2.5 rounded-xl font-black text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Check size={15} className="stroke-[3]" />
                <span>{getDrawerButtonLabel()}</span>
              </button>
            </footer>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
