import { describe, it, expect } from 'vitest';
import { fuzzyMaterialMatch, bestMaterialMatch } from '../../utils/fuzzyMaterialMatch';
import type { FuzzyMaterial } from '../../utils/fuzzyMaterialMatch';

const materials: FuzzyMaterial[] = [
  { id: '1', name: 'Plywood', category: 'Wood', unit: 'sq.ft', base_price: 500 },
  { id: '2', name: 'Marble Tiles', category: 'Flooring', unit: 'sq.ft', base_price: 200 },
  { id: '3', name: 'Wall Paint', category: 'Paint', unit: 'litre', base_price: 250 },
  { id: '4', name: 'Cement', category: 'Construction', unit: 'bag', base_price: 300 },
  { id: '5', name: 'Granite Slab', category: 'Stone', unit: 'sq.ft', base_price: 800 },
];

describe('fuzzyMaterialMatch', () => {
  it('returns exact match with score 1', () => {
    const results = fuzzyMaterialMatch('Plywood', materials);
    expect(results).toHaveLength(1);
    expect(results[0].material.id).toBe('1');
    expect(results[0].score).toBe(1);
  });

  it('returns partial matches sorted by score', () => {
    const results = fuzzyMaterialMatch('paint', materials, 3);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].material.name).toBe('Wall Paint');
  });

  it('matches by category with lower weight', () => {
    const results = fuzzyMaterialMatch('Wood', materials);
    expect(results.some(r => r.material.id === '1')).toBe(true);
  });

  it('filters out low-score matches (< 0.15)', () => {
    const results = fuzzyMaterialMatch('zzzzz', materials);
    expect(results).toHaveLength(0);
  });

  it('returns empty array for empty query', () => {
    const results = fuzzyMaterialMatch('', materials);
    expect(results).toHaveLength(0);
  });

  it('returns empty array for empty materials list', () => {
    const results = fuzzyMaterialMatch('plywood', []);
    expect(results).toHaveLength(0);
  });

  it('respects the limit parameter', () => {
    const results = fuzzyMaterialMatch('a', materials, 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('handles case-insensitive matching', () => {
    const results = fuzzyMaterialMatch('PLYWOOD', materials);
    expect(results[0].material.id).toBe('1');
    expect(results[0].score).toBe(1);
  });

  it('matches on token overlap', () => {
    const results = fuzzyMaterialMatch('marble', materials);
    expect(results.some(r => r.material.id === '2')).toBe(true);
  });
});

describe('bestMaterialMatch', () => {
  it('returns the best match above threshold', () => {
    const result = bestMaterialMatch('Plywood', materials);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('1');
  });

  it('returns null when no match meets the threshold', () => {
    const result = bestMaterialMatch('zzzzz', materials);
    expect(result).toBeNull();
  });

  it('respects custom threshold', () => {
    // "xyz" has no meaningful overlap with any material name
    const result = bestMaterialMatch('xyz', materials, 0.5);
    expect(result).toBeNull();
  });
});
