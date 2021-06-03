'use strict';

const { logger } = require('../logger');

const ENVIRONMENTAL_VARIABLES = [
  'APP_PORT',
  'JWT_SECRET',
  'MONGO_URI',
  'UPLOAD_DIR',
  'MAX_REQUESTS'
];

async function envCheck() {
  const unsetVariables = [];

  for (const VARIABLE of ENVIRONMENTAL_VARIABLES) {
    if (!process.env[VARIABLE]) {
      unsetVariables.push(VARIABLE);
    }
  }

  if (unsetVariables.length !== 0) {
    logger.log('error', JSON.stringify({ message: 'Environmental variable check failed', unsetVariables }));
    throw new Error('Environmental variable check failed');
  }
}

module.exports = {
  envCheck
};
