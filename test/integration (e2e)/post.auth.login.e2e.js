'use strict';

const { expect } = require('chai');
const got = require('got');
const mongoose = require('mongoose');
const { loadEnv } = require('./utils/loadEnv');
const { connectDb } = require('./utils/connectDb');
const { User } = require('../../src/models/User');
const { FailedTest } = require('../shared utils/FailedTest');
const { createTestUser } = require('./utils/createTestUser');

describe('POST /v1/auth/login', () => {
  const username = 'Tester';
  const password = 'password';
  const headers = {
    'Content-Type': 'application/json'
  };
  const method = 'POST';

  let url;

  before(async () => {
    loadEnv();
    await connectDb();
    url = `http://${process.env.APP_HOSTNAME}:${process.env.APP_PORT}/v1/auth/login`;
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  after(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  it('should return a 401 status when a user with that username does not exist', async () => {
    try {
      await got(url, {
        method,
        headers,
        body: JSON.stringify({ username: 'InvalidUser', password })
      });
      throw new FailedTest();
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(401);
      expect(errors[0].message).to.eq('Invalid username or password');
    }
  });

  it('should return a 401 status when the password is invalid', async () => {
    try {
      await createTestUser(username, password);
      await got(url, {
        method,
        headers,
        body: JSON.stringify({ username, password: 'WrongPassword' })
      });
      throw new FailedTest();
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(401);
      expect(errors[0].message).to.eq('Invalid username or password');
    }
  });

  it('should return a token', async () => {
    await createTestUser(username, password);
    const res = await got(url, {
      method,
      headers,
      body: JSON.stringify({ username, password })
    });
    const body = JSON.parse(res.body);
    expect(res.statusCode).to.eq(200);
    expect(body.token).not.to.be.undefined;
  });
});
