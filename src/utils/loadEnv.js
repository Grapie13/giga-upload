'use strict';

const path = require('path');
const dotenv = require('dotenv');

function loadEnv() {
  const envPath = path.join(__dirname, `../../config/${process.env.NODE_ENV ?? 'development'}.env`);
  return dotenv.config({
    path: envPath
  });
}

module.exports = {
  loadEnv
};
