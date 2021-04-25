'use strict';

const { userSchema } = require('../validation/userSchema');

async function userValidation(req, res, next) {
  try {
    await userSchema.validateAsync(req.body, {
      abortEarly: false
    });
    return next();
  } catch (err) {
    return res.status(401).json({ message: err.message });
  }
}

module.exports = {
  userValidation
};
