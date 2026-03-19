---
description: "Pedagogical code walkthrough - teaches you about your own code changes"
argument-hint: "[1|2|3|<PR#>] [--staged] [path/prefix]"
allowed-tools: ["AskUserQuestion", "Bash(git diff:*)", "Bash(git log:*)", "Bash(git status:*)", "Bash(gh pr view:*)", "Bash(gh pr diff:*)", "Read"]
---

# /teach-me

Pedagogical code walkthrough that teaches developers about their own code.
Explains choices, tradeoffs, alternatives, and refactoring opportunities.

## Options
1) Uncommitted changes
2) Last local commit
3) Unpushed local commits
4+) GitHub pull request (pass PR number directly, e.g., `/teach-me 8275`)

## Input
User argument: {{#if $ARGUMENTS}}$ARGUMENTS{{else}}(none provided){{/if}}

> **Template variable:** `$ARGUMENTS` contains any text passed after the command (e.g., `/teach-me 2` sets `$ARGUMENTS` to "2").

**Argument interpretation:**
- `1` → Teach about uncommitted changes
- `2` → Teach about last local commit
- `3` → Teach about unpushed local commits
- Any number > 3 → Treat as a GitHub PR number and teach about that PR
- `--staged` → Only include staged changes (works with scope 1)
- Path prefix (e.g., `src/`) → Filter to files under that path

Arguments can be combined: `/teach-me 3 src/` teaches about unpushed commits filtered to `src/`.

If no argument was provided, default to scope **1** (uncommitted changes). Do NOT prompt the user for scope selection — just proceed with uncommitted changes.

> **Note:** `AskUserQuestion` is available only for scope resolution fallbacks (e.g., no upstream branch for scope 3, invalid PR number). Never use it to ask which scope to use.

## Scope resolution rules
- **1 (Uncommitted):** collect the uncommitted diff/changed files in the working tree.
  - If `--staged` is present, use `git diff --cached` instead of `git diff`.
  - If a path prefix is provided, append it to the diff command.
- **2 (Last commit):** collect the diff for the most recent local commit on the current branch.
- **3 (Unpushed):** collect the combined diff for commits that exist locally but are not pushed to the upstream tracking branch.
  - If no upstream tracking branch exists, ask which remote branch to compare against (e.g., `origin/main`).
- **PR number (>3):** assume the current git repository and fetch the PR with that number.
  - Validate the PR number is a positive integer before use.
  - If validation fails, inform the user and prompt for a valid number.
  - If the repo cannot be determined from git remotes, ask for `owner/repo` as a fallback.

## Execute
Once the code context is gathered:

1. **Collect the diff** — Get the patch/diff for the selected scope.
2. **Read full files** — For new/untracked files, read the entire file. For modified files, read enough context to understand the changes.
3. **Identify file status** — Classify each file as "new" (untracked/added) or "modified" (has a diff against a previous version).
4. **Apply the teaching methodology below** — Process all files through the methodology.
5. **Deliver in one pass** — Present the complete walkthrough without interruptions.

Do NOT ask the user questions during the walkthrough. Deliver the full teaching in a single response.

---

## Teaching Methodology

### Before Teaching

1. **Gather context** — Read CLAUDE.md files, related modules, and project conventions
   to understand the codebase the learner is working in.
2. **Assess developer level** — Infer from the code itself. Junior patterns (verbose guards,
   copy-paste) get more foundational explanations. Senior patterns (generics, advanced
   composition) get architecture-level discussion.
3. **Check edge cases before starting:**
   - **No changes** — If the diff is empty, say so and suggest what to try next.
   - **Binary files** — Skip with a one-line note ("Skipping binary file X").
   - **Generated files** — Skip lock files, build output, codegen. Note what was skipped.
   - **Large diffs (>1000 lines)** — Note the size, auto-select the 10 most significant files
     (by change size and architectural importance), and teach those. List the skipped files at the end.
   - **Scaffolded/boilerplate** — Acknowledge but don't spend time teaching obvious template code.
     Focus on the parts the developer actually wrote or customized.

### Teaching Order

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

### Per-File Breakdown

Use the appropriate template based on file status:

#### New Files (untracked — no previous version exists)

For each new file, deliver these 6 sections:

##### 1. What it is
One sentence. Name the architectural layer (util, service, controller, component, test, config).

##### 2. What it does
2–4 sentences. Behavioral description — what happens when this code runs.
Reference specific function/class names. No line-by-line narration.

##### 3. Why it matters
Connect this file to the bigger picture. What breaks or becomes impossible without it?
How does it fit into the system's data flow or user journey?

##### 4. Key choices (2–5 items)
Each item names a decision the developer made and the tradeoff:

- **Chose discriminated union over class hierarchy** — Trades extensibility for exhaustiveness checking at compile time. Right call for a closed set of states.

##### 5. Alternatives worth knowing (1–4 items)
Genuinely useful alternatives the developer should know about. Not "you should have
done this instead" — rather "here's what else exists in this space."

- **Zod instead of manual validation** — Would give you runtime type checking + static inference from a single schema.

##### 6. Suggested refactor
Only include when there's a material improvement — not style preferences.
Include a concrete code snippet showing the before/after.

**Skip this section** if the code is already well-structured.

---

#### Modified Files (tracked — has a diff)

For each modified file, deliver these 5 sections. **Focus exclusively on the diff.**
Do NOT explain existing/unchanged code.

##### 1. What changed
Summarize the diff concisely: what was added, removed, or modified.
Reference specific function/variable names and line ranges.

##### 2. Why it changed
Infer or explain the motivation. Is this a bug fix? New capability? Refactor?
Performance improvement? If the motivation isn't obvious, say so and offer
the most likely interpretation.

##### 3. Key choices in the changes (2–5 items)
Same format as new files, but focused on decisions embedded in the diff.

##### 4. Alternatives to these changes
Other ways to achieve the same goal. Frame as "here's what else you could have done."

##### 5. Suggested refactor
Same rules as new files — only when material, with concrete code.

---

### Synthesis (3+ files only)

When teaching about 3 or more files, add a synthesis section after all per-file breakdowns:

#### Pattern Name
Name the architectural pattern these files implement together.

#### Cohesion Assessment
How well do these files work together? Are responsibilities cleanly separated?
Is the dependency direction healthy?

#### Watch Points
1–3 things that could become problems as this code grows. Not current bugs — future pressure points.

#### Suggested Next Steps
What the developer should build, test, or refactor next based on what they've built so far.

### Tone Guidelines

- **Opinionated** — Take positions. "This is the right call because..." not "This could be considered acceptable."
- **Concrete** — Every claim references specific code. No abstract advice.
- **Calibrated** — Match depth to complexity.
- **One-pass** — Deliver the full walkthrough without interruptions.
- **No filler praise** — Don't say "Great job!" If something is genuinely well done, explain WHY.
- **Respectful of existing code** — For modified files, don't critique code the developer didn't touch.

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

### Alternatives worth knowing
- **[Alternative]** — [When/why you'd use it]

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

### Alternatives to these changes
- **[Alternative]** — [When/why you'd use it]

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
