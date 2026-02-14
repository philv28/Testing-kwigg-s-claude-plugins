/**
 * TypeScript types for Gemini CLI integration.
 */

/**
 * Options for invoking the Gemini CLI.
 */
export interface GeminiInvokeOptions {
  /** Prompt text passed via -p flag */
  prompt: string;
  /** Content piped to stdin (e.g., a diff) */
  stdin?: string;
  /** Model override via -m flag */
  model?: string;
  /** Timeout in milliseconds (default: 120000) */
  timeout?: number;
}

/**
 * Result from a Gemini CLI invocation.
 */
export interface GeminiResult {
  /** Whether the invocation succeeded */
  success: boolean;
  /** Output text from Gemini */
  output: string;
  /** Error reason if failed */
  error?: GeminiErrorReason;
  /** Raw error message */
  errorMessage?: string;
}

/**
 * Classified error reasons for Gemini CLI failures.
 */
export type GeminiErrorReason =
  | 'not_installed'
  | 'timeout'
  | 'auth_error'
  | 'unknown';
