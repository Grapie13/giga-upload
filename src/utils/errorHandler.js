'use strict';

const { CastError } = require('mongoose');
const { CustomError } = require('../errors/CustomError');
const { logger } = require('../logger');

function errorHandler(err, req, res, next) { // eslint-disable-line
  if (err instanceof CastError) {
    return res.status(400).json({ error: 'Invalid ID' });
  }
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json(err.formatErrors());
  }
  logger.log('error', JSON.stringify(err));
  return res.status(500).json({ error: 'Internal server error' });
}

module.exports = {
  errorHandler
};
