/**
 * Validation utilities for form inputs
 */

/**
 * Validate email format using regex
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email is valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} { valid: boolean, error: string }
 */
export const validatePassword = (password) => {
  if (!password || password.length < 8) {
    return {valid: false, error: 'Password must be at least 8 characters'};
  }
  if (!/[a-zA-Z]/.test(password)) {
    return {valid: false, error: 'Password must contain at least one letter'};
  }
  if (!/[0-9]/.test(password)) {
    return {valid: false, error: 'Password must contain at least one number'};
  }
  return {valid: true};
};

export default {
  isValidEmail,
  validatePassword,
};
