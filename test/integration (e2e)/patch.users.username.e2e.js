'use strict';

const { expect } = require('chai');
const got = require('got');
const mongoose = require('mongoose');
const { loadEnv } = require('./utils/loadEnv');
const { connectDb } = require('./utils/connectDb');
const { User } = require('../../src/models/User');
const { FailedTest } = require('../shared utils/FailedTest');
const { createTestUser } = require('./utils/createTestUser');
const { ROLES } = require('../../src/utils/constants/roles');

describe('PATCH /v1/users/:username', () => {
  const username = 'Tester';
  const password = 'password';
  const method = 'PATCH';
  const headers = {
    'Content-Type': 'application/json'
  };

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
          ...headers,
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ role: ROLES.Administrator })
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
        method,
        headers,
        body: JSON.stringify({ role: ROLES.Administrator })
      });
      throw new FailedTest();
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(403);
      expect(errors[0].message).to.eq('You are not authorized to access this route');
    }
  });

  it('should return a 403 status if accessing user is not the owner of the account', async () => {
    try {
      await createTestUser(username, password);
      const token = await createTestUser('MaliciousUser', password);
      await got(url, {
        method,
        headers: {
          ...headers,
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: ROLES.Administrator })
      });
      throw new FailedTest();
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(403);
      expect(errors[0].message).to.eq('You are not authorized to access this route');
    }
  });

  it('should update the password, but ignore role change if the user is not an administrator', async () => {
    const token = await createTestUser(username, password);
    const userBeforeUpdate = await User.findOne({ username });
    const res = await got(url, {
      method,
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ password: 'newPassword', role: ROLES.Administrator })
    });
    const userAfterUpdate = await User.findOne({ username });
    expect(res.statusCode).to.eq(200);
    expect(userAfterUpdate).not.to.be.undefined;
    expect(userAfterUpdate.id).to.eq(userBeforeUpdate.id);
    expect(userAfterUpdate.username).to.eq(userBeforeUpdate.username);
    expect(userAfterUpdate.role).to.eq(ROLES.User);
    expect(userAfterUpdate.password).not.to.eq(userBeforeUpdate.password);
  });

  it('should update password and role if the updating user is an administrator', async () => {
    await createTestUser(username, password);
    const adminToken = await createTestUser('Admin', password, { admin: true });
    const userBeforeUpdate = await User.findOne({ username });
    const res = await got(url, {
      method,
      headers: {
        ...headers,
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ password: 'newPassword', role: ROLES.Administrator })
    });
    const body = JSON.parse(res.body);
    const userAfterUpdate = body.user;
    expect(res.statusCode).to.eq(200);
    expect(userAfterUpdate).not.to.be.undefined;
    expect(userAfterUpdate.id).to.eq(userBeforeUpdate.id);
    expect(userAfterUpdate.username).to.eq(userBeforeUpdate.username);
    expect(userAfterUpdate.role).to.eq(ROLES.Administrator);
    expect(userAfterUpdate.password).not.to.eq(userBeforeUpdate.password);
  });
});
