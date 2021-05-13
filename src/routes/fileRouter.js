'use strict';

const express = require('express');
const { createFile } = require('../controllers/fileControllers');
const { handleUpload } = require('../middleware/handleUpload');
const { authorizationCheck } = require('../middleware/authorizationCheck');

const fileRouter = express.Router();

fileRouter.route('/v1/files').post([authorizationCheck, handleUpload], createFile);

module.exports = {
  fileRouter
};
