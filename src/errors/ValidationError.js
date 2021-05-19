'use strict';

const { CustomError } = require('./CustomError');

class ValidationError extends CustomError {
  constructor(errors) {
    super('');
    this._statusCode = 401;
    this.errors = errors.map(error => ({
      message: error.message,
      field: error.context.key
    }));
  }

  formatErrors() {
    return {
      errors: this.errors
    };
  }
}

module.exports = {
  ValidationError
};
