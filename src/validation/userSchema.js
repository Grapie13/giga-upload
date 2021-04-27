'use strict';

const Joi = require('joi');

const userSchema = Joi.object({
  username: Joi
    .string()
    .required()
    .min(3)
    .max(20),
  role: Joi.string().forbidden(),
  password: Joi
    .string()
    .required()
    .min(6)
    .max(30)
});

module.exports = {
  userSchema
};
