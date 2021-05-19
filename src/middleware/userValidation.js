'use strict';

const { userSchema } = require('../validation/userSchema');
const { ValidationError } = require('../errors/ValidationError');

async function userValidation(req, res, next) {
  try {
    await userSchema.validateAsync(req.body, {
      abortEarly: false
    });
    return next();
  } catch (err) {
    return next(new ValidationError(err.details));
  }
}

module.exports = {
  userValidation
};
