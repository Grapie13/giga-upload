'use strict';

const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { router: routes } = require('./routes');
const { errorHandler } = require('./utils/errorHandler');

const app = express();

app.use(express.json());
app.use(helmet());
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 100
}));

app.use(routes);
app.use(errorHandler);

module.exports = {
  app
};
