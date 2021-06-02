'use strict';

const { expect } = require('chai');
const got = require('got');
const mongoose = require('mongoose');
const { loadEnv } = require('./utils/loadEnv');
const { connectDb } = require('./utils/connectDb');
const { User } = require('../../src/models/User');
const { FailedTest } = require('../shared utils/FailedTest');
const { createTestUser } = require('./utils/createTestUser');

describe('DELETE /v1/users/:username', () => {
  const username = 'Tester';
  const password = 'password';
  const method = 'DELETE';

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

  it('should return a 404 status if the user does not exist', async () => {
    try {
      const adminToken = await createTestUser('Admin', password, { admin: true });
      await got(url, {
        method,
        headers: {
          Authorization: `Bearer ${adminToken}`
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
      await createTestUser(username, password);
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

  it('should return a 403 status if the deleting user is not the owner of the account', async () => {
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

  it('should delete a user', async () => {
    const userToken = await createTestUser(username, password);
    const firstRes = await got(url, {
      method,
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    });
    const firstBody = JSON.parse(firstRes.body);
    expect(firstRes.statusCode).to.eq(200);
    expect(firstBody.message).to.eq('User deleted successfully');

    await createTestUser(username, password);
    const adminToken = await createTestUser('Admin', password, { admin: true });
    const secondRes = await got(url, {
      method,
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    const secondBody = JSON.parse(secondRes.body);
    expect(secondRes.statusCode).to.eq(200);
    expect(secondBody.message).to.eq('User deleted successfully');
  });
});
