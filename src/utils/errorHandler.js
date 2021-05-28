'use strict';

const { CastError } = require('mongoose');
const { CustomError } = require('../errors/CustomError');
const { logger } = require('../logger');

function errorHandler(err, req, res, next) { // eslint-disable-line
  if (err instanceof CastError) {
    return res.status(400).json({
      errors: [
        { message: 'Invalid ID' }
      ]
    });
  }
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json(err.formatErrors());
  }
  logger.log('error', err.toString());
  return res.status(500).json({
    errors: [
      { message: 'Internal server error' }
    ]
  });
}

module.exports = {
  errorHandler
};
