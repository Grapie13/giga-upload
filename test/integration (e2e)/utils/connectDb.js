'use strict';

const mongoose = require('mongoose');

async function connectDb() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  });
}

module.exports = {
  connectDb
};
