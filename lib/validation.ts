// validation.ts
import Joi from 'joi';

/**
 * Validates data against a Joi schema
 * @param data - The data to validate
 * @param schema - Joi schema to validate against
 * @returns Validation result with isValid flag and error details
 */
export function validateWithJoi(data: any, schema: Joi.Schema) {
  try {
    const { error, value } = schema.validate(data, { 
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        message: detail.message,
        path: detail.path,
        type: detail.type
      }));

      return {
        isValid: false,
        errors: errorDetails,
        value: null
      };
    }

    return {
      isValid: true,
      errors: null,
      value
    };
  } catch (err) {
    console.error('Validation error:', err);
    return {
      isValid: false,
      errors: [{ message: 'Internal validation error', path: [], type: 'internal' }],
      value: null
    };
  }
}
