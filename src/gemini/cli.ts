#!/usr/bin/env node
/**
 * CLI entrypoint for Gemini text generation.
 * Usage: node dist/gemini/cli.js --prompt "..." [--context "..."] [--model name] [--timeout ms] [--system "..."]
 *
 * Also reads stdin when piped:
 *   echo "file content" | node dist/gemini/cli.js --prompt "Review this"
 */

import { generateText } from './api.js';
import type { GeminiInvokeOptions } from './types.js';

export interface CliArgs {
  prompt: string;
  context: string | null;
  model: string | null;
  timeout: number | null;
  systemInstruction: string | null;
}

export function parseArgs(argv: string[]): CliArgs {
  let prompt: string | null = null;
  let context: string | null = null;
  let model: string | null = null;
  let timeout: number | null = null;
  let systemInstruction: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--prompt' && i + 1 < argv.length) {
      prompt = argv[++i];
    } else if (arg === '--context' && i + 1 < argv.length) {
      context = argv[++i];
    } else if (arg === '--model' && i + 1 < argv.length) {
      model = argv[++i];
    } else if (arg === '--timeout' && i + 1 < argv.length) {
      const val = parseInt(argv[++i], 10);
      if (isNaN(val) || val <= 0) {
        console.error(`Invalid timeout: ${argv[i]}`);
        process.exit(1);
      }
      timeout = val;
    } else if (arg === '--system' && i + 1 < argv.length) {
      systemInstruction = argv[++i];
    }
  }

  if (!prompt) {
    console.error('--prompt is required');
    process.exit(1);
  }

  return { prompt, context, model, timeout, systemInstruction };
}

/**
 * Read all data from stdin (non-blocking: returns empty string if not piped).
 */
function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }

    const chunks: Buffer[] = [];
    process.stdin.on('data', (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    process.stdin.on('error', () => resolve(''));
  });
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  // Read stdin if piped (e.g., echo "diff" | node cli.js --prompt "Review")
  const stdinData = await readStdin();

  // Merge stdin with --context flag (stdin takes priority as context)
  const context = stdinData || args.context || undefined;

  const options: GeminiInvokeOptions = {
    prompt: args.prompt,
    context,
    model: args.model ?? undefined,
    timeout: args.timeout ?? undefined,
    systemInstruction: args.systemInstruction ?? undefined,
  };

  const result = await generateText(options);

  // Output JSON to stdout for the skill to parse
  console.log(JSON.stringify(result, null, 2));

  if (!result.success) {
    process.exit(1);
  }
}

/* istanbul ignore next -- CLI entrypoint guard */
if (process.argv[1]?.endsWith('cli.js')) {
  main();
}
