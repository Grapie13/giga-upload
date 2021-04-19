'use strict';

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { router: routes } = require('./routes');

const app = express();

app.use(express.json());
app.use(helmet());
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100
}));

app.use(routes);

module.exports = {
  app
};
