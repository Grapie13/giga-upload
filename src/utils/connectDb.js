'use strict';

const mongoose = require('mongoose');
const { logger } = require('../logger');

async function connectDb() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    });
    logger.log('info', 'Database connection established successfully');
  } catch (err) {
    logger.log('error', err.toString());
    throw err;
  }
}

module.exports = {
  connectDb
};
