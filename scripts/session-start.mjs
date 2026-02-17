#!/usr/bin/env node

/**
 * kw-plugin Session Start Hook
 *
 * Thin wrapper — reads stdin, delegates to compiled TypeScript, writes stdout.
 * All session-start logic lives in src/hooks/session-start.ts (single source of truth).
 *
 * Requires `npm run build` to have run (imports from dist/).
 *
 * The contract:
 *   stdin  → JSON { sessionId, directory }
 *   stdout → JSON { continue: true, hookSpecificOutput: { hookEventName, additionalContext } }
 */

import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PLUGIN_ROOT = join(__dirname, '..');

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

async function main() {
  try {
    // Read input from Claude Code (contract requires consuming stdin)
    await readStdin();

    // Import compiled TypeScript — single source of truth for session-start logic
    const { buildSessionStartContext } = await import(
      join(PLUGIN_ROOT, 'dist', 'hooks', 'session-start.js')
    );

    const output = buildSessionStartContext(PLUGIN_ROOT);

    console.log(JSON.stringify(output));
  } catch (error) {
    // CRITICAL: Never block session start. Always return continue: true.
    // If dist/ isn't built yet, fall back gracefully.
    console.log(JSON.stringify({ continue: true }));
  }
}

main();
