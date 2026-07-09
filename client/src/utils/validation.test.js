import {isValidEmail, validatePassword} from './validation';

describe('validation utilities', () => {
  test('accepts valid email addresses', () => {
    expect(isValidEmail('dispatcher@example.com')).toBe(true);
  });

  test('rejects malformed email addresses', () => {
    expect(isValidEmail('not-an-email')).toBe(false);
    expect(isValidEmail('missing-domain@')).toBe(false);
  });

  test('accepts passwords with minimum length, letters, and numbers', () => {
    expect(validatePassword('GoodPass123')).toEqual({valid: true});
  });

  test('rejects weak passwords with clear messages', () => {
    expect(validatePassword('short1')).toEqual({
      valid: false,
      error: 'Password must be at least 8 characters',
    });
    expect(validatePassword('NoDigitsHere')).toEqual({
      valid: false,
      error: 'Password must contain at least one number',
    });
    expect(validatePassword('12345678')).toEqual({
      valid: false,
      error: 'Password must contain at least one letter',
    });
  });
});
