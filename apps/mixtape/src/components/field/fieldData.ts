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

export const INITIAL_MOIETIES: Moiety[] = [
  // --- Canon / Identity ---
  mk("mission", "Mission / 50", "canon", 160, 120, 95,
    "We build community resilience through food access, youth development, and volunteer-powered mutual aid.",
    ["identity","grant","core"], ["cabot-2019"], ["org-overview","community-need","vision"],
    { why_here: ["Gravity 95","Core identity document","Member: Cabot Foundation 2019","Raised by you"] }),
  mk("vision", "Vision", "canon", 340, 80, 72,
    "A city where every neighbor has access to dignified food, meaningful work, and belonging.",
    ["identity","core"], [], ["mission","theory-of-change"]),
  mk("org-overview", "Organization Overview", "canon", 510, 165, 85,
    "Founded 2009. Staff of 14 FTE, 103 active volunteers. Annual budget ~$2.1M across 4 programs.",
    ["identity","grant","capacity"], ["cabot-2019"], ["mission","staff-model","volunteer-base"],
    { why_here: ["Gravity 85","Member: Cabot Foundation 2019","Related to Volunteer Base"] }),
  mk("community-need", "Community Need", "canon", 510, 315, 70,
    "29% of households in the service area are food insecure. Youth unemployment at 18%. Transit gaps limit access.",
    ["context","grant"], ["cabot-2019"], ["mission","youth-program","food-access"]),
  mk("website-about", "Website About", "report", 320, 240, 48,
    "Public-facing description of the organization for the website About page.",
    ["identity","external"], [], ["org-overview","press-boilerplate"]),
  mk("press-boilerplate", "Press Boilerplate", "report", 165, 295, 50,
    "Standard 3-sentence description for press releases and grant cover letters.",
    ["identity","external","grant"], [], ["mission","org-overview"]),
  mk("equity-approach", "Equity Approach", "canon", 340, 360, 60,
    "We center community voice in program design. Staff live in the neighborhoods we serve. Leadership reflects our community.",
    ["equity","identity"], [], ["community-need","population-served"]),
  // --- Strategy ---
  mk("strategic-plan", "Strategic Plan", "canon", 710, 100, 75,
    "3-year plan 2024–2026: deepen food access, scale youth program, build volunteer pipeline, launch earned revenue.",
    ["strategy","governance"], ["current-priorities-like"], ["theory-of-change","current-priorities"]),
  mk("theory-of-change", "Theory of Change", "canon", 885, 78, 65,
    "Stable food → family stability → youth engagement → volunteer retention → community resilience.",
    ["strategy"], ["current-priorities-like"], ["strategic-plan","vision"]),
  mk("current-priorities", "Current Priorities", "canon", 730, 248, 80,
    "FY27 focus: Garden Project expansion, Cabot renewal, volunteer longevity study, DEIJ audit.",
    ["strategy","governance"], ["current-priorities-like"], ["strategic-plan","garden-project"]),
  mk("sustainability", "Sustainability", "canon", 908, 225, 62,
    "Revenue diversification goal: earned income 15% by FY28. Volunteer program reduces labor costs ~$320k/yr.",
    ["finance","strategy"], [], ["fy27-budget","volunteer-base"]),
  mk("evaluation-approach", "Evaluation Approach", "canon", 1030, 148, 58,
    "Participatory evaluation. Community-defined outcomes. Annual external review. Logic model updated annually.",
    ["quality","grant"], [], ["outcomes-2025"]),
  // --- Governance ---
  mk("leadership", "Leadership", "canon", 1320, 118, 68,
    "ED: Constance Farrow (12 yrs). Deputy ED: Tomás Ruiz. Finance Director: Kezia Watts.",
    ["governance","capacity"], [], ["board","staff-model"]),
  mk("board", "Board", "data", 1498, 162, 62,
    "17-member board. 11 women. 8 community members. 4 with legal/finance expertise. Meets bimonthly.",
    ["governance"], [], ["leadership"]),
  mk("org-history", "Organizational History", "report", 1320, 265, 52,
    "Founded 2009 by 6 neighbors after a grocery store closure. First grant: $12k from Community Foundation.",
    ["identity","context"], [], ["org-overview","leadership"]),
  mk("staff-model", "Staff Model", "data", 1148, 200, 63,
    "14 FTE: 4 program, 4 admin, 2 dev, 2 comms, 2 ops. Average tenure 5.2 years.",
    ["capacity","grant"], ["cabot-2019"], ["org-overview","volunteer-base"]),
  // --- Finance ---
  mk("fy27-budget", "FY27 Budget", "data", 1428, 368, 78,
    "Total revenue: $2.18M. Expenses: $2.04M. Net: +$140k. Program 72%, Admin 18%, Dev 10%.",
    ["finance","grant"], ["cabot-2019"], ["fy26-audit","sustainability"],
    { why_here: ["Gravity 78","Member: Cabot Foundation 2019","Active budget"] }),
  mk("fy26-audit", "FY26 Audit", "report", 1578, 448, 53,
    "Clean opinion. Net assets increased $88k. No material weaknesses. Auditor: Crane & Bloom LLP.",
    ["finance"], [], ["fy27-budget"]),
  mk("past-funders", "Past Funders", "data", 1218, 398, 63,
    "Cabot Foundation, Community Health Trust, City Arts & Culture, 3 family foundations, 14 corporate sponsors.",
    ["finance","development"], [], ["cabot-grant-2019"]),
  mk("foundation-prospects", "Foundation Prospects", "data", 1398, 518, 58,
    "7 prospects in active research. 2 letters of inquiry submitted. 1 site visit scheduled Q3.",
    ["finance","development"], [], ["past-funders"]),
  mk("program-calendar", "Program Calendar", "data", 1195, 515, 52,
    "Garden open May–Oct. Youth program Sept–June. Volunteer training monthly. Annual gala: March.",
    ["operations"], [], ["youth-program","garden-project"]),
  mk("partnerships", "Partnerships", "data", 1018, 458, 54,
    "12 active partnerships: 3 schools, 2 hospitals, 4 food banks, city parks dept, 2 faith communities.",
    ["community","capacity"], [], ["youth-program","food-access"]),
  // --- Programs ---
  mk("youth-program", "Youth Program", "program", 278, 598, 85,
    "Serves 240 youth ages 10–18. After-school, summer, mentorship. 94% HS completion among participants.",
    ["programs","community","grant"], ["cabot-2019"], ["volunteer-base","population-served","outcomes-2025"],
    { why_here: ["Gravity 85","Member: Cabot Foundation 2019","Core program"] }),
  mk("volunteer-training", "Volunteer Training", "program", 115, 698, 63,
    "12-hour onboarding. Monthly skill sessions. 76% of trained volunteers stay 2+ years.",
    ["programs","capacity"], [], ["volunteer-base","volunteer-handbook"]),
  mk("garden-project", "Garden Project", "program", 428, 698, 62,
    "4.2-acre community garden. 320 plot-holders. 18,000 lbs produce donated to food pantry annually.",
    ["programs","community","food"], [], ["food-access","community-survey"]),
  mk("food-access", "Food Access Project", "program", 278, 808, 65,
    "Weekly distribution. 1,200 households served. Partners: 4 food banks, 2 hospitals.",
    ["programs","food","community"], [], ["garden-project","community-need","partnerships"]),
  mk("volunteer-base", "Volunteer Base", "data", 115, 498, 87,
    "103 active volunteers; 17 have served for 10+ years. Average 6.2 hrs/week. Age range 16–74.",
    ["capacity","grant","volunteer"], ["cabot-2019"], ["youth-program","volunteer-training","org-overview"],
    { why_here: ["Gravity 87","Member: Cabot Foundation 2019","Raised by you","Related to Youth Program"] }),
  mk("population-served", "Population Served", "data", 455, 505, 68,
    "Primary: food-insecure households (97201, 97210, 97217). Youth: ages 10–18 in same zip codes.",
    ["community","grant"], [], ["youth-program","community-need"]),
  // --- Reports / Docs ---
  mk("outcomes-2025", "2025 Outcomes", "report", 695, 598, 73,
    "Youth: 94% HS completion. Food: 1,200 households. Garden: 18k lbs donated. Volunteer: 103 active.",
    ["impact","grant"], ["cabot-2019"], ["youth-program","food-access","garden-project"],
    { why_here: ["Gravity 73","Member: Cabot Foundation 2019","Impact evidence"] }),
  mk("cabot-reporting-2020", "Cabot Reporting 2020", "report", 595, 908, 68,
    "2020 final report to Cabot Foundation. Met all deliverables. Volunteer count exceeded target by 14%.",
    ["grant","history"], ["cabot-2019"], ["cabot-grant-2019","volunteer-base"]),
  mk("volunteer-handbook", "Volunteer Handbook", "report", 165, 875, 48,
    "42-page handbook covering orientation, policies, safety, roles, and community agreements.",
    ["volunteer","operations"], [], ["volunteer-training"]),
  mk("recruitment-notes", "Recruitment Notes", "report", 365, 895, 44,
    "Working notes on volunteer recruitment pipeline. Last updated Aug 2026.",
    ["volunteer","operations"], [], ["volunteer-base","volunteer-training"]),
  mk("annual-report-2025", "Annual Report 2025", "report", 848, 698, 58,
    "FY2025 public annual report. 24 pages. Published March 2026.",
    ["communications","impact"], [], ["outcomes-2025","org-overview"]),
  mk("community-survey", "Community Survey", "report", 578, 768, 48,
    "Annual needs survey. 2025: n=412. Top needs: food, childcare, transit, healthcare.",
    ["community","context"], [], ["community-need","population-served"]),
  mk("grant-language-notes", "Grant Language Notes", "report", 708, 878, 58,
    "Working notes on grant language preferences and vocabulary. Not for external use.",
    ["grant","internal"], [], ["mission","org-overview"]),
  mk("program-testimonials", "Program Testimonials", "report", 848, 878, 43,
    "16 participant testimonials. 8 youth, 4 volunteer, 4 community member. Approved for publication.",
    ["communications","impact"], [], ["youth-program","volunteer-base"]),
  mk("data-dictionary", "Data Dictionary", "report", 1018, 798, 38,
    "Internal data dictionary for program tracking database. Maintained by ops team.",
    ["internal","operations"], [], []),
  // --- Grant ---
  mk("cabot-grant-2019", "Cabot Grant 2019", "grant", 318, 445, 74,
    "3-year grant from Cabot Foundation, 2019–2022. $225k total. Purpose: volunteer infrastructure.",
    ["grant","history","cabot"], ["cabot-2019"], ["cabot-reporting-2020","past-funders","volunteer-base"],
    { why_here: ["Gravity 74","Member: Cabot Foundation 2019","Core grant history"] }),
  // --- Drops ---
  mk("send-maya", "Send Maya revision", "drop", 588, 478, 63,
    "Send Maya revised Youth Program overview. Due September 10, 2026.",
    ["action","grant"], [], ["youth-program","org-overview"],
    { temporal: "due: 2026-09-10", why_here: ["Gravity 63","Due soon: Sep 10","Active task"] }),
  mk("potluck-brainstorm", "Potluck Brainstorm", "drop", 998, 958, 47,
    "Brainstorm notes from Aug 12 potluck planning session. Ephemeral.",
    ["ephemeral","internal"], [], []),
];

export const SEED_LIKENESSES: LikenessRecord[] = [
  {
    id: "cabot-2019",
    name: "Cabot Foundation 2019",
    formation: "circle",
    memberIds: ["mission","org-overview","volunteer-base","staff-model","fy27-budget","community-need","outcomes-2025","cabot-grant-2019","cabot-reporting-2020"],
  },
  {
    id: "current-priorities-like",
    name: "Current Priorities",
    formation: "row",
    memberIds: ["current-priorities","strategic-plan","theory-of-change"],
  },
];

export const RELATIONS: Relation[] = [
  { from: "mission", to: "org-overview", strength: "strong" },
  { from: "mission", to: "vision", strength: "strong" },
  { from: "youth-program", to: "volunteer-base", strength: "medium" },
  { from: "youth-program", to: "outcomes-2025", strength: "medium" },
  { from: "youth-program", to: "population-served", strength: "medium" },
  { from: "cabot-grant-2019", to: "cabot-reporting-2020", strength: "strong" },
  { from: "strategic-plan", to: "theory-of-change", strength: "strong" },
  { from: "fy27-budget", to: "fy26-audit", strength: "medium" },
  { from: "volunteer-base", to: "volunteer-training", strength: "medium" },
  { from: "food-access", to: "garden-project", strength: "weak" },
  { from: "outcomes-2025", to: "annual-report-2025", strength: "medium" },
];
