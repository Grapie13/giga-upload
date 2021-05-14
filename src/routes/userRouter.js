'use strict';

const express = require('express');
const {
  getAllUsers, getUser, createUser, updateUser, deleteUser
} = require('../controllers/userControllers');
const { userValidation } = require('../middleware/userValidation');
const { authorizationCheck } = require('../middleware/authorizationCheck');
const { adminRoleCheck } = require('../middleware/adminRoleCheck');

const userRouter = express.Router();

userRouter.route('/v1/users').get([authorizationCheck, adminRoleCheck], getAllUsers).post([authorizationCheck, userValidation], createUser);
userRouter.route('/v1/users/:username').get(authorizationCheck, getUser).patch(authorizationCheck, updateUser).delete(authorizationCheck, deleteUser);

module.exports = {
  userRouter
};
