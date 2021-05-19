'use strict';

const { CustomError } = require('./CustomError');

class AuthorizationError extends CustomError {
  constructor(msg) {
    super(msg ?? 'Invalid username or password');
    this._errorCode = 401;
  }
}

module.exports = {
  AuthorizationError
};
