'use strict';

const Joi = require('joi');
const { ROLES } = require('../utils/constants/roles');

const userSchema = Joi.object({
  username: Joi
    .string()
    .required()
    .min(3)
    .max(20),
  role: Joi
    .string()
    .optional()
    .valid(...Object.values(ROLES)),
  password: Joi
    .string()
    .required()
    .min(6)
    .max(255)
});

module.exports = {
  userSchema
};
