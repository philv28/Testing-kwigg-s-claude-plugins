---
name: gemini-advisor
description: |
  Gets Gemini's independent opinion on any file, topic, or discussion.
  Use when users say "ask gemini", "gemini opinion", or "what does gemini think".
  Provides a second perspective from a different AI model with Claude's commentary.
  Requires the Gemini CLI to be installed (`gemini` binary).
---

# Gemini Advisor Skill

## Before Starting

1. **Check Gemini availability** — Run `gemini --version` via Bash to verify
   the CLI is installed and authenticated. If it fails, inform the user that
   Gemini is not available and offer to answer the question directly.
2. **Determine context** — Figure out what the user wants Gemini's opinion on:
   - A specific file → read the file content
   - A code question → formulate the question with relevant context
   - A discussion/decision → summarize the current discussion state
   - A general topic → pass the question directly

## Process

### Step 1: Prepare the Query

Build a clear, self-contained prompt for Gemini that includes:
- The user's question or topic
- Relevant context (file contents, discussion summary, code snippets)
- Framing: "Provide your independent technical opinion on the following."

### Step 2: Send to Gemini

Use Bash to invoke Gemini CLI:

```bash
echo "<context>" | gemini -p "<question with framing>" -o text
```

Or without stdin if no file/code context is needed:

```bash
gemini -p "<full question with context>" -o text
```

### Step 3: Present Results

## Output Format

### Gemini's Take

[Gemini's full response, formatted cleanly]

### Claude's Commentary

[Brief commentary on Gemini's response — agreements, disagreements,
additional considerations, or alternative perspectives. Keep this
concise — the point is to get a second opinion, not to debate.]

## Fallback Behavior

If Gemini CLI is not available or fails:
1. Inform the user: "Gemini CLI not available."
2. Offer to answer the question directly as Claude.
3. Do NOT block on Gemini unavailability.

## Guidelines

- Present Gemini's output faithfully — do not rewrite or censor it.
- Claude's commentary should be brief and additive, not defensive.
- If the user's question is about a file, always read and pipe the file content.
- Keep Gemini prompts self-contained — Gemini has no conversation context.
- Do not send sensitive information (secrets, credentials) to Gemini.
