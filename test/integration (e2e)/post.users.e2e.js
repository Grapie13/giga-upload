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

describe('POST /v1/users', () => {
  const username = 'Tester';
  const password = 'password';
  const method = 'POST';
  const headers = {
    'Content-Type': 'application/json'
  };

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
        method,
        headers,
        body: JSON.stringify({ username, password })
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
      const token = await createTestUser('NotAnAdmin', password);
      await got(url, {
        method,
        headers: {
          ...headers,
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ username, password })
      });
      throw new FailedTest();
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(403);
      expect(errors[0].message).to.eq('You are not authorized to access this route');
    }
  });

  it('should return a 401 status if the username does not pass validation', async () => {
    const token = await createTestUser('Admin', password, { admin: true });

    try {
      await got(url, {
        method,
        headers: {
          ...headers,
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(401);
      expect(errors[0].field).to.eq('username');
    }

    try {
      await got(url, {
        method,
        headers: {
          ...headers,
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ username: 'a', password })
      });
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(401);
      expect(errors[0].field).to.eq('username');
    }

    try {
      await got(url, {
        method,
        headers: {
          ...headers,
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ username: 'ausernamethatstoolongtopassvalidation', password })
      });
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(401);
      expect(errors[0].field).to.eq('username');
    }
  });

  it('should return a 400 status if a user with that username already exists', async () => {
    try {
      const token = await createTestUser(username, password, { admin: true });
      await got(url, {
        method,
        headers: {
          ...headers,
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ username, password })
      });
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(400);
      expect(errors[0].message).to.eq('A user with that username already exists');
    }
  });

  it('should create a user and returns its details', async () => {
    const token = await createTestUser('Admin', password, { admin: true });
    const res = await got(url, {
      method,
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ username, password, role: ROLES.Administrator })
    });
    const { user } = JSON.parse(res.body);
    expect(res.statusCode).to.eq(201);
    expect(user).not.to.be.undefined;
    expect(user.username).to.eq(username);
    expect(user.password).not.to.eq(password);
    expect(user.role).to.eq(ROLES.Administrator);
  });
});
