---
name: gemini-advisor
description: |
  Gets Gemini's independent opinion on any file, topic, or discussion.
  Use when users say "ask gemini", "gemini opinion", or "what does gemini think".
  Provides a second perspective from a different AI model with Claude's commentary.
  Requires GEMINI_API_KEY environment variable to be set.
---

# Gemini Advisor Skill

## Before Starting

1. **Check Gemini availability** — Run `test -n "$GEMINI_API_KEY"` via Bash to verify
   the API key is configured. If it fails, inform the user that Gemini API key is not
   configured and offer to answer the question directly.
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

Use Bash to invoke the Gemini CLI entrypoint:

```bash
echo "<context>" | node {pluginDir}/dist/gemini/cli.js --prompt "<question with framing>"
```

Or without stdin if no file/code context is needed:

```bash
node {pluginDir}/dist/gemini/cli.js --prompt "<full question with context>"
```

The CLI outputs JSON with `success`, `output`, `model`, and optional error fields.

### Step 3: Present Results

## Output Format

### Gemini's Take

[Gemini's full response, formatted cleanly]

### Claude's Commentary

[Brief commentary on Gemini's response — agreements, disagreements,
additional considerations, or alternative perspectives. Keep this
concise — the point is to get a second opinion, not to debate.]

## Fallback Behavior

If Gemini API key is not configured or the call fails:
1. Inform the user: "Gemini API key not configured."
2. Offer to answer the question directly as Claude.
3. Do NOT block on Gemini unavailability.

## Guidelines

- Present Gemini's output faithfully — do not rewrite or censor it.
- Claude's commentary should be brief and additive, not defensive.
- If the user's question is about a file, always read and pipe the file content.
- Keep Gemini prompts self-contained — Gemini has no conversation context.
- Do not send sensitive information (secrets, credentials) to Gemini.
