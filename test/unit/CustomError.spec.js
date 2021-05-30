'use strict';

const { expect } = require('chai');
const { CustomError } = require('../../src/errors/CustomError');
const { FailedTest } = require('../utils/FailedTest');

describe('CustomError', () => {
  it('should throw an error when being instantiated', () => {
    try {
      const badError = new CustomError('This should throw'); // eslint-disable-line
      throw new FailedTest();
    } catch (err) {
      expect(err.message).to.eq("Class 'CustomError' is abstract and cannot be instantiated");
    }
  });
});
