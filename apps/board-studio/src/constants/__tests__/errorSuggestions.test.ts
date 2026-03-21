import { describe, it, expect } from 'vitest';
import { getErrorSuggestion, ERROR_SUGGESTIONS } from '../errorSuggestions';

describe('ERROR_SUGGESTIONS', () => {
  it('exports a non-empty mapping object', () => {
    expect(ERROR_SUGGESTIONS).toBeDefined();
    expect(Object.keys(ERROR_SUGGESTIONS).length).toBeGreaterThan(0);
  });
});

describe('getErrorSuggestion', () => {
  it('returns suggestion for 404 RUN_NOT_FOUND', () => {
    const result = getErrorSuggestion(404, 'RUN_NOT_FOUND');
    expect(result).not.toBeNull();
    expect(result!.message).toContain('run');
  });

  it('returns suggestion for 404 ARTIFACT_NOT_FOUND', () => {
    const result = getErrorSuggestion(404, 'ARTIFACT_NOT_FOUND');
    expect(result).not.toBeNull();
    expect(result!.message).toContain('artifact');
  });

  it('returns suggestion for 400 INVALID_PLAN', () => {
    const result = getErrorSuggestion(400, 'INVALID_PLAN');
    expect(result).not.toBeNull();
    expect(result!.action).toContain('required inputs');
  });

  it('returns suggestion for 400 MISSING_INTENT_SPEC', () => {
    const result = getErrorSuggestion(400, 'MISSING_INTENT_SPEC');
    expect(result).not.toBeNull();
    expect(result!.message).toContain('IntentSpec');
  });

  it('returns suggestion for 403 FORBIDDEN', () => {
    const result = getErrorSuggestion(403, 'FORBIDDEN');
    expect(result).not.toBeNull();
    expect(result!.message).toContain('permission');
  });

  it('returns wildcard suggestion for 500 UNKNOWN', () => {
    const result = getErrorSuggestion(500, 'UNKNOWN');
    expect(result).not.toBeNull();
    expect(result!.message).toContain('unexpected server error');
  });

  it('returns null for completely unknown status+code', () => {
    const result = getErrorSuggestion(418, 'NEVER_SEEN_CODE');
    expect(result).toBeNull();
  });

  it('returns 500 wildcard fallback for other 5xx codes', () => {
    const result = getErrorSuggestion(502, 'SOME_RANDOM_CODE');
    expect(result).not.toBeNull();
    expect(result!.message).toContain('unexpected server error');
  });

  it('returns 500 wildcard for 503 with no code', () => {
    const result = getErrorSuggestion(503);
    expect(result).not.toBeNull();
    expect(result!.action).toContain('Try again');
  });
});
