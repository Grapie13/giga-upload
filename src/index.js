'use strict';

const { app } = require('./app');
const { logger } = require('./logger');
const { loadEnv } = require('./utils/loadEnv');
const { envCheck } = require('./utils/envCheck');
const { connectDb } = require('./utils/connectDb');

async function start() {
  loadEnv();
  await envCheck();
  await connectDb();
  await app.listen(process.env.APP_PORT);
  logger.log('info', `Server started listening on port ${process.env.APP_PORT}`);
}
start();
