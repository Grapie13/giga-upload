'use strict';

const express = require('express');
const {
  getAllUsers, createUser, updateUser, deleteUser
} = require('../controllers/userControllers');
const { userValidation } = require('../middleware/userValidation');
const { authorizationCheck } = require('../middleware/authorizationCheck');

const userRouter = express.Router();

userRouter.route('/v1/user').get(getAllUsers).post(userValidation, createUser);
userRouter.route('/v1/user/:username').patch(authorizationCheck, updateUser).delete(authorizationCheck, deleteUser);

module.exports = {
  userRouter
};
