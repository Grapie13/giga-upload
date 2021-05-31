'use strict';

const dotenv = require('dotenv');
const { join } = require('path');

function loadEnv() {
  return dotenv.config({
    path: join(__dirname, '../../../config/test.env')
  });
}

module.exports = {
  loadEnv
};
