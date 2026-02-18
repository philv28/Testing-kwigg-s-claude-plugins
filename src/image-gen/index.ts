/**
 * Gemini image generation module.
 */

export { isApiKeySet, classifyError } from '../gemini/shared.js';
export { generateImage } from './api.js';
export type {
  ImageModel,
  ImageGenOptions,
  ImageGenResult,
  ImageGenErrorReason,
} from './types.js';
