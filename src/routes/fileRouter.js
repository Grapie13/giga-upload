'use strict';

const express = require('express');
const { handleUpload } = require('../middleware/handleUpload');

const fileRouter = express.Router();

fileRouter.route('/v1/file').post(handleUpload, (req, res) => res.status(200).json({ file: req.file }));

module.exports = {
  fileRouter
};
