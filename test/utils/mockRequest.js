'use strict';

function mockRequest(options = { body: {}, params: {}, query: {} }) {
  return {
    ...options
  };
}

module.exports = {
  mockRequest
};
