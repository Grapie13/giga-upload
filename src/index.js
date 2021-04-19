'use strict';

const { app } = require('./app');
const { logger } = require('./logger');

async function start() {
  await app.listen(process.env.APP_PORT || 3000);
  logger.log('info', `Server started on port ${process.env.APP_PORT || 3000}`);
}
start();
