import { describe, it, expect } from 'vitest';
import { checkTolerance, calculateTax, calculateWithholding } from './format';

describe('lib/format', () => {
  describe('calculateTax', () => {
    it('should calculate tax correctly for a positive amount', () => {
      expect(calculateTax(1000, 0.11)).toBe(110);
    });

    it('should return 0 when base amount is 0', () => {
      expect(calculateTax(0, 0.11)).toBe(0);
    });

    it('should return 0 when tax rate is 0', () => {
      expect(calculateTax(1000, 0)).toBe(0);
    });
  });

  describe('calculateWithholding', () => {
    it('should calculate withholding tax correctly', () => {
      expect(calculateWithholding(1000, 0.02)).toBe(20);
    });

    it('should return 0 when base amount is 0', () => {
      expect(calculateWithholding(0, 0.02)).toBe(0);
    });
  });

  describe('checkTolerance', () => {
    it('should return true when value is within upper tolerance', () => {
      const result = checkTolerance(100, 105, 10); // base, check, 10% tolerance
      expect(result.isWithin).toBe(true);
      expect(result.delta).toBe(5);
      expect(result.isOver).toBe(true);
    });

    it('should return true when value is exactly at the upper bound', () => {
        const result = checkTolerance(100, 110, 10);
        expect(result.isWithin).toBe(true);
    });

    it('should return true when value is within lower tolerance', () => {
      const result = checkTolerance(100, 95, 10);
      expect(result.isWithin).toBe(true);
      expect(result.delta).toBe(-5);
      expect(result.isUnder).toBe(true);
    });
    
    it('should return true when value is exactly at the lower bound', () => {
        const result = checkTolerance(100, 90, 10);
        expect(result.isWithin).toBe(true);
    });

    it('should return false when value is outside upper tolerance', () => {
      const result = checkTolerance(100, 111, 10);
      expect(result.isWithin).toBe(false);
      expect(result.isOver).toBe(true);
    });

    it('should return false when value is outside lower tolerance', () => {
      const result = checkTolerance(100, 89, 10);
      expect(result.isWithin).toBe(false);
      expect(result.isUnder).toBe(true);
    });

    it('should handle zero values correctly', () => {
        const result = checkTolerance(0, 0, 10);
        expect(result.isWithin).toBe(true);
    });
  });
});
