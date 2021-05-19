'use strict';

const { CustomError } = require('./CustomError');

class NotFoundError extends CustomError {
  constructor(msg) {
    super(msg ?? 'Resource not found');
    this._errorCode = 404;
  }
}

module.exports = {
  NotFoundError
};
