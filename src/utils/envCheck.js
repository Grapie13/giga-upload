'use strict';

const { asyncLogger } = require('./asyncLogger');

const ENVIRONMENTAL_VARIABLES = [
  'APP_PORT',
  'JWT_SECRET'
];

async function envCheck() {
  const unsetVariables = [];

  for (const VARIABLE of ENVIRONMENTAL_VARIABLES) {
    if (!process.env[VARIABLE]) {
      unsetVariables.push(VARIABLE);
    }
  }

  if (unsetVariables.length !== 0) {
    await asyncLogger('error', { message: 'Environmental variable check failed', unsetVariables });
    process.exit(1);
  }
}

module.exports = {
  envCheck
};
