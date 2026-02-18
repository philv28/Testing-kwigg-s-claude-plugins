/**
 * TypeScript types for Gemini API integration.
 */

/** Default model used for text generation. */
export const DEFAULT_TEXT_MODEL = 'gemini-2.5-flash';

/**
 * Options for invoking the Gemini API.
 */
export interface GeminiInvokeOptions {
  /** Prompt text sent to the model */
  prompt: string;
  /** Additional context appended to the prompt (e.g., a diff or file content) */
  context?: string;
  /** System instruction for the model */
  systemInstruction?: string;
  /** Model override (defaults to DEFAULT_TEXT_MODEL) */
  model?: string;
  /** Timeout in milliseconds (default: 120000) */
  timeout?: number;
}

/**
 * Result from a Gemini API invocation.
 */
export interface GeminiResult {
  /** Whether the invocation succeeded */
  success: boolean;
  /** Output text from Gemini */
  output: string;
  /** Which model was used */
  model: string;
  /** Error reason if failed */
  error?: GeminiErrorReason;
  /** Raw error message */
  errorMessage?: string;
}

/**
 * Classified error reasons for Gemini API failures.
 * Extends the base ApiErrorReason shared with image-gen.
 */
export type { ApiErrorReason } from './shared.js';
export type GeminiErrorReason = import('./shared.js').ApiErrorReason;
