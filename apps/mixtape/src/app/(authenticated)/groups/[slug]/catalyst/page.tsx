// apps/mixtape/src/app/(authenticated)/groups/[slug]/catalyst/page.tsx
// Dissolve shell — Catalyst surface. Input at top (declarative). Left panel constant.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  Avatar,
  Box,
  Button,
  Collapsible,
  Dialog,
  Heading,
  HStack,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useColorModeValue } from "@components/ui/color-mode";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { axiosInstance } from "@mixtape/api/lib/axiosInstance";

type MemberPreview = {
  username: string;
  display_name: string;
  avatar_url: string;
};

type GroupDetail = {
  title: string;
  slug: string;
  quick_intro?: string;
  description?: string;
  member_preview?: MemberPreview[];
};

type IntroState = "center" | "questions" | "animating" | "bubble" | "phase1_review" | "analyzing" | "confirming" | "browse";

type Phase1Register = {
  slug: string;
  display_name: string;
  entry_count: number;
  source_file: string;
  canon_synonym: string;
  notes: string;
  confidence: "high" | "medium" | "low";
  columns: string[];
  matched_declared?: string;
};

type ChildSuggestion = {
  parent: string;
  child_candidate: string;
  source_register: string;
};

type NestedInParent = {
  type: string;
  nested_in: string;
};

type Phase1Results = {
  aligned: Phase1Register[];
  unexpected: Phase1Register[];
  absent: string[];
  nested_in_parent: NestedInParent[];
  declared_types: string[];
  child_suggestions: ChildSuggestion[];
  source_inventory?: SourceInventory;
  strategy_map?: StrategyMap;
  section_map?: SourceSectionMap;
  tuning_notes?: TuningNote[];
};

type TuningNote = {
  id: string;
  created_at: string;
  created_by: string;
  scope: string;
  shape?: string;
  field?: string;
  value?: string;
  confidence?: string;
  note?: string;
};

type ParseJob = {
  job_id: string;
  status?: string;
  phase1_results: Phase1Results;
  source_inventory?: SourceInventory;
  strategy_map?: StrategyMap;
  section_map?: SourceSectionMap;
  skipped_duplicates?: string[];
};

type MaterializationProgress = {
  source_job_id?: string;
  register?: string;
  status?: string;
  current_file?: string | null;
  source_files?: string[];
  completed_files?: string[];
  entry_count?: number;
  file_results?: Record<string, {
    status?: string;
    extraction_mode?: string;
    token_posture?: string;
    entity_count?: number;
    raw_entity_count?: number;
    sections_total?: number;
    sections_complete?: number;
    bundle?: Record<string, number>;
    bundle_confidence?: string;
    bundle_warnings?: string[];
    bundle_cache?: string;
    reason?: string;
    title?: string;
  }>;
};

type SourceInventoryFile = {
  filename: string;
  file_type: string;
  size_bytes: number;
  duplicate_of?: string | null;
  process_decision: string;
  text_status: string;
  text_chars: number;
  estimated_tokens: number;
  domain?: string | null;
  source_shape?: string | null;
  source_shape_id?: string | null;
  source_shape_confidence?: "high" | "medium" | "low";
  evidence?: string[];
};

type SourceInventory = {
  version: string;
  files: SourceInventoryFile[];
  duplicate_groups?: { sha256: string; filenames: string[] }[];
  text_duplicate_groups?: { text_sha256: string; filenames: string[] }[];
};

type StrategyMapRow = {
  filename: string;
  domain?: string | null;
  source_shape?: string | null;
  source_shape_id?: string | null;
  duplicate_of?: string | null;
  process_decision?: string;
  target_registers?: string[];
  strategy?: string;
  strategy_id?: string;
  strategy_version?: string;
  strategy_status?: string;
  primary_target?: string;
  secondary_targets?: string[];
  sectioning?: string;
  extraction_grain?: string;
  authority_status?: string;
  token_posture?: string;
  operator_decision?: "review" | "extract" | "skip" | "hold";
  operator_intent?: string;
  notes?: string;
  validation?: string[];
  failure_modes?: string[];
  contract_gaps?: { contract_gap: string; missing_shape?: string; strategy_id?: string; detail?: string }[];
};

type StrategyMap = {
  version: string;
  status: string;
  expected_categories?: string[];
  files: Record<string, StrategyMapRow>;
};

type SourceSection = {
  section_id: string;
  title: string;
  proposed_label: string;
  operator_label?: string;
  operator_decision?: "review" | "extract" | "skip" | "hold" | "misc";
  operator_confidence?: "confident" | "staff_review" | "client_review";
  operator_notes?: string;
  merged_into?: string;
  merged_section_ids?: string[];
  merged_titles?: string[];
  evidence?: string[];
  start_char: number;
  end_char: number;
  content_markdown: string;
  content_chars: number;
};

type SourceFileSectionMap = {
  version: string;
  filename: string;
  parser: string;
  status: string;
  sections: SourceSection[];
};

type SourceSectionMap = {
  version: string;
  status: string;
  files: Record<string, SourceFileSectionMap>;
};

type RegisterRow = {
  slug: string;
  displayName: string;
  canonSynonym: string;
  entryCount: number;
  sourceFile: string;
};

type RegisterMeta = {
  slug: string;
  title: string;
  canon_synonym: string;
  entry_count: number;
  status: string;
  source_file: string;
};

type ParsedFileRegister = {
  slug: string;
  display_name: string;
  entry_count: number;
  source_file: string;
  canon_synonym: string;
  notes: string;
  confidence: "high" | "medium" | "low";
  columns: string[];
};

type ParsedFile = {
  filename: string;
  file_type: string;
  registers: ParsedFileRegister[];
  skipped: string[];
  file_notes: string;
};

const BRAND = "#1a1a2e";
const VERBS = ["Find", "Amend", "Add"];

// ── Vertical shape library (derived from puddlejump/zz/shape-library/) ────────
type VerticalEntityType = { slug: string; label: string; description: string };
type VerticalId = "food-service" | "retail" | "education";

const VERTICALS: { id: VerticalId; label: string; icon: string; description: string }[] = [
  { id: "food-service", label: "Food Service", icon: "🍽", description: "Restaurants, catering, events, retreats" },
  { id: "retail",       label: "Retail",       icon: "🛍", description: "Shops, products, vendors, inventory" },
  { id: "education",    label: "Education",    icon: "📚", description: "Courses, programs, students, resources" },
];

// ── Per-vertical accent theme ─────────────────────────────────────────────────
const VERTICAL_THEME: Record<VerticalId, { accent: string; accentMuted: string; setupBg: string }> = {
  "food-service": { accent: "#92400e", accentMuted: "#b45309", setupBg: "#fef3e2" },
  "retail":       { accent: "#1e40af", accentMuted: "#2563eb", setupBg: "#eff6ff" },
  "education":    { accent: "#166534", accentMuted: "#16a34a", setupBg: "#f0fdf4" },
};

// ── Shape-derived extraction context (from puddlejump/zz/shape-library/) ──────
// Tells the semantic analysis prompt how entity types nest and what to count.
const VERTICAL_SHAPE_CONTEXT: Record<VerticalId, string> = {
  "food-service": `VERTICAL: food-service

Shape relationships — use these to guide extraction:
- Recipe (primary unit): a named dish with instructions and an outcome.
  REQUIRED composition: every recipe contains Ingredients (name, quantity, unit)
  as bullet-point lists embedded within the recipe section — they are NOT
  separate top-level registers. Look for ingredient bullet lists inside each
  named recipe and count/extract them as children of that recipe.
  Other children: Instruction Step (numbered preparation step), Storage Guidance.
  COUNT rule: count individual named dishes, NOT meal-occasion headings
  (e.g. "Wednesday Lunch" is a container — count the dishes listed inside it).
- Ingredient (required child of Recipe): appears as bullet points ("- 2 cups flour",
  "- 1 tbsp olive oil") inside a recipe section. Always a child, never standalone.
- Menu: a time-based or occasion-based container of Recipes. Not a recipe itself.
- Prep Task: a preparation checklist entry, shift schedule item, or action list row.
- Purveyor / Partner: a confirmed supplier, vendor, sponsor, or donor organization.
  Distinguished from outreach prospects — confirmed/contracted entities only.
- People: named individuals (staff, volunteers, contacts). Skip roles without a name.`,

  "retail": `VERTICAL: retail

Shape relationships — use these to guide extraction:
- Product (primary unit): a named item for sale or in inventory.
  Children to look for: Variant (size, color, SKU), Category (department/grouping),
  Pricing tier, Supplier/Vendor reference.
- Category: a grouping or department containing Products. Not a product itself.
- Vendor: a confirmed supplier or trade partner with a product relationship.
- Customer: a named account or individual customer record.
- Promotion: a named sale, discount, or campaign with date range and scope.`,

  "education": `VERTICAL: education

Shape relationships — use these to guide extraction:
- Course (primary unit): a named educational program or class.
  Children: Module (unit/lesson within the course), Assignment (task or assessment),
  Learning Objective, Resource (reading or material).
- Module: a discrete unit within a course. Not a course itself.
- Assignment: a named task, project, or assessment with a deadline.
- Student: a named learner record. Skip role labels without a name.
- Resource: a named reading, tool, or reference material.`,
};

const VERTICAL_ENTITY_TYPES: Record<VerticalId, VerticalEntityType[]> = {
  "food-service": [
    { slug: "recipe",              label: "Recipes",              description: "Named dishes with instructions and an outcome" },
    { slug: "meal",                label: "Meals",                description: "Meal occasions by day and service" },
    { slug: "ingredient",          label: "Ingredients",          description: "Food components with quantities when known" },
    { slug: "menu",                label: "Menus",                description: "Collections of dishes by meal or occasion" },
    { slug: "prep-task",           label: "Prep Tasks",           description: "Checklists and preparation schedules" },
    { slug: "supplier",            label: "Suppliers",            description: "Vendors, purveyors, sponsors, donors" },
    { slug: "supply",              label: "Supplies",             description: "Non-food items to purchase or have on hand" },
    { slug: "order",               label: "Orders",               description: "Supplier-linked purchases with supplies or ingredients and amounts" },
    { slug: "dietary-restriction", label: "Dietary Restrictions", description: "Constraints like vegan, gluten-free, dairy-free, allergies" },
    { slug: "people",              label: "People",               description: "Staff, volunteers, contacts" },
  ],
  "retail": [
    { slug: "product",    label: "Products",   description: "Items for sale or inventory" },
    { slug: "category",   label: "Categories", description: "Product groupings or departments" },
    { slug: "vendor",     label: "Vendors",    description: "Suppliers and trade partners" },
    { slug: "customer",   label: "Customers",  description: "Customer records or accounts" },
    { slug: "promotion",  label: "Promotions", description: "Sales, discounts, campaigns" },
    { slug: "people",     label: "People",     description: "Staff and contacts" },
  ],
  "education": [
    { slug: "course",      label: "Courses",     description: "Educational programs or classes" },
    { slug: "module",      label: "Modules",     description: "Units or lessons within a course" },
    { slug: "assignment",  label: "Assignments", description: "Tasks and assessments" },
    { slug: "student",     label: "Students",    description: "Learner records" },
    { slug: "resource",    label: "Resources",   description: "Materials, readings, references" },
    { slug: "people",      label: "People",      description: "Instructors, staff, contacts" },
  ],
};

// ── Semantic entity classifier ────────────────────────────────────────────────
type EntityClass = { type: string; icon: string; plural: string };

function classifyRegister(slug: string, displayName: string, columns: string[]): EntityClass {
  const t = (slug + " " + displayName + " " + columns.join(" ")).toLowerCase();
  if (/recipe|menu|meal|dish|breakfast|lunch|dinner|sauce|cook|food|prep/.test(t))
    return { type: "Recipes", icon: "🍽", plural: "recipes" };
  if (/ingredient|pantry|stock|inventory/.test(t))
    return { type: "Ingredients", icon: "🥬", plural: "ingredients" };
  if (/supplier|vendor|partner|purveyor|fundrais|outreach|confirmed|grant|sponsor|donation/.test(t))
    return { type: "Partners & Suppliers", icon: "🤝", plural: "partners" };
  if (/staff|crew|team|volunteer|people|person|role|contact|worker|member/.test(t))
    return { type: "People", icon: "👥", plural: "people" };
  if (/meeting|minutes|action|agenda|carried|notes/.test(t))
    return { type: "Meeting notes", icon: "📋", plural: "meeting notes" };
  if (/task|checklist|todo|shift|schedule/.test(t))
    return { type: "Tasks", icon: "✅", plural: "tasks" };
  return { type: "Records", icon: "📄", plural: "records" };
}

function humanSummary(registers: { slug: string; display_name: string; entry_count: number; columns: string[] }[]): string {
  const byType: Record<string, number> = {};
  for (const r of registers) {
    const ec = classifyRegister(r.slug, r.display_name, r.columns);
    byType[ec.plural] = (byType[ec.plural] ?? 0) + r.entry_count;
  }
  const parts = Object.entries(byType)
    .filter(([, n]) => n > 0)
    .map(([type, n]) => `${n} ${type}`);
  return parts.length ? parts.join(" · ") : (registers.length > 0 ? `${registers.length} items` : "nothing detected");
}

// Consolidate granular parser registers into one row per entity type.
// e.g. "Confirmed Partners" + "Partner Outreach" + "Grants" → one "Partners & Suppliers" register.
const ENTITY_ORDER = ["people", "recipes", "tasks", "partners", "meeting notes", "records"];

function consolidateByEntityType(regs: RegisterRow[]): RegisterRow[] {
  const byType: Record<string, { ec: EntityClass; entryCount: number; sources: string[] }> = {};
  for (const r of regs) {
    const ec = classifyRegister(r.slug, r.displayName, []);
    if (!byType[ec.plural]) byType[ec.plural] = { ec, entryCount: 0, sources: [] };
    byType[ec.plural].entryCount += r.entryCount;
    for (const f of r.sourceFile.split(", ")) {
      if (f.trim() && !byType[ec.plural].sources.includes(f.trim())) byType[ec.plural].sources.push(f.trim());
    }
  }
  return Object.entries(byType)
    .sort(([a], [b]) => {
      const ai = ENTITY_ORDER.indexOf(a), bi = ENTITY_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    })
    .map(([, { ec, entryCount, sources }]) => ({
      slug: ec.plural.replace(/[^a-z0-9]+/g, "-"),
      displayName: ec.type,
      canonSynonym: "Active",
      entryCount,
      sourceFile: sources.join(", "),
    }));
}

const PROPOSED_REGISTERS: RegisterRow[] = [
  { slug: "meals",              displayName: "Meal Register",      canonSynonym: "Final Menu", entryCount: 16,  sourceFile: "2026_Temple_Menu. UPDATED.docx" },
  { slug: "prep-tasks",         displayName: "Prep Tasks",          canonSynonym: "Live Prep",  entryCount: 42,  sourceFile: "2026_Prep_List..docx" },
  { slug: "confirmed-partners", displayName: "Confirmed Partners",  canonSynonym: "Confirmed",  entryCount: 25,  sourceFile: "TOB 2026 Fundraising Progress-2.xlsx" },
  { slug: "partner-outreach",   displayName: "Partner Outreach",    canonSynonym: "Active",     entryCount: 163, sourceFile: "TOB 2026 Fundraising Progress-2.xlsx" },
  { slug: "staff",              displayName: "Staff",               canonSynonym: "Active",     entryCount: 36,  sourceFile: "Temple 2026 Workbook (ours).xlsx" },
  { slug: "grants",             displayName: "Grants",              canonSynonym: "Awarded",    entryCount: 5,   sourceFile: "TOB 2026 Fundraising Progress-2.xlsx" },
  { slug: "meeting-actions",    displayName: "Meeting Actions",     canonSynonym: "Resolved",   entryCount: 8,   sourceFile: "Meeting 7_6_26.docx" },
];

const CONTEXT_FILES = [
  { slug: "dietary-restrictions-summary", label: "dietary-restrictions-summary" },
  { slug: "shift-schedule-2026",          label: "shift-schedule-2026" },
];

export default function GroupCatalystPage() {
  const params = useParams();
  const slug = Array.isArray(params.slug) ? params.slug[0] : (params.slug as string);

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [introState, setIntroState] = useState<IntroState>("center");
  const [cmdInput, setCmdInput] = useState("");
  const [registers, setRegisters] = useState<RegisterRow[]>(PROPOSED_REGISTERS);
  const [contextOpen, setContextOpen] = useState(false);
  const [materializing, setMaterializing] = useState(false);
  const [materializeResult, setMaterializeResult] = useState<{ commit: string; registers_written: number } | null>(null);
  const [materializeError, setMaterializeError] = useState<string | null>(null);
  const [generalContext, setGeneralContext] = useState("");
  const [entityExpectations, _setEntityExpectations] = useState("");
  const [selectedVertical, setSelectedVertical] = useState<VerticalId | null>(null);
  const [entityToggles, setEntityToggles] = useState<Record<string, boolean>>({});
  const [entitySynonyms, setEntitySynonyms] = useState<Record<string, string>>({});
  const [synonymOpenFor, setSynonymOpenFor] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [parsing, setParsing] = useState(false);
  const [resumingReview, setResumingReview] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
  const [parseJob, setParseJob] = useState<ParseJob | null>(null);
  const [enrichmentContext, setEnrichmentContext] = useState("");
  const [startingAnalysis, setStartingAnalysis] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ done: number; total: number } | null>(null);
  // Per-item unexpected register decisions: slug → "include" | "skip"
  const [unexpectedDecisions, setUnexpectedDecisions] = useState<Record<string, "include" | "skip">>({});
  const [alignedNotes, setAlignedNotes] = useState<Record<string, string>>({});
  const [alignedNoteOpen, setAlignedNoteOpen] = useState<Record<string, boolean>>({});
  const [unexpectedNotes, setUnexpectedNotes] = useState<Record<string, string>>({});
  const [savingSectionIds, setSavingSectionIds] = useState<Record<string, boolean>>({});
  const [savedSectionIds, setSavedSectionIds] = useState<Record<string, boolean>>({});
  const [expandedSectionContent, setExpandedSectionContent] = useState<Record<string, boolean>>({});
  const [openSectionIds, setOpenSectionIds] = useState<Record<string, boolean>>({});
  const [progressReviewOpen, setProgressReviewOpen] = useState<Record<string, boolean>>({});
  const [tuneOpen, setTuneOpen] = useState(false);
  const [tuneShape, setTuneShape] = useState("Recipe");
  const [tuneField, setTuneField] = useState("yield");
  const [tuneValue, setTuneValue] = useState("315 persons");
  const [tuneConfidence, setTuneConfidence] = useState("65%");
  const [tuneNote, setTuneNote] = useState("");
  const [savingTune, setSavingTune] = useState(false);

  // Browse state
  const [registerList, setRegisterList] = useState<RegisterMeta[]>([]);
  const [registerListLoading, setRegisterListLoading] = useState(false);
  const [selectedRegSlug, setSelectedRegSlug] = useState<string | null>(null);
  const [, setRegBody] = useState<string>("");
  const [regMeta, setRegMeta] = useState<RegisterMeta | null>(null);
  const [regLoading, setRegLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [canonizing, setCanonizing] = useState(false);
  const [saveResult, setSaveResult] = useState<string | null>(null);

  // Entry list state
  type EntryMeta = { slug: string; title: string; status: string };
  const [entryList, setEntryList] = useState<EntryMeta[]>([]);
  const [entryListLoading, setEntryListLoading] = useState(false);
  const [selectedEntrySlug, setSelectedEntrySlug] = useState<string | null>(null);
  const [entryLoading, setEntryLoading] = useState(false);
  const [shareResult, setShareResult] = useState<string | null>(null);

  // Materialize (extract entries) state — per-register
  const [materializingReg, setMaterializingReg] = useState<string | null>(null);
  const [materializeRegResult, setMaterializeRegResult] = useState<string | null>(null);
  const [materializeProgress, setMaterializeProgress] = useState<MaterializationProgress | null>(null);
  const materializePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Settings panel state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSynonym, setSettingsSynonym] = useState("");
  const [settingsDisplayName, setSettingsDisplayName] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsResult, setSettingsResult] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const didInitUrlRef = useRef(false);
  const pendingUrlEntryRef = useRef<string | null>(null);
  const sectionNoteDraftsRef = useRef<Record<string, string>>({});
  const sectionNoteCursorsRef = useRef<Record<string, number>>({});
  const sectionNoteElementsRef = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const updateCodexUrl = useCallback((regSlug: string | null, entrySlug?: string | null) => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (regSlug) {
      url.searchParams.set("register", regSlug);
    } else {
      url.searchParams.delete("register");
    }
    if (entrySlug) {
      url.searchParams.set("entry", entrySlug);
    } else {
      url.searchParams.delete("entry");
    }
    window.history.pushState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  // ── TipTap editor ────────────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [StarterKit],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "cat-tiptap-body",
      },
    },
  });

  const selectRegister = useCallback((regSlug: string, syncUrl = true) => {
    setSelectedRegSlug(regSlug);
    setSelectedEntrySlug(null);
    setShareResult(null);
    editor?.commands.setContent("");
    if (syncUrl) updateCodexUrl(regSlug, null);
  }, [editor, updateCodexUrl]);

  const copyEntryUrl = useCallback(async () => {
    if (!selectedRegSlug || !selectedEntrySlug || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.searchParams.set("register", selectedRegSlug);
    url.searchParams.set("entry", selectedEntrySlug);
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareResult("URL copied.");
    } catch {
      setShareResult(url.toString());
    }
  }, [selectedRegSlug, selectedEntrySlug]);

  // ── color tokens ──────────────────────────────────────────────────────────
  const shellBg         = useColorModeValue("#f4f5f7", "#111827");
  const topBarBg        = useColorModeValue("white", "#1a202c");
  const topBarBorder    = useColorModeValue("#e2e8f0", "#2d3748");
  const centerBg        = useColorModeValue("#f9fafb", "#111827");
  const cardBg          = useColorModeValue("white", "#1e2533");
  const cardBorder      = useColorModeValue("#e2e8f0", "#2d3748");
  const mutedText       = useColorModeValue("#6b7280", "#9ca3af");
  const chipBg          = useColorModeValue("#f1f5f9", "#1e2a3a");
  const chipBorder      = useColorModeValue("#e2e8f0", "#2d3748");
  const chipText        = useColorModeValue("#374151", "#cbd5e0");
  const dropZoneHoverBg = useColorModeValue("#eef3ff", "#1a2030");
  const dropZoneBorder  = useColorModeValue("#c7d7fe", "#2d3748");
  const statusBg        = useColorModeValue("#f0fdf4", "#0f2318");
  const statusBorder    = useColorModeValue("#bbf7d0", "#166534");
  const statusText      = useColorModeValue("#15803d", "#4ade80");
  const badgeBg         = useColorModeValue("#f1f5f9", "#1e2a3a");
  const badgeText       = useColorModeValue("#64748b", "#94a3b8");
  const synonymLabel    = useColorModeValue("#9ca3af", "#6b7280");
  const removeHover     = useColorModeValue("#fee2e2", "#3b1515");
  const startHereBg     = useColorModeValue("#eef4ff", "#1e2a40");
  const startHereBorder = useColorModeValue("#c3d9ff", "#2a4070");
  const navBg           = useColorModeValue("#f0f2f5", "#161d2a");
  const navBorder       = useColorModeValue("#e2e8f0", "#1e2533");
  const navItemHover    = useColorModeValue("#e4e9f5", "#1e2a40");
  const navItemActive   = useColorModeValue("#dde6ff", "#1a2a50");
  const navActiveText   = useColorModeValue("#1e3a8a", "#93c5fd");
  const toolbarBg       = useColorModeValue("white", "#1a202c");
  const toolbarBorder   = useColorModeValue("#e2e8f0", "#2d3748");
  const canonBadgeBg    = useColorModeValue("#f0fdf4", "#0f2318");
  const canonBadgeText  = useColorModeValue("#166534", "#4ade80");
  const preCanonBg      = useColorModeValue("#fefce8", "#1a1600");
  const preCanonText    = useColorModeValue("#854d0e", "#facc15");

  const activeParseJobLabel = parseJob
    ? `${parseJob.job_id.slice(0, 8)}... · ${parseJob.status ?? "unknown"}`
    : "none";
  const activeParseJobFiles = parseJob?.source_inventory?.files
    ?.filter((file) => !file.duplicate_of)
    .map((file) => file.filename.trim())
    .filter(Boolean) ?? [];
  const selectedRegisterSource = String(regMeta?.source_file ?? "").trim();
  const registerSourceMatchesActiveJob = !selectedRegisterSource || activeParseJobFiles.length === 0
    ? true
    : activeParseJobFiles.some((filename) => (
        selectedRegisterSource.includes(filename) || filename.includes(selectedRegisterSource)
      ));
  const materializeCacheHitCount = Object.values(materializeProgress?.file_results ?? {})
    .filter((result) => result.status === "cache_hit").length;
  const materializeBlockedCount = Object.values(materializeProgress?.file_results ?? {})
    .filter((result) => String(result.status ?? "").startsWith("blocked")).length;
  const materializeWholeFileCount = Object.values(materializeProgress?.file_results ?? {})
    .filter((result) => result.extraction_mode === "whole_file_chunked").length;
  const materializeSectionTotal = Object.values(materializeProgress?.file_results ?? {})
    .reduce((sum, result) => sum + Number(result.sections_total ?? 0), 0);
  const materializeSectionComplete = Object.values(materializeProgress?.file_results ?? {})
    .reduce((sum, result) => sum + Number(result.sections_complete ?? 0), 0);
  const materializeProgressSummary = materializeProgress
    ? [
        `status: ${(materializeProgress.status ?? "unknown").replace(/_/g, " ")}`,
        `entries: ${materializeProgress.entry_count ?? 0}`,
        materializeSectionTotal ? `sections: ${materializeSectionComplete}/${materializeSectionTotal}` : null,
        materializeCacheHitCount ? `cache hits: ${materializeCacheHitCount}` : null,
        materializeWholeFileCount ? `whole-file: ${materializeWholeFileCount}` : null,
        materializeBlockedCount ? `blocked: ${materializeBlockedCount}` : null,
        materializeProgress.current_file ? `current: ${materializeProgress.current_file}` : null,
      ].filter(Boolean).join(" · ")
    : null;

  useEffect(() => {
    axiosInstance
      .get(`/api/public/groups/${slug}`)
      .then((res) => setGroup(res.data))
      .finally(() => setLoading(false));
  }, [slug]);

  const loadRegisterList = useCallback(() => {
    setRegisterListLoading(true);
    axiosInstance
      .get(`/api/catalyst/groups/${slug}/registers/`)
      .then((res) => setRegisterList(res.data))
      .catch(() => setRegisterList([]))
      .finally(() => setRegisterListLoading(false));
  }, [slug]);

  const loadRegister = useCallback((regSlug: string) => {
    setRegLoading(true);
    setSaveResult(null);
    axiosInstance
      .get(`/api/catalyst/groups/${slug}/registers/${regSlug}/`)
      .then((res) => {
        setRegBody(res.data.body_markdown ?? "");
        const meta: RegisterMeta = {
          slug: regSlug,
          title: res.data.frontmatter?.id ?? regSlug,
          canon_synonym: res.data.canon_synonym ?? "",
          entry_count: res.data.entry_count ?? 0,
          status: res.data.status ?? "pre-canon",
          source_file: res.data.frontmatter?.source_file ?? "",
        };
        setRegMeta(meta);
        setSettingsSynonym(meta.canon_synonym);
        setSettingsDisplayName(res.data.frontmatter?.display_name ?? meta.title);
        setSettingsOpen(false);
        setSettingsResult(null);
        editor?.commands.setContent(mdToHtml(res.data.body_markdown ?? ""));
      })
      .finally(() => setRegLoading(false));
  }, [slug, editor]);

  const loadEntryList = useCallback((regSlug: string) => {
    setEntryListLoading(true);
    setEntryList([]);
    setSelectedEntrySlug(null);
    axiosInstance
      .get(`/api/catalyst/groups/${slug}/registers/${regSlug}/entries/`)
      .then((res) => setEntryList(res.data.entries ?? []))
      .catch(() => setEntryList([]))
      .finally(() => setEntryListLoading(false));
  }, [slug]);

  const loadEntry = useCallback((regSlug: string, entrySlug: string, syncUrl = true) => {
    setEntryLoading(true);
    setSaveResult(null);
    axiosInstance
      .get(`/api/catalyst/groups/${slug}/registers/${regSlug}/entries/${entrySlug}/`)
      .then((res) => {
        setSelectedEntrySlug(entrySlug);
        setShareResult(null);
        if (syncUrl) updateCodexUrl(regSlug, entrySlug);
        const body = res.data.body_markdown ?? "";
        setRegBody(body);
        editor?.commands.setContent(mdToHtml(body));
      })
      .finally(() => setEntryLoading(false));
  }, [slug, editor, updateCodexUrl]);

  useEffect(() => {
    if (introState === "browse") {
      loadRegisterList();
    }
  }, [introState, loadRegisterList]);

  useEffect(() => {
    if (introState !== "browse" || parseJob) return;
    axiosInstance
      .get(`/api/catalyst/groups/${slug}/parse-jobs/latest-review/`)
      .then((res) => {
        const data = res.data as {
          job_id: string;
          status?: string;
          phase1_results: Phase1Results;
          source_inventory?: SourceInventory;
          strategy_map?: StrategyMap;
          section_map?: SourceSectionMap;
          skipped_duplicates?: string[];
        };
        setParseJob({
          job_id: data.job_id,
          status: data.status,
          phase1_results: data.phase1_results,
          source_inventory: data.source_inventory ?? data.phase1_results.source_inventory,
          strategy_map: data.strategy_map ?? data.phase1_results.strategy_map,
          section_map: data.section_map ?? data.phase1_results.section_map,
          skipped_duplicates: data.skipped_duplicates,
        });
      })
      .catch(() => {
        // Browse still works without an active parse job; extraction will use API fallback.
      });
  }, [introState, parseJob, slug]);

  useEffect(() => {
    if (didInitUrlRef.current || typeof window === "undefined") return;
    didInitUrlRef.current = true;
    const params = new URLSearchParams(window.location.search);
    const regSlug = params.get("register");
    const entrySlug = params.get("entry");
    if (!regSlug) return;
    pendingUrlEntryRef.current = entrySlug;
    setIntroState("browse");
    selectRegister(regSlug, false);
  }, [selectRegister]);

  useEffect(() => {
    if (selectedRegSlug) {
      loadRegister(selectedRegSlug);
      loadEntryList(selectedRegSlug);
    }
  }, [selectedRegSlug, loadRegister, loadEntryList]);

  useEffect(() => {
    const pendingEntry = pendingUrlEntryRef.current;
    if (!selectedRegSlug || !pendingEntry || entryListLoading || selectedEntrySlug) return;
    if (!entryList.some((entry) => entry.slug === pendingEntry)) return;
    pendingUrlEntryRef.current = null;
    loadEntry(selectedRegSlug, pendingEntry, false);
  }, [selectedRegSlug, selectedEntrySlug, entryList, entryListLoading, loadEntry]);

  function handleVerticalSelect(id: VerticalId) {
    setSelectedVertical(id);
    const types = VERTICAL_ENTITY_TYPES[id];
    const defaults: Record<string, boolean> = {};
    types.forEach((t) => { defaults[t.slug] = true; });
    setEntityToggles(defaults);
    setEntitySynonyms({});
    setSynonymOpenFor(null);
  }

  function buildEntityExpectations(): string {
    if (!selectedVertical) return entityExpectations;
    const types = VERTICAL_ENTITY_TYPES[selectedVertical];
    const vocabLines = types
      .filter((t) => entityToggles[t.slug] !== false)
      .map((t) => {
        const syn = entitySynonyms[t.slug]?.trim();
        const synPart = syn ? ` (also called: ${syn})` : "";
        return `${t.label}${synPart}: ${t.description}`;
      })
      .join("\n");
    return vocabLines;
  }

  function buildVerticalContext(): string {
    if (!selectedVertical) return "";
    return VERTICAL_SHAPE_CONTEXT[selectedVertical];
  }

  function handleStartQuestions() {
    setIntroState("questions");
  }

  function _handleImport() {
    setIntroState("animating");
    setTimeout(() => setIntroState("bubble"), 480);
  }

  function handleRestoreIntro() {
    setIntroState("center");
  }

  function handleGoToBrowse() {
    setIntroState("browse");
    setSelectedRegSlug(null);
    setRegMeta(null);
    setRegBody("");
    setEntryList([]);
    setSelectedEntrySlug(null);
  }

  function seedVerb(verb: string) {
    setCmdInput(verb + " ");
    inputRef.current?.focus();
  }

  function expandNoteShortcut(
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    onValue: (value: string, cursor: number) => void,
  ) {
    if (e.key !== "Tab") return;
    const shortcuts: Record<string, string> = {
      "/Rec": "Recipe:",
      "/Recipe": "Recipe:",
      "/Meal": "Meal:",
      "/Ing": "Ingredient:",
      "/Ingredient": "Ingredient:",
      "/Supplier": "Supplier:",
      "/Supply": "Supply:",
      "/Order": "Order:",
      "/Yield": "recipe.yield:",
      "r.in": "recipe.ingredients",
      "r.y": "recipe.yield:",
      "r.ins": "recipe.instructions",
      "m.s": "meal.service:",
      "m.d": "meal.day:",
      "o.s": "order.supplier:",
    };
    const prefixShortcuts: Record<string, string> = {
      me: "meal",
      mea: "meal",
      meal: "meal",
      rec: "recipe",
      rep: "recipe",
      recipe: "recipe",
      ing: "ingredient",
      ingr: "ingredient",
      ingredient: "ingredient",
      supp: "supplier",
      supplier: "supplier",
      sup: "supply",
      supply: "supply",
      ord: "order",
      order: "order",
      diet: "dietary_restriction",
      dietary: "dietary_restriction",
      "meal.re": "meal.recipe",
      "meal.rec": "meal.recipe",
      "meal.recipe": "meal.recipe",
      "meal.s": "meal.service",
      "meal.se": "meal.service",
      "meal.service": "meal.service",
      "meal.d": "meal.date",
      "meal.da": "meal.date",
      "meal.date": "meal.date",
      "meal.a": "meal.attendees",
      "meal.at": "meal.attendees",
      "meal.attendees": "meal.attendees",
      "recipe.in": "recipe.ingredients",
      "recipe.ing": "recipe.ingredients",
      "recipe.ingredients": "recipe.ingredients",
      "recipe.inst": "recipe.instructions",
      "recipe.instructions": "recipe.instructions",
      "recipe.n": "recipe.notes",
      "recipe.no": "recipe.notes",
      "recipe.notes": "recipe.notes",
      "recipe.y": "recipe.yield",
      "recipe.yield": "recipe.yield",
      "order.s": "order.supplier",
      "order.supplier": "order.supplier",
    };
    const target = e.currentTarget;
    const cursor = target.selectionStart ?? 0;
    const before = target.value.slice(0, cursor);
    const match = before.match(/(?:^|\s)(\/?[A-Za-z._-]+)$/);
    const token = match?.[1];
    if (!token) return;
    const normalizedToken = token.replace(/-/g, "_");
    const replacement = shortcuts[token] ?? prefixShortcuts[normalizedToken.toLowerCase()];
    if (!replacement) return;
    e.preventDefault();
    const tokenStart = cursor - token.length;
    const nextValue = `${target.value.slice(0, tokenStart)}${replacement}${target.value.slice(cursor)}`;
    const nextCursor = tokenStart + replacement.length;
    onValue(nextValue, nextCursor);
    requestAnimationFrame(() => {
      target.setSelectionRange(nextCursor, nextCursor);
    });
  }

  function updateRegisterName(idx: number, value: string) {
    setRegisters((prev) => prev.map((r, i) => i === idx ? { ...r, displayName: value } : r));
  }

  function updateRegisterSynonym(idx: number, value: string) {
    setRegisters((prev) => prev.map((r, i) => i === idx ? { ...r, canonSynonym: value } : r));
  }

  function removeRegister(idx: number) {
    setRegisters((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleMaterialize() {
    setMaterializing(true);
    setMaterializeError(null);
    try {
      const payload = registers.map((r) => ({
        slug: r.slug,
        display_name: r.displayName,
        canon_synonym: r.canonSynonym,
        entry_count: r.entryCount,
        source_file: r.sourceFile,
      }));
      const res = await axiosInstance.post(
        `/api/catalyst/groups/${slug}/materialize-registers/`,
        { registers: payload },
      );
      setMaterializeResult(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Materialization failed — check console.";
      setMaterializeError(msg);
    } finally {
      setMaterializing(false);
    }
  }

  async function handleMaterializeRegister() {
    if (!selectedRegSlug) return;
    const regSlug = selectedRegSlug;
    setMaterializingReg(regSlug);
    setMaterializeRegResult(null);
    setMaterializeProgress(null);
    if (materializePollRef.current) clearInterval(materializePollRef.current);
    try {
      const res = await axiosInstance.post(
        `/api/catalyst/groups/${slug}/registers/${regSlug}/materialize/`,
        parseJob?.job_id ? { job_id: parseJob.job_id } : {},
      );
      const taskId = res.data?.task_id ? ` Task ${res.data.task_id}.` : "";
      const queuedJobId = res.data?.job_id ? ` Job ${String(res.data.job_id).slice(0, 8)}....` : "";
      setMaterializeRegResult(`Extracting entries...${queuedJobId}${taskId}`);
      let pollCount = 0;
      materializePollRef.current = setInterval(async () => {
        try {
          pollCount += 1;
          const progressRes = await axiosInstance.get(
            `/api/catalyst/groups/${slug}/registers/${regSlug}/materialize/progress/`,
          );
          const progress = progressRes.data as MaterializationProgress;
          setMaterializeProgress(progress);
          const progressStatus = progress.status ?? "running";
          if (progressStatus === "complete" || progressStatus.startsWith("failed")) {
            clearInterval(materializePollRef.current!);
            materializePollRef.current = null;
            setMaterializingReg(null);
            const entriesRes = await axiosInstance.get(
              `/api/catalyst/groups/${slug}/registers/${regSlug}/entries/`,
            );
            const entries = entriesRes.data.entries ?? [];
            setEntryList(entries);
            setMaterializeRegResult(
              progressStatus === "complete"
                ? `Entries extracted: ${entries.length}.`
                : `Extraction ${progressStatus.replace(/_/g, " ")} — check progress details.`,
            );
            return;
          }
          const entriesRes = await axiosInstance.get(
            `/api/catalyst/groups/${slug}/registers/${regSlug}/entries/`,
          );
          const entries = entriesRes.data.entries ?? [];
          setEntryList(entries);
          if (entries.length > 0) {
            setMaterializeRegResult(`Extracting entries... ${entries.length} written so far.`);
          }
          if (pollCount >= 450) {
            clearInterval(materializePollRef.current!);
            materializePollRef.current = null;
            setMaterializingReg(null);
            setMaterializeRegResult("Extraction is still running. Refresh the register or check Catalyst logs for batch progress.");
          }
        } catch {
          // ignore poll errors
        }
      }, 8000);
    } catch {
      setMaterializingReg(null);
      setMaterializeRegResult("Extract failed — check logs.");
    }
  }

  async function handleSave() {
    if (!selectedRegSlug || !editor) return;
    setSaving(true);
    setSaveResult(null);
    try {
      const body = htmlToMd(editor.getHTML());
      const url = selectedEntrySlug
        ? `/api/catalyst/groups/${slug}/registers/${selectedRegSlug}/entries/${selectedEntrySlug}/`
        : `/api/catalyst/groups/${slug}/registers/${selectedRegSlug}/`;
      await axiosInstance.patch(url, { body_markdown: body });
      setSaveResult("Saved");
      setRegBody(body);
    } catch {
      setSaveResult("Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSettings() {
    if (!selectedRegSlug) return;
    setSettingsSaving(true);
    setSettingsResult(null);
    try {
      const res = await axiosInstance.patch(
        `/api/catalyst/groups/${slug}/registers/${selectedRegSlug}/`,
        { canon_synonym: settingsSynonym, display_name: settingsDisplayName },
      );
      setRegMeta((prev) =>
        prev ? { ...prev, canon_synonym: res.data.canon_synonym ?? settingsSynonym } : prev
      );
      setRegisterList((prev) =>
        prev.map((r) =>
          r.slug === selectedRegSlug ? { ...r, canon_synonym: res.data.canon_synonym ?? settingsSynonym } : r
        )
      );
      setSettingsResult("Saved");
    } catch {
      setSettingsResult("Save failed");
    } finally {
      setSettingsSaving(false);
    }
  }

  async function handleDecanonize() {
    if (!selectedRegSlug) return;
    setCanonizing(true);
    setSaveResult(null);
    try {
      await axiosInstance.patch(
        `/api/catalyst/groups/${slug}/registers/${selectedRegSlug}/`,
        { decanonize: true },
      );
      setRegMeta((prev) => prev ? { ...prev, status: "pre-canon" } : prev);
      setRegisterList((prev) =>
        prev.map((r) => r.slug === selectedRegSlug ? { ...r, status: "pre-canon" } : r)
      );
      setSaveResult("Reverted to draft");
    } catch {
      setSaveResult("Revert failed");
    } finally {
      setCanonizing(false);
    }
  }

  async function handleCanonize() {
    if (!selectedRegSlug || !editor) return;
    setCanonizing(true);
    setSaveResult(null);
    try {
      const body = htmlToMd(editor.getHTML());
      await axiosInstance.patch(
        `/api/catalyst/groups/${slug}/registers/${selectedRegSlug}/`,
        { body_markdown: body, canonize: true },
      );
      setSaveResult("Accepted");
      setRegMeta((prev) => prev ? { ...prev, status: "canon" } : prev);
      setRegisterList((prev) =>
        prev.map((r) => r.slug === selectedRegSlug ? { ...r, status: "canon" } : r)
      );
    } catch {
      setSaveResult("Accept failed");
    } finally {
      setCanonizing(false);
    }
  }

  async function handleParse() {
    if (!selectedFiles.length) return;
    setParsing(true);
    setParseError(null);
    try {
      const form = new FormData();
      selectedFiles.forEach((f) => form.append("files", f));
      // Vertical shape context seeds the parse prompt with domain knowledge + extraction hierarchy
      const verticalContext = buildVerticalContext();
      if (verticalContext.trim()) form.append("general_context", verticalContext.trim());
      // Entity expectations: vocabulary from toggles + synonyms
      const builtExpectations = buildEntityExpectations();
      if (builtExpectations.trim()) form.append("entity_expectations", builtExpectations.trim());
      const res = await axiosInstance.post(
        `/api/catalyst/groups/${slug}/parse-files/`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      const data = res.data as {
        job_id: string;
        status?: string;
        phase1_results: Phase1Results;
        source_inventory?: SourceInventory;
        strategy_map?: StrategyMap;
        section_map?: SourceSectionMap;
        files: ParsedFile[];
        files_processed: number;
        skipped_duplicates?: string[];
        errors: { file: string; error: string }[];
      };
      setParseJob({
        job_id: data.job_id,
        status: data.status,
        phase1_results: data.phase1_results,
        source_inventory: data.source_inventory ?? data.phase1_results.source_inventory,
        strategy_map: data.strategy_map ?? data.phase1_results.strategy_map,
        section_map: data.section_map ?? data.phase1_results.section_map,
        skipped_duplicates: data.skipped_duplicates,
      });
      setParsedFiles(data.files ?? []);
      setUnexpectedDecisions({});
      setEnrichmentContext("");
      setIntroState("phase1_review");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Parse failed — check file types and try again.";
      setParseError(msg);
    } finally {
      setParsing(false);
    }
  }

  async function handleResumeLatestReview() {
    setResumingReview(true);
    setParseError(null);
    try {
      const res = await axiosInstance.get(
        `/api/catalyst/groups/${slug}/parse-jobs/latest-review/`,
      );
      const data = res.data as {
        job_id: string;
        status?: string;
        phase1_results: Phase1Results;
        source_inventory?: SourceInventory;
        strategy_map?: StrategyMap;
        section_map?: SourceSectionMap;
        files?: ParsedFile[];
        skipped_duplicates?: string[];
      };
      setParseJob({
        job_id: data.job_id,
        status: data.status,
        phase1_results: data.phase1_results,
        source_inventory: data.source_inventory ?? data.phase1_results.source_inventory,
        strategy_map: data.strategy_map ?? data.phase1_results.strategy_map,
        section_map: data.section_map ?? data.phase1_results.section_map,
        skipped_duplicates: data.skipped_duplicates,
      });
      setParsedFiles(data.files ?? []);
      setUnexpectedDecisions({});
      setEnrichmentContext("");
      setIntroState("phase1_review");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "No saved inventory review found.";
      setParseError(msg);
    } finally {
      setResumingReview(false);
    }
  }

  async function handleSaveTuningNote() {
    if (!parseJob) return;
    setSavingTune(true);
    setParseError(null);
    try {
      const res = await axiosInstance.post(
        `/api/catalyst/groups/${slug}/parse-jobs/${parseJob.job_id}/tuning-notes/`,
        {
          shape: tuneShape.trim(),
          field: tuneField.trim(),
          value: tuneValue.trim(),
          confidence: tuneConfidence.trim(),
          note: tuneNote.trim(),
        },
      );
      const data = res.data as { tuning_notes?: TuningNote[]; phase1_results?: Phase1Results };
      setParseJob((prev) => {
        if (!prev) return prev;
        const nextPhase1 = data.phase1_results ?? {
          ...prev.phase1_results,
          tuning_notes: data.tuning_notes ?? prev.phase1_results.tuning_notes ?? [],
        };
        return {
          ...prev,
          phase1_results: nextPhase1,
        };
      });
      setTuneNote("");
      setTuneOpen(false);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Could not save tuning note.";
      setParseError(msg);
    } finally {
      setSavingTune(false);
    }
  }

  async function handleStartAnalysis() {
    if (!parseJob) return;
    setStartingAnalysis(true);
    setParseError(null);
    try {
      const narrativeContext = generalContext.trim();
      const enrichment = enrichmentContext.trim();
      const combinedEnrichment = [narrativeContext, enrichment].filter(Boolean).join("\n\n");
      await axiosInstance.post(
        `/api/catalyst/groups/${slug}/parse-jobs/${parseJob.job_id}/start-analysis/`,
        {
          ...(combinedEnrichment ? { enrichment_context: combinedEnrichment } : {}),
          ...(parseJob.strategy_map ? { strategy_map: parseJob.strategy_map } : {}),
        },
      );
      setIntroState("analyzing");
      setAnalysisProgress(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Could not start analysis — try again.";
      setParseError(msg);
    } finally {
      setStartingAnalysis(false);
    }
  }

  function updateStrategyRow(filename: string, patch: Partial<StrategyMapRow>) {
    setParseJob((prev) => {
      if (!prev?.strategy_map) return prev;
      const existing = prev.strategy_map.files[filename];
      if (!existing) return prev;
      const nextStrategyMap = {
        ...prev.strategy_map,
        status: "operator_review",
        files: {
          ...prev.strategy_map.files,
          [filename]: { ...existing, ...patch },
        },
      };
      return {
        ...prev,
        strategy_map: nextStrategyMap,
        phase1_results: {
          ...prev.phase1_results,
          strategy_map: nextStrategyMap,
        },
      };
    });
  }

  function updateSectionMapRow(filename: string, sectionId: string, patch: Partial<SourceSection>) {
    setParseJob((prev) => {
      if (!prev?.section_map) return prev;
      const fileMap = prev.section_map.files[filename];
      if (!fileMap) return prev;
      const nextFileMap = {
        ...fileMap,
        status: "operator_review",
        sections: fileMap.sections.map((section) => (
          section.section_id === sectionId ? { ...section, ...patch } : section
        )),
      };
      const nextSectionMap = {
        ...prev.section_map,
        status: "operator_review",
        files: {
          ...prev.section_map.files,
          [filename]: nextFileMap,
        },
      };
      return {
        ...prev,
        section_map: nextSectionMap,
        phase1_results: {
          ...prev.phase1_results,
          section_map: nextSectionMap,
        },
      };
    });
  }

  async function saveSectionMapRow(
    filename: string,
    section: SourceSection,
    patch: Partial<SourceSection> = {},
    options: { applyLocalPatch?: boolean; combineWithNext?: boolean } = {},
  ) {
    if (!parseJob) return;
    const key = `${filename}:${section.section_id}`;
    const nextPatch = patch.operator_notes === undefined && !options.combineWithNext
      ? { ...patch, operator_notes: getSectionNoteDraft(key, section) }
      : patch;
    const nextSection = { ...section, ...nextPatch };
    if (Object.keys(nextPatch).length > 0 && options.applyLocalPatch !== false) {
      updateSectionMapRow(filename, section.section_id, nextPatch);
    }
    setSavingSectionIds((prev) => ({ ...prev, [key]: true }));
    setSavedSectionIds((prev) => ({ ...prev, [key]: false }));
    try {
      const res = await axiosInstance.patch(
        `/api/catalyst/groups/${slug}/parse-jobs/${parseJob.job_id}/section-map/`,
        {
          filename,
          section_id: section.section_id,
          operator_label: nextSection.operator_label ?? "",
          operator_decision: nextSection.operator_decision ?? "review",
          operator_confidence: nextSection.operator_confidence ?? "staff_review",
          operator_notes: nextSection.operator_notes ?? "",
          ...(options.combineWithNext ? { combine_with_next: true } : {}),
        },
      );
      const data = res.data as { section_map?: SourceSectionMap };
      if (data.section_map) {
        setParseJob((prev) => prev ? {
          ...prev,
          section_map: data.section_map,
          phase1_results: {
            ...prev.phase1_results,
            section_map: data.section_map,
          },
        } : prev);
      }
      setSavedSectionIds((prev) => ({ ...prev, [key]: true }));
      if (nextPatch.operator_decision === "skip" || nextPatch.operator_decision === "misc") {
        setOpenSectionIds((prev) => ({ ...prev, [key]: false }));
      }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ??
        "Could not save section note.";
      setParseError(msg);
    } finally {
      setSavingSectionIds((prev) => ({ ...prev, [key]: false }));
    }
  }

  function advanceAfterSectionAction(filename: string, sectionId: string) {
    const sections = parseJob?.section_map?.files[filename]?.sections ?? [];
    const idx = sections.findIndex((section) => section.section_id === sectionId);
    const currentKey = `${filename}:${sectionId}`;
    const nextSection = idx >= 0 ? sections[idx + 1] : null;
    setOpenSectionIds((prev) => ({
      ...prev,
      [currentKey]: false,
      ...(nextSection ? { [`${filename}:${nextSection.section_id}`]: true } : {}),
    }));
  }

  function handleSectionQuickAction(filename: string, section: SourceSection, patch: Partial<SourceSection>) {
    const key = `${filename}:${section.section_id}`;
    const draftNotes = getSectionNoteDraft(key, section);
    const nextPatch = patch.operator_notes === undefined
      ? { ...patch, operator_notes: draftNotes }
      : { ...patch, operator_notes: draftNotes.trim() ? draftNotes : patch.operator_notes };
    updateSectionMapRow(filename, section.section_id, nextPatch);
    advanceAfterSectionAction(filename, section.section_id);
    void saveSectionMapRow(filename, section, nextPatch, { applyLocalPatch: false });
  }

  function getSectionNoteDraft(sectionKey: string, section: SourceSection) {
    return sectionNoteDraftsRef.current[sectionKey] ?? section.operator_notes ?? "";
  }

  function writeSectionNoteDraft(sectionKey: string, value: string, cursor?: number) {
    sectionNoteDraftsRef.current[sectionKey] = value;
    if (cursor !== undefined) {
      sectionNoteCursorsRef.current[sectionKey] = cursor;
    }
    const target = sectionNoteElementsRef.current[sectionKey];
    if (!target) return;
    target.value = value;
    if (cursor !== undefined) {
      requestAnimationFrame(() => target.setSelectionRange(cursor, cursor));
    }
  }

  function insertSectionNoteAtCursor(
    filename: string,
    section: SourceSection,
    line: string,
    patch: Partial<SourceSection> = {},
  ) {
    const key = `${filename}:${section.section_id}`;
    const existing = getSectionNoteDraft(key, section);
    const fallbackCursor = existing.length;
    const cursor = Math.max(0, Math.min(sectionNoteCursorsRef.current[key] ?? fallbackCursor, existing.length));
    const prefix = existing.slice(0, cursor);
    const suffix = existing.slice(cursor);
    const beforeLineBreak = prefix && !prefix.endsWith("\n") ? "\n" : "";
    const afterLineBreak = suffix && !suffix.startsWith("\n") ? "\n" : "";
    const nextNotes = `${prefix}${beforeLineBreak}${line}${afterLineBreak}${suffix}`;
    const nextCursor = prefix.length + beforeLineBreak.length + line.length;

    writeSectionNoteDraft(key, nextNotes, nextCursor);
    updateSectionMapRow(filename, section.section_id, {
      operator_decision: section.operator_decision === "skip" || section.operator_decision === "misc"
        ? section.operator_decision
        : "review",
      ...patch,
      operator_notes: nextNotes,
    });
  }

  function updateSectionNoteCursor(sectionKey: string, target: HTMLTextAreaElement) {
    sectionNoteDraftsRef.current[sectionKey] = target.value;
    sectionNoteCursorsRef.current[sectionKey] = target.selectionStart ?? 0;
  }

  function sectionQuickLabels(): { label: string; noteLine: string; operatorLabel: string }[] {
    const verticalTypes = selectedVertical ? VERTICAL_ENTITY_TYPES[selectedVertical] : VERTICAL_ENTITY_TYPES["food-service"];
    const preferredLabels: Record<string, string> = {
      recipe: "Recipe",
      meal: "Meal",
      ingredient: "Ingredients",
      supplier: "Supplier",
      supply: "Supply",
      order: "Order",
      "dietary-restriction": "Dietary Restriction",
    };
    return verticalTypes
      .filter((type) => ["recipe", "meal", "ingredient", "supplier", "supply", "order", "dietary-restriction"].includes(type.slug))
      .map((type) => {
        const label = preferredLabels[type.slug] ?? type.label;
        return {
          label,
          operatorLabel: label,
          noteLine: `${label}:`,
        };
      });
  }

  function isSectionReviewed(section: SourceSection) {
    return Boolean(
      section.operator_label ||
      section.operator_notes?.trim() ||
      section.operator_confidence ||
      (section.operator_decision ?? "review") !== "review",
    );
  }

  function reviewSectionProgress(filename: string) {
    const sections = parseJob?.section_map?.files[filename]?.sections ?? [];
    const decisions = sections.reduce<Record<string, number>>((acc, section) => {
      const decision = section.operator_decision ?? "review";
      acc[decision] = (acc[decision] ?? 0) + 1;
      return acc;
    }, {});
    const touched = sections.filter((section) => (
      section.operator_label ||
      section.operator_notes ||
      section.operator_confidence ||
      (section.operator_decision ?? "review") !== "review"
    ));
    const firstUntouched = sections.find((section) => !(
      section.operator_label ||
      section.operator_notes ||
      section.operator_confidence ||
      (section.operator_decision ?? "review") !== "review"
    ));
    const notes = touched.map((section) => `${section.operator_label ?? ""}\n${section.operator_notes ?? ""}`).join("\n").toLowerCase();
    const impliedTypes = [
      ["Meal", /\bmeal\b|meal\.|breakfast|lunch|dinner/],
      ["Recipe", /\brecipe\b|recipes\s*=/],
      ["Ingredient", /\bingredient\b|ingredients\s*=/],
      ["Supplier", /\bsupplier\b|suppliers\s*=/],
      ["Supply", /\bsupply\b|\bsupplies\b|gloves|plates|utensils/],
      ["Order", /\border\b|order\.supplier/],
      ["Dietary Restriction", /dietary|vegan|vegetarian|gluten free|dairy free/],
    ].filter(([, pattern]) => (pattern as RegExp).test(notes)).map(([label]) => label);
    return {
      total: sections.length,
      touched: touched.length,
      decisions,
      firstUntouched,
      impliedTypes,
    };
  }

  function combineSectionWithNext(filename: string, section: SourceSection) {
    const sections = parseJob?.section_map?.files[filename]?.sections ?? [];
    const idx = sections.findIndex((candidate) => candidate.section_id === section.section_id);
    const nextSection = idx >= 0 ? sections[idx + 1] : null;
    if (!nextSection) return;
    setParseJob((prev) => {
      if (!prev?.section_map) return prev;
      const fileMap = prev.section_map.files[filename];
      if (!fileMap) return prev;
      const nextSections = fileMap.sections.map((candidate) => (
        candidate.section_id === section.section_id
          ? {
              ...candidate,
              title: `${section.title} + ${nextSection.title}`,
              content_markdown: [section.content_markdown, nextSection.content_markdown].filter(Boolean).join("\n\n"),
              content_chars: (section.content_markdown?.length ?? 0) + (nextSection.content_markdown?.length ?? 0) + 2,
              end_char: nextSection.end_char,
              merged_section_ids: [
                ...(section.merged_section_ids ?? [section.section_id]),
                ...(nextSection.merged_section_ids ?? [nextSection.section_id]),
              ],
              merged_titles: [
                ...(section.merged_titles ?? [section.title]),
                ...(nextSection.merged_titles ?? [nextSection.title]),
              ],
            }
          : candidate
      )).filter((candidate) => candidate.section_id !== nextSection.section_id);
      const nextFileMap = {
        ...fileMap,
        status: "operator_review",
        sections: nextSections,
      };
      const nextSectionMap = {
        ...prev.section_map,
        status: "operator_review",
        files: {
          ...prev.section_map.files,
          [filename]: nextFileMap,
        },
      };
      return {
        ...prev,
        section_map: nextSectionMap,
        phase1_results: {
          ...prev.phase1_results,
          section_map: nextSectionMap,
        },
      };
    });
    setOpenSectionIds((prev) => ({
      ...prev,
      [`${filename}:${section.section_id}`]: true,
      [`${filename}:${nextSection.section_id}`]: false,
    }));
    void saveSectionMapRow(filename, section, {}, { applyLocalPatch: false, combineWithNext: true });
  }

  // Poll for Phase 2 completion every 5s
  useEffect(() => {
    if (introState !== "analyzing" || !parseJob) return;
    const interval = setInterval(async () => {
      try {
        const res = await axiosInstance.get(
          `/api/catalyst/groups/${slug}/parse-jobs/${parseJob.job_id}/status/`,
        );
        const data = res.data as {
          status: string;
          files_done: number;
          files_total: number;
          source_inventory?: SourceInventory;
          strategy_map?: StrategyMap;
          section_map?: SourceSectionMap;
          merged_registers?: ParsedFileRegister[];
        };
        if (data.source_inventory || data.strategy_map || data.section_map) {
          setParseJob((prev) => prev ? {
            ...prev,
            source_inventory: data.source_inventory ?? prev.source_inventory,
            strategy_map: data.strategy_map ?? prev.strategy_map,
            section_map: data.section_map ?? prev.section_map,
            phase1_results: {
              ...prev.phase1_results,
              ...(data.source_inventory ? { source_inventory: data.source_inventory } : {}),
              ...(data.strategy_map ? { strategy_map: data.strategy_map } : {}),
              ...(data.section_map ? { section_map: data.section_map } : {}),
            },
          } : prev);
        }
        setAnalysisProgress({ done: data.files_done, total: data.files_total });
        if (data.status === "complete") {
          const merged = data.merged_registers ?? [];
          if (merged.length) {
            const rawRows = merged.map((r) => ({
              slug: r.slug,
              displayName: r.display_name,
              canonSynonym: r.canon_synonym || "Active",
              entryCount: r.entry_count,
              sourceFile: r.source_file,
            }));
            setRegisters(consolidateByEntityType(rawRows));
          }
          setIntroState("confirming");
        }
      } catch {
        // silent — keep polling
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [introState, parseJob, slug]);

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) setSelectedFiles((prev) => [...prev, ...files]);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) setSelectedFiles((prev) => [...prev, ...files]);
  }

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minH="100vh" bg={shellBg}>
        <Spinner size="lg" color="blue.500" />
      </Box>
    );
  }

  const showBubble = ["questions", "animating", "bubble", "phase1_review", "analyzing", "confirming"].includes(introState);
  const showRegNav = introState === "browse";

  return (
    <>
    <style>{`
      @keyframes cat-dissolve-out {
        0%   { opacity: 1; transform: scale(1) translateX(0); }
        60%  { opacity: 0.5; transform: scale(0.55) translateX(-18%); }
        100% { opacity: 0; transform: scale(0.25) translateX(-32%); }
      }
      @keyframes cat-bubble-appear {
        0%   { opacity: 0; transform: scale(0.3); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes cat-work-appear {
        0%   { opacity: 0; transform: translateY(14px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      .cat-tiptap-body {
        outline: none;
        font-size: 15px;
        line-height: 1.75;
        min-height: 320px;
      }
      .cat-tiptap-body h1 { font-size: 1.65em; font-weight: 750; margin: 0 0 0.7em; letter-spacing: 0; }
      .cat-tiptap-body h2 { font-size: 1.18em; font-weight: 700; margin: 1.2em 0 0.45em; letter-spacing: 0; }
      .cat-tiptap-body p  { margin: 0 0 0.75em; }
      .cat-tiptap-body strong { font-weight: 600; }
      .cat-tiptap-body em { font-style: italic; }
      .cat-tiptap-body code { font-family: monospace; background: rgba(0,0,0,0.06); padding: 1px 4px; border-radius: 3px; font-size: 0.88em; }
      .cat-tiptap-body ul, .cat-tiptap-body ol { padding-left: 1.35em; margin: 0 0 0.8em; }
      .cat-tiptap-body li { margin: 0.18em 0; }
    `}</style>
    <Box
      className="cat-shell"
      display="flex"
      height="100%"
      minH="calc(100vh - 60px)"
      bg={shellBg}
      overflow="hidden"
    >
      {/* ── LEFT PANEL — constant persistence anchor ────────────────────── */}
      <Box
        className="cat-left"
        width="52px"
        bg={BRAND}
        display="flex"
        flexDirection="column"
        alignItems="center"
        py={4}
        gap={4}
        flexShrink={0}
        borderRight="1px solid rgba(255,255,255,0.06)"
      >
        <Box
          title="Codex anchor"
          fontSize="18px"
          color="white"
          opacity={0.55}
          cursor="default"
          lineHeight="1"
          userSelect="none"
        >
          ◈
        </Box>

        {showBubble && (
          <Box
            className="cat-intro-bubble"
            onClick={introState !== "animating" ? handleRestoreIntro : undefined}
            cursor={introState !== "animating" ? "pointer" : "default"}
            w="34px"
            h="34px"
            borderRadius="full"
            bg="rgba(255,255,255,0.10)"
            border="1px solid rgba(255,255,255,0.18)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            title="Restore orientation"
            animation={introState === "bubble" || introState === "confirming" ? "cat-bubble-appear 0.3s ease forwards" : undefined}
            _hover={introState !== "animating" ? { bg: "rgba(255,255,255,0.18)" } : undefined}
            transition="background 0.15s"
          >
            <Text fontSize="13px" lineHeight="1">📍</Text>
          </Box>
        )}

        {showRegNav && (
          <Box
            as="button"
            onClick={() => setIntroState("center")}
            w="34px"
            h="34px"
            borderRadius="full"
            bg="rgba(255,255,255,0.10)"
            border="1px solid rgba(255,255,255,0.18)"
            display="flex"
            alignItems="center"
            justifyContent="center"
            title="Back to landing"
            _hover={{ bg: "rgba(255,255,255,0.18)" }}
            transition="background 0.15s"
          >
            <Text fontSize="13px" lineHeight="1">🏠</Text>
          </Box>
        )}
      </Box>

      {/* ── REGISTER NAV PANEL — visible in browse state ─────────────────── */}
      {showRegNav && (
        <Box
          className="cat-reg-nav"
          width="286px"
          flexShrink={0}
          bg={navBg}
          borderRight="1px solid"
          borderColor={navBorder}
          display="flex"
          flexDirection="column"
          overflow="hidden"
        >
          <Box px={3} py={3} borderBottom="1px solid" borderColor={navBorder}>
            <Text
              fontSize="9px"
              fontWeight="700"
              letterSpacing="0.12em"
              textTransform="uppercase"
              color={mutedText}
            >
              Register of Registers
            </Text>
            <Text fontSize="xs" color={mutedText} mt={1} lineHeight="1.4">
              {group?.title}
            </Text>
            <Box
              className="cat-reg-nav-job-context"
              mt={2}
              px={2}
              py={1}
              borderRadius="md"
              bg={chipBg}
              border="1px solid"
              borderColor={chipBorder}
            >
              <Text fontSize="10px" fontWeight="700" color={chipText} textTransform="uppercase">
                Active job {activeParseJobLabel}
              </Text>
              {activeParseJobFiles.length > 0 && (
                <Text fontSize="10px" color={mutedText} mt="2px" lineHeight="1.35">
                  {activeParseJobFiles.join(", ")}
                </Text>
              )}
            </Box>
          </Box>

          <Box flex={selectedRegSlug && entryList.length > 0 ? "0 0 36%" : "1"} overflowY="auto" py={1}>
            {registerListLoading ? (
              <Box px={3} py={4}>
                <Spinner size="xs" color="blue.400" />
              </Box>
            ) : registerList.length === 0 ? (
              <Box px={3} py={4}>
                <Text fontSize="xs" color={mutedText}>
                  No registers yet. Import files to create them.
                </Text>
              </Box>
            ) : (
              registerList.map((reg) => (
                <Box
                  key={reg.slug}
                  className="cat-reg-nav-item"
                  as="button"
                  w="full"
                  textAlign="left"
                  px={3}
                  py="9px"
                  bg={selectedRegSlug === reg.slug ? navItemActive : "transparent"}
                  _hover={{ bg: selectedRegSlug === reg.slug ? navItemActive : navItemHover }}
                  transition="background 0.1s"
                  onClick={() => selectRegister(reg.slug)}
                  borderLeft="3px solid"
                  borderColor={selectedRegSlug === reg.slug ? navActiveText : "transparent"}
                >
                  <Text
                    fontSize="12px"
                    fontWeight={selectedRegSlug === reg.slug ? "600" : "400"}
                    color={selectedRegSlug === reg.slug ? navActiveText : chipText}
                    lineHeight="1.3"
                    mb="2px"
                  >
                    {reg.title || reg.slug}
                  </Text>
                  <HStack gap={1.5}>
                    <Text fontSize="10px" color={synonymLabel}>
                      {reg.entry_count} entries
                    </Text>
                    <Box
                      px="5px"
                      py="1px"
                      borderRadius="full"
                      bg={reg.status === "canon" ? canonBadgeBg : preCanonBg}
                    >
                      <Text
                        fontSize="9px"
                        fontWeight="600"
                        color={reg.status === "canon" ? canonBadgeText : preCanonText}
                      >
                        {reg.status === "canon" ? "accepted" : "draft"}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              ))
            )}
          </Box>

          {selectedRegSlug && entryList.length > 0 && (
            <Box
              className="cat-reg-entry-nav"
              flex="1"
              minH="0"
              borderTop="1px solid"
              borderColor={navBorder}
              display="flex"
              flexDirection="column"
            >
              <Box px={3} py={2} flexShrink={0}>
                <Text
                  fontSize="9px"
                  fontWeight="700"
                  letterSpacing="0.12em"
                  textTransform="uppercase"
                  color={mutedText}
                >
                  {regMeta?.title ?? selectedRegSlug.replace(/-/g, " ")}
                </Text>
                <Text fontSize="10px" color={synonymLabel} mt={0.5}>
                  {entryList.length} items
                </Text>
              </Box>
              <Box flex="1" minH="0" overflowY="auto" pb={2}>
                {entryList.map((entry) => (
                  <Box
                    key={entry.slug}
                    as="button"
                    w="full"
                    textAlign="left"
                    px={3}
                    py="7px"
                    borderLeft="3px solid"
                    borderColor={selectedEntrySlug === entry.slug ? BRAND : "transparent"}
                    bg={selectedEntrySlug === entry.slug ? navItemActive : "transparent"}
                    _hover={{ bg: selectedEntrySlug === entry.slug ? navItemActive : navItemHover }}
                    transition="background 0.1s"
                    onClick={() => loadEntry(selectedRegSlug, entry.slug)}
                  >
                    <Text
                      fontSize="11px"
                      lineHeight="1.25"
                      fontWeight={selectedEntrySlug === entry.slug ? "650" : "450"}
                      color={selectedEntrySlug === entry.slug ? navActiveText : chipText}
                    >
                      {entry.title}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          <Box px={3} py={3} borderTop="1px solid" borderColor={navBorder}>
            <Box
              as="button"
              onClick={() => {
                setIntroState("bubble");
                setSelectedRegSlug(null);
              }}
              fontSize="11px"
              color={mutedText}
              _hover={{ color: BRAND }}
              transition="color 0.12s"
              cursor="pointer"
            >
              + Import more files
            </Box>
          </Box>
        </Box>
      )}

      {/* ── MAIN AREA ───────────────────────────────────────────────────── */}
      <Box className="cat-main" flex="1" display="flex" flexDirection="column" overflow="hidden">

        {/* TOP BAR */}
        <Box
          className="cat-top-bar"
          bg={topBarBg}
          borderBottom="1px solid"
          borderColor={topBarBorder}
          px={4}
          py="7px"
          display="flex"
          alignItems="center"
          gap={3}
          flexShrink={0}
        >
          {/* Breadcrumb trail */}
          <HStack gap={1} flexShrink={0} align="center">
            <Text
              as={introState !== "center" ? "button" : "span"}
              fontSize="10px"
              fontWeight="700"
              letterSpacing="0.1em"
              textTransform="uppercase"
              color={introState !== "center" ? BRAND : mutedText}
              cursor={introState !== "center" ? "pointer" : "default"}
              userSelect="none"
              opacity={introState !== "center" ? 1 : 1}
              _hover={introState !== "center" ? { opacity: 0.7 } : undefined}
              transition="opacity 0.12s"
              onClick={introState !== "center" ? () => setIntroState("center") : undefined}
              title={introState !== "center" ? "← Start Here" : undefined}
            >
              {group?.title ?? "Catalyst"}
            </Text>
            {(introState === "questions" || introState === "bubble" || introState === "animating") && (
              <>
                <Text fontSize="10px" color={mutedText}>/</Text>
                <Text fontSize="10px" fontWeight="700" color={mutedText} userSelect="none">Set up</Text>
              </>
            )}
            {introState === "phase1_review" && (
              <>
                <Text fontSize="10px" color={mutedText}>/</Text>
                <Text fontSize="10px" fontWeight="700" color={mutedText} userSelect="none">First pass</Text>
              </>
            )}
            {introState === "analyzing" && (
              <>
                <Text fontSize="10px" color={mutedText}>/</Text>
                <Text fontSize="10px" fontWeight="700" color={mutedText} userSelect="none">Analyzing…</Text>
              </>
            )}
            {introState === "confirming" && (
              <>
                <Text fontSize="10px" color={mutedText}>/</Text>
                <Text
                  as="button"
                  fontSize="10px"
                  fontWeight="600"
                  color={mutedText}
                  cursor="pointer"
                  userSelect="none"
                  _hover={{ color: BRAND }}
                  transition="color 0.12s"
                  onClick={() => setIntroState("bubble")}
                >
                  Import
                </Text>
                <Text fontSize="10px" color={mutedText}>/</Text>
                <Text fontSize="10px" fontWeight="700" color={mutedText} userSelect="none">Confirm</Text>
              </>
            )}
            {introState === "browse" && (
              <>
                <Text fontSize="10px" color={mutedText}>/</Text>
                <Text fontSize="10px" fontWeight="700" color={mutedText} userSelect="none">Codex</Text>
              </>
            )}
          </HStack>
          <Box w="1px" h="14px" bg={topBarBorder} flexShrink={0} />

          <Input
            ref={inputRef}
            value={cmdInput}
            onChange={(e) => setCmdInput(e.target.value)}
            placeholder="Find, Amend, Add…"
            size="sm"
            flex="1"
            fontSize="sm"
            fontFamily="mono"
            border="none"
            background="transparent"
            boxShadow="none"
            _focus={{ boxShadow: "none", outline: "none" }}
            _placeholder={{ color: mutedText, opacity: 0.7 }}
          />

          <HStack gap={1} flexShrink={0}>
            {VERBS.map((v) => (
              <Box
                key={v}
                as="button"
                onClick={() => seedVerb(v)}
                px="8px"
                py="2px"
                borderRadius="4px"
                bg={chipBg}
                border="1px solid"
                borderColor={chipBorder}
                fontSize="11px"
                fontWeight="600"
                color={chipText}
                cursor="pointer"
                fontFamily="mono"
                _hover={{ borderColor: BRAND, color: BRAND }}
                transition="all 0.12s"
              >
                {v}
              </Box>
            ))}
          </HStack>
        </Box>

        {/* STEP STRIP — questions / bubble / phase1_review / analyzing / confirming */}
        {(["questions", "bubble", "animating", "phase1_review", "analyzing", "confirming"] as IntroState[]).includes(introState) && (
          <Box
            className="cat-step-strip"
            bg={topBarBg}
            borderBottom="1px solid"
            borderColor={topBarBorder}
            px={5}
            py="5px"
            display="flex"
            alignItems="center"
            gap={2}
            flexShrink={0}
          >
            {([
              { n: 1, label: "Set up",           states: ["questions", "bubble", "animating"] },
              { n: 2, label: "First pass",        states: ["phase1_review"] },
              { n: 3, label: "Confirm & accept",  states: ["analyzing", "confirming"] },
            ] as const).map(({ n, label, states }, idx) => {
              const order: Record<string, number> = {
                center: 0, questions: 1, animating: 1, bubble: 1,
                phase1_review: 2, analyzing: 3, confirming: 3, browse: 4,
              };
              const cur = order[introState] ?? 0;
              const isActive = states.some((s) => s === introState) || (n === 3 && cur === 3);
              const isDone = cur > n;
              return (
                <HStack key={label} gap={2} align="center">
                  {idx > 0 && (
                    <Box flex="1" h="1px" bg={isDone ? "green.300" : topBarBorder} w="24px" />
                  )}
                  <Box
                    w="16px" h="16px" borderRadius="full" display="flex" alignItems="center" justifyContent="center" flexShrink={0}
                    bg={isActive ? BRAND : isDone ? "green.400" : chipBg}
                    border="1px solid"
                    borderColor={isActive ? BRAND : isDone ? "green.400" : chipBorder}
                  >
                    <Text fontSize="8px" fontWeight="800" color={isActive || isDone ? "white" : mutedText} lineHeight="1">
                      {isDone ? "✓" : n}
                    </Text>
                  </Box>
                  <Text fontSize="10px" fontWeight={isActive ? "700" : "500"} color={isActive ? chipText : mutedText} userSelect="none">
                    {label}
                  </Text>
                </HStack>
              );
            })}
          </Box>
        )}

        {/* CENTER */}
        <Box
          className="cat-center"
          flex="1"
          overflow="auto"
          bg={centerBg}
          position="relative"
        >

          {/* ── INTRO / LANDING ── */}
          {(introState === "center" || introState === "animating") && (
            <Box
              className="cat-intro"
              position="absolute"
              inset={0}
              overflow="auto"
              display="flex"
              justifyContent="center"
              p={{ base: 5, md: 8 }}
              animation={
                introState === "animating"
                  ? "cat-dissolve-out 0.48s cubic-bezier(0.4,0,0.2,1) forwards"
                  : undefined
              }
              pointerEvents={introState === "animating" ? "none" : undefined}
            >
              <Box className="cat-intro-inner" maxW="640px" w="full">
                <VStack align="stretch" gap={6}>

                  {/* Header */}
                  <Box
                    className="cat-intro-header"
                    bg={BRAND}
                    color="white"
                    px={8}
                    py={7}
                    borderRadius="xl"
                    boxShadow="0 4px 24px rgba(0,0,0,0.10)"
                  >
                    <Text
                      fontSize="10px"
                      fontWeight="700"
                      letterSpacing="0.12em"
                      textTransform="uppercase"
                      opacity={0.45}
                      mb={3}
                    >
                      Catalyst · Foundation
                    </Text>
                    <Heading
                      as="h1"
                      fontSize={{ base: "xl", md: "2xl" }}
                      fontWeight="700"
                      letterSpacing="-0.02em"
                      mb={2}
                    >
                      {group?.title}
                    </Heading>
                    {group?.quick_intro && (
                      <Text fontSize="sm" opacity={0.65} mb={4}>
                        {group.quick_intro}
                      </Text>
                    )}
                    <HStack gap={2}>
                      <Box w="7px" h="7px" borderRadius="full" bg="green.400" flexShrink={0} />
                      <Text fontSize="xs" fontWeight="500" opacity={0.8}>
                        Codex active — CORE + FIXTURE indexed
                      </Text>
                    </HStack>
                  </Box>

                  {/* Start here */}
                  <Box
                    className="cat-start-here"
                    bg={startHereBg}
                    border="1px solid"
                    borderColor={startHereBorder}
                    borderRadius="lg"
                    p={5}
                  >
                    <HStack gap={3} mb={2}>
                      <Text fontSize="lg">📍</Text>
                      <Text fontWeight="700" fontSize="md">Start here</Text>
                    </HStack>
                    <Text fontSize="sm" color={mutedText} mb={4}>
                      Open <strong>START-HERE.md</strong> in your Codex to orient yourself — it maps out
                      your knowledge structure, key files, and what to build first.
                    </Text>
                    <HStack gap={3} flexWrap="wrap">
                      <Button
                        onClick={handleStartQuestions}
                        bg={BRAND}
                        color="white"
                        _hover={{ opacity: 0.88 }}
                        size="sm"
                        fontWeight="600"
                      >
                        Set up your ingest →
                      </Button>
                      <Button
                        onClick={handleGoToBrowse}
                        variant="outline"
                        size="sm"
                        fontWeight="600"
                      >
                        View Register of Registers →
                      </Button>
                      <Button
                        onClick={handleResumeLatestReview}
                        variant="outline"
                        size="sm"
                        fontWeight="600"
                        loading={resumingReview}
                        disabled={resumingReview}
                      >
                        Resume latest inventory review →
                      </Button>
                    </HStack>
                    {parseError && (
                      <Text fontSize="xs" color="red.600" mt={3}>
                        {parseError}
                      </Text>
                    )}
                  </Box>

                  {/* Three pillars */}
                  <Box className="cat-pillars">
                    <Text
                      fontSize="10px"
                      fontWeight="700"
                      letterSpacing="0.1em"
                      textTransform="uppercase"
                      color={mutedText}
                      mb={3}
                    >
                      What&apos;s in your Codex
                    </Text>
                    <VStack gap={3} align="stretch">
                      {[
                        {
                          icon: "📚",
                          title: "Knowledge Base",
                          body: "Seeded with the Catalyst CORE library — the foundational types, patterns, and structure your team will build on.",
                        },
                        {
                          icon: "🗂",
                          title: "Context Files",
                          body: "Who you are, how you work, what you offer. These are the files Beryl draws from when it helps your team.",
                        },
                        {
                          icon: "⚙️",
                          title: "Operational Files",
                          body: "Procedures, playbooks, and workflows. Active knowledge — not archive, not notes. Living documents your team acts on.",
                        },
                      ].map(({ icon, title, body }) => (
                        <HStack
                          key={title}
                          className="cat-pillar"
                          align="start"
                          gap={4}
                          p={4}
                          bg={cardBg}
                          border="1px solid"
                          borderColor={cardBorder}
                          borderRadius="md"
                        >
                          <Text fontSize="xl" flexShrink={0} mt="1px">{icon}</Text>
                          <Box>
                            <Text fontWeight="600" fontSize="sm" mb={1}>{title}</Text>
                            <Text fontSize="sm" color={mutedText}>{body}</Text>
                          </Box>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>

                  {/* Team preview */}
                  {(group?.member_preview ?? []).length > 0 && (
                    <Box className="cat-team">
                      <Text
                        fontSize="10px"
                        fontWeight="700"
                        letterSpacing="0.1em"
                        textTransform="uppercase"
                        color={mutedText}
                        mb={3}
                      >
                        Your team
                      </Text>
                      <HStack gap={3} flexWrap="wrap">
                        {(group?.member_preview ?? []).map((m) => (
                          <HStack key={m.username} gap={2}>
                            <Avatar.Root size="sm">
                              <Avatar.Image src={m.avatar_url || undefined} />
                              <Avatar.Fallback>
                                {(m.display_name || m.username).charAt(0).toUpperCase()}
                              </Avatar.Fallback>
                            </Avatar.Root>
                            <Text fontSize="sm">{m.display_name || m.username}</Text>
                          </HStack>
                        ))}
                      </HStack>
                    </Box>
                  )}

                  <Text className="cat-support" fontSize="xs" color={mutedText}>
                    Questions or need a walkthrough? Reply to your activation email — we&apos;re here.
                  </Text>

                </VStack>
              </Box>
            </Box>
          )}

          {/* ── STEP 1 — SETUP: vertical + files + entity types ── */}
          {introState === "questions" && (
            <Box
              className="cat-setup-surface"
              maxW="640px"
              mx="auto"
              px={6}
              py={10}
              animation="cat-work-appear 0.4s ease forwards"
            >
              <VStack align="stretch" gap={7}>
                {/* Themed header — changes when vertical is selected */}
                <Box
                  bg={selectedVertical ? VERTICAL_THEME[selectedVertical].accent : BRAND}
                  color="white"
                  px={6}
                  py={5}
                  borderRadius="xl"
                  transition="background 0.3s ease"
                >
                  <Text fontSize="10px" fontWeight="700" letterSpacing="0.12em" textTransform="uppercase" opacity={0.5} mb={2}>
                    {selectedVertical ? VERTICALS.find((v) => v.id === selectedVertical)?.label : "Catalyst"} · Ingest Setup
                  </Text>
                  <Heading as="h2" fontSize="xl" fontWeight="700" letterSpacing="-0.02em" mb={1}>
                    {selectedVertical
                      ? `${VERTICALS.find((v) => v.id === selectedVertical)?.icon} Let's set up your ${VERTICALS.find((v) => v.id === selectedVertical)?.label.toLowerCase()} ingest`
                      : "Let's set up your ingest"}
                  </Heading>
                  <Text fontSize="sm" opacity={0.75} lineHeight="1.6">
                    Choose your vertical, add your files, and tell us what to look for.
                  </Text>
                </Box>

                {/* Vertical selector */}
                <Box>
                  <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color={mutedText} mb={3}>
                    What kind of operation is this?
                  </Text>
                  <HStack gap={3} flexWrap="wrap">
                    {VERTICALS.map((v) => {
                      const active = selectedVertical === v.id;
                      const theme = VERTICAL_THEME[v.id];
                      return (
                        <Box
                          key={v.id}
                          as="button"
                          onClick={() => handleVerticalSelect(v.id)}
                          px={4}
                          py={3}
                          borderRadius="lg"
                          border="2px solid"
                          borderColor={active ? theme.accent : chipBorder}
                          bg={active ? theme.accent : cardBg}
                          cursor="pointer"
                          transition="all 0.2s"
                          _hover={{ borderColor: theme.accentMuted }}
                          flex="1"
                          minW="140px"
                          textAlign="left"
                        >
                          <Text fontSize="lg" mb={1}>{v.icon}</Text>
                          <Text fontSize="sm" fontWeight="700" color={active ? "white" : chipText}>{v.label}</Text>
                          <Text fontSize="11px" color={active ? "whiteAlpha.700" : mutedText} lineHeight="1.4">{v.description}</Text>
                        </Box>
                      );
                    })}
                  </HStack>
                </Box>

                {/* File drop zone */}
                <Box>
                  <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color={mutedText} mb={3}>
                    Add your files
                  </Text>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".md,.pdf,.docx,.doc,.txt,.xlsx,.xls,.csv"
                    style={{ display: "none" }}
                    onChange={handleFileInputChange}
                  />
                  <Box
                    borderRadius="lg"
                    border="2px dashed"
                    borderColor={dragOver ? BRAND : dropZoneBorder}
                    p={8}
                    textAlign="center"
                    cursor="pointer"
                    bg={dragOver ? dropZoneHoverBg : cardBg}
                    _hover={{ borderColor: BRAND, bg: dropZoneHoverBg }}
                    transition="all 0.15s"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                  >
                    <Text fontSize="xl" mb={2}>📂</Text>
                    <Text fontWeight="600" fontSize="sm" mb={1}>
                      {selectedFiles.length > 0
                        ? `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} selected`
                        : "Drop files here, or click to browse"}
                    </Text>
                    <Text fontSize="xs" color={mutedText}>
                      {selectedFiles.length > 0
                        ? selectedFiles.map((f) => f.name).join(", ").slice(0, 100)
                        : "Markdown, PDF, DOCX, XLSX, plain text"}
                    </Text>
                  </Box>
                </Box>

                {/* Entity type toggles — shown after vertical is chosen */}
                {selectedVertical && (
                  <Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
                      <Text fontSize="xs" fontWeight="700" letterSpacing="0.08em" textTransform="uppercase" color={mutedText}>
                        What other things might we find in these files?
                      </Text>
                      <Box
                        as="button"
                        onClick={() => {
                          if (selectedVertical === "food-service") {
                            const defaults: Record<string, boolean> = {};
                            VERTICAL_ENTITY_TYPES["food-service"].forEach((t) => { defaults[t.slug] = true; });
                            setEntityToggles(defaults);
                            setEntitySynonyms({
                              recipe: "dish, menu item",
                              purveyor: "partner, vendor",
                            });
                          }
                        }}
                        px="8px"
                        py="2px"
                        borderRadius="4px"
                        bg={chipBg}
                        border="1px solid"
                        borderColor={chipBorder}
                        fontSize="10px"
                        fontWeight="700"
                        color={mutedText}
                        cursor="pointer"
                        _hover={{ borderColor: BRAND, color: BRAND }}
                        transition="all 0.12s"
                      >
                        Demo
                      </Box>
                    </Box>
                    <Text fontSize="xs" color={mutedText} mb={3} lineHeight="1.6">
                      Turn off any types you don&apos;t have in these files. Click a type to add your own word for it.
                    </Text>
                    <VStack align="stretch" gap={2}>
                      {VERTICAL_ENTITY_TYPES[selectedVertical].map((t) => {
                        const on = entityToggles[t.slug] !== false;
                        const synOpen = synonymOpenFor === t.slug;
                        const synonym = entitySynonyms[t.slug] ?? "";
                        return (
                          <Box key={t.slug}>
                            <HStack
                              bg={cardBg}
                              border="1px solid"
                              borderColor={on ? cardBorder : chipBorder}
                              borderRadius={synOpen ? "lg lg 0 0" : "lg"}
                              px={4}
                              py={3}
                              gap={3}
                              opacity={on ? 1 : 0.45}
                              transition="opacity 0.15s"
                            >
                              <Box flex="1">
                                <Text fontSize="sm" fontWeight="600">{t.label}</Text>
                                <Text fontSize="11px" color={mutedText}>{t.description}</Text>
                              </Box>
                              <HStack gap={2} flexShrink={0}>
                                {on && (
                                  <Box
                                    as="button"
                                    onClick={() => setSynonymOpenFor(synOpen ? null : t.slug)}
                                    px="8px" py="2px" borderRadius="4px" cursor="pointer"
                                    bg={synOpen ? chipBorder : chipBg}
                                    border="1px solid" borderColor={chipBorder}
                                    fontSize="10px" fontWeight="600" color={mutedText}
                                    _hover={{ borderColor: mutedText }}
                                    title={synonym ? `Synonym: ${synonym}` : "Add your word for this"}
                                  >
                                    {synonym ? `≈ ${synonym.split(",")[0].trim()}` : "Add synonym"}
                                  </Box>
                                )}
                                <Box
                                  as="button"
                                  onClick={() => setEntityToggles((prev) => ({ ...prev, [t.slug]: !on }))}
                                  px="8px" py="2px" borderRadius="4px" cursor="pointer"
                                  bg={on ? BRAND : chipBg}
                                  border="1px solid" borderColor={on ? BRAND : chipBorder}
                                  fontSize="10px" fontWeight="700"
                                  color={on ? "white" : mutedText}
                                  transition="all 0.12s"
                                >
                                  {on ? "On" : "Off"}
                                </Box>
                              </HStack>
                            </HStack>
                            {synOpen && (
                              <Box
                                bg={cardBg}
                                border="1px solid" borderColor={cardBorder}
                                borderTop="none"
                                borderRadius="0 0 lg lg"
                                px={4} pb={3}
                              >
                                <Text fontSize="11px" color={mutedText} mt={2} mb={1}>
                                  What do you call {t.label.toLowerCase()} in your operation?
                                </Text>
                                <input
                                  autoFocus
                                  value={synonym}
                                  onChange={(e) => setEntitySynonyms((prev) => ({ ...prev, [t.slug]: e.target.value }))}
                                  placeholder={`e.g. your word for ${t.label.toLowerCase()}`}
                                  style={{
                                    width: "100%", fontSize: "12px", padding: "6px 8px",
                                    border: `1px solid ${cardBorder}`, borderRadius: "4px",
                                    background: "transparent", outline: "none", fontFamily: "inherit", color: "inherit",
                                  }}
                                />
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </VStack>
                    <Text fontSize="11px" color={mutedText} mt={3} textAlign="center" fontStyle="italic">
                      Your clarity helps us find things as efficiently as possible.
                    </Text>
                  </Box>
                )}

                {parseError && (
                  <Box px={3} py={2} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md">
                    <Text fontSize="xs" color="red.700">{parseError}</Text>
                  </Box>
                )}

                <HStack justify="space-between" align="center">
                  <Box
                    as="button"
                    onClick={() => setIntroState("center")}
                    fontSize="sm"
                    color={mutedText}
                    cursor="pointer"
                    _hover={{ color: BRAND }}
                    transition="color 0.12s"
                  >
                    ← Back
                  </Box>
                  <Button
                    onClick={handleParse}
                    bg={BRAND}
                    color="white"
                    _hover={{ opacity: 0.88 }}
                    size="md"
                    fontWeight="600"
                    loading={parsing}
                    disabled={parsing || !selectedFiles.length}
                  >
                    {selectedFiles.length
                      ? `Parse ${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} →`
                      : "Add files to continue →"}
                  </Button>
                </HStack>
              </VStack>
            </Box>
          )}

          {/* ── FILE IMPORT SURFACE ── */}
          {introState === "bubble" && (
            <Box
              className="cat-import-surface"
              maxW="600px"
              mx="auto"
              px={6}
              py={10}
              animation="cat-work-appear 0.4s ease forwards"
            >
              <VStack align="stretch" gap={7}>
                <Box>
                  <Heading as="h2" fontSize="xl" fontWeight="700" letterSpacing="-0.02em" mb={1}>
                    Bring in your files
                  </Heading>
                  <Text fontSize="sm" color={mutedText}>
                    Documents, lists, notes — anything that holds knowledge about how your team works.
                    We&apos;ll parse it and propose a structure for your review before anything is committed.
                  </Text>
                </Box>

                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".md,.pdf,.docx,.doc,.txt,.xlsx,.xls,.csv"
                  style={{ display: "none" }}
                  onChange={handleFileInputChange}
                />

                <Box
                  borderRadius="lg"
                  border="2px dashed"
                  borderColor={dragOver ? BRAND : dropZoneBorder}
                  p={12}
                  textAlign="center"
                  cursor="pointer"
                  bg={dragOver ? dropZoneHoverBg : cardBg}
                  _hover={{ borderColor: BRAND, bg: dropZoneHoverBg }}
                  transition="all 0.15s"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <Text fontSize="2xl" mb={3}>📂</Text>
                  <Text fontWeight="600" fontSize="sm" mb={1}>
                    {selectedFiles.length > 0
                      ? `${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} selected`
                      : "Drop files here"}
                  </Text>
                  <Text fontSize="xs" color={mutedText}>
                    {selectedFiles.length > 0
                      ? selectedFiles.map((f) => f.name).join(", ").slice(0, 80)
                      : "or click to browse — Markdown, PDF, DOCX, XLSX, plain text"}
                  </Text>
                </Box>

                {parseError && (
                  <Box px={3} py={2} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md">
                    <Text fontSize="xs" color="red.700">{parseError}</Text>
                  </Box>
                )}

                {selectedFiles.length > 0 && (
                  <Button
                    bg={BRAND}
                    color="white"
                    _hover={{ opacity: 0.88 }}
                    size="md"
                    w="full"
                    fontWeight="600"
                    onClick={handleParse}
                    loading={parsing}
                    disabled={parsing}
                  >
                    Parse {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} →
                  </Button>
                )}

                <Text
                  as="button"
                  fontSize="xs"
                  color={mutedText}
                  textAlign="center"
                  cursor="pointer"
                  _hover={{ color: BRAND }}
                  onClick={() => setIntroState("confirming")}
                >
                  Skip to Stage 4 → (dev shortcut — uses fixture data)
                </Text>

                <Box>
                  <Text
                    fontSize="10px"
                    fontWeight="700"
                    letterSpacing="0.1em"
                    textTransform="uppercase"
                    color={mutedText}
                    mb={3}
                  >
                    What happens next
                  </Text>
                  <VStack align="stretch" gap={2}>
                    {[
                      { step: "1", label: "Parse", body: "We read your files and propose artifact shapes — registers, playbooks, context files." },
                      { step: "2", label: "Review", body: "You confirm the shape before anything is created. Nothing is committed without your say-so." },
                      { step: "3", label: "Accept", body: "Accepted entries go into your Codex. You can accept now or leave something as a draft to decide later." },
                    ].map(({ step, label, body }) => (
                      <HStack
                        key={step}
                        align="start"
                        gap={3}
                        p={3}
                        bg={cardBg}
                        border="1px solid"
                        borderColor={cardBorder}
                        borderRadius="md"
                      >
                        <Box
                          w="22px"
                          h="22px"
                          borderRadius="full"
                          bg={BRAND}
                          color="white"
                          fontSize="10px"
                          fontWeight="700"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          flexShrink={0}
                          mt="1px"
                        >
                          {step}
                        </Box>
                        <Box>
                          <Text fontWeight="600" fontSize="sm">{label}</Text>
                          <Text fontSize="xs" color={mutedText}>{body}</Text>
                        </Box>
                      </HStack>
                    ))}
                  </VStack>
                </Box>

                <Text fontSize="xs" color={mutedText} textAlign="center">
                  Files stay in your Codex on your cluster. Nothing is shared without your explicit approval.
                </Text>
              </VStack>
            </Box>
          )}

          {/* ── PHASE 1 — STRUCTURE REVIEW ── */}
          {introState === "phase1_review" && parseJob && (
            <Box
              className="cat-phase1-surface"
              maxW="680px"
              mx="auto"
              px={6}
              py={10}
              animation="cat-work-appear 0.4s ease forwards"
            >
              <VStack align="stretch" gap={8}>
                <Box>
                  <HStack justify="space-between" align="flex-start" gap={4} mb={2}>
                    <Box>
                      <Heading as="h2" fontSize="xl" fontWeight="700" letterSpacing="-0.02em" mb={2}>
                        First pass — file inventory.
                      </Heading>
                      <Text fontSize="sm" color={mutedText} lineHeight="1.7">
                        Here&apos;s our local read of the files: duplicates, source shape,
                        likely strategy, and rough token weight. Confirm this before
                        we spend tokens on deeper analysis.
                      </Text>
                      <HStack mt={3} gap={2} wrap="wrap">
                        <Box
                          className="cat-active-parse-job-chip"
                          bg={chipBg}
                          border="1px solid"
                          borderColor={chipBorder}
                          borderRadius="md"
                          px={2}
                          py={1}
                        >
                          <Text fontSize="10px" fontWeight="700" color={chipText} textTransform="uppercase">
                            Active parse job: {activeParseJobLabel}
                          </Text>
                        </Box>
                        {activeParseJobFiles.length > 0 && (
                          <Text fontSize="11px" color={mutedText}>
                            Source: {activeParseJobFiles.join(", ")}
                          </Text>
                        )}
                      </HStack>
                    </Box>
                    <Button
                      size="sm"
                      variant="outline"
                      fontWeight="600"
                      flexShrink={0}
                      onClick={() => setTuneOpen(true)}
                    >
                      Tune
                    </Button>
                  </HStack>
                  {(parseJob.phase1_results.tuning_notes ?? []).length > 0 && (
                    <Box
                      bg={chipBg}
                      border="1px solid"
                      borderColor={chipBorder}
                      borderRadius="md"
                      px={3}
                      py={2}
                      mt={3}
                    >
                      <Text fontSize="10px" fontWeight="700" color={mutedText} textTransform="uppercase" mb={1}>
                        Tuning notes
                      </Text>
                      <VStack align="stretch" gap={1}>
                        {(parseJob.phase1_results.tuning_notes ?? []).slice(-3).map((note) => (
                          <Text key={note.id} fontSize="xs" color={mutedText}>
                            {note.shape && note.field && note.value
                              ? `${note.shape}.${note.field}: ${note.value}${note.confidence ? ` (${note.confidence})` : ""}`
                              : note.note}
                          </Text>
                        ))}
                      </VStack>
                    </Box>
                  )}
                </Box>

                {/* Duplicate file notice */}
                {(parseJob.skipped_duplicates ?? []).length > 0 && (
                  <Box
                    bg="yellow.50"
                    border="1px solid"
                    borderColor="yellow.300"
                    borderRadius="lg"
                    px={4}
                    py={3}
                  >
                    <Text fontSize="sm" fontWeight="600" color="yellow.800" mb={1}>
                      Duplicate file{(parseJob.skipped_duplicates ?? []).length > 1 ? "s" : ""} skipped
                    </Text>
                    <Text fontSize="xs" color="yellow.700">
                      {(parseJob.skipped_duplicates ?? []).join(", ")} — identical content to another uploaded file. Counts below reflect deduplicated files only.
                    </Text>
                  </Box>
                )}

                {/* Source Inventory + Strategy Review */}
                {parseJob.strategy_map && (
                  <Box
                    className="cat-strategy-review"
                    bg={cardBg}
                    border="1px solid"
                    borderColor={cardBorder}
                    borderRadius="lg"
                    p={5}
                  >
                    <HStack justify="space-between" align="flex-start" mb={4}>
                      <Box>
                        <Text fontSize="10px" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" color={mutedText} mb={1}>
                          Strategy review
                        </Text>
                        <Heading as="h3" fontSize="md" fontWeight="700">
                          Decide how each source should be used.
                        </Heading>
                      </Box>
                      <Box
                        px="8px"
                        py="3px"
                        borderRadius="4px"
                        bg={chipBg}
                        border="1px solid"
                        borderColor={chipBorder}
                        fontSize="10px"
                        fontWeight="700"
                        color={mutedText}
                        flexShrink={0}
                      >
                        {parseJob.strategy_map.status}
                      </Box>
                    </HStack>
                    <Text fontSize="xs" color={mutedText} lineHeight="1.6" mb={4}>
                      This is the resourceful pause: confirm the shape of each file,
                      hold anything uncertain, and leave notes before we spend tokens.
                    </Text>
                    <VStack align="stretch" gap={3}>
                      {Object.entries(parseJob.strategy_map.files).map(([filename, row]) => {
                        const inventory = parseJob.source_inventory?.files.find((item) => item.filename === filename);
                        const gaps = row.contract_gaps ?? [];
                        const duplicateOf = row.duplicate_of ?? inventory?.duplicate_of;
                        const decision = row.operator_decision ?? "review";
                        return (
                          <Collapsible.Root
                            key={filename}
                            className="cat-strategy-row"
                          >
                            <Box
                              border="1px solid"
                              borderColor={gaps.length ? "orange.300" : chipBorder}
                              borderRadius="md"
                              overflow="hidden"
                            >
                              <Collapsible.Trigger asChild>
                                <Box
                                  as="button"
                                  type="button"
                                  width="100%"
                                  textAlign="left"
                                  px={4}
                                  py={3}
                                  cursor="pointer"
                                  _hover={{ bg: chipBg }}
                                >
                                  <HStack align="center" justify="space-between" gap={4}>
                                    <Box minW={0} flex="1">
                                      <HStack gap={2} mb={1} minW={0}>
                                        <Text fontSize="sm" fontWeight="700" noOfLines={1}>
                                          {filename}
                                        </Text>
                                        {duplicateOf && (
                                          <Box
                                            px="6px"
                                            py="1px"
                                            borderRadius="4px"
                                            bg="orange.50"
                                            color="orange.700"
                                            fontSize="10px"
                                            fontWeight="700"
                                            flexShrink={0}
                                          >
                                            DUPLICATE
                                          </Box>
                                        )}
                                        {gaps.length > 0 && (
                                          <Box
                                            px="6px"
                                            py="1px"
                                            borderRadius="4px"
                                            bg="orange.50"
                                            color="orange.700"
                                            fontSize="10px"
                                            fontWeight="700"
                                            flexShrink={0}
                                          >
                                            CONTRACT GAP
                                          </Box>
                                        )}
                                      </HStack>
                                      <Text fontSize="xs" color={mutedText} noOfLines={1}>
                                        {(row.source_shape_id ?? row.source_shape ?? "unknown source")} · {row.strategy_id ?? row.strategy ?? "strategy pending"}
                                      </Text>
                                    </Box>
                                    <HStack gap={2} flexShrink={0}>
                                      <Box
                                        px="8px"
                                        py="3px"
                                        borderRadius="4px"
                                        bg={decision === "skip" ? "orange.50" : chipBg}
                                        border="1px solid"
                                        borderColor={decision === "skip" ? "orange.200" : chipBorder}
                                        fontSize="10px"
                                        fontWeight="700"
                                        color={decision === "skip" ? "orange.700" : mutedText}
                                      >
                                        {decision.toUpperCase()}
                                      </Box>
                                      <Text fontSize="xs" color={mutedText} whiteSpace="nowrap">
                                        {inventory?.estimated_tokens ?? "?"} est. ingest cost
                                      </Text>
                                      <Collapsible.Indicator />
                                    </HStack>
                                  </HStack>
                                </Box>
                              </Collapsible.Trigger>

                              <Collapsible.Content>
                                <Box px={4} pb={4} pt={1}>
                                  {duplicateOf && (
                                    <Text fontSize="xs" color="orange.700" mb={3}>
                                      Duplicate of {duplicateOf}; this should stay skipped.
                                    </Text>
                                  )}

                                  <HStack align="flex-start" justify="space-between" gap={4} mb={3}>
                                    <Box minW={0}>
                                      <Text fontSize="xs" color={mutedText}>
                                        {inventory?.file_type?.toUpperCase() ?? "FILE"} · {inventory?.text_status ?? "unknown"} text · {inventory?.text_chars ?? 0} chars
                                      </Text>
                                    </Box>
                                    <select
                                      value={decision}
                                      onChange={(e) => updateStrategyRow(filename, { operator_decision: e.target.value as StrategyMapRow["operator_decision"] })}
                                      style={{
                                        fontSize: "12px",
                                        padding: "6px 8px",
                                        border: `1px solid ${cardBorder}`,
                                        borderRadius: "6px",
                                        background: "transparent",
                                        color: "inherit",
                                      }}
                                    >
                                      <option value="review">Review</option>
                                      <option value="extract">Extract</option>
                                      <option value="hold">Hold</option>
                                      <option value="skip">Skip</option>
                                    </select>
                                  </HStack>

                                  <Box
                                    className="cat-strategy-fields"
                                    display="grid"
                                    gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }}
                                    gap={3}
                                    mb={3}
                                  >
                                    <Box>
                                      <Text fontSize="10px" fontWeight="700" color={mutedText} textTransform="uppercase" mb={1}>
                                        Source shape
                                      </Text>
                                      <Input
                                        value={row.source_shape_id ?? row.source_shape ?? ""}
                                        onChange={(e) => updateStrategyRow(filename, { source_shape_id: e.target.value })}
                                        size="sm"
                                        fontSize="12px"
                                      />
                                    </Box>
                                    <Box>
                                      <Text fontSize="10px" fontWeight="700" color={mutedText} textTransform="uppercase" mb={1}>
                                        Strategy
                                      </Text>
                                      <Input
                                        value={row.strategy_id ?? row.strategy ?? ""}
                                        onChange={(e) => updateStrategyRow(filename, { strategy_id: e.target.value, strategy: e.target.value })}
                                        size="sm"
                                        fontSize="12px"
                                      />
                                    </Box>
                                    <Box>
                                      <Text fontSize="10px" fontWeight="700" color={mutedText} textTransform="uppercase" mb={1}>
                                        Authority
                                      </Text>
                                      <select
                                        value={row.authority_status ?? "working_source"}
                                        onChange={(e) => updateStrategyRow(filename, { authority_status: e.target.value })}
                                        style={{
                                          width: "100%",
                                          fontSize: "12px",
                                          padding: "7px 8px",
                                          border: `1px solid ${cardBorder}`,
                                          borderRadius: "6px",
                                          background: "transparent",
                                          color: "inherit",
                                        }}
                                      >
                                        <option value="authoritative">Authoritative</option>
                                        <option value="working_source">Working source</option>
                                        <option value="supporting_source">Supporting source</option>
                                        <option value="duplicate">Duplicate</option>
                                        <option value="superseded">Superseded</option>
                                      </select>
                                    </Box>
                                    <Box>
                                      <Text fontSize="10px" fontWeight="700" color={mutedText} textTransform="uppercase" mb={1}>
                                        Target
                                      </Text>
                                      <Text fontSize="xs" color={mutedText} py="8px">
                                        {row.primary_target ?? row.target_registers?.join(", ") ?? "not selected"}
                                      </Text>
                                    </Box>
                                  </Box>

                                  {(row.sectioning || row.extraction_grain || row.token_posture) && (
                                    <Text fontSize="xs" color={mutedText} mb={2}>
                                      {row.sectioning ?? "sectioning pending"} · {row.extraction_grain ?? "grain pending"} · {row.token_posture ?? "token posture pending"}
                                    </Text>
                                  )}

                                  {gaps.length > 0 && (
                                    <Box bg="orange.50" border="1px solid" borderColor="orange.200" borderRadius="md" px={3} py={2} mb={3}>
                                      <Text fontSize="xs" fontWeight="700" color="orange.800" mb={1}>
                                        Contract gap
                                      </Text>
                                      {gaps.map((gap, idx) => (
                                        <Text key={`${gap.contract_gap}-${idx}`} fontSize="xs" color="orange.700">
                                          {gap.contract_gap}{gap.missing_shape ? `: ${gap.missing_shape}` : ""}{gap.strategy_id ? `: ${gap.strategy_id}` : ""}
                                        </Text>
                                      ))}
                                    </Box>
                                  )}

                                  {(row.validation?.length || row.failure_modes?.length) && (
                                    <Text fontSize="xs" color={mutedText} mb={3}>
                                      Validation: {(row.validation ?? []).join(", ") || "none"} · Failure modes: {(row.failure_modes ?? []).slice(0, 2).join(", ")}
                                      {(row.failure_modes?.length ?? 0) > 2 ? "..." : ""}
                                    </Text>
                                  )}

                                  <textarea
                                    value={row.notes ?? ""}
                                    onChange={(e) => updateStrategyRow(filename, { notes: e.target.value })}
                                    placeholder="Operator notes for this file..."
                                    rows={2}
                                    style={{
                                      width: "100%",
                                      fontSize: "12px",
                                      lineHeight: "1.55",
                                      resize: "vertical",
                                      border: `1px solid ${cardBorder}`,
                                      borderRadius: "6px",
                                      padding: "8px 10px",
                                      background: "transparent",
                                      outline: "none",
                                      fontFamily: "inherit",
                                      color: "inherit",
                                    }}
                                  />

                                  {parseJob.section_map?.files[filename]?.sections?.length ? (
                                    <Box mt={4}>
                                      <Text fontSize="10px" fontWeight="700" color={mutedText} textTransform="uppercase" mb={2}>
                                        Source sections
                                      </Text>
                                      {(() => {
                                        const progress = reviewSectionProgress(filename);
                                        return (
                                          <Box border="1px solid" borderColor={chipBorder} borderRadius="md" p={3} mb={3}>
                                            <HStack justify="space-between" align="center" gap={3}>
                                              <Text fontSize="xs" color={mutedText}>
                                                {progress.touched} of {progress.total} sections touched · {Object.entries(progress.decisions).map(([key, value]) => `${key}: ${value}`).join(" · ")}
                                              </Text>
                                              <Button
                                                size="xs"
                                                variant="ghost"
                                                onClick={() => setProgressReviewOpen((prev) => ({ ...prev, [filename]: !prev[filename] }))}
                                              >
                                                {progressReviewOpen[filename] ? "Hide review" : "Review progress"}
                                              </Button>
                                            </HStack>
                                            {progressReviewOpen[filename] && (
                                              <Box mt={2}>
                                                <Text fontSize="xs" color={mutedText}>
                                                  First untouched: {progress.firstUntouched ? `${progress.firstUntouched.section_id} · ${progress.firstUntouched.title}` : "none"}
                                                </Text>
                                                <Text fontSize="xs" color={mutedText}>
                                                  Types implied by notes: {progress.impliedTypes.length ? progress.impliedTypes.join(", ") : "none yet"}
                                                </Text>
                                              </Box>
                                            )}
                                          </Box>
                                        );
                                      })()}
                                      <VStack align="stretch" gap={2}>
                                        {parseJob.section_map.files[filename].sections.map((section) => {
                                          const sectionKey = `${filename}:${section.section_id}`;
                                          const showFullContent = Boolean(expandedSectionContent[sectionKey]);
                                          const content = section.content_markdown ?? "";
                                          const sectionReviewed = isSectionReviewed(section);
                                          const shouldTruncate = content.length > 900;
                                          const visibleContent = showFullContent || !shouldTruncate
                                            ? content
                                            : `${content.slice(0, 900).trimEnd()}\n\n[Preview truncated. Show full content to inspect the rest.]`;
                                          return (
                                            <Collapsible.Root
                                              key={`${parseJob.job_id}:${sectionKey}`}
                                              className="cat-source-section-row"
                                              open={Boolean(openSectionIds[sectionKey])}
                                              onOpenChange={({ open }) => setOpenSectionIds((prev) => ({ ...prev, [sectionKey]: open }))}
                                            >
                                              <Box border="1px solid" borderColor={chipBorder} borderRadius="md" overflow="hidden">
                                                <Collapsible.Trigger asChild>
                                                  <Box
                                                    as="button"
                                                    type="button"
                                                    width="100%"
                                                    textAlign="left"
                                                    px={3}
                                                    py={2}
                                                    cursor="pointer"
                                                    _hover={{ bg: chipBg }}
                                                  >
                                                    <HStack justify="space-between" gap={3}>
                                                      <Box minW={0}>
                                                        <Text fontSize="xs" fontWeight="700" noOfLines={1}>
                                                          {section.title}
                                                        </Text>
                                                        <Text fontSize="11px" color={mutedText} noOfLines={1}>
                                                          {section.operator_label || section.proposed_label} · {section.content_chars} chars
                                                        </Text>
                                                      </Box>
                                                      <HStack gap={2} flexShrink={0}>
                                                        <Box
                                                          px="6px"
                                                          py="1px"
                                                          borderRadius="4px"
                                                          bg={sectionReviewed ? "green.50" : chipBg}
                                                          border="1px solid"
                                                          borderColor={sectionReviewed ? "green.200" : chipBorder}
                                                          fontSize="10px"
                                                          fontWeight="700"
                                                          color={sectionReviewed ? "green.700" : mutedText}
                                                        >
                                                          {sectionReviewed ? "✓ REVIEWED" : (section.operator_decision ?? "review").toUpperCase()}
                                                        </Box>
                                                        <Collapsible.Indicator />
                                                      </HStack>
                                                    </HStack>
                                                  </Box>
                                                </Collapsible.Trigger>
                                                <Collapsible.Content>
                                                  <Box px={3} pb={3} pt={1}>
                                                    {section.evidence?.length ? (
                                                      <Text fontSize="11px" color={mutedText} mb={2}>
                                                        Evidence: {section.evidence.join(", ")}
                                                      </Text>
                                                    ) : null}
                                                    <Box
                                                      bg={chipBg}
                                                      border="1px solid"
                                                      borderColor={chipBorder}
                                                      borderRadius="md"
                                                      p={3}
                                                      mb={3}
                                                      maxH={showFullContent ? "420px" : "220px"}
                                                      overflowY="auto"
                                                    >
                                                      <Text
                                                        as="pre"
                                                        fontSize="12px"
                                                        lineHeight="1.55"
                                                        whiteSpace="pre-wrap"
                                                        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
                                                        color={mutedText}
                                                      >
                                                        {visibleContent}
                                                      </Text>
                                                    </Box>
                                                    {shouldTruncate && (
                                                      <Button
                                                        size="xs"
                                                        variant="ghost"
                                                        mb={3}
                                                        onClick={() => setExpandedSectionContent((prev) => ({
                                                          ...prev,
                                                          [sectionKey]: !showFullContent,
                                                        }))}
                                                      >
                                                        {showFullContent ? "Show preview" : "Show full content"}
                                                      </Button>
                                                    )}
                                                    <Box
                                                      display="grid"
                                                      gridTemplateColumns={{ base: "1fr", md: "1fr 150px 160px" }}
                                                      gap={3}
                                                      mb={3}
                                                    >
                                                      <Box>
                                                        <Text fontSize="10px" fontWeight="700" color={mutedText} textTransform="uppercase" mb={1}>
                                                          Operator label
                                                        </Text>
                                                        <Input
                                                          value={section.operator_label ?? ""}
                                                          onChange={(e) => updateSectionMapRow(filename, section.section_id, { operator_label: e.target.value })}
                                                          placeholder={section.proposed_label}
                                                          size="sm"
                                                          fontSize="12px"
                                                        />
                                                      </Box>
                                                      <Box>
                                                        <Text fontSize="10px" fontWeight="700" color={mutedText} textTransform="uppercase" mb={1}>
                                                          Decision
                                                        </Text>
                                                        <select
                                                          value={section.operator_decision ?? "review"}
                                                          onChange={(e) => updateSectionMapRow(filename, section.section_id, { operator_decision: e.target.value as SourceSection["operator_decision"] })}
                                                          style={{
                                                            width: "100%",
                                                            fontSize: "12px",
                                                            padding: "7px 8px",
                                                            border: `1px solid ${cardBorder}`,
                                                            borderRadius: "6px",
                                                            background: "transparent",
                                                            color: "inherit",
                                                          }}
                                                        >
                                                          <option value="review">Review</option>
                                                          <option value="extract">Extract</option>
                                                          <option value="hold">Hold</option>
                                                          <option value="skip">Skip</option>
                                                          <option value="misc">Misc</option>
                                                        </select>
                                                      </Box>
                                                      <Box>
                                                        <Text fontSize="10px" fontWeight="700" color={mutedText} textTransform="uppercase" mb={1}>
                                                          Confidence
                                                        </Text>
                                                        <select
                                                          value={section.operator_confidence ?? "staff_review"}
                                                          onChange={(e) => updateSectionMapRow(filename, section.section_id, { operator_confidence: e.target.value as SourceSection["operator_confidence"] })}
                                                          style={{
                                                            width: "100%",
                                                            fontSize: "12px",
                                                            padding: "7px 8px",
                                                            border: `1px solid ${cardBorder}`,
                                                            borderRadius: "6px",
                                                            background: "transparent",
                                                            color: "inherit",
                                                          }}
                                                        >
                                                          <option value="confident">Confident</option>
                                                          <option value="staff_review">Staff Review</option>
                                                          <option value="client_review">Client Review</option>
                                                        </select>
                                                      </Box>
                                                    </Box>
                                                    <HStack gap={2} flexWrap="wrap" mb={3}>
                                                      {sectionQuickLabels().map((quick) => (
                                                        <HStack
                                                          key={quick.operatorLabel}
                                                          gap={0}
                                                          border="1px solid"
                                                          borderColor={chipBorder}
                                                          borderRadius="md"
                                                          overflow="hidden"
                                                        >
                                                          <Button
                                                            size="xs"
                                                            variant="ghost"
                                                            borderRadius="0"
                                                            px={2}
                                                            onClick={() => updateSectionMapRow(filename, section.section_id, {
                                                              operator_label: quick.operatorLabel,
                                                              operator_decision: section.operator_decision === "skip" || section.operator_decision === "misc"
                                                                ? section.operator_decision
                                                                : "review",
                                                            })}
                                                          >
                                                            ↑
                                                          </Button>
                                                          <Box
                                                            px={2}
                                                            fontSize="11px"
                                                            fontWeight="700"
                                                            color={mutedText}
                                                            borderLeft="1px solid"
                                                            borderRight="1px solid"
                                                            borderColor={chipBorder}
                                                          >
                                                            {quick.label}
                                                          </Box>
                                                          <Button
                                                            size="xs"
                                                            variant="ghost"
                                                            borderRadius="0"
                                                            px={2}
                                                            onClick={() => insertSectionNoteAtCursor(filename, section, quick.noteLine)}
                                                          >
                                                            ↓
                                                          </Button>
                                                        </HStack>
                                                      ))}
                                                      <HStack
                                                        gap={0}
                                                        border="1px solid"
                                                        borderColor={chipBorder}
                                                        borderRadius="md"
                                                        overflow="hidden"
                                                      >
                                                        <Button
                                                          size="xs"
                                                          variant="ghost"
                                                          borderRadius="0"
                                                          px={2}
                                                          onClick={() => updateSectionMapRow(filename, section.section_id, {
                                                            operator_label: section.operator_label || "recipe",
                                                            operator_decision: section.operator_decision === "skip" || section.operator_decision === "misc"
                                                              ? section.operator_decision
                                                              : "review",
                                                          })}
                                                        >
                                                          ↑
                                                        </Button>
                                                        <Box
                                                          px={2}
                                                          fontSize="11px"
                                                          fontWeight="700"
                                                          color={mutedText}
                                                          borderLeft="1px solid"
                                                          borderRight="1px solid"
                                                          borderColor={chipBorder}
                                                        >
                                                          Yield 315
                                                        </Box>
                                                        <Button
                                                          size="xs"
                                                          variant="ghost"
                                                          borderRadius="0"
                                                          px={2}
                                                          onClick={() => insertSectionNoteAtCursor(filename, section, "recipe.yield: 315 persons")}
                                                        >
                                                          ↓
                                                        </Button>
                                                      </HStack>
                                                    </HStack>
                                                    <textarea
                                                      data-section-key={sectionKey}
                                                      ref={(node) => {
                                                        sectionNoteElementsRef.current[sectionKey] = node;
                                                      }}
                                                      defaultValue={section.operator_notes ?? ""}
                                                      onChange={(e) => {
                                                        updateSectionNoteCursor(sectionKey, e.currentTarget);
                                                      }}
                                                      onClick={(e) => updateSectionNoteCursor(sectionKey, e.currentTarget)}
                                                      onKeyUp={(e) => updateSectionNoteCursor(sectionKey, e.currentTarget)}
                                                      onSelect={(e) => updateSectionNoteCursor(sectionKey, e.currentTarget)}
                                                      onKeyDown={(e) => expandNoteShortcut(e, (value, cursor) => {
                                                        e.currentTarget.value = value;
                                                        sectionNoteDraftsRef.current[sectionKey] = value;
                                                        sectionNoteCursorsRef.current[sectionKey] = cursor;
                                                      })}
                                                      placeholder="What do you see here? What should extraction do with this section?"
                                                      rows={3}
                                                      style={{
                                                        width: "100%",
                                                        fontSize: "12px",
                                                        lineHeight: "1.55",
                                                        resize: "vertical",
                                                        border: `1px solid ${cardBorder}`,
                                                        borderRadius: "6px",
                                                        padding: "8px 10px",
                                                        background: "transparent",
                                                        outline: "none",
                                                        fontFamily: "inherit",
                                                        color: "inherit",
                                                      }}
                                                    />
                                                    <HStack justify="flex-end" mt={2}>
                                                      {savedSectionIds[sectionKey] && (
                                                        <Text fontSize="11px" color={mutedText}>
                                                          Saved
                                                        </Text>
                                                      )}
                                                      <Button
                                                        size="xs"
                                                        variant="ghost"
                                                        onClick={() => combineSectionWithNext(filename, section)}
                                                      >
                                                        Combine next
                                                      </Button>
                                                      <Button
                                                        size="xs"
                                                        variant="ghost"
                                                        color="orange.700"
                                                        onClick={() => handleSectionQuickAction(filename, section, {
                                                          operator_decision: "skip",
                                                          operator_label: section.operator_label || "ignore",
                                                          operator_notes: section.operator_notes || "Ignored during operator section review.",
                                                        })}
                                                      >
                                                        Ignore
                                                      </Button>
                                                      <Button
                                                        size="xs"
                                                        variant="ghost"
                                                        onClick={() => handleSectionQuickAction(filename, section, {
                                                          operator_decision: "misc",
                                                          operator_label: section.operator_label || "misc",
                                                          operator_notes: section.operator_notes || "Preserve as a miscellaneous courtesy pointer.",
                                                        })}
                                                      >
                                                        Misc
                                                      </Button>
                                                      <Button
                                                        size="xs"
                                                        variant="outline"
                                                        loading={Boolean(savingSectionIds[sectionKey])}
                                                        onClick={() => saveSectionMapRow(filename, section)}
                                                      >
                                                        Save section note
                                                      </Button>
                                                    </HStack>
                                                  </Box>
                                                </Collapsible.Content>
                                              </Box>
                                            </Collapsible.Root>
                                          );
                                        })}
                                      </VStack>
                                    </Box>
                                  ) : null}
                                </Box>
                              </Collapsible.Content>
                            </Box>
                          </Collapsible.Root>
                        );
                      })}
                    </VStack>
                  </Box>
                )}

                {/* Aligned finds — grouped by entity class */}
                {parseJob.phase1_results.aligned.length > 0 && (() => {
                  // Group by entity class, summing counts
                  const grouped: Record<string, {
                    ec: EntityClass;
                    totalCount: number;
                    matchedTerms: string[];
                    sourceFiles: string[];
                  }> = {};
                  for (const r of parseJob.phase1_results.aligned) {
                    const ec = classifyRegister(r.slug, r.display_name, r.columns);
                    if (!grouped[ec.plural]) {
                      grouped[ec.plural] = { ec, totalCount: 0, matchedTerms: [], sourceFiles: [] };
                    }
                    grouped[ec.plural].totalCount += r.entry_count ?? 0;
                    if (r.matched_declared && !grouped[ec.plural].matchedTerms.includes(r.matched_declared)) {
                      grouped[ec.plural].matchedTerms.push(r.matched_declared);
                    }
                    if (!grouped[ec.plural].sourceFiles.includes(r.source_file)) {
                      grouped[ec.plural].sourceFiles.push(r.source_file);
                    }
                  }
                  return (
                    <Box>
                      <Text fontSize="10px" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" color={mutedText} mb={3}>
                        What we found
                      </Text>
                      <VStack align="stretch" gap={2}>
                        {Object.values(grouped).map((g) => {
                          const noteKey = g.ec.plural;
                          const noteOpen = alignedNoteOpen[noteKey];
                          // (d) client's word first — use their declared term as the label if available
                          const primaryLabel = g.matchedTerms.length > 0
                            ? g.matchedTerms.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(" / ")
                            : g.ec.type;
                          // Only show ec.type as a synonym if it adds information (not if it would say "Recipe (Tasks)")
                          const synonymLabel2 = (g.matchedTerms.length > 0 && g.ec.type.toLowerCase() !== primaryLabel.toLowerCase())
                            ? g.ec.type
                            : null;
                          return (
                            <Box key={noteKey}>
                              <HStack
                                bg={cardBg}
                                border="1px solid"
                                borderColor={cardBorder}
                                borderRadius={noteOpen ? "lg lg 0 0" : "lg"}
                                px={4}
                                py={3}
                                gap={3}
                              >
                                <Text fontSize="xl" flexShrink={0}>{g.ec.icon}</Text>
                                <Box flex="1">
                                  <HStack gap={2} align="baseline">
                                    <Text fontSize="sm" fontWeight="600">{primaryLabel}</Text>
                                    {synonymLabel2 && (
                                      <Text fontSize="10px" color={mutedText}>({synonymLabel2})</Text>
                                    )}
                                  </HStack>
                                  <Text fontSize="xs" color={mutedText}>
                                    across {g.sourceFiles.length} {g.sourceFiles.length === 1 ? "file" : "files"}
                                  </Text>
                                </Box>
                                <Box
                                  as="button"
                                  onClick={() => setAlignedNoteOpen((prev) => ({ ...prev, [noteKey]: !prev[noteKey] }))}
                                  px="8px" py="2px" borderRadius="4px" cursor="pointer"
                                  bg={noteOpen ? chipBorder : chipBg}
                                  border="1px solid" borderColor={chipBorder}
                                  fontSize="10px" fontWeight="600" color={mutedText}
                                  flexShrink={0}
                                  _hover={{ borderColor: mutedText }}
                                >
                                  {noteOpen ? "Done" : "Add note"}
                                </Box>
                              </HStack>
                              {noteOpen && (
                                <Box
                                  bg={cardBg}
                                  border="1px solid" borderColor={cardBorder}
                                  borderTop="none"
                                  borderRadius="0 0 lg lg"
                                  px={4} pb={3}
                                >
                                  <input
                                    autoFocus
                                    value={alignedNotes[noteKey] ?? ""}
                                    onChange={(e) => setAlignedNotes((prev) => ({ ...prev, [noteKey]: e.target.value }))}
                                    placeholder={`e.g. "Todos may not be recipes — those are prep tasks"`}
                                    style={{
                                      width: "100%", fontSize: "12px", padding: "6px 8px",
                                      border: `1px solid ${cardBorder}`, borderRadius: "4px",
                                      background: "transparent", outline: "none", fontFamily: "inherit", color: "inherit",
                                    }}
                                  />
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                      </VStack>
                    </Box>
                  );
                })()}

                {/* Nested types — known children of aligned types, found inside those files */}
                {(parseJob.phase1_results.nested_in_parent ?? []).length > 0 && (
                  <Box>
                    <Text fontSize="10px" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" color={mutedText} mb={3}>
                      Nested inside
                    </Text>
                    <VStack align="stretch" gap={2}>
                      {(parseJob.phase1_results.nested_in_parent ?? []).map((n) => (
                        <HStack
                          key={n.type}
                          bg={cardBg}
                          border="1px solid"
                          borderColor="green.200"
                          borderRadius="lg"
                          px={4}
                          py={3}
                          gap={3}
                        >
                          <Text fontSize="xl" flexShrink={0}>🪆</Text>
                          <Box flex="1">
                            <Text fontSize="sm" fontWeight="600">{n.type.charAt(0).toUpperCase() + n.type.slice(1)}</Text>
                            <Text fontSize="xs" color={mutedText}>
                              Embedded inside {n.nested_in} files — extracted in Phase 2, not a top-level register
                            </Text>
                          </Box>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Absent types — one card per missing type */}
                {parseJob.phase1_results.absent.length > 0 && (
                  <Box>
                    <Text fontSize="10px" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" color={mutedText} mb={3}>
                      We didn&apos;t find
                    </Text>
                    <VStack align="stretch" gap={2}>
                      {parseJob.phase1_results.absent.map((a) => (
                        <HStack
                          key={a}
                          bg={cardBg}
                          border="1px solid"
                          borderColor={chipBorder}
                          borderRadius="lg"
                          px={4}
                          py={3}
                          gap={3}
                          opacity={0.7}
                        >
                          <Text fontSize="xl" flexShrink={0}>🔍</Text>
                          <Box flex="1">
                            <Text fontSize="sm" fontWeight="600">{a.charAt(0).toUpperCase() + a.slice(1)}</Text>
                            <Text fontSize="xs" color={mutedText}>
                              Not found in these files — add a note below if we should look differently
                            </Text>
                          </Box>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Unexpected finds — deduplicated by display_name, no file detail */}
                {parseJob.phase1_results.unexpected.length > 0 && (() => {
                  // Deduplicate: keep first occurrence of each display_name
                  const seen = new Set<string>();
                  const deduped = parseJob.phase1_results.unexpected.filter((r) => {
                    const key = r.display_name.trim().toLowerCase();
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                  });
                  return (
                    <Box>
                      <Text fontSize="10px" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" color={mutedText} mb={1}>
                        We also noticed
                      </Text>
                      <Text fontSize="xs" color={mutedText} mb={3}>
                        Not in your list — should we look for these too?
                      </Text>
                      <VStack align="stretch" gap={2}>
                        {deduped.map((r) => {
                          const ec = classifyRegister(r.slug, r.display_name, r.columns);
                          const decision = unexpectedDecisions[r.slug];
                          return (
                            <Box key={r.slug}>
                              <HStack
                                bg={cardBg}
                                border="1px solid"
                                borderColor={decision === "skip" ? chipBorder : cardBorder}
                                borderRadius={decision === "include" ? "lg lg 0 0" : "lg"}
                                px={4}
                                py={3}
                                gap={3}
                                opacity={decision === "skip" ? 0.5 : 1}
                                transition="opacity 0.15s"
                              >
                                <Text fontSize="xl" flexShrink={0}>{ec.icon}</Text>
                                <Text fontSize="sm" fontWeight="600" flex="1">{r.display_name}</Text>
                                <HStack gap={1.5} flexShrink={0}>
                                  <Box
                                    as="button"
                                    onClick={() => setUnexpectedDecisions((prev) => ({ ...prev, [r.slug]: "include" }))}
                                    px="8px" py="2px" borderRadius="4px" cursor="pointer"
                                    bg={decision === "include" ? BRAND : chipBg}
                                    border="1px solid"
                                    borderColor={decision === "include" ? BRAND : chipBorder}
                                    fontSize="10px" fontWeight="700"
                                    color={decision === "include" ? "white" : mutedText}
                                    transition="all 0.12s"
                                    _hover={{ borderColor: BRAND }}
                                  >
                                    Yes
                                  </Box>
                                  <Box
                                    as="button"
                                    onClick={() => setUnexpectedDecisions((prev) => ({ ...prev, [r.slug]: "skip" }))}
                                    px="8px" py="2px" borderRadius="4px" cursor="pointer"
                                    bg={decision === "skip" ? chipBorder : chipBg}
                                    border="1px solid"
                                    borderColor={chipBorder}
                                    fontSize="10px" fontWeight="700"
                                    color={mutedText}
                                    transition="all 0.12s"
                                    _hover={{ borderColor: mutedText }}
                                  >
                                    No
                                  </Box>
                                </HStack>
                              </HStack>
                              {decision === "include" && (
                                <Box
                                  bg={cardBg}
                                  border="1px solid" borderColor={cardBorder}
                                  borderTop="none"
                                  borderRadius="0 0 lg lg"
                                  px={4} pb={3}
                                >
                                  <input
                                    autoFocus
                                    value={unexpectedNotes[r.slug] ?? ""}
                                    onChange={(e) => setUnexpectedNotes((prev) => ({ ...prev, [r.slug]: e.target.value }))}
                                    placeholder="Any context about this? (optional)"
                                    style={{
                                      width: "100%", fontSize: "12px", padding: "6px 8px",
                                      border: `1px solid ${cardBorder}`, borderRadius: "4px",
                                      background: "transparent", outline: "none", fontFamily: "inherit", color: "inherit",
                                    }}
                                  />
                                </Box>
                              )}
                            </Box>
                          );
                        })}
                      </VStack>
                    </Box>
                  );
                })()}

                {/* Child / sub-type suggestions */}
                {(parseJob.phase1_results.child_suggestions ?? []).length > 0 && (() => {
                  // Group by parent, deduplicate child candidates
                  const byParent: Record<string, string[]> = {};
                  for (const s of parseJob.phase1_results.child_suggestions) {
                    if (!byParent[s.parent]) byParent[s.parent] = [];
                    if (!byParent[s.parent].includes(s.child_candidate)) {
                      byParent[s.parent].push(s.child_candidate);
                    }
                  }
                  return (
                    <Box bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="lg" p={4}>
                      <Text fontSize="10px" fontWeight="700" letterSpacing="0.1em" textTransform="uppercase" color={mutedText} mb={2}>
                        We may have found more
                      </Text>
                      <VStack align="stretch" gap={2}>
                        {Object.entries(byParent).map(([parent, children]) => (
                          <Text key={parent} fontSize="xs" color={mutedText} lineHeight="1.7">
                            Inside <strong>{parent}</strong> we noticed fields that look like sub-types:{" "}
                            <strong>{children.slice(0, 4).join(", ")}</strong>.
                            {" "}Should these be their own list, or stay embedded?
                          </Text>
                        ))}
                      </VStack>
                    </Box>
                  );
                })()}

                {/* File safety note */}
                <Text fontSize="xs" color={mutedText} textAlign="center" px={2}>
                  Your original files are always kept intact — you can find anything here, anytime.
                </Text>

                {/* Narrative question — moved here from pre-ingest screen */}
                <Box bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="lg" p={5}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                    <Text fontSize="sm" fontWeight="600">Before we go deeper — what are these files about?</Text>
                    <Box
                      as="button"
                      onClick={() => setGeneralContext(
                        "These are planning files for a 6-day community retreat happening in September 2026 — menus, staffing, and fundraising records."
                      )}
                      px="8px" py="2px" borderRadius="4px"
                      bg={chipBg} border="1px solid" borderColor={chipBorder}
                      fontSize="10px" fontWeight="700" color={mutedText}
                      cursor="pointer" letterSpacing="0.04em"
                      _hover={{ borderColor: BRAND, color: BRAND }} transition="all 0.12s"
                      title="Fill with demo context (Temple of Belonging)"
                    >
                      Demo
                    </Box>
                  </Box>
                  <Text fontSize="xs" color={mutedText} mb={3} lineHeight="1.6">
                    Optional — the occasion, project, or context they were created for.
                    This helps us understand intent when the full analysis runs.
                  </Text>
                  <textarea
                    value={generalContext}
                    onChange={(e) => setGeneralContext(e.target.value)}
                    placeholder="e.g. These are planning files for a 6-day community retreat happening in September 2026 — menus, staffing, and fundraising records."
                    rows={3}
                    style={{
                      width: "100%", fontSize: "13px", lineHeight: "1.65", resize: "vertical",
                      border: `1px solid ${cardBorder}`, borderRadius: "6px",
                      padding: "10px 12px", background: "transparent", outline: "none",
                      fontFamily: "inherit", color: "inherit",
                    }}
                  />
                </Box>

                {/* Enrichment context */}
                <Box bg={cardBg} border="1px solid" borderColor={cardBorder} borderRadius="lg" p={5}>
                  <Text fontSize="sm" fontWeight="600" mb={1}>Anything we&apos;re misreading?</Text>
                  <Text fontSize="xs" color={mutedText} mb={3} lineHeight="1.6">
                    If something looks off, or you use a different word for something,
                    tell us here. The more specific you are, the more resourceful we can be.
                  </Text>
                  <textarea
                    value={enrichmentContext}
                    onChange={(e) => setEnrichmentContext(e.target.value)}
                    placeholder="e.g. We call our vendors 'purveyors'. The -2.xlsx is the current version. The meeting notes are background only — don't make a register for those."
                    rows={3}
                    style={{
                      width: "100%",
                      fontSize: "13px",
                      lineHeight: "1.65",
                      resize: "vertical",
                      border: `1px solid ${cardBorder}`,
                      borderRadius: "6px",
                      padding: "10px 12px",
                      background: "transparent",
                      outline: "none",
                      fontFamily: "inherit",
                      color: "inherit",
                    }}
                  />
                </Box>

                {parseError && (
                  <Box px={3} py={2} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md">
                    <Text fontSize="xs" color="red.700">{parseError}</Text>
                  </Box>
                )}

                <HStack justify="space-between" pt={2}>
                  <Box
                    as="button"
                    onClick={() => setIntroState("bubble")}
                    fontSize="sm" color={mutedText} cursor="pointer"
                    _hover={{ color: BRAND }} transition="color 0.12s"
                  >
                    ← Back to import
                  </Box>
                  <Button
                    onClick={handleStartAnalysis}
                    bg={BRAND}
                    color="white"
                    _hover={{ opacity: 0.88 }}
                    size="md"
                    fontWeight="600"
                    loading={startingAnalysis}
                    disabled={startingAnalysis}
                  >
                    Analyze → (takes a few minutes)
                  </Button>
                </HStack>
              </VStack>
            </Box>
          )}

          {/* ── ANALYZING — holding screen ── */}
          {introState === "analyzing" && (
            <Box
              className="cat-analyzing-surface"
              display="flex"
              alignItems="center"
              justifyContent="center"
              height="100%"
              p={8}
              animation="cat-work-appear 0.4s ease forwards"
            >
              <VStack gap={6} textAlign="center" maxW="480px">
                <Spinner size="lg" color="blue.400" />
                <Box>
                  <Heading as="h2" fontSize="xl" fontWeight="700" letterSpacing="-0.02em" mb={3}>
                    Reading your files in detail
                  </Heading>
                  <Text fontSize="sm" color={mutedText} lineHeight="1.8">
                    We&apos;re running a full semantic analysis on each file — this takes a few minutes
                    and happens in the background. You&apos;ll receive an email when it&apos;s ready.
                  </Text>
                </Box>

                {analysisProgress && analysisProgress.total > 0 && (
                  <Box
                    bg={cardBg}
                    border="1px solid"
                    borderColor={cardBorder}
                    borderRadius="lg"
                    px={5}
                    py={3}
                    w="full"
                  >
                    <Text fontSize="xs" color={mutedText}>
                      {analysisProgress.done} of {analysisProgress.total} files analyzed
                    </Text>
                    <Box mt={2} h="4px" bg={chipBg} borderRadius="full" overflow="hidden">
                      <Box
                        h="full"
                        bg={BRAND}
                        borderRadius="full"
                        w={`${Math.round((analysisProgress.done / analysisProgress.total) * 100)}%`}
                        transition="width 0.4s ease"
                      />
                    </Box>
                  </Box>
                )}

                <Text fontSize="xs" color={synonymLabel} lineHeight="1.6">
                  You can close this tab — we&apos;ll email you when the analysis is complete.
                  The review screen will be waiting for you at this link.
                </Text>
              </VStack>
            </Box>
          )}

          {/* ── STAGE 4 — REGISTER REVIEW ── */}
          {introState === "confirming" && (
            <Box
              className="cat-confirm-surface"
              maxW="720px"
              mx="auto"
              px={6}
              py={10}
              animation="cat-work-appear 0.4s ease forwards"
            >
              <VStack align="stretch" gap={8}>

                {/* Bridge narrative header */}
                <Box>
                  <Heading as="h2" fontSize="xl" fontWeight="700" letterSpacing="-0.02em" mb={2}>
                    {(() => {
                      const agg = registers.filter(r => r.entryCount > 0);
                      if (!agg.length) return "Your files have been read";
                      const parts = agg.map(r => `${r.entryCount} ${r.displayName.toLowerCase()}`);
                      const joined = parts.length === 1
                        ? parts[0]
                        : parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1];
                      return `We found ${joined}`;
                    })()}
                  </Heading>
                  <Text fontSize="sm" color={mutedText} lineHeight="1.7">
                    {parsedFiles.length > 0
                      ? `Here's what we found across your ${parsedFiles.length} file${parsedFiles.length !== 1 ? "s" : ""} — confirm what you want to bring into your Codex, edit the names, or remove anything that doesn't fit. Your original files are always kept.`
                      : "Before anything is written to your Codex, confirm the registers below. Your original files are always kept — these are proposed shapes, not final."}
                  </Text>
                </Box>

                {/* Per-file breakdown */}
                {parsedFiles.length > 0 && (
                  <Box>
                    <Text
                      fontSize="10px"
                      fontWeight="700"
                      letterSpacing="0.1em"
                      textTransform="uppercase"
                      color={mutedText}
                      mb={3}
                    >
                      What each file contributed
                    </Text>
                    <VStack align="stretch" gap={3}>
                      {parsedFiles.map((pf) => (
                        <Box
                          key={pf.filename}
                          bg={cardBg}
                          border="1px solid"
                          borderColor={cardBorder}
                          borderRadius="lg"
                          overflow="hidden"
                        >
                          {/* File header */}
                          <HStack px={4} py={3} gap={3}>
                            <Text fontSize="xl" flexShrink={0}>
                              {pf.file_type === "pdf" ? "📑" : pf.file_type === "docx" ? "📝" : "📊"}
                            </Text>
                            <Box flex="1" minW={0}>
                              <Text fontSize="sm" fontWeight="600" overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap">
                                {pf.filename}
                              </Text>
                              {/* Human findings summary */}
                              <Text fontSize="sm" color={chipText} mt="3px" fontWeight="500">
                                {humanSummary(pf.registers)}
                              </Text>
                              {/* Skipped sheets — plain language */}
                              {pf.skipped.length > 0 && (
                                <Text fontSize="11px" color={synonymLabel} mt="2px">
                                  Also skipped {pf.skipped.length} tab{pf.skipped.length !== 1 ? "s" : ""} that looked like cover pages or summaries
                                </Text>
                              )}
                            </Box>
                          </HStack>

                          {/* Entity chips per register */}
                          {pf.registers.length > 0 && (
                            <HStack px={4} pb={3} gap={2} flexWrap="wrap">
                              {pf.registers.map((r) => {
                                const ec = classifyRegister(r.slug, r.display_name, r.columns);
                                return (
                                  <Box
                                    key={r.slug}
                                    px={3}
                                    py="4px"
                                    bg={chipBg}
                                    border="1px solid"
                                    borderColor={chipBorder}
                                    borderRadius="full"
                                  >
                                    <Text fontSize="11px" fontWeight="500" color={chipText}>
                                      {ec.icon} {r.entry_count > 0 ? `${r.entry_count} ` : ""}{r.entry_count === 1 ? ec.type.replace(/s$/, "") : ec.type}
                                    </Text>
                                  </Box>
                                );
                              })}
                            </HStack>
                          )}
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                )}

                {/* Registers to create — editable flat list */}
                <Box>
                  <Text
                    fontSize="10px"
                    fontWeight="700"
                    letterSpacing="0.1em"
                    textTransform="uppercase"
                    color={mutedText}
                    mb={1}
                  >
                    Registers to create
                  </Text>
                  <Text fontSize="xs" color={mutedText} mb={3} lineHeight="1.6">
                    Edit names or synonyms, remove any you don&apos;t want.
                    Nothing is written until you confirm below.
                  </Text>
                  <VStack align="stretch" gap={2}>
                    {registers.map((reg, idx) => (
                      <Box
                        key={reg.slug}
                        bg={cardBg}
                        border="1px solid"
                        borderColor={cardBorder}
                        borderRadius="lg"
                        px={4}
                        py={3}
                      >
                        <HStack align="start" gap={3}>
                          <Text fontSize="lg" flexShrink={0} mt="6px" title={classifyRegister(reg.slug, reg.displayName, []).type}>
                            {classifyRegister(reg.slug, reg.displayName, []).icon}
                          </Text>
                          <VStack align="stretch" flex="1" gap={1.5}>
                            <HStack gap={2} align="center">
                              <Input
                                value={reg.displayName}
                                onChange={(e) => updateRegisterName(idx, e.target.value)}
                                fontSize="sm"
                                fontWeight="600"
                                flex="1"
                                px={0}
                                border="none"
                                background="transparent"
                                borderRadius={0}
                                _focus={{ outline: "none", boxShadow: "none", borderBottom: `1px solid ${BRAND}` }}
                              />
                              <Box px={2} py="1px" bg={badgeBg} borderRadius="full" flexShrink={0}>
                                <Text fontSize="10px" fontWeight="600" color={badgeText} whiteSpace="nowrap">
                                  {reg.entryCount} entries
                                </Text>
                              </Box>
                            </HStack>
                            <Text
                              fontSize="10px"
                              fontFamily="mono"
                              color={synonymLabel}
                              maxW="340px"
                              overflow="hidden"
                              textOverflow="ellipsis"
                              whiteSpace="nowrap"
                            >
                              {reg.sourceFile}
                            </Text>
                            <HStack gap={2} align="center" mt={0.5}>
                              <Text fontSize="10px" color={synonymLabel} flexShrink={0}>
                                Label when accepted:
                              </Text>
                              <Input
                                value={reg.canonSynonym}
                                onChange={(e) => updateRegisterSynonym(idx, e.target.value)}
                                placeholder="e.g. Final Menu, Live, Confirmed"
                                fontSize="11px"
                                flex="1"
                                px={0}
                                color={mutedText}
                                border="none"
                                background="transparent"
                                borderRadius={0}
                                _placeholder={{ color: synonymLabel, opacity: 0.7 }}
                                _focus={{ outline: "none", boxShadow: "none", borderBottom: `1px solid ${BRAND}` }}
                              />
                            </HStack>
                          </VStack>
                          <Box
                            as="button"
                            onClick={() => removeRegister(idx)}
                            w="24px"
                            h="24px"
                            borderRadius="md"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            color={mutedText}
                            fontSize="14px"
                            flexShrink={0}
                            mt="2px"
                            _hover={{ bg: removeHover, color: "red.500" }}
                            transition="all 0.12s"
                            title="Remove this register"
                          >
                            ✕
                          </Box>
                        </HStack>
                      </Box>
                    ))}
                  </VStack>
                </Box>

                {/* Context files — collapsible */}
                <Box
                  bg={cardBg}
                  border="1px solid"
                  borderColor={cardBorder}
                  borderRadius="lg"
                  overflow="hidden"
                >
                  <HStack
                    px={4}
                    py={3}
                    as="button"
                    w="full"
                    justify="space-between"
                    onClick={() => setContextOpen((o) => !o)}
                    cursor="pointer"
                    _hover={{ bg: chipBg }}
                    transition="background 0.12s"
                  >
                    <Text fontSize="xs" fontWeight="600" color={mutedText}>
                      Also proposed as context files (not registers)
                    </Text>
                    <Text fontSize="10px" color={synonymLabel}>{contextOpen ? "▲" : "▼"}</Text>
                  </HStack>
                  {contextOpen && (
                    <VStack align="stretch" px={4} pb={3} gap={1.5}>
                      {CONTEXT_FILES.map((cf) => (
                        <Text key={cf.slug} fontSize="11px" fontFamily="mono" color={mutedText}>
                          {cf.label}
                        </Text>
                      ))}
                    </VStack>
                  )}
                </Box>

                {/* Error feedback */}
                {materializeError && (
                  <Box px={3} py={2} bg="red.50" border="1px solid" borderColor="red.200" borderRadius="md">
                    <Text fontSize="xs" color="red.700">{materializeError}</Text>
                  </Box>
                )}

                {/* Success — replaces the action row */}
                {materializeResult ? (
                  <Box
                    bg={statusBg}
                    border="1px solid"
                    borderColor={statusBorder}
                    borderRadius="lg"
                    px={5}
                    py={5}
                  >
                    <VStack align="stretch" gap={4}>
                      <HStack gap={2}>
                        <Box w="7px" h="7px" borderRadius="full" bg="green.400" flexShrink={0} />
                        <Text fontSize="sm" fontWeight="600" color={statusText}>
                          {materializeResult.registers_written} register{materializeResult.registers_written !== 1 ? "s" : ""} written to your Codex
                        </Text>
                      </HStack>
                      <Text fontSize="xs" color={mutedText}>
                        Commit <code>{materializeResult.commit}</code> — files are in{" "}
                        <code>CONTENT/registers/</code> in your Codex git repo. Draft entries
                        are waiting for your review. Canon synonyms are set per register.
                      </Text>
                      <HStack gap={3} flexWrap="wrap">
                        <Button
                          bg={BRAND}
                          color="white"
                          _hover={{ opacity: 0.88 }}
                          size="sm"
                          fontWeight="600"
                          flex="1"
                          onClick={handleGoToBrowse}
                        >
                          View Register of Registers →
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          fontWeight="600"
                          flex="1"
                          onClick={() => {
                            setMaterializeResult(null);
                            setMaterializeError(null);
                            setRegisters(PROPOSED_REGISTERS);
                            setParsedFiles([]);
                            setIntroState("bubble");
                            setSelectedFiles([]);
                          }}
                        >
                          Import more files
                        </Button>
                      </HStack>
                    </VStack>
                  </Box>
                ) : (
                  <HStack justify="space-between" pt={2} flexWrap="wrap" gap={3}>
                    <Box
                      as="button"
                      onClick={() => setIntroState("bubble")}
                      fontSize="sm"
                      color={mutedText}
                      cursor="pointer"
                      _hover={{ color: BRAND }}
                      transition="color 0.12s"
                    >
                      ← Back to import
                    </Box>
                    <Button
                      onClick={handleMaterialize}
                      bg={BRAND}
                      color="white"
                      _hover={{ opacity: 0.88 }}
                      size="md"
                      fontWeight="600"
                      flexShrink={0}
                      loading={materializing}
                      disabled={materializing}
                    >
                      Accept — create {registers.length} register{registers.length !== 1 ? "s" : ""} in Codex →
                    </Button>
                  </HStack>
                )}

              </VStack>
            </Box>
          )}

          {/* ── STAGE 7 — BROWSE / REGISTER EDITOR ── */}
          {introState === "browse" && (
            <Box
              className="cat-browse-surface"
              display="flex"
              flexDirection="column"
              height="100%"
            >
              {/* No register selected — placeholder */}
              {!selectedRegSlug && (
                <Box flex="1" display="flex" alignItems="center" justifyContent="center" p={8}>
                  <VStack gap={3} textAlign="center">
                    <Text fontSize="2xl">◈</Text>
                    <Text fontWeight="600" fontSize="sm">Select a register</Text>
                    <Text fontSize="xs" color={mutedText} maxW="260px" lineHeight="1.6">
                      Choose a register from the panel on the left to view and edit its content.
                    </Text>
                  </VStack>
                </Box>
              )}

              {/* Register selected, entries loaded, no entry selected — show entry list */}
              {selectedRegSlug && !selectedEntrySlug && entryList.length > 0 && (
                <Box className="cat-entry-list" display="flex" flexDirection="column" height="100%">
                  {/* Entry list header */}
                  <Box
                    px={5} py={3}
                    borderBottom="1px solid" borderColor={toolbarBorder}
                    display="flex" alignItems="center" gap={3} flexShrink={0}
                    bg={toolbarBg}
                  >
                    <Text fontWeight="700" fontSize="sm">
                      {regMeta?.title ?? selectedRegSlug.replace(/-/g, " ")}
                    </Text>
                    <Text fontSize="xs" color={mutedText}>{entryList.length} entries</Text>
                    <Box flex="1" />
                    <Box
                      className="cat-register-extraction-context"
                      px={2}
                      py="2px"
                      borderRadius="md"
                      bg={registerSourceMatchesActiveJob ? chipBg : "yellow.50"}
                      border="1px solid"
                      borderColor={registerSourceMatchesActiveJob ? chipBorder : "yellow.300"}
                      title={`Active parse job: ${parseJob?.job_id ?? "none"}`}
                    >
                      <Text
                        fontSize="10px"
                        fontWeight="700"
                        color={registerSourceMatchesActiveJob ? chipText : "yellow.800"}
                        textTransform="uppercase"
                      >
                        Job {activeParseJobLabel}
                      </Text>
                    </Box>
                    <Button
                      onClick={handleMaterializeRegister}
                      size="xs" bg={chipBg} border="1px solid" borderColor={chipBorder}
                      color={chipText} fontWeight="600" _hover={{ borderColor: BRAND }}
                      loading={materializingReg === selectedRegSlug}
                      disabled={materializingReg !== null}
                    >
                      {materializingReg === selectedRegSlug ? "Extracting…" : "Re-extract"}
                    </Button>
                  </Box>
                  {/* Entry cards */}
                  <Box flex="1" overflowY="auto" p={4}>
                    {entryListLoading ? (
                      <Box display="flex" justifyContent="center" pt={8}><Spinner size="sm" /></Box>
                    ) : (
                      <VStack gap={2} align="stretch">
                        {entryList.map((entry) => (
                          <Box
                            key={entry.slug}
                            as="button"
                            textAlign="left"
                            onClick={() => loadEntry(selectedRegSlug, entry.slug)}
                            px={4} py={3}
                            borderRadius="8px"
                            border="1px solid"
                            borderColor={chipBorder}
                            bg={chipBg}
                            _hover={{ borderColor: BRAND, bg: navItemHover }}
                            transition="all 0.12s"
                            cursor="pointer"
                          >
                            <Text fontSize="sm" fontWeight="500">{entry.title}</Text>
                            <Text fontSize="xs" color={mutedText} mt="2px">{entry.status}</Text>
                          </Box>
                        ))}
                      </VStack>
                    )}
                  </Box>
                  {materializeRegResult && (
                    <Box className="cat-materialize-progress" px={5} py={2} borderTop="1px solid" borderColor={toolbarBorder}>
                      <Text fontSize="xs" color={mutedText}>{materializeRegResult}</Text>
                      {materializeProgressSummary && (
                        <Text fontSize="11px" color={materializeBlockedCount ? "yellow.700" : mutedText} mt="2px">
                          {materializeProgressSummary}
                        </Text>
                      )}
                    </Box>
                  )}
                </Box>
              )}

              {/* Register selected, entry selected OR no entries yet — TipTap editor */}
              {selectedRegSlug && (selectedEntrySlug || entryList.length === 0) && (
                <Box className="cat-editor-area" display="flex" flexDirection="column" height="100%">

                  {/* Entry breadcrumb — shown when viewing an individual entry */}
                  {selectedEntrySlug && (
                    <Box
                      px={4} py="5px"
                      borderBottom="1px solid" borderColor={toolbarBorder}
                      bg={toolbarBg}
                      display="flex" alignItems="center" gap={2}
                      flexShrink={0}
                    >
                      <Box
                        as="button"
                        onClick={() => {
                          setSelectedEntrySlug(null);
                          setShareResult(null);
                          editor?.commands.setContent("");
                          updateCodexUrl(selectedRegSlug, null);
                        }}
                        fontSize="11px" color={mutedText}
                        cursor="pointer" _hover={{ color: BRAND }}
                      >
                        ← {regMeta?.title ?? selectedRegSlug?.replace(/-/g, " ")}
                      </Box>
                      <Text fontSize="11px" color={mutedText}>/</Text>
                      <Text fontSize="11px" fontWeight="600" color={chipText}>
                        {entryList.find((e) => e.slug === selectedEntrySlug)?.title ?? selectedEntrySlug}
                      </Text>
                      {entryLoading && <Spinner size="xs" ml={1} />}
                    </Box>
                  )}

                  {/* Editor toolbar */}
                  <Box
                    className="cat-editor-toolbar"
                    bg={toolbarBg}
                    borderBottom="1px solid"
                    borderColor={toolbarBorder}
                    px={4}
                    py="6px"
                    display="flex"
                    alignItems="center"
                    gap={2}
                    flexShrink={0}
                  >
                    {/* Format buttons */}
                    {[
                      { label: "B", title: "Bold", action: () => editor?.chain().focus().toggleBold().run(), active: editor?.isActive("bold") },
                      { label: "I", title: "Italic", action: () => editor?.chain().focus().toggleItalic().run(), active: editor?.isActive("italic") },
                      { label: "H1", title: "Heading 1", action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), active: editor?.isActive("heading", { level: 1 }) },
                      { label: "H2", title: "Heading 2", action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), active: editor?.isActive("heading", { level: 2 }) },
                    ].map(({ label, title, action, active }) => (
                      <Box
                        key={label}
                        as="button"
                        onClick={action}
                        title={title}
                        px="8px"
                        py="2px"
                        borderRadius="4px"
                        bg={active ? chipBorder : "transparent"}
                        border="1px solid"
                        borderColor={active ? BRAND : chipBorder}
                        fontSize="11px"
                        fontWeight="700"
                        color={active ? BRAND : chipText}
                        cursor="pointer"
                        _hover={{ borderColor: BRAND, color: BRAND }}
                        transition="all 0.1s"
                        fontFamily="mono"
                      >
                        {label}
                      </Box>
                    ))}

                    <Box flex="1" />

                    {/* Status badge */}
                    {regMeta && (
                      <Box
                        px={2}
                        py="2px"
                        borderRadius="full"
                        bg={regMeta.status === "canon" ? canonBadgeBg : preCanonBg}
                      >
                        <Text
                          fontSize="10px"
                          fontWeight="600"
                          color={regMeta.status === "canon" ? canonBadgeText : preCanonText}
                        >
                          {regMeta.status === "canon" ? "✓ accepted" : "draft"}
                        </Text>
                      </Box>
                    )}

                    {selectedEntrySlug && (
                      <>
                        <Button
                          onClick={copyEntryUrl}
                          size="xs"
                          bg={chipBg}
                          border="1px solid"
                          borderColor={chipBorder}
                          color={chipText}
                          fontWeight="600"
                          _hover={{ borderColor: BRAND }}
                          title="Copy a shareable URL for this Codex entry"
                        >
                          Copy URL
                        </Button>
                        {shareResult && (
                          <Text
                            fontSize="11px"
                            color={shareResult === "URL copied." ? statusText : mutedText}
                            maxW="220px"
                            overflow="hidden"
                            textOverflow="ellipsis"
                            whiteSpace="nowrap"
                            title={shareResult}
                          >
                            {shareResult}
                          </Text>
                        )}
                      </>
                    )}

                    <Box
                      className="cat-register-extraction-context"
                      px={2}
                      py="2px"
                      borderRadius="md"
                      bg={registerSourceMatchesActiveJob ? chipBg : "yellow.50"}
                      border="1px solid"
                      borderColor={registerSourceMatchesActiveJob ? chipBorder : "yellow.300"}
                      title={`Active parse job: ${parseJob?.job_id ?? "none"}`}
                    >
                      <Text
                        fontSize="10px"
                        fontWeight="700"
                        color={registerSourceMatchesActiveJob ? chipText : "yellow.800"}
                        textTransform="uppercase"
                      >
                        Job {activeParseJobLabel}
                      </Text>
                    </Box>

                    {/* Extract entries button */}
                    <Button
                      onClick={handleMaterializeRegister}
                      size="xs"
                      bg={chipBg}
                      border="1px solid"
                      borderColor={chipBorder}
                      color={chipText}
                      fontWeight="600"
                      _hover={{ borderColor: BRAND }}
                      loading={materializingReg === selectedRegSlug}
                      disabled={materializingReg !== null}
                      title="Run AI extraction to populate entries for this register"
                    >
                      {materializingReg === selectedRegSlug ? "Extracting…" : "Extract entries"}
                    </Button>

                    {/* Extract result / in-progress feedback */}
                    {(materializeRegResult && selectedRegSlug === materializingReg) || (materializeRegResult && materializingReg === null) ? (
                      <Box className="cat-materialize-progress" maxW="460px">
                        <Text fontSize="11px" color={materializeRegResult.includes("fail") ? "red.500" : statusText}>
                          {materializeRegResult}
                        </Text>
                        {materializeProgressSummary && (
                          <Text fontSize="10px" color={materializeBlockedCount ? "yellow.700" : mutedText}>
                            {materializeProgressSummary}
                          </Text>
                        )}
                      </Box>
                    ) : null}

                    {/* Save result feedback */}
                    {saveResult && (
                      <Text fontSize="11px" color={saveResult.includes("fail") ? "red.500" : statusText}>
                        {saveResult}
                      </Text>
                    )}

                    {/* Settings toggle */}
                    <Box
                      as="button"
                      onClick={() => { setSettingsOpen((o) => !o); setSettingsResult(null); }}
                      px="8px"
                      py="2px"
                      borderRadius="4px"
                      bg={settingsOpen ? chipBorder : "transparent"}
                      border="1px solid"
                      borderColor={settingsOpen ? BRAND : chipBorder}
                      fontSize="11px"
                      fontWeight="600"
                      color={settingsOpen ? BRAND : chipText}
                      cursor="pointer"
                      _hover={{ borderColor: BRAND, color: BRAND }}
                      transition="all 0.1s"
                      title="Register settings"
                    >
                      ⚙ Settings
                    </Box>

                    {/* Save button */}
                    <Button
                      onClick={handleSave}
                      size="xs"
                      bg={chipBg}
                      border="1px solid"
                      borderColor={chipBorder}
                      color={chipText}
                      fontWeight="600"
                      _hover={{ borderColor: BRAND }}
                      loading={saving}
                      disabled={saving || canonizing || settingsSaving}
                    >
                      Save
                    </Button>

                    {/* Accept / Move to draft button */}
                    {regMeta?.status !== "canon" ? (
                      <Button
                        onClick={handleCanonize}
                        size="xs"
                        bg={BRAND}
                        color="white"
                        fontWeight="600"
                        _hover={{ opacity: 0.88 }}
                        loading={canonizing}
                        disabled={saving || canonizing || settingsSaving}
                      >
                        Accept →
                      </Button>
                    ) : (
                      <Button
                        onClick={handleDecanonize}
                        size="xs"
                        variant="outline"
                        fontWeight="600"
                        loading={canonizing}
                        disabled={saving || canonizing || settingsSaving}
                      >
                        Move to draft
                      </Button>
                    )}
                  </Box>

                  {/* Settings panel */}
                  {settingsOpen && regMeta && (
                    <Box
                      className="cat-settings-panel"
                      bg={startHereBg}
                      borderBottom="1px solid"
                      borderColor={startHereBorder}
                      px={6}
                      py={5}
                      flexShrink={0}
                    >
                      <Text
                        fontSize="9px"
                        fontWeight="700"
                        letterSpacing="0.12em"
                        textTransform="uppercase"
                        color={mutedText}
                        mb={4}
                      >
                        Register Settings
                      </Text>

                      <VStack align="stretch" gap={4} maxW="480px">
                        {/* Display name */}
                        <Box>
                          <Text fontSize="11px" fontWeight="600" color={mutedText} mb={1}>
                            Display name
                          </Text>
                          <Input
                            value={settingsDisplayName}
                            onChange={(e) => setSettingsDisplayName(e.target.value)}
                            size="sm"
                            bg={cardBg}
                            border="1px solid"
                            borderColor={cardBorder}
                            borderRadius="md"
                            fontSize="sm"
                            _focus={{ borderColor: BRAND, boxShadow: "none" }}
                          />
                        </Box>

                        {/* Canon synonym */}
                        <Box>
                          <Text fontSize="11px" fontWeight="600" color={mutedText} mb={1}>
                            Canon synonym
                          </Text>
                          <Text fontSize="10px" color={synonymLabel} mb={2} lineHeight="1.5">
                            The label used for a confirmed, authoritative entry in this register.
                            Used in Beryl prompts and export headers.
                          </Text>
                          <Input
                            value={settingsSynonym}
                            onChange={(e) => setSettingsSynonym(e.target.value)}
                            placeholder="e.g. Final Menu, Live, Confirmed"
                            size="sm"
                            bg={cardBg}
                            border="1px solid"
                            borderColor={cardBorder}
                            borderRadius="md"
                            fontSize="sm"
                            _focus={{ borderColor: BRAND, boxShadow: "none" }}
                          />
                        </Box>

                        {/* Provenance read-only */}
                        <Box>
                          <Text fontSize="11px" fontWeight="600" color={mutedText} mb={2}>
                            Provenance
                          </Text>
                          <VStack align="stretch" gap={1}>
                            {[
                              { label: "Source file", value: regMeta.source_file || "—" },
                              { label: "Entry count", value: String(regMeta.entry_count) },
                              { label: "Status", value: regMeta.status },
                            ].map(({ label, value }) => (
                              <HStack key={label} gap={2}>
                                <Text fontSize="10px" color={synonymLabel} w="80px" flexShrink={0}>{label}</Text>
                                <Text fontSize="10px" fontFamily="mono" color={chipText}>{value}</Text>
                              </HStack>
                            ))}
                          </VStack>
                        </Box>

                        {/* Save settings */}
                        <HStack gap={3}>
                          <Button
                            onClick={handleSaveSettings}
                            size="sm"
                            bg={BRAND}
                            color="white"
                            fontWeight="600"
                            _hover={{ opacity: 0.88 }}
                            loading={settingsSaving}
                            disabled={settingsSaving}
                          >
                            Save settings
                          </Button>
                          {settingsResult && (
                            <Text
                              fontSize="11px"
                              color={settingsResult.includes("fail") ? "red.500" : statusText}
                            >
                              {settingsResult}
                            </Text>
                          )}
                        </HStack>
                      </VStack>
                    </Box>
                  )}

                  {/* Register meta header */}
                  {regMeta && !regLoading && (
                    <Box
                      px={6}
                      py={selectedEntrySlug ? 5 : 4}
                      borderBottom="1px solid"
                      borderColor={cardBorder}
                      bg={cardBg}
                      flexShrink={0}
                    >
                      <VStack align="stretch" gap={1}>
                        <HStack gap={3} align="baseline" justify="space-between">
                          <Heading as="h2" fontSize={selectedEntrySlug ? "xl" : "lg"} fontWeight="750" letterSpacing="0">
                            {selectedEntrySlug
                              ? entryList.find((e) => e.slug === selectedEntrySlug)?.title ?? selectedEntrySlug
                              : regMeta.title || regMeta.slug}
                          </Heading>
                          {selectedEntrySlug && (
                            <Text
                              fontSize="10px"
                              fontFamily="mono"
                              color={synonymLabel}
                              flexShrink={0}
                            >
                              {selectedEntrySlug}
                            </Text>
                          )}
                        </HStack>
                        <Text fontSize="xs" color={mutedText}>
                          {selectedEntrySlug
                            ? `${regMeta.title || regMeta.slug} · editable Codex entry`
                            : `${regMeta.entry_count} entries · synonym: ${regMeta.canon_synonym || "—"}`}
                        </Text>
                      </VStack>
                      {regMeta.source_file && (
                        <Text fontSize="10px" fontFamily="mono" color={synonymLabel} mt={1}>
                          {regMeta.source_file}
                        </Text>
                      )}
                    </Box>
                  )}

                  {/* TipTap body */}
                  {regLoading ? (
                    <Box flex="1" display="flex" alignItems="center" justifyContent="center">
                      <Spinner size="md" color="blue.400" />
                    </Box>
                  ) : (
                    <Box
                      className="cat-tiptap-wrapper"
                      flex="1"
                      overflow="auto"
                      px={{ base: 4, md: 8 }}
                      py={6}
                      bg={centerBg}
                    >
                      <Box
                        maxW={selectedEntrySlug ? "860px" : "720px"}
                        bg={selectedEntrySlug ? cardBg : "transparent"}
                        border={selectedEntrySlug ? "1px solid" : "none"}
                        borderColor={cardBorder}
                        borderRadius={selectedEntrySlug ? "8px" : 0}
                        px={selectedEntrySlug ? { base: 5, md: 8 } : 0}
                        py={selectedEntrySlug ? { base: 5, md: 7 } : 0}
                        boxShadow={selectedEntrySlug ? "0 1px 2px rgba(15, 23, 42, 0.04)" : "none"}
                      >
                        <EditorContent editor={editor} />
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          )}

        </Box>
      </Box>
    </Box>
    <Dialog.Root open={tuneOpen} onOpenChange={({ open }) => setTuneOpen(open)}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="560px" borderRadius="lg" bg={cardBg} border="1px solid" borderColor={cardBorder}>
          <Dialog.Header>
            <Dialog.Title> Tune this review pass</Dialog.Title>
            <Dialog.CloseTrigger />
          </Dialog.Header>
          <Dialog.Body>
            <Text fontSize="sm" color={mutedText} lineHeight="1.6" mb={4}>
              Save batch-level guidance once, then use it during extraction instead of typing the same instruction into every section.
            </Text>
            <Box
              display="grid"
              gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }}
              gap={3}
              mb={3}
            >
              <Box>
                <Text fontSize="10px" fontWeight="700" color={mutedText} textTransform="uppercase" mb={1}>
                  Shape
                </Text>
                <Input
                  value={tuneShape}
                  onChange={(e) => setTuneShape(e.target.value)}
                  placeholder="Recipe"
                  size="sm"
                  fontSize="12px"
                />
              </Box>
              <Box>
                <Text fontSize="10px" fontWeight="700" color={mutedText} textTransform="uppercase" mb={1}>
                  Field
                </Text>
                <Input
                  value={tuneField}
                  onChange={(e) => setTuneField(e.target.value)}
                  placeholder="yield"
                  size="sm"
                  fontSize="12px"
                />
              </Box>
              <Box>
                <Text fontSize="10px" fontWeight="700" color={mutedText} textTransform="uppercase" mb={1}>
                  Value
                </Text>
                <Input
                  value={tuneValue}
                  onChange={(e) => setTuneValue(e.target.value)}
                  placeholder="315 persons"
                  size="sm"
                  fontSize="12px"
                />
              </Box>
              <Box>
                <Text fontSize="10px" fontWeight="700" color={mutedText} textTransform="uppercase" mb={1}>
                  Confidence
                </Text>
                <Input
                  value={tuneConfidence}
                  onChange={(e) => setTuneConfidence(e.target.value)}
                  placeholder="65%"
                  size="sm"
                  fontSize="12px"
                />
              </Box>
            </Box>
            <textarea
              value={tuneNote}
              onChange={(e) => setTuneNote(e.target.value)}
              onKeyDown={(e) => expandNoteShortcut(e, (value) => setTuneNote(value))}
              placeholder="Optional extra note. Try /Rec + Tab or r.in + Tab."
              rows={4}
              style={{
                width: "100%",
                fontSize: "13px",
                lineHeight: "1.65",
                resize: "vertical",
                border: `1px solid ${cardBorder}`,
                borderRadius: "6px",
                padding: "10px 12px",
                background: "transparent",
                outline: "none",
                fontFamily: "inherit",
                color: "inherit",
              }}
            />
          </Dialog.Body>
          <Dialog.Footer>
            <HStack justify="space-between" w="full">
              <Text fontSize="xs" color={mutedText}>
                Saved on this parse job.
              </Text>
              <HStack gap={2}>
                <Button variant="ghost" onClick={() => setTuneOpen(false)}>
                  Cancel
                </Button>
                <Button
                  bg={BRAND}
                  color="white"
                  _hover={{ opacity: 0.88 }}
                  loading={savingTune}
                  disabled={savingTune || !(tuneNote.trim() || (tuneShape.trim() && tuneField.trim() && tuneValue.trim()))}
                  onClick={handleSaveTuningNote}
                >
                  Save tuning note
                </Button>
              </HStack>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
    </>
  );
}

// ── Minimal md ↔ HTML round-trip (no external dep) ───────────────────────────

function mdToHtml(md: string): string {
  return md
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .split("\n\n")
    .map((block) =>
      block.startsWith("<h") || block.startsWith("<ul") || block.startsWith("<ol")
        ? block
        : `<p>${block.replace(/\n/g, "<br>")}</p>`
    )
    .join("\n");
}

function htmlToMd(html: string): string {
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, "$1")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
