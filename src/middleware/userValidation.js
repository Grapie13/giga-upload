'use strict';

const { userSchema } = require('../validation/userSchema');

async function userValidation(req, res, next) {
  try {
    await userSchema.validateAsync(req.body, {
      abortEarly: false
    });
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  userValidation
};
