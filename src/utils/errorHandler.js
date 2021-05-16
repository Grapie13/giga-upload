'use strict';

const { CastError } = require('mongoose');
const { logger } = require('../logger');

function errorHandler(err, req, res, next) { // eslint-disable-line
  if (err instanceof CastError) {
    return res.status(400).json({ message: 'Invalid ID' });
  }
  logger.log('error', JSON.stringify(err));
  return res.status(500).json({ message: 'Internal server error' });
}

module.exports = {
  errorHandler
};
