'use strict';

class FailedTest extends Error {
  constructor() {
    super('Function did not throw');
  }
}

module.exports = {
  FailedTest
};
