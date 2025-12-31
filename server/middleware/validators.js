/**
 * Input Validation Utilities
 * Sanitizes and validates user inputs
 */

export const validators = {
  // Username validation
  username: (value) => {
    if (typeof value !== 'string') return { valid: false, error: 'Username must be a string' };
    if (value.length < 3) return { valid: false, error: 'Username must be at least 3 characters' };
    if (value.length > 20) return { valid: false, error: 'Username must be at most 20 characters' };
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) return { valid: false, error: 'Username can only contain letters, numbers, - and _' };
    return { valid: true, value: value.trim() };
  },

  // Email validation
  email: (value) => {
    if (typeof value !== 'string') return { valid: false, error: 'Email must be a string' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return { valid: false, error: 'Invalid email format' };
    return { valid: true, value: value.toLowerCase().trim() };
  },

  // Password validation
  password: (value) => {
    if (typeof value !== 'string') return { valid: false, error: 'Password must be a string' };
    if (value.length < 6) return { valid: false, error: 'Password must be at least 6 characters' };
    if (value.length > 100) return { valid: false, error: 'Password is too long' };
    return { valid: true, value };
  },

  // Lobby code validation
  lobbyCode: (value) => {
    if (typeof value !== 'string') return { valid: false, error: 'Lobby code must be a string' };
    if (!/^[A-Z0-9]{6}$/.test(value)) return { valid: false, error: 'Invalid lobby code format' };
    return { valid: true, value: value.toUpperCase() };
  },

  // Number validation
  number: (value, min = -Infinity, max = Infinity) => {
    const num = Number(value);
    if (isNaN(num)) return { valid: false, error: 'Must be a number' };
    if (num < min) return { valid: false, error: `Must be at least ${min}` };
    if (num > max) return { valid: false, error: `Must be at most ${max}` };
    return { valid: true, value: num };
  },

  // Boolean validation
  boolean: (value) => {
    if (typeof value !== 'boolean') return { valid: false, error: 'Must be a boolean' };
    return { valid: true, value };
  },

  // Array validation
  array: (value, maxLength = 1000) => {
    if (!Array.isArray(value)) return { valid: false, error: 'Must be an array' };
    if (value.length > maxLength) return { valid: false, error: `Array too large (max ${maxLength})` };
    return { valid: true, value };
  },

  // Object validation
  object: (value) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return { valid: false, error: 'Must be an object' };
    }
    return { valid: true, value };
  },

  // String validation
  string: (value, minLength = 0, maxLength = 10000) => {
    if (typeof value !== 'string') return { valid: false, error: 'Must be a string' };
    if (value.length < minLength) return { valid: false, error: `Must be at least ${minLength} characters` };
    if (value.length > maxLength) return { valid: false, error: `Must be at most ${maxLength} characters` };
    return { valid: true, value: value.trim() };
  },

  // Character selection validation
  characterId: (value) => {
    const validCharacters = ['jojo', 'mimi', 'robo', 'luna'];
    if (!validCharacters.includes(value)) {
      return { valid: false, error: 'Invalid character' };
    }
    return { valid: true, value };
  },

  // Board selection validation
  boardId: (value) => {
    const validBoards = ['tropical_paradise', 'crystal_caves', 'haunted_manor', 'sky_kingdom'];
    if (!validBoards.includes(value)) {
      return { valid: false, error: 'Invalid board' };
    }
    return { valid: true, value };
  }
};

// Validation helper
export function validate(schema, data) {
  const errors = {};
  const validated = {};

  for (const [field, validator] of Object.entries(schema)) {
    const value = data[field];
    const result = typeof validator === 'function' ? validator(value) : validator;
    
    if (!result.valid) {
      errors[field] = result.error;
    } else {
      validated[field] = result.value;
    }
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: validated
  };
}

// Sanitize HTML to prevent XSS
export function sanitizeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Sanitize object recursively
export function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? sanitizeHtml(obj) : obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeObject(value);
  }
  return sanitized;
}
