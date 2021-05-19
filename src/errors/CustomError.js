'use strict';

class CustomError extends Error {
  constructor(msg) {
    super(msg);
    if (this.constructor === CustomError) {
      throw new Error("Class 'CustomError' is abstract and cannot be instantiated");
    }
    this._errorCode = undefined;
  }

  get errorCode() {
    return this._errorCode;
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
