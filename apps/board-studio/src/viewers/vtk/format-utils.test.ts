import { describe, it, expect } from 'vitest';
import { getVtkFormat, isVtkFile } from './format-utils';

describe('getVtkFormat', () => {
  it('returns "vtp" for .vtp files', () => {
    expect(getVtkFormat('mesh.vtp')).toBe('vtp');
  });

  it('returns "vtu" for .vtu files', () => {
    expect(getVtkFormat('result.vtu')).toBe('vtu');
  });

  it('returns null for unsupported formats', () => {
    expect(getVtkFormat('model.stl')).toBeNull();
  });

  it('returns null for undefined', () => {
    expect(getVtkFormat(undefined)).toBeNull();
  });

  it('returns "vtp" for uppercase .VTP files (case insensitive)', () => {
    expect(getVtkFormat('STRESS.VTP')).toBe('vtp');
  });

  it('returns "vtu" for mixed-case .VtU files', () => {
    expect(getVtkFormat('data.VtU')).toBe('vtu');
  });

  it('returns null for empty string', () => {
    expect(getVtkFormat('')).toBeNull();
  });
});

describe('isVtkFile', () => {
  it('returns true for .vtp files', () => {
    expect(isVtkFile('mesh.vtp')).toBe(true);
  });

  it('returns true for .vtu files', () => {
    expect(isVtkFile('result.vtu')).toBe(true);
  });

  it('returns false for non-VTK files', () => {
    expect(isVtkFile('photo.png')).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isVtkFile(undefined)).toBe(false);
  });
});
