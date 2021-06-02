'use strict';

const { expect } = require('chai');
const got = require('got');
const mongoose = require('mongoose');
const { loadEnv } = require('./utils/loadEnv');
const { connectDb } = require('./utils/connectDb');
const { User } = require('../../src/models/User');
const { FailedTest } = require('../shared utils/FailedTest');
const { createTestUser } = require('./utils/createTestUser');

describe('GET /v1/users/:username', () => {
  const username = 'Tester';
  const password = 'password';
  const method = 'GET';

  let url;

  before(async () => {
    loadEnv();
    await connectDb();
    url = `http://${process.env.APP_HOSTNAME}:${process.env.APP_PORT}/v1/users/${username}`;
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  after(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  it('should return a 404 status if a user does not exist', async () => {
    try {
      const token = await createTestUser('Admin', password, { admin: true });
      await got(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      throw new FailedTest();
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(404);
      expect(errors[0].message).to.eq('A user with that username does not exist');
    }
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

  it("should return a 403 status if the user is not the account's owner nor an administrator", async () => {
    try {
      await createTestUser(username, password);
      const token = await createTestUser('MaliciousUser', password);
      await got(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      throw new FailedTest();
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(403);
      expect(errors[0].message).to.eq('You are not authorized to access this route');
    }
  });

  it("should return a user's details", async () => {
    const userToken = await createTestUser(username, password);
    const adminToken = await createTestUser('Admin', password, { admin: true });
    const firstRes = await got(url, {
      method,
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    });
    const firstBody = JSON.parse(firstRes.body);
    expect(firstRes.statusCode).to.eq(200);
    expect(firstBody.user).not.to.be.undefined;
    expect(firstBody.user.username).to.eq(username);

    const secondRes = await got(url, {
      method,
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    const secondBody = JSON.parse(secondRes.body);
    expect(secondRes.statusCode).to.eq(200);
    expect(secondBody.user).not.to.be.undefined;
    expect(secondBody.user.username).to.eq(username);
  });
});
