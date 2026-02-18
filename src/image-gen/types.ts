/**
 * TypeScript types for Gemini image generation.
 */

/**
 * Supported Gemini image generation models.
 */
export type ImageModel = 'gemini-2.0-flash-preview-image-generation' | 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';

/** Default model used for image generation. */
export const DEFAULT_IMAGE_MODEL: ImageModel = 'gemini-3-pro-image-preview';

/**
 * Options for generating an image.
 */
export interface ImageGenOptions {
  /** Enhanced prompt text for image generation */
  prompt: string;
  /** Output file path for the generated image */
  output: string;
  /** Optional reference image file paths for image-to-image generation */
  references?: string[];
  /** Output resolution */
  size?: '1K' | '2K' | '4K';
  /** Aspect ratio (e.g. '16:9', '1:1') */
  aspectRatio?: string;
  /** Model to use (defaults to DEFAULT_IMAGE_MODEL) */
  model?: ImageModel;
}

/**
 * Result from an image generation request.
 */
export interface ImageGenResult {
  /** Whether the generation succeeded */
  success: boolean;
  /** Saved file path on success */
  output?: string;
  /** Any text the model returned alongside the image */
  modelText?: string;
  /** Which model was used */
  model: string;
  /** Error reason if failed */
  error?: ImageGenErrorReason;
  /** Raw error message */
  errorMessage?: string;
}

/**
 * Classified error reasons for image generation failures.
 * Extends the base ApiErrorReason with image-specific reasons.
 */
export type { ApiErrorReason } from '../gemini/shared.js';
export type ImageGenErrorReason =
  | import('../gemini/shared.js').ApiErrorReason
  | 'no_image'
  | 'reference_not_found';
