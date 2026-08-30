export type MoietyKind = "canon" | "data" | "report" | "drop" | "program" | "grant";
export type Formation = "circle" | "row" | "cluster";
export type RelationStrength = "weak" | "medium" | "strong";

export interface Moiety {
  id: string;
  name: string;
  kind: MoietyKind;
  distillate: string;
  x: number;
  y: number;
  home_x: number;
  home_y: number;
  gravity: number;
  human_placed: boolean;
  tags: string[];
  likenesses: string[];
  relations: string[];
  temporal?: string;
  why_here: string[];
}

export interface LikenessRecord {
  id: string;
  name: string;
  formation: Formation;
  memberIds: string[];
}

export interface Relation {
  from: string;
  to: string;
  strength: RelationStrength;
}

function mk(
  id: string, name: string, kind: MoietyKind,
  x: number, y: number, gravity: number,
  distillate: string, tags: string[], likenesses: string[], relations: string[],
  opts: { temporal?: string; why_here?: string[] } = {}
): Moiety {
  return {
    id, name, kind, x, y, home_x: x, home_y: y, gravity, distillate,
    tags, likenesses, relations, human_placed: false,
    temporal: opts.temporal,
    why_here: opts.why_here ?? [`Gravity ${gravity}`, `Kind: ${kind}`],
  };
}

// Brightwater Feline Sanctuary — Josephine County, Oregon
// Permanent sanctuary for large felids surrendered by zoos, private collectors,
// circuses, and roadside attractions. Founded 2008. 42 residents, 18 FTE, ~$1.8M budget.

export const INITIAL_MOIETIES: Moiety[] = [

  // --- Canon / Identity ---

  mk("mission", "Mission / Charter", "canon", 160, 115, 95,
    "Brightwater provides permanent sanctuary to large felids surrendered by zoos, private collectors, circuses, and roadside attractions. We receive animals; we do not breed, trade, or exhibit.",
    ["identity", "grant", "core"], ["wildcat-2022"], ["org-overview", "care-philosophy", "vision"],
    { why_here: ["Gravity 95", "Core identity document", "Member: Wildcat Trust 2022", "Raised by you"] }),

  mk("vision", "Vision", "canon", 342, 75, 70,
    "A world where no captive large felid lacks access to dignity, space, and lifelong care — and where the pipeline feeding private ownership is systematically closed.",
    ["identity", "core"], [], ["mission", "theory-of-change"]),

  mk("org-overview", "Organization Overview", "canon", 512, 162, 83,
    "Founded 2008 in Josephine County, Oregon. 18 FTE, 62 active volunteers. Annual budget ~$1.8M. 42 resident animals across 9 species. No public exhibition; sanctuary-first model.",
    ["identity", "grant", "capacity"], ["wildcat-2022"], ["mission", "staff-model", "volunteer-base"],
    { why_here: ["Gravity 83", "Member: Wildcat Trust 2022", "Related to Volunteer Base"] }),

  mk("care-philosophy", "Animal Care Philosophy", "canon", 165, 280, 80,
    "Every animal is treated as an individual with behavioral history. We prioritize psychological wellbeing alongside physical health. Voluntary participation in care procedures is our standard.",
    ["care", "identity", "grant"], ["wildcat-2022"], ["vet-protocols", "enrichment-program"],
    { why_here: ["Gravity 80", "Member: Wildcat Trust 2022", "Foundational care doctrine"] }),

  mk("intake-policy", "Intake Policy", "canon", 368, 272, 72,
    "Animals accepted on capacity and species expertise. Priority: animals facing euthanasia or immediate welfare crisis. Intake committee reviews all requests. We do not accept convenience surrenders.",
    ["care", "governance", "intake"], [], ["intake-records-2025", "animal-roster", "no-breeding-policy"]),

  mk("no-breeding-policy", "No-Breeding Policy", "canon", 532, 312, 65,
    "Brightwater is a lifetime sanctuary only. No breeding, no loans for breeding programs, no cub-handling experiences. All animals sterilized within 90 days of intake if not already done.",
    ["care", "ethics", "identity"], [], ["care-philosophy", "intake-policy"]),

  mk("community-access", "Community Access", "canon", 332, 388, 55,
    "Free quarterly open days for Josephine County residents. School partnerships with 4 local districts. 60% of volunteer hours contributed by county residents.",
    ["community", "equity"], [], ["education-outreach", "volunteer-base"]),

  // --- Strategy ---

  mk("strategic-plan", "Strategic Plan 2024–27", "canon", 710, 98, 75,
    "3-year plan 2024–2027: stabilize tiger cohort care, deepen education outreach, expand veterinary infrastructure, grow earned revenue via keeper consultation services.",
    ["strategy", "governance"], ["current-priorities-like"], ["theory-of-change", "current-priorities", "sustainability"]),

  mk("theory-of-change", "Theory of Change", "canon", 892, 75, 63,
    "Welfare-stable animals → staff capacity to educate → public engagement with captive wildlife policy → reduced demand for private ownership → fewer animals in crisis.",
    ["strategy"], ["current-priorities-like"], ["strategic-plan", "vision", "education-outreach"]),

  mk("current-priorities", "Current Priorities", "canon", 728, 244, 82,
    "FY27 focus: tiger habitat Phase 2 expansion, Wildcat Trust renewal proposal, veterinary infrastructure grant application, staff retention plan rollout.",
    ["strategy", "governance"], ["current-priorities-like"], ["strategic-plan", "tiger-cohort", "fy27-budget"],
    { why_here: ["Gravity 82", "Member: Current Priorities", "Active FY27 focus"] }),

  mk("sustainability", "Sustainability Plan", "canon", 908, 230, 60,
    "Earned revenue target: 12% by FY29 via veterinary consultation and keeper training programs. Volunteer program currently reduces labor costs ~$280k/yr.",
    ["finance", "strategy"], [], ["fy27-budget", "volunteer-base"]),

  mk("evaluation-approach", "Evaluation Approach", "canon", 1042, 148, 55,
    "Annual external welfare audit (AWA standard). USDA inspection record clean for 14 consecutive years. Internal quarterly behavioral assessments for all 42 residents.",
    ["quality", "grant"], [], ["outcomes-2025", "vet-protocols"]),

  // --- Governance ---

  mk("leadership", "Leadership", "canon", 1312, 118, 68,
    "ED: Renata Solís (11 yrs). Animal Care Director: Thiago Brandt. Head Veterinarian: Dr. Nora Osei. Development Director: Claire Hatch. Volunteer Coordinator: Marcus Yee.",
    ["governance", "capacity"], [], ["board", "staff-model"]),

  mk("board", "Board of Directors", "data", 1496, 165, 60,
    "14-member board. 9 with wildlife conservation backgrounds. 3 with legal or finance expertise. 2 community members. Meets quarterly. Chair: Delphine Arquette (conservation attorney).",
    ["governance"], [], ["leadership"]),

  mk("staff-model", "Staff Model", "data", 1152, 202, 65,
    "18 FTE: 8 animal care, 2 veterinary, 3 admin, 2 development, 2 education, 1 volunteer coordination. Average tenure 6.1 years. No staff turnover in animal care since 2023.",
    ["capacity", "grant"], ["wildcat-2022"], ["org-overview", "volunteer-base", "leadership"]),

  // --- Finance ---

  mk("fy27-budget", "FY27 Budget", "data", 1435, 372, 78,
    "Total revenue: $1.82M. Expenses: $1.71M. Net: +$110k. Program 78%, Admin 14%, Development 8%. Feed and veterinary costs represent 42% of program expenses.",
    ["finance", "grant"], ["wildcat-2022"], ["fy26-audit", "sustainability", "current-priorities"],
    { why_here: ["Gravity 78", "Member: Wildcat Trust 2022", "Active budget"] }),

  mk("fy26-audit", "FY26 Audit", "report", 1600, 452, 52,
    "Clean opinion. Net assets increased $95k. No material weaknesses. Restricted fund balances properly maintained. Auditor: Merritt & Cole LLP.",
    ["finance"], [], ["fy27-budget"]),

  mk("past-funders", "Past Funders", "data", 1224, 410, 62,
    "Wildcat Trust, Pacific Wildlife Foundation, Cascade Community Foundation, Oregon Wildlife Coalition, 4 family foundations, 22 individual major donors (cumulative giving $50k+).",
    ["finance", "development"], [], ["wildcat-grant-2022", "foundation-prospects"]),

  mk("foundation-prospects", "Foundation Prospects", "data", 1412, 524, 57,
    "5 prospects in active research. 1 LOI submitted to Pacific Environmental Trust. 2 site visits completed Q2. Wildcat Trust renewal proposal submitted June 2026 — decision expected Q4.",
    ["finance", "development"], [], ["past-funders", "wildcat-grant-2022"]),

  // --- Animal Roster / Care ---

  mk("animal-roster", "Animal Roster (42)", "data", 138, 530, 90,
    "42 residents: 6 lions, 9 tigers, 6 cougars, 4 leopards (2 African, 2 snow), 2 cheetahs, 3 caracals, 3 servals, 1 jaguar, 8 small felids. Oldest: Sultan (lion, est. age 19, arrived 2014).",
    ["animals", "care", "grant"], ["wildcat-2022"], ["animal-care-program", "intake-records-2025", "lion-cohort", "tiger-cohort"],
    { why_here: ["Gravity 90", "Member: Wildcat Trust 2022", "Core asset record"] }),

  mk("lion-cohort", "Lion Cohort", "data", 308, 510, 75,
    "6 lions. Sultan (2014, roadside zoo), Marisol (2019, private collector), 3-member pride from 2021 Nebraska facility closure, 1 welfare-emergency intake March 2025. Socialization managed carefully.",
    ["animals", "care"], [], ["animal-roster", "animal-care-program"]),

  mk("tiger-cohort", "Tiger Cohort", "data", 470, 510, 78,
    "9 tigers: Indira (2011, circus retirement), Bengal trio from Cascade Zoo downsizing (2022), Amur pair (2018, USDA seizure), 2 arrivals 2025. Tiger Habitat Phase 2 expansion in progress.",
    ["animals", "care", "strategy"], [], ["animal-roster", "animal-care-program", "current-priorities"],
    { why_here: ["Gravity 78", "Linked to Current Priorities", "Phase 2 expansion active"] }),

  mk("cougar-cohort", "Cougar Cohort", "data", 138, 672, 62,
    "6 cougars. Three non-releasable rehab cases via DFW partnership; three surrendered private-possession animals. Most socially tolerant cohort on sanctuary — paired housing possible.",
    ["animals", "care"], [], ["animal-roster", "intake-policy"]),

  mk("leopard-cohort", "Leopard Cohort", "data", 318, 658, 65,
    "4 leopards: Zola (African, 2017), Nkosi (African, 2020), Kestrel + Drift (snow leopards, 2019 AZA surplus). Snow pair requires cold-weather habitat; capital upgrade budgeted for FY28.",
    ["animals", "care"], [], ["animal-roster", "vet-assessment-summary"]),

  mk("intake-records-2025", "Intake Records 2025", "data", 474, 640, 70,
    "7 intakes in calendar year 2025: 2 tigers (Jan, private collector enforcement action), 1 lion (Mar, welfare emergency), 1 serval (Jun, voluntary surrender), 3 others. 1 animal deceased 30 days post-intake from pre-existing condition.",
    ["animals", "intake", "grant"], ["wildcat-2022"], ["animal-roster", "intake-policy", "vet-protocols"],
    { why_here: ["Gravity 70", "Member: Wildcat Trust 2022", "Active year's intake record"] }),

  mk("vet-protocols", "Veterinary Protocols", "canon", 202, 820, 73,
    "Standardized protocols for intake exam, annual wellness, emergency intervention, and end-of-life. All procedures documented in VetPro. Remote specialist consults for complex procedures.",
    ["care", "quality", "grant"], ["wildcat-2022"], ["animal-care-program", "enrichment-program", "evaluation-approach"]),

  mk("enrichment-program", "Behavioral Enrichment", "program", 402, 800, 65,
    "Daily enrichment schedule per animal: scent, novel food, puzzle feeders, environmental modification. Behavioral data tracked weekly in enrichment log. Quarterly reviews by full care team.",
    ["care", "programs"], [], ["animal-care-program", "vet-protocols"]),

  // --- Programs ---

  mk("animal-care-program", "Animal Care Program", "program", 628, 510, 85,
    "Core program: daily care, feeding, and welfare monitoring for all 42 residents. 8 animal care staff on rotating 12-hour shifts, 365 days/year. On-call vet available at all times.",
    ["programs", "care", "grant"], ["wildcat-2022"], ["animal-roster", "vet-protocols", "enrichment-program"],
    { why_here: ["Gravity 85", "Member: Wildcat Trust 2022", "Primary operational program"] }),

  mk("education-outreach", "Education & Outreach", "program", 804, 500, 62,
    "School programs serving ~1,200 students/yr across 4 local districts. Speaker series on captive wildlife policy and sanctuary alternatives. 2 staff educators. Curriculum developed in-house.",
    ["programs", "community"], [], ["sanctuary-tours", "community-access", "theory-of-change"]),

  mk("volunteer-program", "Volunteer Program", "program", 628, 660, 68,
    "62 active volunteers. Roles: grounds, enrichment prep, education support, admin. 40-hour onboarding required. 71% retention at one year. 6 long-term docents with 5+ years each.",
    ["programs", "capacity"], [], ["volunteer-base", "education-outreach"]),

  mk("sanctuary-tours", "Sanctuary Tours", "program", 804, 650, 58,
    "Quarterly behind-the-scenes tours for donors and educators only — no general public exhibition. 8 tour dates/year, max 12 participants per date. Waitlist typically 3–4 months.",
    ["programs", "development", "community"], [], ["education-outreach", "foundation-prospects"]),

  mk("volunteer-base", "Volunteer Base", "data", 628, 820, 80,
    "62 active volunteers; 11 have served 5+ years. Average 5.8 hrs/week. Age range 18–71. 38% Josephine County residents. Largest cohort: retired professionals and educators.",
    ["capacity", "grant", "volunteer"], ["wildcat-2022"], ["volunteer-program", "org-overview", "sustainability"],
    { why_here: ["Gravity 80", "Member: Wildcat Trust 2022", "Core capacity metric"] }),

  mk("keeper-training", "Keeper Training Plan", "drop", 802, 820, 60,
    "Draft proposal: cross-train 4 animal care staff with specialist felid keepers from Portland Zoo. Estimated cost $28k. Submitted to board Q3 2026 for FY27 budget consideration.",
    ["capacity", "strategy", "internal"], [], ["staff-model", "animal-care-program"],
    { temporal: "Q3 2026 board review", why_here: ["Gravity 60", "Pending board decision", "Links to staff model and core program"] }),

  // --- Reports / Docs ---

  mk("outcomes-2025", "2025 Outcomes", "report", 1060, 620, 72,
    "All 42 animals met welfare benchmarks. 7 intakes processed. ~1,200 students reached via education. 0 USDA violations for 14th consecutive year. 62 volunteers retained. Wildcat Trust deliverables met.",
    ["impact", "grant"], ["wildcat-2022"], ["animal-care-program", "education-outreach", "volunteer-program"],
    { why_here: ["Gravity 72", "Member: Wildcat Trust 2022", "Primary impact evidence"] }),

  mk("annual-report-2025", "Annual Report 2025", "report", 1252, 700, 57,
    "FY2025 public annual report. 28 pages. Published April 2026. Includes welfare outcomes, financial summary, and individual animal spotlight section featuring Sultan, Indira, and Kestrel.",
    ["communications", "impact"], [], ["outcomes-2025", "org-overview"]),

  mk("vet-assessment-summary", "Vet Assessment Q2 2026", "report", 1060, 762, 63,
    "39 of 42 animals stable. 3 on active monitoring plans: Sultan (age-related mobility, enrichment modifications in place), Indira (dental intervention scheduled November), Zola (dermatitis, topical protocol active).",
    ["care", "quality"], [], ["vet-protocols", "animal-roster", "leopard-cohort"]),

  mk("grant-language-notes", "Grant Language Notes", "report", 1252, 844, 50,
    "Internal notes on funder vocabulary preferences. Wildcat Trust: 'welfare outcomes' preferred over 'success metrics.' Pacific Wildlife: use 'non-domestic' not 'exotic.' Do not use the word 'rescue.'",
    ["grant", "internal", "development"], [], ["mission", "org-overview"]),

  // --- Grants ---

  mk("wildcat-grant-2022", "Wildcat Trust Grant 2022", "grant", 1060, 900, 75,
    "3-year grant from Wildcat Trust, 2022–2025. $340k total. Purpose: veterinary infrastructure and staff training. All deliverables met. Renewal proposal submitted June 2026.",
    ["grant", "history", "wildcat"], ["wildcat-2022"], ["wildcat-reporting-2023", "past-funders", "vet-protocols"],
    { why_here: ["Gravity 75", "Member: Wildcat Trust 2022", "Core grant — renewal in progress"] }),

  mk("wildcat-reporting-2023", "Wildcat Reporting 2023", "report", 1260, 964, 65,
    "2023 interim report to Wildcat Trust. All deliverables met: vet infrastructure complete, 3 staff trained. Funder noted enrichment documentation quality as a model for other grantees.",
    ["grant", "history", "wildcat"], ["wildcat-2022"], ["wildcat-grant-2022"]),

  // --- Drops ---

  mk("transfer-intake-oct", "Tiger Transfer — October", "drop", 456, 956, 68,
    "Incoming: 2 tigers from Midwest Regional Zoo downsizing, October 2026. Pre-intake welfare assessment completed by Dr. Osei. Quarantine space confirmed in Tiger Habitat 1. Thiago leading intake team.",
    ["action", "intake", "animals"], [], ["tiger-cohort", "intake-records-2025", "vet-protocols"],
    { temporal: "due: 2026-10-15", why_here: ["Gravity 68", "Imminent intake — October 2026", "Active coordination task"] }),
];

export const SEED_LIKENESSES: LikenessRecord[] = [
  {
    id: "wildcat-2022",
    name: "Wildcat Trust 2022",
    formation: "circle",
    memberIds: [
      "mission", "org-overview", "care-philosophy", "staff-model", "fy27-budget",
      "animal-roster", "intake-records-2025", "animal-care-program",
      "outcomes-2025", "volunteer-base", "wildcat-grant-2022",
    ],
  },
  {
    id: "current-priorities-like",
    name: "Current Priorities",
    formation: "row",
    memberIds: ["current-priorities", "strategic-plan", "theory-of-change"],
  },
];

export const RELATIONS: Relation[] = [
  { from: "mission",            to: "org-overview",         strength: "strong" },
  { from: "mission",            to: "vision",               strength: "strong" },
  { from: "animal-care-program",to: "animal-roster",        strength: "strong" },
  { from: "animal-care-program",to: "vet-protocols",        strength: "medium" },
  { from: "intake-records-2025",to: "animal-roster",        strength: "strong" },
  { from: "strategic-plan",     to: "theory-of-change",     strength: "strong" },
  { from: "fy27-budget",        to: "fy26-audit",           strength: "medium" },
  { from: "volunteer-program",  to: "volunteer-base",       strength: "medium" },
  { from: "education-outreach", to: "sanctuary-tours",      strength: "weak" },
  { from: "outcomes-2025",      to: "annual-report-2025",   strength: "medium" },
  { from: "wildcat-grant-2022", to: "wildcat-reporting-2023", strength: "strong" },
  { from: "lion-cohort",        to: "animal-roster",        strength: "medium" },
  { from: "tiger-cohort",       to: "animal-roster",        strength: "medium" },
  { from: "enrichment-program", to: "animal-care-program",  strength: "medium" },
  { from: "intake-records-2025",to: "intake-policy",        strength: "medium" },
  { from: "vet-assessment-summary", to: "vet-protocols",    strength: "medium" },
];
