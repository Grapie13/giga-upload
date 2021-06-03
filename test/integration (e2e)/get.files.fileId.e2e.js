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

describe('GET /v1/files/:fileId', () => {
  const username = 'Tester';
  const password = 'password';
  const filename = 'test_file.jpg';
  const method = 'GET';

  let url;

  before(async () => {
    loadEnv();
    await connectDb();
    url = `http://${process.env.APP_HOSTNAME}:${process.env.APP_PORT}/v1/files/`;
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

  it('should return a 404 status if the file does not exist', async () => {
    try {
      const adminToken = await createTestUser(username, password, { admin: true });
      const fullUrl = url + new mongoose.Types.ObjectId().toString();
      await got(fullUrl, {
        method,
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });
      throw new FailedTest();
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(404);
      expect(errors[0].message).to.eq('File not found');
    }
  });

  it('should return a 403 status if the user is not authenticated', async () => {
    try {
      const fullUrl = url + new mongoose.Types.ObjectId().toString();
      await got(fullUrl, {
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
      const userToken = await createTestUser(username, password);
      const file = await createTestFile(filename, userToken);
      const fullUrl = url + file.id.toString();
      await got(fullUrl, {
        method,
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      });
      throw new FailedTest();
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(403);
      expect(errors[0].message).to.eq('You are not authorized to access this route');
    }
  });

  it("should return a file's details", async () => {
    const adminToken = await createTestUser(username, password, { admin: true });
    const file = await createTestFile(filename, adminToken);
    const fullUrl = url + file.id.toString();
    const res = await got(fullUrl, {
      method,
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    const body = JSON.parse(res.body);
    const returnedFile = body.file;
    expect(res.statusCode).to.eq(200);
    expect(returnedFile).not.to.be.undefined;
    expect(returnedFile.filename).to.eq(filename);
  });
});
