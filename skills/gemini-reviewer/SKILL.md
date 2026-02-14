---
name: gemini-reviewer
description: |
  Dual code review: gets independent reviews from both Claude and Gemini CLI,
  then synthesizes agreements, unique findings, and a verdict. Use when users
  say "gemini review", "dual review", or want a second-perspective code review.
  Requires the Gemini CLI to be installed (`gemini` binary).
---

# Gemini Dual Code Review Skill

## Before Reviewing

1. **Check Gemini availability** — Run `gemini --version` via Bash to verify
   the CLI is installed and authenticated. If it fails, inform the user and
   fall back to a Claude-only review using the code-reviewer skill.
2. **Gather context** — Read related files to understand existing patterns,
   naming conventions, and architectural decisions.
3. **Collect the diff** — Use the same scope resolution as code-reviewer:
   - `1` → Uncommitted changes (`git diff` + `git diff --cached`)
   - `2` → Last local commit (`git show HEAD`)
   - `3` → Unpushed local commits (`git diff @{upstream}..HEAD`)
   - `PR#` → GitHub PR diff (`gh pr diff <number>`)

## Dual Review Process

### Step 1: Send to Gemini

Pipe the diff to Gemini CLI via Bash:

```bash
echo "<diff content>" | gemini -p "You are a senior code reviewer. Review this diff for:
1. Logic bugs, incorrect assumptions, unhandled edge cases
2. Security vulnerabilities (injection, auth, data exposure)
3. Performance issues (N+1 queries, unnecessary allocations)
4. Maintainability concerns (naming, complexity, duplication)
5. Missing test coverage

Format your response as:
## Summary
Brief overview of change quality.

## Findings
- **Critical** — Must fix (security, data loss, crashes)
- **Major** — Should fix (quality/maintainability impact)
- **Minor** — Nice to fix (lower priority improvements)

Include file:line references where possible.
Be specific and actionable. Do NOT flag pre-existing issues." -o text
```

Capture Gemini's full response.

### Step 2: Claude Review

Independently review the same diff using the code-reviewer skill evaluation
criteria. Do NOT look at Gemini's output first — form your own assessment.

### Step 3: Synthesis

Compare both reviews and present a unified report:

## Output Format

### Dual Code Review

**Scope:** [description of what was reviewed]

---

### Claude's Review
[Claude's independent findings using code-reviewer format]

---

### Gemini's Review
[Gemini's response, formatted cleanly]

---

### Synthesis

#### Agreements
Findings both reviewers identified (highest confidence).

#### Unique to Claude
Findings only Claude caught.

#### Unique to Gemini
Findings only Gemini caught.

#### Verdict
Overall assessment combining both perspectives. Note where reviewers
disagree and which assessment seems more accurate based on the code.

## Fallback Behavior

If Gemini CLI is not available or fails:
1. Inform the user: "Gemini CLI not available — running Claude-only review."
2. Proceed with a standard code-reviewer skill review.
3. Do NOT block the review because of Gemini unavailability.

## Guidelines

- Both reviews must be independent — do not let one influence the other.
- Present Gemini's output faithfully; do not rewrite or suppress its findings.
- If Gemini produces low-quality output, note it but still include it.
- The synthesis should add value, not just repeat findings.
