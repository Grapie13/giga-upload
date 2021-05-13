'use strict';

const express = require('express');
const { userRouter } = require('./userRouter');
const { fileRouter } = require('./fileRouter');
const { authRouter } = require('./authRouter');

const router = express.Router();

router.route('/v1/health').get((req, res) => {
  const health = {
    message: 'OK',
    uptime: process.uptime(),
    timestamp: Date.now()
  };
  try {
    return res.status(200).json(health);
  } catch (err) {
    health.message = err.message;
    return res.status(503).json(health);
  }
});
router.use(userRouter);
router.use(fileRouter);
router.use(authRouter);

module.exports = {
  router
};
