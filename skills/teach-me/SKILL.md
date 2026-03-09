---
name: teach-me
description: |
  Pedagogical code walkthrough that teaches developers about their own code.
  Explains choices, tradeoffs, alternatives, and refactoring opportunities.
  Use when users say "teach me", "explain my changes", "walk me through",
  "what did I build", or want to understand their code at a deeper level.
  Works on uncommitted changes, last commit, unpushed commits, or a PR.
---

# Teach Me Skill

## Before Teaching

1. **Gather context** — Read CLAUDE.md files, related modules, and project conventions
   to understand the codebase the learner is working in.
2. **Assess developer level** — Infer from the code itself. Junior patterns (verbose guards,
   copy-paste) get more foundational explanations. Senior patterns (generics, advanced
   composition) get architecture-level discussion.
3. **Check edge cases before starting:**
   - **No changes** — If the diff is empty, say so and suggest what to try next.
   - **Binary files** — Skip with a one-line note ("Skipping binary file X").
   - **Generated files** — Skip lock files, build output, codegen. Note what was skipped.
   - **Large diffs (>1000 lines)** — Warn the user, offer to focus on a subset, then proceed.
   - **Scaffolded/boilerplate** — Acknowledge but don't spend time teaching obvious template code.
     Focus on the parts the developer actually wrote or customized.

## Teaching Order

Process files in this pedagogical order (earlier = teach first):

1. **Config & environment** — `.env`, `tsconfig`, `package.json`, CI files
2. **Types & interfaces** — Type definitions, schemas, enums, contracts
3. **Utilities & helpers** — Pure functions, shared logic
4. **Core business logic** — Services, domain models, state management
5. **API & integration** — Routes, controllers, external service calls
6. **Tests** — Unit tests, integration tests, fixtures
7. **UI & presentation** — Components, templates, styles
8. **Documentation** — READMEs, comments, changelogs

Within each tier, order by dependency: if file A imports file B, teach B first.

## Per-File Breakdown

Use the appropriate template based on file status:

### New Files (untracked — no previous version exists)

For each new file, deliver these 6 sections:

#### 1. What it is
One sentence. Name the architectural layer (util, service, controller, component, test, config).

#### 2. What it does
2–4 sentences. Behavioral description — what happens when this code runs.
Reference specific function/class names. No line-by-line narration.

#### 3. Why it matters
Connect this file to the bigger picture. What breaks or becomes impossible without it?
How does it fit into the system's data flow or user journey?

#### 4. Key choices (2–5 items)
Each item names a decision the developer made and the tradeoff:

**WRONG — vague:**
> - Good use of TypeScript

**CORRECT — specific tradeoff:**
> - **Chose discriminated union over class hierarchy** — Trades extensibility (adding new
>   variants requires touching the union) for exhaustiveness checking at compile time.
>   Right call for a closed set of 4 states.

#### 5. Alternatives worth knowing (1–4 items)
Genuinely useful alternatives the developer should know about. Not "you should have
done this instead" — rather "here's what else exists in this space."

**WRONG — obvious or unhelpful:**
> - Could use a different variable name

**CORRECT — expands the developer's toolkit:**
> - **Zod instead of manual validation** — Would give you runtime type checking + static
>   inference from a single schema. Worth considering if validation logic grows beyond
>   these 3 fields.

#### 6. Suggested refactor
Only include when there's a material improvement — not style preferences.
Include a concrete code snippet showing the before/after.

**Skip this section** if the code is already well-structured. Don't manufacture
suggestions to fill space.

---

### Modified Files (tracked — has a diff)

For each modified file, deliver these 5 sections. **Focus exclusively on the diff.**
Do NOT explain existing/unchanged code.

#### 1. What changed
Summarize the diff concisely: what was added, removed, or modified.
Reference specific function/variable names and line ranges.

#### 2. Why it changed
Infer or explain the motivation. Is this a bug fix? New capability? Refactor?
Performance improvement? If the motivation isn't obvious, say so and offer
the most likely interpretation.

#### 3. Key choices in the changes (2–5 items)
Same format as new files, but focused on decisions embedded in the diff:

**WRONG — describes the unchanged code:**
> - The existing service pattern is well-structured

**CORRECT — teaches about the change:**
> - **Added retry with exponential backoff instead of simple retry** — The 2^n delay
>   prevents thundering herd on the downstream service. The max of 3 retries caps
>   total wait at ~7s, which keeps the request within typical timeout budgets.

#### 4. Alternatives to these changes
Other ways to achieve the same goal. Frame as "here's what else you could have done"
not "you did it wrong."

#### 5. Suggested refactor
Same rules as new files — only when material, with concrete code.

---

## Synthesis (3+ files only)

When teaching about 3 or more files, add a synthesis section after all per-file breakdowns:

### Pattern Name
Name the architectural pattern these files implement together (e.g., "Repository pattern
with service layer", "Event-driven pipeline", "Feature module with co-located tests").

### Cohesion Assessment
How well do these files work together? Are responsibilities cleanly separated?
Is the dependency direction healthy?

### Watch Points
1–3 things that could become problems as this code grows. Not current bugs —
future pressure points.

### Suggested Next Steps
What the developer should build, test, or refactor next based on what they've built so far.

## Tone Guidelines

- **Opinionated** — Take positions. "This is the right call because..." not "This could
  be considered acceptable."
- **Concrete** — Every claim references specific code. No abstract advice.
- **Calibrated** — Match depth to complexity. Don't over-explain simple things.
  Don't under-explain subtle things.
- **One-pass** — Deliver the full walkthrough without interruptions. Don't ask
  questions mid-teaching.
- **No filler praise** — Don't say "Great job!" or "Nice work!" If something is
  genuinely well done, explain WHY it's good and what principle it demonstrates.
  Hollow praise wastes the developer's time.
- **Respectful of existing code** — For modified files, don't critique code the
  developer didn't touch in this change. Teach about their changes, not someone
  else's code.

## Output Format

```markdown
# Code Walkthrough: [brief description of changes]

> **Scope:** [X new files, Y modified files] | **Estimated read:** [N minutes]

---

## [filename.ext] *(new file)*

### What it is
...

### What it does
...

### Why it matters
...

### Key choices
- **[Choice name]** — [Tradeoff explanation]
- ...

### Alternatives worth knowing
- **[Alternative]** — [When/why you'd use it]
- ...

### Suggested refactor *(only if material)*
...

---

## [filename.ext] *(modified)*

### What changed
...

### Why it changed
...

### Key choices in the changes
- **[Choice name]** — [Tradeoff explanation]
- ...

### Alternatives to these changes
- **[Alternative]** — [When/why you'd use it]
- ...

### Suggested refactor *(only if material)*
...

---

## Synthesis *(3+ files only)*

### Pattern: [name]
...

### Cohesion
...

### Watch points
...

### Next steps
...
```

## Examples

### WRONG vs CORRECT: "What it does"

**WRONG — line-by-line narration:**
> On line 1, we import express. On line 3, we create a router. On line 5, we define
> a GET handler that takes req and res parameters...

**CORRECT — behavioral description:**
> Exposes a REST endpoint (`GET /users/:id`) that fetches a user by ID from the
> database, strips sensitive fields (`passwordHash`, `ssn`), and returns the
> sanitized profile. Returns 404 with a structured error body if the user doesn't exist.

### WRONG vs CORRECT: "Key choices"

**WRONG — vague praise:**
> - Good use of async/await
> - Clean code structure

**CORRECT — named tradeoff:**
> - **Chose `Promise.allSettled` over `Promise.all`** — Lets all three API calls
>   complete even if one fails, so the UI can show partial data. The tradeoff is
>   you need per-result error handling instead of a single catch block.

### WRONG vs CORRECT: "What changed" (modified file)

**WRONG — explains existing code:**
> This file contains a UserService class that manages user CRUD operations.
> The constructor takes a database connection...

**CORRECT — focuses on the diff:**
> Added `softDelete()` method (lines 45-62) and changed `delete()` to call
> `softDelete()` internally instead of `db.users.remove()`. Added `deletedAt`
> timestamp field to the return type.

## Pre-Delivery Checklist

Before presenting the walkthrough, verify:

- [ ] Every "Key choices" item names a specific decision and its tradeoff
- [ ] Every "Alternatives" item is genuinely useful (not obvious or trivial)
- [ ] "Suggested refactor" sections are only present when material (not manufactured)
- [ ] New files get full 6-section treatment
- [ ] Modified files focus on the diff — no explanation of unchanged code
- [ ] Files are ordered by teaching tier, not alphabetically
- [ ] Synthesis section is included when 3+ files are present
- [ ] No filler praise — every positive statement explains WHY it's good
- [ ] Edge cases handled (binary, generated, empty diff, large diff)
- [ ] One-pass delivery — no questions asked mid-walkthrough
