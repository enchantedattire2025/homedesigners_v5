import { describe, it, expect } from 'vitest';
import { parseVoiceItemCommand } from '../../utils/parseVoiceItemCommand';

describe('parseVoiceItemCommand', () => {
  describe('full parsing', () => {
    it('parses name, quantity, unit, and price', () => {
      const result = parseVoiceItemCommand(' plywood 2 piece at 500');
      expect(result.name).toBe('plywood');
      expect(result.quantity).toBe(2);
      expect(result.unit).toBe('piece');
      expect(result.unitPrice).toBe(500);
      expect(result.confidence).toBe('full');
    });

    it('parses with ₹ symbol for price', () => {
      const result = parseVoiceItemCommand('paint 10 litres ₹250');
      expect(result.name).toBe('paint');
      expect(result.quantity).toBe(10);
      expect(result.unit).toBe('litre');
      expect(result.unitPrice).toBe(250);
      expect(result.confidence).toBe('full');
    });

    it('parses dimensions and auto-calculates quantity from area', () => {
      const result = parseVoiceItemCommand('marble 12 x 8 sq ft at 200');
      expect(result.name).toBe('marble');
      expect(result.width).toBe(12);
      expect(result.height).toBe(8);
      expect(result.unit).toBe('sq.ft');
      expect(result.unitPrice).toBe(200);
      expect(result.quantity).toBe(96);
      expect(result.confidence).toBe('full');
    });

    it('parses "height is X and width is Y" pattern', () => {
      const result = parseVoiceItemCommand('granite height is 8 and width is 4 sq ft at 300');
      expect(result.width).toBe(4);
      expect(result.height).toBe(8);
      expect(result.quantity).toBe(32);
    });

    it('parses "width is X height is Y" pattern', () => {
      const result = parseVoiceItemCommand('tiles width is 5 height is 3 sq ft at 150');
      expect(result.width).toBe(5);
      expect(result.height).toBe(3);
      expect(result.quantity).toBe(15);
    });
  });

  describe('partial parsing', () => {
    it('returns full confidence when price is missing but unit present', () => {
      const result = parseVoiceItemCommand('plywood 2 piece');
      expect(result.name).toBe('plywood');
      expect(result.quantity).toBe(2);
      expect(result.unit).toBe('piece');
      expect(result.unitPrice).toBeNull();
      // Full because name + quantity + unit are all present
      expect(result.confidence).toBe('full');
    });

    it('returns partial confidence when unit is missing but quantity present', () => {
      const result = parseVoiceItemCommand('paint 5');
      expect(result.name).toBe('paint');
      expect(result.quantity).toBe(5);
      expect(result.unit).toBeNull();
      expect(result.confidence).toBe('partial');
    });
  });

  describe('name-only fallback', () => {
    it('returns name-only confidence when just a name is given', () => {
      const result = parseVoiceItemCommand('plywood');
      expect(result.name).toBe('plywood');
      expect(result.quantity).toBeNull();
      expect(result.unit).toBeNull();
      expect(result.unitPrice).toBeNull();
      expect(result.confidence).toBe('name-only');
    });

    it('returns name-only for a bare item name with stop words', () => {
      const result = parseVoiceItemCommand('add plywood please');
      expect(result.name).toBe('plywood');
      expect(result.confidence).toBe('name-only');
    });
  });

  describe('edge cases', () => {
    it('handles empty string', () => {
      const result = parseVoiceItemCommand('');
      expect(result.name).toBe('');
      expect(result.confidence).toBe('name-only');
    });

    it('handles numbers only (treated as quantity)', () => {
      const result = parseVoiceItemCommand('5');
      expect(result.quantity).toBe(5);
      expect(result.name).toBe('');
      expect(result.confidence).toBe('name-only');
    });

    it('handles slash-separated dimensions (8/4 -> 8 x 4)', () => {
      const result = parseVoiceItemCommand('wood 8/4 sq ft at 100');
      expect(result.width).toBe(8);
      expect(result.height).toBe(4);
      expect(result.quantity).toBe(32);
    });

    it('handles "by" as dimension separator', () => {
      const result = parseVoiceItemCommand('wood 10 by 5 sq ft at 100');
      expect(result.width).toBe(10);
      expect(result.height).toBe(5);
    });

    it('handles running feet unit', () => {
      const result = parseVoiceItemCommand('molding 10 rft at 50');
      expect(result.unit).toBe('rft');
    });

    it('handles lump sum unit', () => {
      const result = parseVoiceItemCommand('installation lump sum at 5000');
      expect(result.unit).toBe('lump sum');
    });

    it('cleans stop words from item name', () => {
      const result = parseVoiceItemCommand('add the plywood please karo');
      expect(result.name).toBe('plywood');
    });
  });
});
