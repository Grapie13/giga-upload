'use strict';

const { expect } = require('chai');
const got = require('got');
const mongoose = require('mongoose');
const { loadEnv } = require('./utils/loadEnv');
const { connectDb } = require('./utils/connectDb');
const { User } = require('../../src/models/User');
const { FailedTest } = require('../shared utils/FailedTest');
const { createTestUser } = require('./utils/createTestUser');

describe('GET /v1/users', () => {
  const username = 'Tester';
  const password = 'password';
  const method = 'GET';

  let url;

  before(async () => {
    loadEnv();
    await connectDb();
    url = `http://${process.env.APP_HOSTNAME}:${process.env.APP_PORT}/v1/users`;
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  after(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  it('should return a 403 status if the user is not authenticated', async () => {
    try {
      await got(url, {
        method
      });
      throw new FailedTest();
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(403);
      expect(errors[0].message).to.eq('You are not authorized to access this route');
    }
  });

  it('should return a 403 status if the user is not an administrator', async () => {
    try {
      const token = await createTestUser(username, password);
      await got(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(403);
      expect(errors[0].message).to.eq('You are not authorized to access this route');
    }
  });

  it('should return a list of existing users without their passwords', async () => {
    const token = await createTestUser(username, password, { admin: true });
    await createTestUser('Tester2', password);
    const res = await got(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const { users } = JSON.parse(res.body);
    expect(res.statusCode).to.eq(200);
    expect(users).not.to.be.undefined;
    expect(users.length).to.eq(2);
    expect(users.some(dbEntry => dbEntry.username === username)).to.be.true;
    expect(users.every(dbEntry => dbEntry.password === undefined)).to.be.true;
  });
});
