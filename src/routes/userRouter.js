'use strict';

const express = require('express');
const { createUser, getAllUsers } = require('../controllers/userControllers');
const { userValidation } = require('../middleware/userValidation');

const userRouter = express.Router();

userRouter.route('/v1/user').get(getAllUsers).post(userValidation, createUser);

module.exports = {
  userRouter
};
