// Schema definitions for platform API validation
import Joi from 'joi';

export const platformCreateSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    'string.empty': 'Platform name is required',
    'any.required': 'Platform name is required'
  }),
  logoUrl: Joi.string().allow(null, '').optional(),
  isDefault: Joi.boolean().optional()
});

export const platformUpdateSchema = Joi.object({
  id: Joi.alternatives().try(
    Joi.string().required(),
    Joi.number().required()
  ).messages({
    'string.empty': 'Platform ID is required',
    'any.required': 'Platform ID is required'
  }),
  name: Joi.string().trim().required().messages({
    'string.empty': 'Platform name is required',
    'any.required': 'Platform name is required'
  }),
  logoUrl: Joi.string().allow(null, '').optional(),
  isDefault: Joi.boolean().optional()
});

export const platformDeleteSchema = Joi.object({
  id: Joi.alternatives().try(
    Joi.string().required(),
    Joi.number().required()
  ).messages({
    'string.empty': 'Platform ID is required',
    'any.required': 'Platform ID is required'
  })
});
