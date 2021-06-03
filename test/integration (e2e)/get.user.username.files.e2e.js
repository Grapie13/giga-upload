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

describe('GET /v1/users/:username/files', () => {
  const username = 'Tester';
  const password = 'password';
  const filename = 'test_file.jpg';
  const method = 'GET';

  let url;

  before(async () => {
    loadEnv();
    await connectDb();
    url = `http://${process.env.APP_HOSTNAME}:${process.env.APP_PORT}/v1/users/${username}/files`;
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

  it('should return a 403 status if the user is not the owner of the account', async () => {
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

  it("should return a list of user's files", async () => {
    const token = await createTestUser(username, password);
    await createTestFile(filename, token);
    const res = await got(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const { files } = JSON.parse(res.body);
    expect(files).not.to.be.undefined;
    expect(files.length).to.eq(1);
    expect(files[0].filename).to.eq(filename);
  });
});
