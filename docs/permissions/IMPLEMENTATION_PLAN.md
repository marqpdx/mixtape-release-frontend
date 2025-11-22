# Permissions System: Phased Implementation Plan

**Status:** Awaiting Approval
**Created:** 2025-01-16
**Estimated Total Time:** 6-8 weeks

---

## Executive Summary

**What we're building:** Hybrid permission system combining role-based access with semantic capability bundles ("decorators").

**Why phased:** Each phase delivers working functionality while building toward the complete system.

**Key decision:** Can proceed phase-by-phase OR skip to Phase 2 if confident.

---

## Phase Overview

| Phase | What | Deliverable | Time | Risk |
|-------|------|-------------|------|------|
| **Phase 1** | Basic role-based permissions | Working auth + simple checks | 1-2 weeks | 🟢 Low |
| **Phase 2A** | Permission hierarchy/tree | Automatic inheritance | 1 week | 🟡 Medium |
| **Phase 2B** | Semantic decorators | Group capability bundles | 1 week | 🟡 Medium |
| **Phase 3** | Natural language UI | User-friendly explanations | 1-2 weeks | 🟢 Low |
| **Phase 4** | Direct permissions | Edge case escape hatch | 1-2 weeks | 🟢 Low |

---

## PHASE 1: Foundation (Weeks 1-2)

### Goal
End-to-end working system with simple role-based permissions.

### What Gets Built

#### **Backend**
1. **Database migrations** (15 min)
   - Add `decorators` JSON field to `Group` model
   - Add `decorators` JSON field to `GroupMember` model
   - Add `additional_permissions` JSON fields (for Phase 4)

2. **PermissionService** (2-3 hours)
   - Simple role → permissions mapping (hardcoded)
   - `compute_user_permissions(user)` method
   - `can_user_perform_action(user, permission)` method
   - Returns: `{granted: [], effective: [], groups: {}}`

3. **Auth endpoint updates** (1-2 hours)
   - Login returns permissions payload
   - Add `/auth/permissions/refresh/` endpoint

4. **DRF permission classes** (2 hours)
   - `HasPermission` base class
   - Example: `CanCreateCourseInGroup`

#### **Frontend**
5. **PermissionsContext** (2 hours)
   - Stores permissions from login
   - `can(permission)` hook
   - `canInGroup(permission, groupSlug)` hook

6. **Update AuthContext** (1 hour)
   - Add permissions to auth state
   - Add `refreshPermissions()` method

### Acceptance Criteria
- [ ] User logs in → receives permissions in response
- [ ] `usePermissions().can('create_course')` works
- [ ] UI shows/hides elements based on permissions
- [ ] API validates permissions (403 if denied)
- [ ] Test users with different roles work correctly

### Test Plan
**Create 3 test users:**
```python
# steward → has create_course, manage_members
# coordinator → has create_course, NOT manage_members
# member → has view_content, enroll_in_courses
```

**Test scenarios:**
1. Login as each → verify correct permissions
2. Try creating course as member → blocked
3. Change role → refresh permissions → new access

### Deliverables
- ✅ Working permission service
- ✅ Auth integration complete
- ✅ Frontend hooks functional
- ✅ Sample UI using permissions
- ✅ Basic tests passing

### Risks & Mitigations
- **Risk:** Frontend/backend permission mismatch
  - **Mitigation:** Both use same permission strings (shared constants)
- **Risk:** Caching issues after role changes
  - **Mitigation:** Explicit refresh endpoint + clear cache on logout

---

## PHASE 2A: Permission Tree (Week 3)

### Goal
Hierarchical permissions with automatic inheritance.

### What Gets Built

#### **Backend**
1. **Permission tree YAML** (4-6 hours)
   - `config/permissions/permission_tree.yaml`
   - Define 15-20 core permissions with hierarchy
   - 4 levels: admin → category → subcategory → action

2. **PermissionTree class** (3-4 hours)
   - Load YAML on app startup
   - `flatten_permissions(granted)` → includes all children
   - `has_permission(granted, required)` → checks inheritance
   - `get_natural_language_grants(perm)` → human explanation

3. **Update PermissionService** (2 hours)
   - Replace hardcoded roles with tree references
   - Use `flatten_permissions()` for effective perms

4. **App initialization** (30 min)
   - Load tree on Django startup
   - Log confirmation

### Acceptance Criteria
- [ ] Grant `manage_courses` → automatically get `create_course`, `edit_course`, etc.
- [ ] Permission tree loads on startup (no errors)
- [ ] Flattening works recursively (test 3-4 levels)
- [ ] Natural language explanations available

### Test Plan
```python
# Test: Granting parent includes children
granted = ["manage_courses"]
effective = tree.flatten_permissions(granted)
assert "create_course" in effective
assert "edit_course" in effective

# Test: Child doesn't grant parent
granted = ["create_course"]
assert not tree.has_permission(granted, "manage_courses")
```

### Deliverables
- ✅ permission_tree.yaml with core permissions
- ✅ PermissionTree class working
- ✅ Integration with PermissionService
- ✅ Tests for inheritance
- ✅ Natural language explanations

### Risks & Mitigations
- **Risk:** Circular dependencies in tree
  - **Mitigation:** Validation on load (raise if detected)
- **Risk:** YAML syntax errors
  - **Mitigation:** Validate YAML in CI/CD

---

## PHASE 2B: Decorators (Week 4)

### Goal
Semantic capability bundles (e.g., "education_hub", "event_venue").

### What Gets Built

#### **Backend**
1. **Decorator YAML files** (3-4 hours)
   - `config/permissions/decorators/groups/education_hub.yaml`
   - `config/permissions/decorators/groups/event_venue.yaml`
   - `config/permissions/decorators/members/moderator.yaml`
   - Define permissions by role + UI features + rules

2. **DecoratorRegistry class** (2-3 hours)
   - Load all decorator YAMLs on startup
   - `get_decorator(name)` lookup
   - `get_permissions_for_role(role)` method

3. **Update PermissionService** (2 hours)
   - Loop through group decorators → get role permissions
   - Loop through member decorators → add permissions
   - Combine all, then flatten via tree

### Frontend
4. **Add decorator checks** (1 hour)
   - `hasDecorator(name, groupSlug?)` hook
   - UI can check group type

### Acceptance Criteria
- [ ] Assign `education_hub` to group → members get course perms
- [ ] Assign `moderator` to member → gets moderation perms
- [ ] Different roles in same decorator → different perms
- [ ] Remove decorator → permissions recalculated

### Test Plan
```python
# Assign education_hub to group
group.decorators = ["education_hub"]
group.save()

# Coordinator in education_hub gets manage_courses
perms = PermissionService.compute_user_permissions(coordinator)
assert "manage_courses" in perms['granted']
assert "create_course" in perms['effective']  # via flattening
```

### Deliverables
- ✅ 3-5 decorator YAML files
- ✅ DecoratorRegistry working
- ✅ Integration with PermissionService
- ✅ Tests for decorator assignment
- ✅ Frontend can detect decorators

### Risks & Mitigations
- **Risk:** Decorator permissions conflict with direct grants
  - **Mitigation:** Additive only (union of all permissions)
- **Risk:** Decorators become too granular
  - **Mitigation:** Keep to 5-10 semantic types max

---

## PHASE 3: Natural Language & UI (Weeks 5-6)

### Goal
Make permissions understandable with progressive disclosure.

### What Gets Built

#### **Backend**
1. **Enhanced permission payload** (2 hours)
   - Add `explanations` object (perm → human text)
   - Add `group_rules` object (group → rules array)
   - Use tree + registry to generate

#### **Frontend**
2. **Enhanced usePermissions hook** (1 hour)
   - Add `explainPermission(perm)` method
   - Add `getGroupRules(groupSlug)` method

3. **UI Components** (4-6 hours)
   - `<PermissionTooltip>` - hover for explanation
   - `<GroupPermissionsCard>` - show group capabilities
   - `<MemberPermissionsPanel>` - show "what can I do"
   - `<RoleComparisonTable>` - compare roles

4. **Settings pages** (4-6 hours)
   - Group settings → decorator checkboxes
   - Member management → view member permissions
   - Personal settings → "my permissions" page

### Acceptance Criteria
- [ ] Hover over "Create Course" button → see tooltip explanation
- [ ] Group settings page shows available decorators
- [ ] Members can see their own permissions in profile
- [ ] Role comparison table shows differences clearly

### Test Plan
- User testing with 3-5 non-technical users
- Can they understand what permissions they have?
- Can group admins assign decorators correctly?
- Is progressive disclosure effective?

### Deliverables
- ✅ Enhanced permission payload with explanations
- ✅ Permission tooltip component
- ✅ Group settings UI
- ✅ Member permissions UI
- ✅ User testing report

### Risks & Mitigations
- **Risk:** Too much information overwhelms users
  - **Mitigation:** Progressive disclosure (collapsed by default)
- **Risk:** Natural language unclear
  - **Mitigation:** User testing + iteration

---

## PHASE 4: Direct Permissions (Weeks 7-8)

### Goal
Escape hatch for edge cases and special grants.

### What Gets Built

#### **Backend**
1. **Update PermissionService** (1 hour)
   - Add group.additional_permissions to computation
   - Add member.additional_permissions to computation
   - Union with decorator permissions

#### **Frontend**
2. **Direct permission UI** (4-6 hours)
   - `<PermissionTreeSelector>` component
   - Advanced accordion in group settings
   - Warning: "Use decorators unless edge case"
   - Per-member direct grants in admin

3. **Documentation** (2 hours)
   - When to use direct vs decorators
   - Examples of valid edge cases
   - Admin training guide

### Acceptance Criteria
- [ ] Can grant individual permission to group
- [ ] Can grant individual permission to member
- [ ] Direct grants combine with decorators correctly
- [ ] UI warns this is advanced/edge case feature

### Test Plan
```python
# Grant direct permission
member.additional_permissions = ["special_beta_feature"]
member.save()

perms = PermissionService.compute_user_permissions(user)
assert "special_beta_feature" in perms['effective']
```

### Deliverables
- ✅ Direct permission logic working
- ✅ UI for direct grants
- ✅ Documentation + training
- ✅ Tests for edge cases

### Risks & Mitigations
- **Risk:** Admins overuse direct permissions
  - **Mitigation:** UI friction (collapsed, warnings, docs)
- **Risk:** Permission explosion (too many direct grants)
  - **Mitigation:** Audit tools + reporting

---

## Decision Points

### After Phase 1
**Go/No-Go:** Does basic role-based permission system work end-to-end?
- If **YES** → Proceed to Phase 2A
- If **NO** → Fix foundation before proceeding

### After Phase 2A
**Go/No-Go:** Does permission tree load and flatten correctly?
- If **YES** → Proceed to Phase 2B
- If **NO** → Debug tree logic

### After Phase 2B
**Go/No-Go:** Do decorators grant permissions correctly?
- If **YES** → Proceed to Phase 3
- If **NO** → Fix decorator registry

### After Phase 3
**Go/No-Go:** Do users understand their permissions?
- If **YES** → Proceed to Phase 4
- If **NO** → Iterate on UX

### After Phase 4
**Complete:** Full permission system operational

---

## Alternative Approaches

### Option A: Skip Phase 1 (Risky)
**Go directly to Phase 2B**
- Faster time to complete system
- Risk: No working checkpoint if issues arise
- **Recommendation:** Only if very confident

### Option B: Phase 1 + 2 Combined
**Implement tree + decorators together**
- Phases 1, 2A, 2B as single phase (2-3 weeks)
- Faster overall
- Risk: Larger debugging surface if problems
- **Recommendation:** If team experienced with similar systems

### Option C: MVP Only
**Stop after Phase 2B**
- Phases 3-4 optional (can add later)
- Get core functionality quickly
- Trade-off: Less user-friendly
- **Recommendation:** If time-constrained

---

## Resource Requirements

### Development Team
- **1 Backend Developer** (Python/Django) - 6-8 weeks
- **1 Frontend Developer** (React/TypeScript) - 4-6 weeks
- **0.5 Designer/UX** (Phase 3) - 1-2 weeks
- **0.25 Tech Writer** (Documentation) - ongoing

### Infrastructure
- YAML config files in repo
- No new services/databases
- Minimal performance impact (in-memory caching)

---

## Testing Strategy

### Unit Tests
- PermissionTree flattening
- DecoratorRegistry loading
- PermissionService computation
- **Target:** 90%+ coverage on permission logic

### Integration Tests
- Login → receive permissions
- Role change → permissions update
- API validation works
- **Target:** Key flows covered

### User Acceptance Testing
- Phase 3: Can users understand permissions?
- Phase 4: Can admins use direct grants correctly?
- **Method:** 5-user testing sessions

---

## Rollout Strategy

### Phase 1 Rollout
1. Deploy to staging
2. Test with internal users (3-5 people)
3. Fix any issues
4. Deploy to production
5. Monitor error logs for 48 hours

### Phase 2 Rollout
1. Add YAML files to repo
2. Deploy backend (tree loads)
3. Verify startup successful
4. Assign decorators to 1-2 test groups
5. Validate permissions correct
6. Gradually assign to more groups

### Phase 3 Rollout
1. Deploy UI updates
2. Gather user feedback
3. Iterate on explanations
4. Document common questions

### Phase 4 Rollout
1. Deploy direct permission feature
2. Restrict to admins initially
3. Train group admins
4. Monitor usage patterns

---

## Success Criteria

### Phase 1 Success
- [ ] 100% of API endpoints check permissions
- [ ] 0 permission-related security bugs
- [ ] Login includes permissions (no extra call)

### Phase 2 Success
- [ ] Permission tree has 20+ permissions
- [ ] 5+ decorators defined
- [ ] Inheritance works correctly (tested)

### Phase 3 Success
- [ ] 80%+ users understand their permissions (survey)
- [ ] Group admins can assign decorators without help
- [ ] Support tickets about permissions < 5/week

### Phase 4 Success
- [ ] Direct permissions used < 10% of time
- [ ] No permission escalation bugs
- [ ] Clear audit trail of all grants

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Performance degradation | High | Low | Benchmark + cache |
| Permission escalation bugs | Critical | Medium | Thorough testing + code review |
| User confusion | Medium | Medium | UX testing + clear UI |
| YAML syntax errors | Low | Medium | Validation in CI |
| Backward compatibility | Medium | Low | Feature flags |

---

## Questions for Review

Before proceeding, please confirm:

1. **Scope:** Are phases 1-4 all in scope, or stop earlier?
2. **Timeline:** Is 6-8 weeks acceptable, or need faster?
3. **Resources:** Can we allocate 1 backend + 1 frontend dev?
4. **Decorators:** Which initial decorators do we need?
   - education_hub ✓
   - event_venue ✓
   - Others?
5. **Testing:** Who will do user acceptance testing (Phase 3)?

---

## Recommendation

**Recommended path:** Proceed with Phase 1 → Phase 2A → Phase 2B → Phase 3 → (evaluate Phase 4)

**Reasoning:**
- Phase 1 establishes working foundation (low risk)
- Phase 2 delivers core value (semantic permissions)
- Phase 3 makes it user-friendly (critical for adoption)
- Phase 4 can be deferred if time-constrained

**Alternative:** If very confident, combine Phases 1+2 (3 weeks instead of 4).

---

## Next Steps (Upon Approval)

1. **Create feature branch:** `feature/permissions-system`
2. **Set up project tracking:** Create issues for each phase
3. **Schedule kickoff:** Backend + frontend dev alignment
4. **Create initial YAMLs:** Draft permission_tree.yaml
5. **Write first test:** TDD approach for PermissionService

---

**Awaiting go-ahead to proceed with implementation.**

