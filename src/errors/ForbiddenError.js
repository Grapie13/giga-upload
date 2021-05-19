'use strict';

const { CustomError } = require('./CustomError');

class ForbiddenError extends CustomError {
  constructor() {
    super('You are not authorized to access this route');
    this._errorCode = 401;
  }
}

module.exports = {
  ForbiddenError
};
