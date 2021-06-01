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
const { ROLES } = require('../../src/utils/constants/roles');

describe('POST /v1/auth/register', () => {
  const username = 'Tester';
  const password = 'password';
  const headers = {
    'Content-Type': 'application/json'
  };
  const method = 'POST';

  let uploadPath;
  let url;

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
        method,
        headers,
        body: JSON.stringify({ password })
      });
      throw new FailedTest();
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(401);
      expect(errors[0].field).to.eq('username');
    }

    try {
      await got(url, {
        method,
        headers,
        body: JSON.stringify({ username: 'a', password })
      });
      throw new FailedTest();
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(401);
      expect(errors[0].field).to.eq('username');
    }

    try {
      await got(url, {
        method,
        headers,
        body: JSON.stringify({ username: 'thisiswaytoolongtopassthevalidation', password })
      });
      throw new FailedTest();
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(401);
      expect(errors[0].field).to.eq('username');
    }
  });

  it('should return a 401 status if the password does not pass validation', async () => {
    try {
      await got(url, {
        method,
        headers,
        body: JSON.stringify({ username })
      });
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(401);
      expect(errors[0].field).to.eq('password');
    }

    try {
      await got(url, {
        method,
        headers,
        body: JSON.stringify({ username, password: 'short' })
      });
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(401);
      expect(errors[0].field).to.eq('password');
    }
  });

  it('should ignore the role parameter', async () => {
    const res = await got(url, {
      method,
      headers,
      body: JSON.stringify({ username, password, role: ROLES.Administrator })
    });
    const user = await User.findOne({ username });
    expect(res.statusCode).to.eq(201);
    expect(user).not.to.be.null;
    expect(user.role).to.eq(ROLES.User);
  });

  it('should create a user and return a token', async () => {
    const res = await got(url, {
      method,
      headers,
      body: JSON.stringify({ username, password })
    });
    const body = JSON.parse(res.body);
    const user = await User.findOne({ username });
    expect(res.statusCode).to.eq(201);
    expect(body.token).not.to.be.undefined;
    expect(user).not.to.be.null;
  });
});
