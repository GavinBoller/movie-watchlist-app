// Schema definitions for user API validation
import Joi from 'joi';

export const userUpdateCountrySchema = Joi.object({
  country: Joi.string().length(2).required().messages({
    'string.empty': 'Country code is required',
    'string.length': 'Country code must be exactly 2 characters',
    'any.required': 'Country code is required'
  })
});
