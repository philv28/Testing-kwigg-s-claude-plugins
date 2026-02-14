import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'child_process';
import {
  getGeminiPath,
  isGeminiAvailable,
  getGeminiVersion,
  invokeGemini,
} from '../gemini/api.js';

vi.mock('child_process', () => ({
  execFileSync: vi.fn(),
}));

const mockExecFileSync = vi.mocked(execFileSync);

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env['GEMINI_CLI_PATH'];
});

// ---------------------------------------------------------------------------
// getGeminiPath
// ---------------------------------------------------------------------------

describe('getGeminiPath', () => {
  afterEach(() => {
    delete process.env['GEMINI_CLI_PATH'];
  });

  it('should return default "gemini" when env var is not set', () => {
    expect(getGeminiPath()).toBe('gemini');
  });

  it('should return custom path from GEMINI_CLI_PATH env var', () => {
    process.env['GEMINI_CLI_PATH'] = '/opt/homebrew/bin/gemini';
    expect(getGeminiPath()).toBe('/opt/homebrew/bin/gemini');
  });
});

// ---------------------------------------------------------------------------
// isGeminiAvailable
// ---------------------------------------------------------------------------

describe('isGeminiAvailable', () => {
  it('should return true when gemini --version succeeds', () => {
    mockExecFileSync.mockReturnValue('Gemini CLI v1.0.0');
    expect(isGeminiAvailable()).toBe(true);
    expect(mockExecFileSync).toHaveBeenCalledWith(
      'gemini',
      ['--version'],
      expect.objectContaining({ encoding: 'utf-8', timeout: 5_000 })
    );
  });

  it('should return false when gemini is not installed', () => {
    mockExecFileSync.mockImplementation(() => {
      const err = new Error('ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      throw err;
    });
    expect(isGeminiAvailable()).toBe(false);
  });

  it('should return false on any error', () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error('some error');
    });
    expect(isGeminiAvailable()).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getGeminiVersion
// ---------------------------------------------------------------------------

describe('getGeminiVersion', () => {
  it('should return trimmed version string', () => {
    mockExecFileSync.mockReturnValue('  Gemini CLI v1.2.3\n');
    expect(getGeminiVersion()).toBe('Gemini CLI v1.2.3');
  });

  it('should return undefined when CLI is not available', () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error('not found');
    });
    expect(getGeminiVersion()).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// invokeGemini
// ---------------------------------------------------------------------------

describe('invokeGemini', () => {
  it('should call gemini with correct args and return output', () => {
    mockExecFileSync.mockReturnValue('Review looks good.\n');

    const result = invokeGemini({ prompt: 'Review this code' });

    expect(result).toEqual({
      success: true,
      output: 'Review looks good.',
    });
    expect(mockExecFileSync).toHaveBeenCalledWith(
      'gemini',
      ['-p', 'Review this code', '-o', 'text'],
      expect.objectContaining({
        encoding: 'utf-8',
        timeout: 120_000,
        maxBuffer: 10 * 1024 * 1024,
        input: undefined,
      })
    );
  });

  it('should pass stdin content', () => {
    mockExecFileSync.mockReturnValue('Found issues.\n');

    const result = invokeGemini({
      prompt: 'Review this diff',
      stdin: '+ added line\n- removed line',
    });

    expect(result.success).toBe(true);
    expect(mockExecFileSync).toHaveBeenCalledWith(
      'gemini',
      ['-p', 'Review this diff', '-o', 'text'],
      expect.objectContaining({ input: '+ added line\n- removed line' })
    );
  });

  it('should include -m flag when model is specified', () => {
    mockExecFileSync.mockReturnValue('Output');

    invokeGemini({ prompt: 'Test', model: 'gemini-2.5-pro' });

    const callArgs = mockExecFileSync.mock.calls[0][1] as string[];
    expect(callArgs).toContain('-m');
    expect(callArgs).toContain('gemini-2.5-pro');
  });

  it('should use custom timeout', () => {
    mockExecFileSync.mockReturnValue('Output');

    invokeGemini({ prompt: 'Test', timeout: 60_000 });

    expect(mockExecFileSync).toHaveBeenCalledWith(
      'gemini',
      expect.anything(),
      expect.objectContaining({ timeout: 60_000 })
    );
  });

  it('should use GEMINI_CLI_PATH env var', () => {
    process.env['GEMINI_CLI_PATH'] = '/custom/gemini';
    mockExecFileSync.mockReturnValue('Output');

    invokeGemini({ prompt: 'Test' });

    expect(mockExecFileSync).toHaveBeenCalledWith(
      '/custom/gemini',
      expect.anything(),
      expect.anything()
    );
  });

  it('should classify ENOENT as not_installed', () => {
    mockExecFileSync.mockImplementation(() => {
      const err = new Error('spawn gemini ENOENT') as NodeJS.ErrnoException;
      err.code = 'ENOENT';
      throw err;
    });

    const result = invokeGemini({ prompt: 'Test' });

    expect(result).toEqual({
      success: false,
      output: '',
      error: 'not_installed',
      errorMessage: expect.stringContaining('ENOENT'),
    });
  });

  it('should classify killed process as timeout', () => {
    mockExecFileSync.mockImplementation(() => {
      const err = new Error('timed out') as Error & { killed?: boolean };
      err.killed = true;
      throw err;
    });

    const result = invokeGemini({ prompt: 'Test' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('timeout');
  });

  it('should classify auth errors', () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error('Authentication failed: invalid credentials');
    });

    const result = invokeGemini({ prompt: 'Test' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('auth_error');
  });

  it('should classify unknown errors', () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error('Something unexpected');
    });

    const result = invokeGemini({ prompt: 'Test' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('unknown');
    expect(result.errorMessage).toContain('Something unexpected');
  });

  it('should handle non-Error throws', () => {
    mockExecFileSync.mockImplementation(() => {
      throw 'string error';
    });

    const result = invokeGemini({ prompt: 'Test' });

    expect(result.success).toBe(false);
    expect(result.error).toBe('unknown');
    expect(result.errorMessage).toBe('string error');
  });
});
