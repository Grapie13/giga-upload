'use strict';

const { CustomError } = require('./CustomError');

class ForbiddenError extends CustomError {
  constructor() {
    super('You are not authorized to access this route');
    this._statusCode = 403;
  }
}

module.exports = {
  ForbiddenError
};
