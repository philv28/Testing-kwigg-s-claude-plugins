/**
 * Gemini text generation API wrapper using @google/genai SDK.
 *
 * Pattern: Follows src/image-gen/api.ts — SDK usage, error classification,
 * structured results. No external binary dependency.
 */

import { GoogleGenAI } from '@google/genai';
import { DEFAULT_TEXT_MODEL } from './types.js';
import type { GeminiInvokeOptions, GeminiResult } from './types.js';
import { classifyError } from './shared.js';

/** Default timeout for API calls (120 seconds). */
const DEFAULT_TIMEOUT_MS = 120_000;

/**
 * Generate text using the Gemini API.
 *
 * Sends a prompt (with optional context and system instruction) to the
 * specified model and returns the text response.
 */
export async function generateText(options: GeminiInvokeOptions): Promise<GeminiResult> {
  const { prompt, context, systemInstruction, model: requestedModel, timeout = DEFAULT_TIMEOUT_MS } = options;
  const model = requestedModel ?? DEFAULT_TEXT_MODEL;

  // Check API key
  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) {
    return {
      success: false,
      output: '',
      model,
      error: 'api_key_missing',
      errorMessage: 'GEMINI_API_KEY environment variable is not set. Get a free key at https://aistudio.google.com/apikey',
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Build full prompt: context first (if provided), then the prompt
    const fullPrompt = context ? `${context}\n\n${prompt}` : prompt;

    // Build config
    const config: Record<string, unknown> = {};
    if (systemInstruction) {
      config['systemInstruction'] = systemInstruction;
    }

    const apiCall = ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      ...(Object.keys(config).length > 0 ? { config } : {}),
    });

    // Race against timeout (clear timer on success to avoid leaking)
    let timer: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error(`Request timed out after ${timeout}ms`)), timeout);
    });

    const response = await Promise.race([apiCall, timeoutPromise]);
    clearTimeout(timer!);

    // Extract text from response
    let outputText = '';
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.text) {
          outputText = outputText ? `${outputText}\n${part.text}` : part.text;
        }
      }
    }

    if (!outputText) {
      return {
        success: false,
        output: '',
        model,
        error: 'generation_error',
        errorMessage: 'Model did not return any text in the response',
      };
    }

    return {
      success: true,
      output: outputText,
      model,
    };
  } catch (err: unknown) {
    const classified = classifyError(err);
    return {
      success: false,
      output: '',
      model,
      ...classified,
    };
  }
}
