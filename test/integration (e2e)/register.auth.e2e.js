'use strict';

const { expect } = require('chai');
const got = require('got');
const mongoose = require('mongoose');
const { join } = require('path');
const { promises: { rmdir } } = require('fs');
const { loadEnv } = require('./utils/loadEnv');
const { connectDb } = require('./utils/connectDb');
const { User } = require('../../src/models/User');
const { File } = require('../../src/models/File');
const { FailedTest } = require('../shared utils/FailedTest');

describe('POST /v1/auth/register', () => {
  const username = 'Tester';
  const password = 'password';

  let url;
  let uploadPath;

  before(async () => {
    loadEnv();
    await connectDb();
    url = `http://${process.env.APP_HOSTNAME}:${process.env.APP_PORT}/v1/auth/register`;
    uploadPath = join(__dirname, `../../${process.env.UPLOAD_DIR}`);
  });

  beforeEach(async () => {
    await rmdir(uploadPath, { recursive: true, force: true });
    await User.deleteMany({});
    await File.deleteMany({});
  });

  after(async () => {
    await rmdir(uploadPath, { recursive: true, force: true });
    await User.deleteMany({});
    await File.deleteMany({});
    await mongoose.connection.close();
  });

  it('should return a 401 status if the username does not pass validation', async () => {
    try {
      await got(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });
      throw new FailedTest();
    } catch (err) {
      expect(err.statusCode).to.eq(401);
      const { errors } = JSON.parse(err.body);
      expect(errors[0].field).to.eq('username');
    }
  });
});
