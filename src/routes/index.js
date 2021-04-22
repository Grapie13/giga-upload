'use strict';

const express = require('express');
const { logger } = require('../logger');
const { handleUpload } = require('../middleware/handleUpload');

const router = express.Router();

router.route('/health').get((req, res) => res.status(200).json({ status: 'OK', uptime: process.uptime(), timestamp: Date.now() }));
router.route('/upload').post(handleUpload, (req, res) => {
  logger.log('info', JSON.stringify(req.body));
  logger.log('info', JSON.stringify(req.file));
  res.status(200).json({ test: true });
});

module.exports = {
  router
};
