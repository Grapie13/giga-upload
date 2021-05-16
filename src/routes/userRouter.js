'use strict';

const express = require('express');
const {
  getAllUsers, getUser, createUser, updateUser, deleteUser
} = require('../controllers/userControllers');
const { userValidation } = require('../middleware/userValidation');
const { authorizationCheck } = require('../middleware/authorizationCheck');
const { adminRoleCheck } = require('../middleware/adminRoleCheck');
const { asyncHandler } = require('../utils/asyncHandler');

const userRouter = express.Router();

userRouter.route('/v1/users')
  .get([authorizationCheck, adminRoleCheck], asyncHandler(getAllUsers))
  .post([authorizationCheck, userValidation], asyncHandler(createUser));
userRouter.route('/v1/users/:username')
  .get(authorizationCheck, asyncHandler(getUser))
  .patch(authorizationCheck, asyncHandler(updateUser))
  .delete(authorizationCheck, asyncHandler(deleteUser));

module.exports = {
  userRouter
};
