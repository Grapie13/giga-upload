'use strict';

const { spy } = require('sinon');

function mockRequest(options = { body: {}, params: {}, query: {} }) {
  return {
    ...options,
    get: spy()
  };
}

module.exports = {
  mockRequest
};
