'use strict';

const express = require('express');
const {
  getFiles, getFile, createFile, deleteFile
} = require('../controllers/fileControllers');
const { handleUpload } = require('../middleware/handleUpload');
const { authorizationCheck } = require('../middleware/authorizationCheck');
const { adminRoleCheck } = require('../middleware/adminRoleCheck');

const fileRouter = express.Router();

fileRouter.route('/v1/files').get([authorizationCheck, adminRoleCheck], getFiles).post([authorizationCheck, handleUpload], createFile);
fileRouter.route('/v1/files/:fileId').get([authorizationCheck, adminRoleCheck], getFile).delete(authorizationCheck, deleteFile);

module.exports = {
  fileRouter
};
