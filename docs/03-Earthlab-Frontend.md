# 📊 EarthLab Data Model
## Backend Architecture Reference

**Status:** Core Reference Document
**Version:** 2.2 (MVP-Ready)
**Last Updated:** November 3, 2025
**Audience:** Backend Engineers, Frontend Engineers, Product Teams

---

## Quick Reference: What Gets Built First

**MVP Models (18):** Production-ready, being built now
- Course, Module, Lesson, LessonBlock
- CourseModule, ModuleLesson, CourseLesson (M-to-M joins)
- CourseRelease, CourseRun, Cohort, Enrollment
- CourseMembership, PrerequisiteRule
- LearningEvent, CourseProgress, LessonProgress
- InstructorNote, LessonSubmission

**Deferred Models (8):** Architected, no implementation yet
- ContentVersion, Resource, Assessment, AssessmentAttempt
- ContentReuseGrant, ContentReview, ModerationAction, LessonTranslation

---

## Core Hierarchy

```
Course (publishable template, top-level)
  ├─ CourseRun (time-bounded offering)
  │  ├─ Enrollment (user's seat)
  │  ├─ Cohort (grouping with Threadworks)
  │  └─ LearningEvent (activity log)
  │
  └─ CourseModule (M-to-M with Module)
      └─ Module (publishable container, reusable)
          └─ ModuleLesson (M-to-M with Lesson)
              └─ Lesson (publishable, owned by Group/Member)
                  ├─ LessonBlock (structural units)
                  ├─ LessonSubmission (learner work)
                  └─ InstructorNote (private/shared feedback)
```

---

## Key Data Model Decisions

### 1. Flexible Lesson Structure (Option B)

**Decision:** Lesson can have EITHER rich text content OR structured blocks (or both, or neither during draft).

**Why:**
- Supports simple text lessons AND complex multi-part lessons
- No forced structure on authors
- Blocks can be empty during draft, filled before publish

**Implementation:**
```python
class Lesson(BaseContent):
    content = TextField(blank=True)           # Tiptap JSON (optional)
    blocks = ManyToMany('LessonBlock')        # Structured (optional)
    status = CharField(choices=[...])         # draft/published/archived
```

**Publishing rule:** To publish, lesson needs content OR ≥1 published block.

---

### 2. Reusable Library Items

**Decision:** Both Lessons and Modules are independently publishable and reusable via M-to-M joins.

**Why:**
- Course designers mix-and-match content flexibly
- Single source of truth (no duplication)
- Lesson can appear in multiple modules/courses

**Implementation:**
```
Course
  └─ CourseModule (M-to-M join, has order)
      └─ Module

Module
  └─ ModuleLesson (M-to-M join, has order)
      └─ Lesson
```

**Benefits:** Reuse without copying, central editing.

---

### 3. Time-Bounded Runs vs. Course Template

**Decision:** Separate evergreen `Course` (template) from `CourseRun` (specific offering).

**Why:**
- Course = "Regenerative Living Foundations" (reusable template)
- CourseRun = "Regenerative Living - Fall 2025 (Portland)" (dates, instructor, enrollment)
- Progress/enrollments/events attach to CourseRun, not template
- Instructors can run same course multiple times

**Implementation:**
```python
class Course(BaseContent):
    title, description, status

class CourseRun(BaseData):
    course = FK(Course)
    starts_at, ends_at
    enrollment_opens_at, capacity
    instructor = FK(User)
```

---

### 4. Enrollment Separate from Membership

**Decision:** `CourseMembership` = role-based access. `Enrollment` = seat/state in `CourseRun`.

**Why:**
- Clear separation: membership = who can do what; enrollment = learner progression
- One user can be: instructor (member) in Course A, learner (enrolled) in CourseRun B
- Enrollment tracks state: invited → enrolled → completed/dropped

**Implementation:**
```python
# Role-based access
class CourseMembership(BaseModel):
    user, course, role  # roles: instructor, ta, author, alumni

# Learner progression
class Enrollment(BaseModel):
    user, course_run, status  # status: invited, enrolled, completed, dropped
```

---

### 5. Immutable Event Stream (Source of Truth)

**Decision:** `LearningEvent` captures all learner activity immutably. Progress is derived.

**Why:**
- Resilient: events are immutable facts
- Scalable: query events for analytics, re-compute progress anytime
- Auditability: know exactly when/what learners did
- No race conditions on progress calculations

**Implementation:**
```python
class LearningEvent(BaseModel):
    user, course_run, lesson, block
    event_type  # view, complete, submit, grade
    occurred_at, payload

class CourseProgress(BaseModel):
    # DERIVED from events (cached, can regenerate)
    user, course_run
    progress_pct, completed_lessons, current_lesson

class LessonProgress(BaseModel):
    # DERIVED from events (cached, can regenerate)
    user, lesson
    completed_blocks, time_spent, completion_timestamp
```

---

### 6. Sponsorship (Group or Member)

**Decision:** All publishable content (Course, Module, Lesson) has sponsor (owner).

**Why:**
- Respect group/member boundaries
- Enable community library (all can access, some can edit)
- Track content ownership
- Enable donation to community

**Implementation:**
```python
class BaseContent(BaseData):
    sponsor_content_type = FK(ContentType)
    sponsor_object_id = UUIDField()
    sponsor = GenericForeignKey()  # Can be Group or Member
```

**Example:**
- Course.sponsor = Group (Regenerative Ag Community)
- Lesson.sponsor = Member (Jane Smith)
- Block.sponsor = Group (default, after donation)

---

### 7. Cohorts with Threadworks

**Decision:** `Cohort` model with `discussion_thread_id` for Threadworks integration.

**Why:**
- Groups learners within CourseRun
- Each cohort has private discussion space
- Essential for MVP (confirmed business priority)

**Implementation:**
```python
class Cohort(BaseData):
    course_run = FK(CourseRun)
    title, slug
    discussion_thread_id  # Threadworks ID
```

---

### 8. Extended Publishing States

**Decision:** Full workflow states: draft → in_review → scheduled → published → archived

**Why:**
- Prepare for review workflows (future)
- Support scheduling (future)
- Archive without deleting
- Clear state machine for UX

**Implementation:**
```python
class BaseContent(BaseData):
    status = CharField(choices=[
        'draft',
        'in_review',
        'scheduled',
        'published',
        'archived'
    ])
    published_at = DateTimeField(null=True)
    archived_at = DateTimeField(null=True)
```

---

### 9. Soft-Delete Pattern

**Decision:** Add `deleted_at` field to BaseModel for consistency.

**Why:**
- Fast hide/restore (no scanning)
- Preserves data for auditing
- Queries filter `deleted_at IS NULL` by default

---

### 10. Prerequisites (Course-Scoped, Not Cross-Course)

**Decision:** Prerequisites are scoped to `CourseRun` context (not Course template).

**Why:**
- Different runs can have different sequencing
- No administrative overhead
- Future-proof for per-run customization

**Implementation:**
```python
class PrerequisiteRule(BaseModel):
    course_run = FK(CourseRun)
    lesson = FK(Lesson)  # This lesson
    required_lesson = FK(Lesson)  # Requires this lesson first

    class Meta:
        unique_together = ('course_run', 'lesson', 'required_lesson')
```

---

## Entity Relationships Summary

| Entity | Publishable? | Reusable? | Sponsor | Key Purpose |
|--------|---|---|---|---|
| **Course** | ✅ | 🚫 | Group | Template (top-level) |
| **Module** | ✅ | ✅ | Group | Reusable container |
| **Lesson** | ✅ | ✅ | Group/Member | Building block |
| **LessonBlock** | ✅ | 🚫 | Group/Member | Structural unit |
| **CourseRun** | ❌ | 🚫 | — | Time-bounded instance |
| **Enrollment** | ❌ | 🚫 | — | User's seat |
| **Cohort** | ❌ | 🚫 | — | Learner grouping |
| **CourseMembership** | ❌ | 🚫 | — | Role-based access |
| **LearningEvent** | ❌ | 🚫 | — | Activity log |
| **InstructorNote** | ❌ | 🚫 | — | Feedback |

---

## Inheritance Strategy

All models inherit from Mixtape base classes:

**BaseModel** (all models)
- created_at, updated_at, deleted_at timestamps
- Common metadata, field utilities

**BaseData** (content that has titles/slugs)
- title, slug, description
- Auto-generated slugs from title
- slug_history for redirects

**BaseContent** (publishable, owned content)
- UUID primary key
- sponsor (polymorphic: Group or Member)
- author, author_name, body
- tags, categories, attachments (via GenericRelation)
- published_at timestamp

---

## API Endpoints (Example Pattern)

```
GET     /api/courses/{courseId}/modules/
POST    /api/courses/{courseId}/modules/
PATCH   /api/courses/{courseId}/modules/{moduleId}/
DELETE  /api/courses/{courseId}/modules/{moduleId}/
POST    /api/courses/{courseId}/modules/{moduleId}/publish/

GET     /api/modules/{moduleId}/lessons/
POST    /api/modules/{moduleId}/lessons/
PATCH   /api/modules/{moduleId}/lessons/{lessonId}/
DELETE  /api/modules/{moduleId}/lessons/{lessonId}/
POST    /api/modules/{moduleId}/lessons/{lessonId}/duplicate/
POST    /api/modules/{moduleId}/lessons/{lessonId}/move/

GET     /api/lessons/{lessonId}/blocks/
POST    /api/lessons/{lessonId}/blocks/
PATCH   /api/lessons/{lessonId}/blocks/{blockId}/
DELETE  /api/lessons/{lessonId}/blocks/{blockId}/

GET     /api/block-library/
POST    /api/block-library/{blockId}/add-to-lesson/
```

---

## Publishing Validation Rules

**Before publishing, validate:**
- Module: Must have ≥1 published lesson
- Lesson: Must have content OR ≥1 published block
- Block: Must have title + content
- Course: All required modules/lessons published

---

## Progress Tracking Pattern

```
LearningEvent (immutable facts)
  ↓ (computed, cached)
CourseProgress & LessonProgress (re-generatable)
```

**Example:**
```
Event 1: User viewed Lesson 1
Event 2: User completed Block 1 (3 min)
Event 3: User completed Block 2 (5 min)
  ↓ (compute)
Lesson Progress: 2/2 blocks completed, 8 min total
```

---

## Deletion Philosophy

**Smart, not cascade:**

- **Delete Module:** Reassign lessons to another module (user chooses)
- **Delete Lesson:** Blocks are preserved in library (never cascade)
- **Delete Block:** Block is removed from lesson
- **Delete CourseRun:** Enrollments soft-delete (can restore)

---

## Content Versioning (Deferred)

**Decision:** ContentVersion model deferred; coordinate with Writing team.

**Why:**
- EarthLab and Writing both need versioning
- Should be consolidated into single polymorphic model
- Prevents duplication

**For MVP:** Use `published_at` timestamps as versioning signal. Full version pinning added in Phase 2.

---

## Learner to Alumni Pipeline

**Decision:** Auto-create `CourseMembership(role='alumni')` when enrollment completes.

**Why:**
- Automatic historical tracking (who took this course?)
- No manual roster management
- Query "all alumni" easily
- Foundation for alumni-only content/events

**Implementation:** Post-save signal on Enrollment status='completed'

---

## Quick Start for Implementation

### Phase 1: Core Models (Weeks 1-2)

```python
# Priority order
1. BaseModel inheritance
2. Course, Module, Lesson, LessonBlock (with status)
3. CourseModule, ModuleLesson joins
4. CourseRun, Enrollment, Cohort
5. LearningEvent, CourseProgress, LessonProgress
6. CourseMembership, PrerequisiteRule
7. InstructorNote, LessonSubmission
```

### Phase 2: APIs & Hooks

- Build serializers for each model
- Create REST endpoints (CRUD + special actions)
- Add validation + error handling
- Write tests

### Phase 3: Frontend

- Hook layer: React Query + mutations
- UI components: Tree view, detail panels, forms
- Drag-drop, inline editing
- Autosave logic

---

## Index References

- **Frontend Implementation:** See `SKILL_02_Frontend_Architecture.md`
- **Strategic Vision:** See `SKILL_04_Strategic_Vision.md`
- **Methodology:** See `SKILL_01_Methodology.md`

---

**Status:** ✅ Ready for backend implementation
**Next:** Coordinate with Writing team on unified ContentVersion strategy