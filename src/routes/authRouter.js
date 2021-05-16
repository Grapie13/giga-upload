'use strict';

const express = require('express');
const { register, login } = require('../controllers/authControllers');
const { userValidation } = require('../middleware/userValidation');
const { asyncHandler } = require('../utils/asyncHandler');

const authRouter = express.Router();

authRouter.route('/v1/auth/register')
  .post(userValidation, asyncHandler(register));
authRouter.route('/v1/auth/login')
  .post(asyncHandler(login));

module.exports = {
  authRouter
};
