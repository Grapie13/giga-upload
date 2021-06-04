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

describe('GET /v1/files/:fileId/download', () => {
  const username = 'Tester';
  const password = 'password';
  const method = 'GET';
  const filename = 'test_file.jpg';

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

  it('should return a 404 status if the file does not exist', async () => {
    try {
      const token = await createTestUser(username, password);
      const fullUrl = `${url}/${new mongoose.Types.ObjectId().toString()}/download`;
      await got(fullUrl, {
        method,
        headers: {
          Authorization: `Bearer ${token}`
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
      const token = await createTestUser(username, password);
      const file = await createTestFile(filename, token);
      const fullUrl = `${url}/${file.id.toString()}/download`;
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

  it('should return a file stream', async () => {
    const token = await createTestUser(username, password);
    const file = await createTestFile(filename, token);
    const fullUrl = `${url}/${file.id.toString()}/download`;
    const res = await got(fullUrl, {
      method,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    res.resume();
    expect(res.statusCode).to.eq(200);
    expect(res.headers['content-type']).to.eq('application/octet-stream');
    expect(res.headers['content-disposition']).to.eq(`attachment; filename=${filename}`);
  });
});
