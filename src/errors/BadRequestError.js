'use strict';

const { CustomError } = require('./CustomError');

class BadRequestError extends CustomError {
  constructor(msg) {
    super(msg);
    this._errorCode = 400;
  }
}

module.exports = {
  BadRequestError
};
