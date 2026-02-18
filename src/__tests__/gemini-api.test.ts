import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateText } from '../gemini/api.js';
import { isApiKeySet, classifyError } from '../gemini/shared.js';
import { DEFAULT_TEXT_MODEL } from '../gemini/types.js';
import { parseArgs } from '../gemini/cli.js';

// ---------------------------------------------------------------------------
// Mock @google/genai — vi.hoisted ensures availability before vi.mock hoist
// ---------------------------------------------------------------------------

const { mockGenerateContent } = vi.hoisted(() => ({
  mockGenerateContent: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent: mockGenerateContent };
  },
}));

const SAVED_ENV = process.env;

beforeEach(() => {
  vi.clearAllMocks();
  process.env = { ...SAVED_ENV, GEMINI_API_KEY: 'test-key-123' };
});

afterEach(() => {
  process.env = SAVED_ENV;
});

// ---------------------------------------------------------------------------
// isApiKeySet
// ---------------------------------------------------------------------------

describe('isApiKeySet', () => {
  it('should return true when GEMINI_API_KEY is set', () => {
    process.env['GEMINI_API_KEY'] = 'test-key';
    expect(isApiKeySet()).toBe(true);
  });

  it('should return false when GEMINI_API_KEY is not set', () => {
    delete process.env['GEMINI_API_KEY'];
    expect(isApiKeySet()).toBe(false);
  });

  it('should return false when GEMINI_API_KEY is empty', () => {
    process.env['GEMINI_API_KEY'] = '';
    expect(isApiKeySet()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// classifyError
// ---------------------------------------------------------------------------

describe('classifyError', () => {
  it('should classify rate limit errors', () => {
    const result = classifyError(new Error('429 Too Many Requests'));
    expect(result.error).toBe('rate_limit');
  });

  it('should classify quota errors as rate limit', () => {
    const result = classifyError(new Error('Quota exceeded'));
    expect(result.error).toBe('rate_limit');
  });

  it('should classify resource exhausted as rate limit', () => {
    const result = classifyError(new Error('RESOURCE_EXHAUSTED'));
    expect(result.error).toBe('rate_limit');
  });

  it('should classify auth errors from API key issues', () => {
    const result = classifyError(new Error('Invalid API_KEY'));
    expect(result.error).toBe('auth_error');
  });

  it('should classify 401 as auth error', () => {
    const result = classifyError(new Error('HTTP 401 Unauthorized'));
    expect(result.error).toBe('auth_error');
  });

  it('should classify 403 as auth error', () => {
    const result = classifyError(new Error('HTTP 403 Forbidden'));
    expect(result.error).toBe('auth_error');
  });

  it('should classify safety filter errors', () => {
    const result = classifyError(new Error('Content blocked by safety filter'));
    expect(result.error).toBe('safety_filter');
  });

  it('should classify harmful content errors', () => {
    const result = classifyError(new Error('Response flagged as harmful'));
    expect(result.error).toBe('safety_filter');
  });

  it('should classify timeout errors', () => {
    const result = classifyError(new Error('Request timed out after 120000ms'));
    expect(result.error).toBe('timeout');
  });

  it('should classify etimedout errors', () => {
    const result = classifyError(new Error('connect ETIMEDOUT'));
    expect(result.error).toBe('timeout');
  });

  it('should classify model not found as model_error', () => {
    const result = classifyError(new Error('Model not found: gemini-99'));
    expect(result.error).toBe('model_error');
  });

  it('should classify 404 as model_error', () => {
    const result = classifyError(new Error('HTTP 404'));
    expect(result.error).toBe('model_error');
  });

  it('should classify unknown errors as generation_error', () => {
    const result = classifyError(new Error('Something unexpected'));
    expect(result.error).toBe('generation_error');
    expect(result.errorMessage).toContain('Something unexpected');
  });

  it('should handle non-Error throws', () => {
    const result = classifyError('string error');
    expect(result.error).toBe('generation_error');
    expect(result.errorMessage).toBe('string error');
  });
});

// ---------------------------------------------------------------------------
// generateText
// ---------------------------------------------------------------------------

describe('generateText', () => {
  it('should return api_key_missing when no key is set', async () => {
    delete process.env['GEMINI_API_KEY'];

    const result = await generateText({ prompt: 'Hello' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('api_key_missing');
    expect(result.model).toBe(DEFAULT_TEXT_MODEL);
  });

  it('should generate text successfully', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{
        content: {
          parts: [{ text: 'Hello! How can I help you?' }],
        },
      }],
    });

    const result = await generateText({ prompt: 'Hello' });

    expect(result.success).toBe(true);
    expect(result.output).toBe('Hello! How can I help you?');
    expect(result.model).toBe(DEFAULT_TEXT_MODEL);
  });

  it('should use custom model when specified', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{
        content: {
          parts: [{ text: 'Response' }],
        },
      }],
    });

    const result = await generateText({ prompt: 'Test', model: 'gemini-2.5-pro' });

    expect(result.success).toBe(true);
    expect(result.model).toBe('gemini-2.5-pro');
    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.model).toBe('gemini-2.5-pro');
  });

  it('should include context in the prompt', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{
        content: {
          parts: [{ text: 'Review complete' }],
        },
      }],
    });

    await generateText({ prompt: 'Review this code', context: 'function add(a, b) { return a + b; }' });

    const callArgs = mockGenerateContent.mock.calls[0][0];
    const sentText = callArgs.contents[0].parts[0].text;
    expect(sentText).toContain('function add(a, b) { return a + b; }');
    expect(sentText).toContain('Review this code');
  });

  it('should pass system instruction in config', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{
        content: {
          parts: [{ text: 'Response' }],
        },
      }],
    });

    await generateText({
      prompt: 'Review this',
      systemInstruction: 'You are a code reviewer',
    });

    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.config.systemInstruction).toBe('You are a code reviewer');
  });

  it('should not include config when no system instruction', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{
        content: {
          parts: [{ text: 'Response' }],
        },
      }],
    });

    await generateText({ prompt: 'Hello' });

    const callArgs = mockGenerateContent.mock.calls[0][0];
    expect(callArgs.config).toBeUndefined();
  });

  it('should concatenate multiple text parts', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{
        content: {
          parts: [
            { text: 'First part' },
            { text: 'Second part' },
          ],
        },
      }],
    });

    const result = await generateText({ prompt: 'Test' });

    expect(result.success).toBe(true);
    expect(result.output).toBe('First part\nSecond part');
  });

  it('should return generation_error when model returns no text', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{
        content: {
          parts: [],
        },
      }],
    });

    const result = await generateText({ prompt: 'Test' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('generation_error');
    expect(result.errorMessage).toContain('did not return any text');
  });

  it('should return generation_error when response has no candidates', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [],
    });

    const result = await generateText({ prompt: 'Test' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('generation_error');
  });

  it('should classify rate limit errors from the SDK', async () => {
    mockGenerateContent.mockRejectedValue(new Error('429 Resource Exhausted'));

    const result = await generateText({ prompt: 'Test' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('rate_limit');
  });

  it('should classify safety filter errors from the SDK', async () => {
    mockGenerateContent.mockRejectedValue(new Error('Content was blocked by safety filters'));

    const result = await generateText({ prompt: 'Test' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('safety_filter');
  });

  it('should send prompt only when no context provided', async () => {
    mockGenerateContent.mockResolvedValue({
      candidates: [{
        content: {
          parts: [{ text: 'Response' }],
        },
      }],
    });

    await generateText({ prompt: 'Just a question' });

    const callArgs = mockGenerateContent.mock.calls[0][0];
    const sentText = callArgs.contents[0].parts[0].text;
    expect(sentText).toBe('Just a question');
  });
});

// ---------------------------------------------------------------------------
// parseArgs (CLI)
// ---------------------------------------------------------------------------

describe('parseArgs', () => {
  it('should parse --prompt', () => {
    const args = parseArgs(['--prompt', 'Hello world']);
    expect(args.prompt).toBe('Hello world');
    expect(args.context).toBeNull();
    expect(args.model).toBeNull();
    expect(args.timeout).toBeNull();
    expect(args.systemInstruction).toBeNull();
  });

  it('should parse --context', () => {
    const args = parseArgs(['--prompt', 'Review', '--context', 'some code']);
    expect(args.context).toBe('some code');
  });

  it('should parse --model', () => {
    const args = parseArgs(['--prompt', 'Test', '--model', 'gemini-2.5-pro']);
    expect(args.model).toBe('gemini-2.5-pro');
  });

  it('should parse --timeout', () => {
    const args = parseArgs(['--prompt', 'Test', '--timeout', '60000']);
    expect(args.timeout).toBe(60000);
  });

  it('should parse --system', () => {
    const args = parseArgs(['--prompt', 'Test', '--system', 'You are a reviewer']);
    expect(args.systemInstruction).toBe('You are a reviewer');
  });

  it('should exit with error when --prompt is missing', () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    const mockError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => parseArgs(['--context', 'stuff'])).toThrow('process.exit');
    expect(mockError).toHaveBeenCalledWith('--prompt is required');

    mockExit.mockRestore();
    mockError.mockRestore();
  });

  it('should exit with error for invalid --timeout', () => {
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit');
    });
    const mockError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => parseArgs(['--prompt', 'Test', '--timeout', 'abc'])).toThrow('process.exit');
    expect(mockError).toHaveBeenCalledWith('Invalid timeout: abc');

    mockExit.mockRestore();
    mockError.mockRestore();
  });
});
