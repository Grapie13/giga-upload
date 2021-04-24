'use strict';

const { app } = require('./app');
const { asyncLogger } = require('./utils/asyncLogger');
const { loadEnv } = require('./utils/loadEnv');
const { envCheck } = require('./utils/envCheck');

async function start() {
  loadEnv();
  await envCheck();
  await app.listen(process.env.APP_PORT);
  await asyncLogger('info', `Server started listening on port ${process.env.APP_PORT}`);
}
start();
