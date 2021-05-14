'use strict';

const express = require('express');
const { register, login } = require('../controllers/authControllers');
const { userValidation } = require('../middleware/userValidation');

const authRouter = express.Router();

authRouter.route('/v1/auth/register').post(userValidation, register);
authRouter.route('/v1/auth/login').post(login);

module.exports = {
  authRouter
};
