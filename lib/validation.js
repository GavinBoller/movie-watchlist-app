import Joi from 'joi';

/**
 * Validates input data against a Joi schema
 * @param {Object} input - Input data to validate
 * @param {Object} schema - Joi schema
 * @returns {Object} Validation result with isValid flag and errors if any
 */
export function validateWithJoi(input, schema) {
  if (!schema) {
    return { isValid: true, value: input };
  }
  
  const { error, value } = schema.validate(input, { 
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: true 
  });
  
  if (error) {
    const errors = {};
    error.details.forEach(detail => {
      errors[detail.path[0]] = detail.message;
    });
    
    return { isValid: false, errors, value };
  }
  
  return { isValid: true, value };
}
