import { z, ZodError } from 'zod';
import { ValidationError, AppError } from '../types/common.js';
import { ERROR_CODES } from './constants.js';

/**
 * Validate data against a Zod schema
 */
export function validateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: ValidationError[] } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      const validationErrors: ValidationError[] = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        value: (err as any).input,
      }));
      return { success: false, errors: validationErrors };
    }
    
    // Fallback for unexpected errors
    return {
      success: false,
      errors: [{
        field: 'unknown',
        message: 'Validation failed with unexpected error',
        value: data,
      }],
    };
  }
}

/**
 * Create a validation error
 */
export function createValidationError(
  field: string,
  message: string,
  value?: any
): ValidationError {
  return {
    field,
    message,
    value,
  };
}

/**
 * Create an application error
 */
export function createAppError(
  message: string,
  code: string = ERROR_CODES.OPERATION_FAILED,
  statusCode?: number,
  details?: any
): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

/**
 * Validate required fields
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      errors.push(createValidationError(field, `${field} is required`));
    }
  }
  
  return errors;
}

/**
 * Validate string length constraints
 */
export function validateStringLength(
  value: string,
  field: string,
  minLength?: number,
  maxLength?: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (minLength !== undefined && value.length < minLength) {
    errors.push(createValidationError(
      field,
      `${field} must be at least ${minLength} characters long`,
      value
    ));
  }
  
  if (maxLength !== undefined && value.length > maxLength) {
    errors.push(createValidationError(
      field,
      `${field} must be no more than ${maxLength} characters long`,
      value
    ));
  }
  
  return errors;
}

/**
 * Validate array constraints
 */
export function validateArray(
  value: any[],
  field: string,
  minLength?: number,
  maxLength?: number
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!Array.isArray(value)) {
    errors.push(createValidationError(field, `${field} must be an array`, value));
    return errors;
  }
  
  if (minLength !== undefined && value.length < minLength) {
    errors.push(createValidationError(
      field,
      `${field} must have at least ${minLength} items`,
      value
    ));
  }
  
  if (maxLength !== undefined && value.length > maxLength) {
    errors.push(createValidationError(
      field,
      `${field} must have no more than ${maxLength} items`,
      value
    ));
  }
  
  return errors;
}

/**
 * Validate enum values
 */
export function validateEnum(
  value: any,
  field: string,
  allowedValues: readonly string[]
): ValidationError[] {
  if (!allowedValues.includes(value)) {
    return [createValidationError(
      field,
      `${field} must be one of: ${allowedValues.join(', ')}`,
      value
    )];
  }
  
  return [];
}

/**
 * Validate date format
 */
export function validateDate(
  value: string,
  field: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (value === undefined || value === null || value === '') {
    return errors; // Optional field
  }
  
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    errors.push(createValidationError(
      field,
      `${field} must be a valid date`,
      value
    ));
  }
  
  return errors;
}

/**
 * Validate URL format
 */
export function validateUrl(
  value: string,
  field: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (value === undefined || value === null || value === '') {
    return errors; // Optional field
  }
  
  try {
    new URL(value);
  } catch {
    errors.push(createValidationError(
      field,
      `${field} must be a valid URL`,
      value
    ));
  }
  
  return errors;
}

/**
 * Validate file path
 */
export function validateFilePath(
  value: string,
  field: string
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (value === undefined || value === null || value === '') {
    return errors; // Optional field
  }
  
  // Check for path traversal attempts
  if (value.includes('..') || value.includes('//')) {
    errors.push(createValidationError(
      field,
      `${field} contains invalid path characters`,
      value
    ));
  }
  
  // Check for invalid characters
  const invalidChars = /[<>:"|?*]/;
  if (invalidChars.test(value)) {
    errors.push(createValidationError(
      field,
      `${field} contains invalid characters`,
      value
    ));
  }
  
  return errors;
}

/**
 * Combine multiple validation results
 */
export function combineValidationResults(
  ...validationResults: ValidationError[][]
): ValidationError[] {
  return validationResults.flat();
}

/**
 * Check if validation result is successful
 */
export function isValidationSuccessful(
  result: { success: boolean; errors?: ValidationError[] }
): result is { success: true } {
  return result.success;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors
    .map(error => `${error.field}: ${error.message}`)
    .join('\n');
}

/**
 * Validate pagination parameters
 */
export function validatePagination(
  page: number,
  limit: number,
  maxLimit: number = 100
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (page < 1) {
    errors.push(createValidationError('page', 'Page must be at least 1', page));
  }
  
  if (limit < 1) {
    errors.push(createValidationError('limit', 'Limit must be at least 1', limit));
  }
  
  if (limit > maxLimit) {
    errors.push(createValidationError('limit', `Limit cannot exceed ${maxLimit}`, limit));
  }
  
  return errors;
}

/**
 * Validate search query
 */
export function validateSearchQuery(
  query: string,
  minLength: number = 1,
  maxLength: number = 500
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (typeof query !== 'string') {
    errors.push(createValidationError('query', 'Query must be a string', query));
    return errors;
  }
  
  errors.push(...validateStringLength(query, 'query', minLength, maxLength));
  
  // Check for potentially dangerous patterns
  if (query.includes('..') || query.includes('//')) {
    errors.push(createValidationError(
      'query',
      'Query contains potentially dangerous patterns',
      query
    ));
  }
  
  return errors;
}
