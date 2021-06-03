'use strict';

const { expect } = require('chai');
const got = require('got');
const mongoose = require('mongoose');
const { loadEnv } = require('./utils/loadEnv');
const { connectDb } = require('./utils/connectDb');
const { User } = require('../../src/models/User');
const { FailedTest } = require('../shared utils/FailedTest');
const { createTestUser } = require('./utils/createTestUser');
const { createTestFile } = require('./utils/createTestFile');
const { deleteAllFiles } = require('./utils/deleteAllFiles');

describe('GET /v1/files', () => {
  const username = 'Tester';
  const password = 'password';
  const method = 'GET';

  let url;

  before(async () => {
    loadEnv();
    await connectDb();
    url = `http://${process.env.APP_HOSTNAME}:${process.env.APP_PORT}/v1/files`;
  });

  beforeEach(async () => {
    await deleteAllFiles();
    await User.deleteMany({});
  });

  after(async () => {
    await deleteAllFiles();
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
      throw new FailedTest();
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(403);
      expect(errors[0].message).to.eq('You are not authorized to access this route');
    }
  });

  it('should return an array of all files', async () => {
    const adminToken = await createTestUser(username, password, { admin: true });
    await createTestFile('test_file.jpg', adminToken);
    const res = await got(url, {
      method,
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    const { files } = JSON.parse(res.body);
    expect(res.statusCode).to.eq(200);
    expect(files.length).to.eq(1);
    expect(files[0].filename).to.eq('test_file.jpg');
  });
});
