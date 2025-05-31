import {
  validateDateFormat,
  validateDateRange,
  formatDate,
  getToday,
  getDaysFromNow,
  getDaysAgo,
  validateId,
  validateIds,
  validateSearchQuery,
  validatePagination,
  validateEnum,
  sanitizeUrlParam,
  parseJsonSafely
} from '../../../src/utils/validators';

describe('Validator Utilities', () => {
  describe('validateDateFormat', () => {
    test('should accept valid date format', () => {
      expect(() => validateDateFormat('2024-01-15')).not.toThrow();
      expect(() => validateDateFormat('2024-12-31')).not.toThrow();
    });

    test('should reject invalid date format', () => {
      expect(() => validateDateFormat('2024/01/15')).toThrow('Invalid date format');
      expect(() => validateDateFormat('15-01-2024')).toThrow('Invalid date format');
      expect(() => validateDateFormat('2024-1-15')).toThrow('Invalid date format');
      expect(() => validateDateFormat('20240115')).toThrow('Invalid date format');
    });

    test('should reject invalid dates', () => {
      expect(() => validateDateFormat('2024-13-01')).toThrow('Invalid date');
      expect(() => validateDateFormat('2024-00-15')).toThrow('Invalid date');
      expect(() => validateDateFormat('2024-01-32')).toThrow('Invalid date');
    });
  });

  describe('validateDateRange', () => {
    test('should accept valid date range', () => {
      expect(() => validateDateRange('2024-01-01', '2024-01-31')).not.toThrow();
      expect(() => validateDateRange('2024-01-01', '2024-01-01')).not.toThrow();
    });

    test('should reject invalid date formats', () => {
      expect(() => validateDateRange('2024/01/01', '2024-01-31')).toThrow('Invalid date format');
      expect(() => validateDateRange('2024-01-01', '2024/01/31')).toThrow('Invalid date format');
    });

    test('should reject start date after end date', () => {
      expect(() => validateDateRange('2024-01-31', '2024-01-01')).toThrow(
        'Invalid date range: start date (2024-01-31) is after end date (2024-01-01)'
      );
    });

    test('should reject date range exceeding 1 year', () => {
      expect(() => validateDateRange('2024-01-01', '2025-01-02')).toThrow(
        'Date range cannot exceed 1 year'
      );
    });

    test('should accept date range exactly 1 year', () => {
      expect(() => validateDateRange('2024-01-01', '2024-12-31')).not.toThrow();
    });
  });

  describe('formatDate', () => {
    test('should format Date object correctly', () => {
      expect(formatDate(new Date('2024-01-15'))).toBe('2024-01-15');
      expect(formatDate(new Date('2024-12-31'))).toBe('2024-12-31');
      expect(formatDate(new Date('2024-03-05'))).toBe('2024-03-05');
    });

    test('should format date string correctly', () => {
      expect(formatDate('2024-01-15')).toBe('2024-01-15');
      expect(formatDate('January 15, 2024')).toBe('2024-01-15');
    });

    test('should pad single digit months and days', () => {
      expect(formatDate(new Date('2024-01-05'))).toBe('2024-01-05');
      expect(formatDate(new Date('2024-03-09'))).toBe('2024-03-09');
    });

    test('should throw error for invalid date', () => {
      expect(() => formatDate('invalid')).toThrow('Invalid date provided');
      expect(() => formatDate(new Date('invalid'))).toThrow('Invalid date provided');
    });
  });

  describe('getToday', () => {
    test("should return today's date in correct format", () => {
      const today = getToday();
      expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // Verify it's actually today
      const todayDate = new Date();
      const expectedDate = formatDate(todayDate);
      expect(today).toBe(expectedDate);
    });
  });

  describe('getDaysFromNow', () => {
    test('should calculate future dates correctly', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15'));

      expect(getDaysFromNow(1)).toBe('2024-01-16');
      expect(getDaysFromNow(7)).toBe('2024-01-22');
      expect(getDaysFromNow(30)).toBe('2024-02-14');

      jest.useRealTimers();
    });

    test('should handle negative days (past dates)', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15'));

      expect(getDaysFromNow(-1)).toBe('2024-01-14');
      expect(getDaysFromNow(-7)).toBe('2024-01-08');

      jest.useRealTimers();
    });
  });

  describe('getDaysAgo', () => {
    test('should calculate past dates correctly', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15'));

      expect(getDaysAgo(1)).toBe('2024-01-14');
      expect(getDaysAgo(7)).toBe('2024-01-08');
      expect(getDaysAgo(15)).toBe('2023-12-31');

      jest.useRealTimers();
    });
  });

  describe('validateId', () => {
    test('should accept valid numeric IDs', () => {
      expect(validateId(123)).toBe(123);
      expect(validateId('456')).toBe(456);
      expect(validateId(1)).toBe(1);
    });

    test('should reject invalid IDs', () => {
      expect(() => validateId('abc')).toThrow('Invalid ID: abc. Must be a positive number');
      expect(() => validateId(0)).toThrow('Invalid ID: 0. Must be a positive number');
      expect(() => validateId(-1)).toThrow('Invalid ID: -1. Must be a positive number');
      expect(() => validateId(NaN)).toThrow('Invalid ID: NaN. Must be a positive number');
      expect(() => validateId('')).toThrow('Invalid ID: . Must be a positive number');
    });

    test('should use custom name in error message', () => {
      expect(() => validateId('abc', 'Player ID')).toThrow(
        'Invalid Player ID: abc. Must be a positive number'
      );
    });
  });

  describe('validateIds', () => {
    test('should accept valid ID arrays', () => {
      expect(validateIds([1, 2, 3])).toEqual([1, 2, 3]);
      expect(validateIds(['1', '2', '3'])).toEqual([1, 2, 3]);
      expect(validateIds([1, '2', 3])).toEqual([1, 2, 3]);
    });

    test('should reject empty arrays', () => {
      expect(() => validateIds([])).toThrow('IDs must be a non-empty array');
    });

    test('should reject non-arrays', () => {
      expect(() => validateIds(null as any)).toThrow('IDs must be a non-empty array');
      expect(() => validateIds('123' as any)).toThrow('IDs must be a non-empty array');
    });

    test('should reject arrays with invalid IDs', () => {
      expect(() => validateIds([1, 'abc', 3])).toThrow('Invalid IDs[1]: abc');
      expect(() => validateIds([1, 0, 3])).toThrow('Invalid IDs[1]: 0');
    });

    test('should use custom name in error messages', () => {
      expect(() => validateIds([], 'League IDs')).toThrow('League IDs must be a non-empty array');
      expect(() => validateIds([1, 'abc'], 'League IDs')).toThrow('Invalid League IDs[1]: abc');
    });
  });

  describe('validateSearchQuery', () => {
    test('should accept valid search queries', () => {
      expect(validateSearchQuery('Manchester')).toBe('Manchester');
      expect(validateSearchQuery('  Liverpool  ')).toBe('Liverpool'); // Should trim
      expect(validateSearchQuery('abc')).toBe('abc'); // Exactly min length
    });

    test('should reject non-string queries', () => {
      expect(() => validateSearchQuery(123 as any)).toThrow('Search query must be a string');
      expect(() => validateSearchQuery(null as any)).toThrow('Search query must be a string');
    });

    test('should reject too short queries', () => {
      expect(() => validateSearchQuery('ab')).toThrow(
        'Search query must be at least 3 characters long'
      );
      expect(() => validateSearchQuery('')).toThrow(
        'Search query must be at least 3 characters long'
      );
      expect(() => validateSearchQuery('  a  ')) // Trimmed = 'a'
        .toThrow('Search query must be at least 3 characters long');
    });

    test('should use custom minimum length', () => {
      expect(validateSearchQuery('ab', 2)).toBe('ab');
      expect(() => validateSearchQuery('a', 2)).toThrow(
        'Search query must be at least 2 characters long'
      );
    });
  });

  describe('validatePagination', () => {
    test('should accept valid pagination parameters', () => {
      expect(() => validatePagination(1, 10)).not.toThrow();
      expect(() => validatePagination(100, 50)).not.toThrow();
      expect(() => validatePagination(undefined, undefined)).not.toThrow();
      expect(() => validatePagination(1, undefined)).not.toThrow();
      expect(() => validatePagination(undefined, 10)).not.toThrow();
    });

    test('should reject invalid page numbers', () => {
      expect(() => validatePagination(0, 10)).toThrow('Page must be a positive integer');
      expect(() => validatePagination(-1, 10)).toThrow('Page must be a positive integer');
      expect(() => validatePagination(1.5, 10)).toThrow('Page must be a positive integer');
    });

    test('should reject invalid per page values', () => {
      expect(() => validatePagination(1, 0)).toThrow(
        'Per page must be an integer between 1 and 100'
      );
      expect(() => validatePagination(1, 101)).toThrow(
        'Per page must be an integer between 1 and 100'
      );
      expect(() => validatePagination(1, -1)).toThrow(
        'Per page must be an integer between 1 and 100'
      );
      expect(() => validatePagination(1, 1.5)).toThrow(
        'Per page must be an integer between 1 and 100'
      );
    });
  });

  describe('validateEnum', () => {
    const TestEnum = {
      OPTION_A: 'a',
      OPTION_B: 'b',
      OPTION_C: 'c'
    } as const;

    test('should accept valid enum values', () => {
      expect(validateEnum('a', TestEnum, 'test option')).toBe('a');
      expect(validateEnum('b', TestEnum, 'test option')).toBe('b');
      expect(validateEnum('c', TestEnum, 'test option')).toBe('c');
    });

    test('should reject invalid enum values', () => {
      expect(() => validateEnum('d', TestEnum, 'test option')).toThrow(
        'Invalid test option: d. Must be one of: a, b, c'
      );
      expect(() => validateEnum(null, TestEnum, 'test option')).toThrow(
        'Invalid test option: null. Must be one of: a, b, c'
      );
    });

    test('should work with numeric enums', () => {
      const NumericEnum = {
        ONE: 1,
        TWO: 2,
        THREE: 3
      } as const;

      expect(validateEnum(1, NumericEnum, 'number')).toBe(1);
      expect(() => validateEnum(4, NumericEnum, 'number')).toThrow(
        'Invalid number: 4. Must be one of: 1, 2, 3'
      );
    });
  });

  describe('sanitizeUrlParam', () => {
    test('should encode special characters', () => {
      expect(sanitizeUrlParam('Manchester United')).toBe('Manchester%20United');
      expect(sanitizeUrlParam('100% success')).toBe('100%25%20success');
      expect(sanitizeUrlParam('test@example.com')).toBe('test%40example.com');
    });

    test('should trim whitespace', () => {
      expect(sanitizeUrlParam('  test  ')).toBe('test');
      expect(sanitizeUrlParam('\ntest\t')).toBe('test');
    });

    test('should handle already encoded strings', () => {
      expect(sanitizeUrlParam('test%20value')).toBe('test%2520value');
    });
  });

  describe('parseJsonSafely', () => {
    test('should parse valid JSON', () => {
      expect(parseJsonSafely('{"key": "value"}')).toEqual({ key: 'value' });
      expect(parseJsonSafely('[1, 2, 3]')).toEqual([1, 2, 3]);
      expect(parseJsonSafely('"string"')).toBe('string');
      expect(parseJsonSafely('123')).toBe(123);
      expect(parseJsonSafely('true')).toBe(true);
    });

    test('should throw error for invalid JSON', () => {
      expect(() => parseJsonSafely('{invalid}')).toThrow('Invalid JSON response from API');
      expect(() => parseJsonSafely('')).toThrow('Invalid JSON response from API');
      expect(() => parseJsonSafely('undefined')).toThrow('Invalid JSON response from API');
    });
  });
});
