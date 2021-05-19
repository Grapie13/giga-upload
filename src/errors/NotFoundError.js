'use strict';

const { CustomError } = require('./CustomError');

class NotFoundError extends CustomError {
  constructor(msg) {
    super(msg ?? 'Resource not found');
    this._statusCode = 404;
  }
}

module.exports = {
  NotFoundError
};
