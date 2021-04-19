'use strict';

const express = require('express');

const router = express.Router();

router.route('/health').get((req, res) => res.status(200).json({ uptime: process.uptime(), timestamp: Date.now() }));

module.exports = {
  router
};
