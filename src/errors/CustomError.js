'use strict';

class CustomError extends Error {
  constructor(msg) {
    super(msg);
    if (this.constructor === CustomError) {
      throw new Error("Class 'CustomError' is abstract and cannot be instantiated");
    }
    this._statusCode = undefined;
  }

  get statusCode() {
    return this._statusCode;
  }

  formatErrors() {
    return {
      errors: [
        { message: this.message }
      ]
    };
  }
}

module.exports = {
  CustomError
};
