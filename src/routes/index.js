'use strict';

const express = require('express');
const { handleUpload } = require('../middleware/handleUpload');

const router = express.Router();

router.route('/v1/health').get((req, res) => res.status(200).json({ status: 'OK', uptime: process.uptime(), timestamp: Date.now() }));
router.route('/v1/file').post(handleUpload, (req, res) => {
  res.status(200).json({ test: true });
});
router.route('/v1/user').get((req, res) => res.status(200).json({ xD: 'xD' }));

module.exports = {
  router
};
