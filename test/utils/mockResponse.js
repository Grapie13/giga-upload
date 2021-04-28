'use strict';

const { stub } = require('sinon');

function mockResponse() {
  const res = {};
  res.status = stub().returns(res);
  res.json = stub().returns(res);
  res.end = stub().returns(res);
  return res;
}

module.exports = {
  mockResponse
};
