/**
 * Gemini CLI wrapper using `gemini` CLI.
 *
 * Pattern: Follows src/github/api.ts — execFileSync, error classification,
 * graceful fallbacks. No shell invocation (bypasses injection risk).
 */

import { execFileSync } from 'child_process';
import type { GeminiInvokeOptions, GeminiResult, GeminiErrorReason } from './types.js';

/** Default timeout for Gemini CLI calls (120 seconds). */
const DEFAULT_TIMEOUT_MS = 120_000;

/** Max buffer for CLI output (10 MB). */
const MAX_BUFFER = 10 * 1024 * 1024;

/**
 * Resolve the Gemini CLI binary path.
 * Checks GEMINI_CLI_PATH env var first, falls back to 'gemini'.
 */
export function getGeminiPath(): string {
  return process.env['GEMINI_CLI_PATH'] || 'gemini';
}

/**
 * Check whether the Gemini CLI is available on this system.
 * Returns true if `gemini --version` succeeds.
 */
export function isGeminiAvailable(): boolean {
  try {
    execFileSync(getGeminiPath(), ['--version'], {
      encoding: 'utf-8',
      timeout: 5_000,
      maxBuffer: MAX_BUFFER,
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the installed Gemini CLI version string.
 * Returns undefined if the CLI is not available.
 */
export function getGeminiVersion(): string | undefined {
  try {
    const output = execFileSync(getGeminiPath(), ['--version'], {
      encoding: 'utf-8',
      timeout: 5_000,
      maxBuffer: MAX_BUFFER,
    });
    return output.trim();
  } catch {
    return undefined;
  }
}

/**
 * Classify an error from execFileSync into a GeminiErrorReason.
 */
function classifyError(err: unknown): GeminiErrorReason {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();

    // ENOENT = binary not found
    if ('code' in err && (err as NodeJS.ErrnoException).code === 'ENOENT') {
      return 'not_installed';
    }

    // Timeout
    if (msg.includes('etimedout') || msg.includes('timed out') || msg.includes('timedout')) {
      return 'timeout';
    }
    if ('killed' in err && (err as { killed?: boolean }).killed) {
      return 'timeout';
    }

    // Auth errors
    if (msg.includes('auth') || msg.includes('credential') || msg.includes('permission')) {
      return 'auth_error';
    }
  }

  return 'unknown';
}

/**
 * Invoke the Gemini CLI with a prompt and optional stdin content.
 *
 * Calls: `gemini -p <prompt> -o text [-m model]`
 * Stdin is piped directly (no shell, no injection risk).
 */
export function invokeGemini(options: GeminiInvokeOptions): GeminiResult {
  const { prompt, stdin, model, timeout = DEFAULT_TIMEOUT_MS } = options;

  const args = ['-p', prompt, '-o', 'text'];
  if (model) {
    args.push('-m', model);
  }

  try {
    const output = execFileSync(getGeminiPath(), args, {
      encoding: 'utf-8',
      timeout,
      maxBuffer: MAX_BUFFER,
      input: stdin,
    });

    return {
      success: true,
      output: output.trim(),
    };
  } catch (err) {
    const reason = classifyError(err);
    const errorMessage = err instanceof Error ? err.message : String(err);

    return {
      success: false,
      output: '',
      error: reason,
      errorMessage,
    };
  }
}
