# 07_BLOCKS_ARCHITECTURE.md

## EarthLab Block System: Comprehensive Architecture

**Status:** ✅ **IMPLEMENTED** (Phase 2A - November 2024)
**Audience:** Backend + Frontend + Product team
**Scope:** What blocks ARE, how they're structured, future-proofing
**Last Updated:** 2024-11-21 (implemented three-layer architecture in Django models)

---

## 📋 Table of Contents

1. [What is a Block?](#1-what-is-a-block)
2. [Three-Layer Architecture](#2-three-layer-architecture)
3. [TypeScript Type System](#3-typescript-type-system)
4. [Data Model (Backend)](#4-data-model-backend)
5. [External Tool Integration](#5-external-tool-integration)
6. [Assessment Strategy](#6-assessment-strategy)
7. [Accessibility & Educator Metadata](#7-accessibility--educator-metadata)
8. [Future-Proofing: Sharing & Reuse](#8-future-proofing-sharing--reuse)
9. [Implementation Roadmap](#9-implementation-roadmap)
10. [Confirmed Decisions & Design Notes](#10-confirmed-decisions--design-notes)

---

## 1. What is a Block?

### Philosophy

A **Block** is the smallest meaningful unit of content within Mixtape. It is:

- **Purposeful** — Has clear intent (learning, writing, event information, etc.)
- **Self-contained** — Stands alone conceptually
- **Reusable** — Can appear in multiple contexts
- **Typed** — Different blocks serve different functions
- **Authored** — Created by educators/groups/users, can be shared
- **Sponsor-scoped** — Always owned by a Group or Member (polymorphic sponsorship)

### Extensible Block Type Hierarchy

`BaseBlock` is designed as a parent to multiple specialized block types, **not just `LessonBlock`**:

**Current & Near-term:**
- **LessonBlock** — Learning-focused (EarthLab courses, modules, lessons)
  - Carries pedagogical metadata, educator notes, teaching constraints
  - Assessment & accessibility fields belong here

**Future:**
- **WritingBlock** — Writing-focused (Hub writing/story contributions)
- **EventBlock** — Event information (community events, gatherings)
- **ResourceBlock** — Standalone resources and references
- **DiscussionBlock** — Threaded discussions (Threadworks integration)

Each inheriting block type carries specialized metadata appropriate to its context and sponsoring entity (e.g., `WritingBlock` may have different assessment patterns than `LessonBlock`).

### Block as Teaching/Content Object

Within the learning context, a `LessonBlock` is a **teaching object** that carries:

- **What to teach** (content)
- **How to teach it** (pedagogy instructions)
- **What constraints exist** (room setup, materials, group size)
- **What educators have learned** (best practices, warnings)
- **How to assess** (optional grading, rubrics, external tools)
- **Accessibility considerations** (transcripts, alt text, reading level)

### What Blocks ARE NOT

- ❌ Just rich text (that's the *content* within a block)
- ❌ Atomic in placement (ordering happens at placement layer)
- ❌ Always assessable (some are pure content)
- ❌ Tightly coupled to specific lessons
- ❌ Limited to learning contexts (they're a general pattern across Mixtape)

---

## 2. Three-Layer Architecture

EarthLab uses **three conceptual layers** to separate concerns:

```
┌─────────────────────────────────────────────────────────┐
│ Layer A: BaseBlock (WHAT it is)                         │
│ ─────────────────────────────────────────────────────── │
│ Canonical representation (generic across block types)    │
│ Content, external wiring, basic metadata                │
│ Reusable across contexts (lessons, curricula, groups)   │
│ Lives in database once per unique block                 │
│                                                         │
│ Parent to: LessonBlock, WritingBlock, EventBlock, ...   │
└─────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Layer B: Specialized Block Types (e.g., LessonBlock)    │
│ ─────────────────────────────────────────────────────── │
│ EXTENDED with context-specific metadata                 │
│ For LessonBlock:                                        │
│   - Teaching instructions, pedagogy constraints         │
│   - Assessment & accessibility metadata                 │
│   - Learner group mode, difficulty, time estimate       │
│ Reusable across groups/courses (like BaseBlock)         │
│                                                         │
│ For WritingBlock, EventBlock, etc:                      │
│   - Their own specialized metadata                      │
└─────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Layer C: SpecializedBlockPlacement (WHERE & WHEN)       │
│ ─────────────────────────────────────────────────────── │
│ Pure structural: "Place Block X at context Y"           │
│ For LessonBlocks: "Place LessonBlock X at order N"      │
│ One entry per placement                                │
│ Contains context FK, block FK, order, overrides         │
│ Placement-specific metadata (visibility, conditions)    │
└─────────────────────────────────────────────────────────┘
```

### Why Three Layers?

**Problem:** A block can appear in multiple contexts, but position/ordering is context-specific.

**Solution:** Separate identity (A+B) from placement (C).

**Example (LessonBlock in EarthLab):**

```
Teacher A creates: Quiz: "Soil Types" (BaseBlock + LessonBlock)
    ↓
Teacher B adds it to Lesson 1, position 3 (LessonBlockPlacement)
Teacher C adds it to Lesson 2, position 1 (different LessonBlockPlacement)
Teacher D adds it to Lesson 3, position 5 (another LessonBlockPlacement)

→ One LessonBlock, three Placements (different orders in different lessons)
→ If Teacher B updates teaching_instructions, all three lessons see it
→ Ordering is independent per lesson
```

---

## 3. TypeScript Type System

### Block Type Enum (Extensible)

```typescript
// Can grow over time without breaking code
export enum BlockType {
  // Phase 2A (MVP) — Text-based content
  OBJECTIVES = 'objectives',      // Learning goals
  CONTENT = 'content',            // Reading, exposition
  ACTIVITY = 'activity',          // Exercise, practice
  NOTES = 'notes',                // Reflection, wrap-up

  // Phase 2B — External + assessment
  EMBED = 'embed',                // External tool (Quizlet, H5P)
  CHECK_IN = 'check_in',          // Quick assessment / poll

  // Phase 3+ — Specialized
  VIDEO = 'video',
  ASSESSMENT = 'assessment',
  INTERACTIVE = 'interactive',
  DISCUSSION = 'discussion',
}

export enum LearnerGroupMode {
  SOLO = 'solo',
  PAIR = 'pair',
  SMALL_GROUP = 'small_group',
  FULL_GROUP = 'full_group',
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum GradingMode {
  NOT_GRADED = 'not_graded',
  PASS_FAIL = 'pass_fail',
  POINTS = 'points',
  PERCENT = 'percent',
}

export type SponsorType = 'group' | 'member';
```

### BaseBlock Interface

```typescript
/**
 * BaseBlock: Canonical block representation (generic parent)
 *
 * This is what gets stored, versioned, shared across contexts.
 * Not lesson-specific. Not placement-specific.
 *
 * Can be parent to LessonBlock, WritingBlock, EventBlock, etc.
 * Keep BaseBlock fields generic and reusable.
 */
export interface BaseBlock {
  // Identity
  id: string;
  title: string;
  summary?: string;
  block_type: BlockType;

  // Content (from BaseContent mixin)
  body?: string;
  tiptap_json?: TiptapJSON;

  // Sponsorship & Ownership (polymorphic)
  sponsor_id: string;
  sponsor_type: SponsorType;  // 'group' or 'member'
  author_id?: string;
  submitted_by_id?: string;

  // External Tool Wiring
  external_provider?: 'quizlet' | 'h5p' | 'youtube' | 'loom' | 'custom_url';
  external_id?: string;         // Quizlet set ID, etc.
  external_config?: {
    url?: string;
    embed_code?: string;
    api_key?: string;
    [key: string]: any;
  };

  // System metadata
  status: ContentStatus;
  created_at: string;
  updated_at: string;
  published_at?: string;
  archived_at?: string;
}

/**
 * LessonBlock: BaseBlock + Pedagogical Metadata
 *
 * This is what appears in EarthLab course structures.
 * Carries teaching wisdom, assessment potential, accessibility.
 * Reusable across lessons/curricula within EarthLab.
 *
 * ⚠️  NOTE: Assessment and accessibility fields are LessonBlock-specific
 * because other block types (WritingBlock, EventBlock) may not need them,
 * or may need different patterns.
 */
export interface LessonBlock extends BaseBlock {
  // Educator-Facing Metadata
  teaching_instructions?: string;       // "How to facilitate this"
  constraints?: {
    max_group_size?: number;
    min_group_size?: number;
    room_setup?: string;
    materials_needed?: string[];
    technology_required?: string[];
    prerequisites?: string[];
    [key: string]: any;
  };
  notes_from_educators?: string;        // "We learned...", "Watch out for..."

  // Pedagogical attributes
  learner_group_mode: LearnerGroupMode;
  difficulty_estimate?: DifficultyLevel;  // Type-safe, can be localized
  time_estimate_minutes?: number;
  learning_objectives?: string[];

  // Assessment (LessonBlock-specific)
  is_assessable: boolean;
  max_score?: number;           // If gradeable
  grading_mode?: GradingMode;

  // Accessibility (LessonBlock-specific)
  accessibility_notes?: string;
  transcript_url?: string;
  alt_text?: string;
  required_reading_level?: 'elementary' | 'middle' | 'high' | 'college';

  // Version control (future)
  version?: number;
  forked_from_id?: string;              // If this is a fork

  // Library metadata
  is_donated?: boolean;                 // In community library
  block_count_in_use?: number;          // How many lessons use this
}

/**
 * Discriminated Union: Type-safe block handling
 */
export type AnyBlock = BaseBlock | LessonBlock;
```

### LessonBlockPlacement Interface

```typescript
/**
 * LessonBlockPlacement: The placement/ordering layer
 *
 * Pure structure: "This block appears here, in this order"
 * Separates block identity from lesson-specific positioning
 */
export interface LessonBlockPlacement {
  id: string;
  lesson_id: string;
  block_id: string;
  order: number;

  // Placement-specific overrides (future)
  visibility_overrides?: {
    hidden?: boolean;
    show_from_date?: string;
    show_until_date?: string;
  };

  // Conditional release (future)
  conditional_logic?: {
    require_prior_assessment?: string; // block_id to complete first
    min_score?: number;
  };

  // Metadata
  created_at: string;
  updated_at: string;
}

/**
 * Lesson: Simplified with Placement
 *
 * Before: Lesson.blocks (array)
 * After: Lesson → LessonBlockPlacement[] → LessonBlock
 */
export interface Lesson {
  id: string;
  title: string;
  summary?: string;
  learning_objectives?: string[];

  module_id: string;
  status: ContentStatus;

  // Relationships handled through LessonBlockPlacement
  block_placements?: LessonBlockPlacement[];
  blocks?: LessonBlock[]; // Denormalized for convenience

  created_at: string;
  updated_at: string;
}
```

---

## 4. Data Model (Backend)

### Django Models (Implemented)

**Location:** `mixtape_core/mixtape/earthlab/models/core.py`

```python
# ACTUAL IMPLEMENTATION (as of Nov 2024)

# Note: EarthlabBase is a mixin providing .for_sponsor() and .active() query managers

class BaseBlock(BaseContent):
    """
    Canonical block representation: generic across all block types.

    Inherits from BaseContent:
    - UUID primary key
    - Polymorphic sponsor (Group or Member)
    - author, submitted_by
    - title, summary, slug
    - body, tiptap_json
    - tags, categories, attachments
    - published_at, status

    Does NOT include EarthlabBase - that's added by child classes as needed.
    Parent to: LessonBlock, WritingBlock, EventBlock, etc.
    """
    BLOCK_TYPE_CHOICES = (
        ('objectives', 'Learning Objectives'),
        ('content', 'Content/Reading'),
        ('activity', 'Activity/Exercise'),
        ('notes', 'Notes/Reflection'),
        ('embed', 'External Tool Embed'),
        ('check_in', 'Check-in/Poll'),
    )

    block_type = models.CharField(max_length=50, choices=BLOCK_TYPE_CHOICES)

    # External tool integration
    external_provider = models.CharField(max_length=50, blank=True)
    external_id = models.CharField(max_length=255, blank=True)
    external_config = models.JSONField(null=True, blank=True)

    class Meta:
        abstract = True  # No separate table - fields added to child tables
        ordering = ['created_at']


class LessonBlock(BaseBlock, EarthlabBase):
    """
    BaseBlock + pedagogical, assessment, and accessibility metadata.

    LessonBlock-specific because:
    - Other block types may not need assessment/accessibility fields
    - Assessment patterns vary by block type
    - Accessibility requirements differ (e.g., EventBlock may not need transcripts)

    This is what appears in EarthLab block library and course structures.
    Reusable across lessons, modules, curricula, groups.
    """
    # Educator metadata
    teaching_instructions = models.TextField(null=True, blank=True)
    constraints = models.JSONField(null=True, blank=True)
    notes_from_educators = models.TextField(null=True, blank=True)

    # Pedagogical attributes
    learner_group_mode = models.CharField(
        max_length=50,
        choices=LEARNER_GROUP_MODE_CHOICES,
        default='solo'
    )
    difficulty_estimate = models.CharField(max_length=50, null=True, blank=True)
    time_estimate_minutes = models.IntegerField(null=True, blank=True)

    # Assessment fields (LessonBlock-specific)
    is_assessable = models.BooleanField(default=False)
    max_score = models.IntegerField(null=True, blank=True)
    grading_mode = models.CharField(max_length=50, null=True, blank=True)

    # Accessibility fields (LessonBlock-specific)
    accessibility_notes = models.TextField(null=True, blank=True)
    transcript_url = models.URLField(null=True, blank=True)
    alt_text = models.TextField(null=True, blank=True)
    required_reading_level = models.CharField(max_length=50, null=True, blank=True)

    # Versioning (future)
    version = models.IntegerField(default=1)
    forked_from = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )

    # Library metadata
    is_donated = models.BooleanField(default=False)

    class Meta:
        ordering = ['created_at']


class LessonBlockPlacement(models.Model):
    """
    Pure structural layer: lesson + block + order.
    Handles reuse of blocks across multiple lessons.
    """
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='block_placements')
    block = models.ForeignKey(LessonBlock, on_delete=models.CASCADE, related_name='placements')
    order = models.IntegerField()

    # Placement-specific overrides (future)
    visibility_overrides = models.JSONField(null=True, blank=True)
    conditional_logic = models.JSONField(null=True, blank=True)

    # Soft delete support
    is_deleted = models.BooleanField(default=False)  # Soft delete flag
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = [['lesson', 'order']]
        ordering = ['order']
        indexes = [
            models.Index(fields=['lesson', 'is_deleted']),
        ]

    def __str__(self):
        return f"{self.lesson.title} → {self.block.title} (#{self.order})"
```

### Database Schema Benefits

**After (three-layer separation):**
```
BaseBlock (canonical, parent to all block types)
├── id, title, block_type
├── external_provider, external_id
├── sponsor (polymorphic: Group/Member)
├── author, submitted_by
├── body, tiptap_json
└── status, published_at, archived_at

LessonBlock (extends BaseBlock with EarthLab-specific metadata)
├── inherits all BaseBlock fields
├── teaching_instructions, constraints
├── notes_from_educators
├── learner_group_mode, difficulty_estimate, time_estimate_minutes
├── is_assessable, max_score, grading_mode
├── accessibility_notes, transcript_url, alt_text, required_reading_level
└── version, forked_from, is_donated

LessonBlockPlacement (pure structure)
├── lesson_id (FK)
├── block_id (FK to LessonBlock)
├── order
├── visibility_overrides
├── conditional_logic
├── is_deleted, deleted_at (soft delete support)
```

**Benefits:**
- ✅ Block reuse across lessons doesn't duplicate data
- ✅ Ordering is independent per lesson
- ✅ Pedagogy/assessment/accessibility metadata shared across uses
- ✅ Easy to add placement-specific overrides later
- ✅ Clear path for versioning & forking
- ✅ Extensible to other block types (WritingBlock, EventBlock, etc.)
- ✅ Soft deletes preserve lesson structure while hiding deleted blocks

---

## 5. External Tool Integration

Blocks can reference external platforms natively (not just embeds).

### Supported Providers (Extensible)

```typescript
export type ExternalProvider =
  | 'quizlet'       // Study sets, flashcards
  | 'h5p'           // Interactive learning activities
  | 'youtube'       // Videos (with transcript potential)
  | 'loom'          // Recorded walkthroughs
  | 'khan_academy'  // Video + practice
  | 'custom_url'    // Generic embed
  | 'custom_lti';   // LTI-based tools (future)
```

### Example: Quizlet Integration

```typescript
// Frontend sees this:
const block: LessonBlock = {
  id: 'block-101',
  title: 'Vocabulary: Soil Types',
  block_type: BlockType.EMBED,

  external_provider: 'quizlet',
  external_id: '123456789',      // Quizlet set ID
  external_config: {
    url: 'https://quizlet.com/123456789/soil-types',
    display_mode: 'embed',         // vs 'link' vs 'iframe'
  },

  learner_group_mode: 'solo',
  time_estimate_minutes: 15,
  difficulty_estimate: DifficultyLevel.BEGINNER,
};

// Frontend rendering:
if (block.external_provider === 'quizlet') {
  return <QuizletEmbed setId={block.external_id} />;
}
```

### Future: LTI Integration

```typescript
// Phase 3+: LTI-based tools (Blackboard, Canvas, etc.)
external_config: {
  lti_launch_url: 'https://tool.example.com/launch',
  consumer_key: '...', // Securely stored
  consumer_secret: '...',
  custom_params: {
    user_id: 'dynamically_resolved',
    course_id: 'dynamically_resolved',
  },
}
```

---

## 6. Assessment Strategy

Assessment is **optional and light** in Phase 2A. Design supports future extensibility.

### Phase 2A: Light Assessment Support

```typescript
// LessonBlocks CAN be assessable, but grading is handled externally
export interface LessonBlock {
  is_assessable: boolean;
  max_score?: number;       // If gradeable, what's the max?
  grading_mode?: GradingMode;

  // External assessment still works (Quizlet, H5P handle scoring)
}
```

### Phase 2B+: Quiz System

When we're ready (Phase 2B), add:

```typescript
export interface QuizBlock extends LessonBlock {
  block_type: BlockType.ASSESSMENT;
  questions: Question[];
  allow_retakes: boolean;
  show_answers_after_submit: boolean;
  time_limit_minutes?: number;
}

export interface Question {
  id: string;
  prompt: string;
  question_type: 'multiple_choice' | 'short_answer' | 'true_false' | 'matching';
  options?: QuestionOption[];
  correct_answer: string | string[];
  explanation?: string;
  points: number;
  order: number;
}
```

### Why This Approach?

- ✅ Assessment is pluggable (Quizlet, H5P, custom)
- ✅ Doesn't force complex scoring logic yet
- ✅ Educator metadata (time, difficulty) informs assessments
- ✅ Leaves room for analytics/LMS integration later
- ✅ Assessment fields isolated to LessonBlock (not cluttering BaseBlock)

---

## 7. Accessibility & Educator Metadata

### Accessibility Fields (LessonBlock-specific)

```typescript
export interface LessonBlock {
  // Accessibility metadata
  accessibility_notes?: string;        // "Transcribed", "Audio description", etc.
  transcript_url?: string;             // For videos, lectures
  alt_text?: string;                   // For images, diagrams
  required_reading_level?: string;     // Elementary, middle, high, college

  // Future:
  captions_url?: string;
  audio_description_url?: string;
  braille_available?: boolean;
}
```

### Educator Metadata (Teaching Wisdom)

```typescript
export interface LessonBlock {
  // How to teach it
  teaching_instructions?: string;

  // Constraints & logistics
  constraints?: {
    max_group_size?: number;
    min_group_size?: number;
    room_setup?: 'classroom' | 'outdoor' | 'lab' | 'flexible';
    materials_needed?: string[];
    technology_required?: string[];
    prerequisites?: string[]; // "Complete Block X first"
  };

  // Community wisdom
  notes_from_educators?: string;
  // "Works best if you..." / "Students often struggle with..." / "Try this instead..."
}
```

### Why This Matters

**Educator metadata transforms blocks from content → teaching objects**

Example:
```typescript
const block: LessonBlock = {
  title: 'pH Indicator Experiment',
  block_type: BlockType.ACTIVITY,

  teaching_instructions: `
    Students work in pairs. Have them predict color changes
    before adding indicators. Circulate and ask: "Why did it turn?"
  `,

  constraints: {
    max_group_size: 2,
    materials_needed: [
      'pH paper',
      'Distilled water',
      'Vinegar',
      'Baking soda solution'
    ],
    room_setup: 'lab'
  },

  notes_from_educators: `
    Pro tip: Pre-mix the baking soda solution to save time.
    Watch out: Some students drink the vinegar (seriously!).
    Timing: Usually takes 12-15 min. Buffer 5 min for cleanup.
  `,

  time_estimate_minutes: 20,
  learner_group_mode: 'pair',
  difficulty_estimate: DifficultyLevel.INTERMEDIATE,
};
```

---

## 8. Future-Proofing: Sharing & Reuse

The three-layer architecture enables:

### Feature: Block Curation Workflow (Q4 Discussion)

**Challenge:** Group A's educators discover best practices using a shared block. How do we share their wisdom with Group B without polluting the canonical LessonBlock?

**Proposed Solution (Phase 3+):**

```typescript
// Educator notes at two levels:
export interface LessonBlock {
  // Canonical educator notes (curated by block sponsor/original author)
  notes_from_educators?: string;

  // Future: Allow downstream annotations without forking
  // curator_notes?: {
  //   [group_id: string]: string;  // Group-specific wisdom
  // };

  // Or: Versioning + forking path (cleaner approach)
}

// Phase 3 workflow:
// 1. Group A publishes LessonBlock with initial notes
// 2. Group B uses the block, adds local wisdom
// 3. Group B can suggest improvements (PR-like workflow)
// 4. Group A reviews, merges upstream changes
// 5. Group A publishes new version
// 6. All downstream users see the update (unless pinned to old version)
```

**Key principles for Q4:**
- Original sponsor maintains fidelity (curation step)
- Downstream feedback is invited but controlled
- Forking is available if groups want independence
- Versioning enables gradual rollout of improvements

### Feature: Block Versioning

```typescript
// Future: Track block evolution
export interface LessonBlockVersion {
  block_id: string;
  version_number: number;
  content_snapshot: LessonBlock;
  changed_by_user_id: string;
  change_summary: string;
  created_at: string;
}

// Usage: Educator forks an old version
const newBlock = await blockApi.fork(
  blockId,
  { version: 2, title: 'pH Experiment (2024 Edition)' }
);
```

### Feature: Block Forking

```typescript
// Educator takes a shared block, forks it for their group
const sharedBlock = await blockApi.getBlock('block-101');
const myBlock = await blockApi.fork(sharedBlock.id, {
  title: sharedBlock.title + ' (My Version)',
  sponsor_id: myGroupId,
});

// Now myBlock is independent
myBlock.teaching_instructions = 'Updated for my context...';
myBlock.constraints.materials_needed = ['...'];
await blockApi.update(myBlock.id, myBlock);
```

### Feature: Block Lineage Tracking

```typescript
// Track provenance: Who created this? Who's using it?
export interface BlockLineage {
  block_id: string;
  original_author_id: string;
  original_sponsor_id: string;
  forked_from_id?: string;        // If this is a fork
  usage_count: number;            // How many lessons use this
  is_shared: boolean;
  is_in_community_library: boolean;
}
```

### Feature: Curriculum-Level Reuse

```typescript
// Eventually: Share entire curricula with block lineage
// Curriculum A (Group 1)
//   → Module 1 → Lesson 1 → Block 1, Block 2, Block 3
//
// Group 2 imports Curriculum A
//   → Blocks are auto-forked per Group 2's sponsor
//   → Lineage tracks: "These came from Group 1's Curriculum A"
//   → Group 2 can later merge upstream improvements
```

---

## 9. Implementation Roadmap

### Phase 2A (MVP) — Three-Layer Architecture + TextBlock

**Goal:** Establish three-layer architecture with LessonBlock-specific assessment/accessibility

**What to build:**
- ✅ BaseBlock model (generic, parent to all)
- ✅ LessonBlock model (BaseBlock + pedagogy + assessment + accessibility)
- ✅ LessonBlockPlacement model (pure ordering + soft delete support)
- ✅ Lesson simplified (remove direct ordering)
- ✅ API endpoints (CRUD for blocks + placements)
- ✅ Frontend: QuickEditor, FullEditor, CourseTreeView
- ✅ Soft delete UI for course owners

**Database:** 3 tables (BaseBlock, LessonBlock, LessonBlockPlacement)

### Phase 2B — External Tools + Enhanced Assessment

**Goal:** Support Quizlet, H5P, simple assessment

**What to build:**
- ✅ External provider integration (Quizlet, H5P, YouTube)
- ✅ QuizBlock type (questions + scoring)
- ✅ CheckInBlock type (quick polls/assessments)
- ✅ Difficulty type enum (localizable)

**Database:** Add external_provider, external_id fields (already in BaseBlock schema)

### Phase 3 — Versioning, Forking & Curation

**Goal:** Support block reuse, forking, curriculum sharing with curation workflow

**What to build:**
- ✅ BlockVersion model (track changes)
- ✅ Fork API (clone block with new sponsor)
- ✅ Lineage tracking
- ✅ Block library UI (discoverable blocks)
- ✅ Curation workflow (suggest improvements → original sponsor reviews)

**Database:** Add BlockVersion table, forked_from FK, curator_notes JSON

### Phase 3+ — Advanced Assessment & Analytics

**Goal:** Full assessment system with scoring, analytics

**What to build:**
- ✅ Submission/grading system
- ✅ Assessment analytics
- ✅ LTI integration
- ✅ Adaptive release (prerequisites, conditional blocks)

---

## 10. Confirmed Decisions & Design Notes

### Decision 1: BaseBlock ↔ LessonBlock Inheritance Pattern

**Chosen: Option B (FK inheritance)**

```python
# Option B (chosen)
class BaseBlock(EarthlabBaseContent):
    block_type = CharField(...)
    external_provider = CharField(...)
    # ... core fields (generic across all block types)

class LessonBlock(BaseBlock):
    teaching_instructions = TextField(...)
    constraints = JSONField(...)
    is_assessable = BooleanField(...)
    # ... LessonBlock-specific fields
```

**Why this works:**
- ✅ Clear separation: BaseBlock is generic, LessonBlock is EarthLab-specific
- ✅ WritingBlock, EventBlock, etc. inherit from BaseBlock cleanly
- ✅ LessonBlock can add assessment/accessibility without cluttering BaseBlock
- ✅ Easier to query by type (all LessonBlocks vs. all Blocks)
- ✅ Future-proof for multi-block-type architecture

---

### Decision 2: Should Blocks Have Versions?

**Chosen: NOT YET (Phase 2A). Add in Phase 3 when sharing/forking becomes important**

**Phase 2A approach:**
- Blocks are mutable (educators can edit directly)
- No version history needed yet
- Focus on core three-layer architecture

**Phase 3 upgrade path:**
- Add BlockVersion model
- Implement immutable versions
- Support forking with lineage tracking

---

### Decision 3: Sponsor-Scoped Always

**Chosen: YES. Every block is always sponsored by a Group or Member (polymorphic)**

```typescript
// Every BaseBlock has:
sponsor_id: string;
sponsor_type: 'group' | 'member';
```

**Why:**
- ✅ Clear ownership model
- ✅ Permissions are easy to reason about
- ✅ Sponsor can control sharing/publication
- ✅ Fork system later: create new block with different sponsor
- ✅ No need for "original_sponsor" field yet (Phase 3 feature)

---

### Decision 4: Local Annotations vs. Forking (Curation Workflow)

**Chosen: Nuanced approach for Phase 3+**

**Phase 2A:**
- Blocks are canonical (no local annotations)
- Groups can fork if they want to modify
- Keep it simple for MVP

**Phase 3+ (discussed but not fully specified):**
- Allow downstream groups to suggest improvements
- Original sponsor reviews and merges
- Optionally pin to old version if needed
- **Details TBD** — needs product design session
- Consider: PR-like workflow vs. version pinning vs. copy annotations

**Key constraint for Q4:** Balance educator wisdom sharing with canonical integrity

---

### Decision 5: Difficulty Level Should Be Typed & Localizable

**Chosen: YES. Use DifficultyLevel enum, support localization in Phase 3+**

```typescript
// Phase 2A: Enum with English defaults
export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export interface LessonBlock {
  difficulty_estimate?: DifficultyLevel;  // Type-safe
}

// Phase 3+: Support custom difficulty scales per group
// Example: Group A might use "Novice / Familiar / Expert"
// This requires admin settings + translation layer
```

**Why:**
- ✅ Type safety in frontend
- ✅ Consistent API responses
- ✅ Easier to add localization/customization later
- ✅ Can display English defaults or group-specific labels

---

### Decision 6: Block Templates?

**Chosen: NOT YET. Phase 3+ when library gets large**

**Recommendation:**
- Phase 2A: Just blocks
- Phase 3+: Add "Block Templates" if educators request standardization
- Example: "Standard Quiz Template", "Discussion Template"

---

### Decision 7: Soft Delete for Deleted Blocks

**Chosen: YES. Soft delete with course owner hide option**

```python
# LessonBlockPlacement model
class LessonBlockPlacement(models.Model):
    is_deleted = BooleanField(default=False)
    deleted_at = DateTimeField(null=True, blank=True)
    hidden_by_course_owner = BooleanField(default=False)  # UI preference
```

**Phase 2A behavior:**
- Educator deletes block from lesson → sets `is_deleted=True`
- Lesson structure preserved (data recoverable)
- Course owner can toggle visibility in UI

**Phase 3 workflow:**
- Add "Replace with another block" flow
- Show undo option briefly after delete
- Eventually: Archive entire lessons

**Why:**
- ✅ Preserves lesson structure
- ✅ No data loss
- ✅ Supports "hide from UI" without losing reference
- ✅ Easy recovery if needed
- ✅ Analytics still see complete history

---

### Decision 8: Assessment & Accessibility Fields in LessonBlock

**Chosen: YES. Move to LessonBlock (not BaseBlock)**

**Rationale:**
- BaseBlock is generic parent (WritingBlock, EventBlock, etc.)
- Only LessonBlock needs assessment/accessibility metadata
- WritingBlock may have different patterns (e.g., peer feedback, rubrics)
- EventBlock doesn't need transcripts or reading levels
- Keeps BaseBlock lean and extensible

**Fields moved to LessonBlock:**
```python
is_assessable = BooleanField(default=False)
max_score = IntegerField(null=True, blank=True)
grading_mode = CharField(...)
accessibility_notes = TextField(...)
transcript_url = URLField(...)
alt_text = TextField(...)
required_reading_level = CharField(...)
```

---

## Summary Decision Matrix

| Decision | Phase 2A | Phase 2B | Phase 3+ | Status |
|----------|----------|----------|----------|--------|
| Inheritance (FK) | ✅ Use | ✓ Continue | ✓ Continue | **Confirmed** |
| Versions | No | Maybe | ✅ Yes | **Confirmed** |
| Always sponsored | ✅ Yes | ✓ Yes | ✓ Yes | **Confirmed** |
| Local annotations | No | No | ⚠️ Discuss | **Phase 3 TBD** |
| Difficulty typed | ✅ Enum | ✓ Enum | Localized | **Confirmed** |
| Templates | No | No | ✅ Maybe | **Phase 3+** |
| Soft delete | ✅ Yes | ✓ Yes | + Hide UI | **Confirmed** |
| Assessment fields | ✅ LessonBlock | ✓ LessonBlock | ✓ LessonBlock | **Confirmed** |

---

## Next Steps

1. ✅ **Backend team:** Implement three-layer schema (BaseBlock → LessonBlock → LessonBlockPlacement) - **DONE Nov 2024**
2. **Backend team:** Create API endpoints with proper serialization
3. **Frontend team:** Implement block editors using confirmed TypeScript interfaces
4. **Frontend team:** Soft delete UI for course owners (hide/show deleted blocks)
5. **Product team:** Schedule Phase 3 curation workflow design session (Q4 discussion)
6. **All:** Revisit versioning/forking/curation in Phase 3 planning

---

## ✅ Implementation Status (November 2024)

### Completed

**Backend (Django Models):**
- ✅ `EarthlabBase` mixin created (query helpers for `.for_sponsor()` and `.active()`)
- ✅ `BaseBlock` implemented as abstract parent (from `BaseContent`)
  - No EarthlabBase - works for all Mixtape apps (Hub, Almanac, etc.)
  - Includes external tool integration fields
- ✅ `LessonBlock` implemented (`BaseBlock` + `EarthlabBase` + pedagogy fields)
  - Adds EarthLab-specific query managers
  - Includes assessment & accessibility fields
- ✅ `LessonBlockPlacement` implemented (pure structural layer)
  - Enables block reuse across lessons
  - Soft delete support (`is_deleted`, `deleted_at`)
- ✅ All existing models updated (`Course`, `Module`, `Lesson`, `Curriculum`)
  - Now use `BaseContent` + `EarthlabBase` pattern

**Architecture Decisions Confirmed:**
- ✅ Three-layer separation implemented
- ✅ `BaseBlock` is abstract (single table per child type, no JOINs)
- ✅ `BaseBlock` does NOT include `EarthlabBase` (app-agnostic)
- ✅ Child classes add `EarthlabBase` as needed (`LessonBlock` does, `WritingBlock` might not)
- ✅ Assessment & accessibility fields in `LessonBlock` only (not `BaseBlock`)

**Files Modified:**
- `mixtape_core/mixtape/earthlab/models/core.py` - Updated Nov 21, 2024
- `release/mixtape-release-frontend/docs/07-EarthlabBlock.md` - Updated Nov 21, 2024

### Next Immediate Steps

1. **Create Django migrations** for new models and schema changes
2. **Update frontend TypeScript types** in `hub3/src/content/earthlabTypes.ts`
3. **Create API endpoints** for:
   - Block CRUD operations
   - LessonBlockPlacement operations
   - Block library queries
4. **Build frontend library UI** (tri-pane drag-and-drop workspace)
5. **Implement block editors** (QuickEditor, FullEditor, BlockEditor)

### Deferred (Phase 3)
- Block versioning enforcement
- Block forking workflow
- Curation workflow (community feedback)
- Block templates

---

## References

- EarthLab Containment Model (similar three-layer pattern)
- Django Polymorphic Patterns (sponsor model)
- Content Versioning Systems (Medium, Wikipedia)
- LMS Block Systems (Open edX, Canvas, Blackboard)
- Mixtape Sponsorship Architecture (BaseContent + GenericForeignKey pattern)