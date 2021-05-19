'use strict';

const express = require('express');
const {
  getFiles, getFile, getUserFiles, createFile, deleteFile
} = require('../controllers/fileControllers');
const { handleUpload } = require('../middleware/handleUpload');
const { authorizationCheck } = require('../middleware/authorizationCheck');
const { adminRoleCheck } = require('../middleware/adminRoleCheck');
const { asyncHandler } = require('../utils/asyncHandler');

const fileRouter = express.Router();

fileRouter.route('/v1/files')
  .get([authorizationCheck, adminRoleCheck], asyncHandler(getFiles))
  .post([authorizationCheck, handleUpload], asyncHandler(createFile));
fileRouter.route('/v1/files/:fileId')
  .get([authorizationCheck, adminRoleCheck], asyncHandler(getFile))
  .delete(authorizationCheck, asyncHandler(deleteFile));
fileRouter.route('/v1/users/:username/files')
  .get(authorizationCheck, getUserFiles);

module.exports = {
  fileRouter
};
