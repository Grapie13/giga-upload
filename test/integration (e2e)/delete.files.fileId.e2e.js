'use strict';

const { expect } = require('chai');
const got = require('got');
const mongoose = require('mongoose');
const { loadEnv } = require('./utils/loadEnv');
const { connectDb } = require('./utils/connectDb');
const { User } = require('../../src/models/User');
const { File } = require('../../src/models/File');
const { FailedTest } = require('../shared utils/FailedTest');
const { createTestUser } = require('./utils/createTestUser');
const { createTestFile } = require('./utils/createTestFile');
const { deleteAllFiles } = require('./utils/deleteAllFiles');

describe('DELETE /v1/files/:fileId', () => {
  const username = 'Tester';
  const password = 'password';
  const method = 'DELETE';
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

  it('should return a 404 status if the file does not exist', async () => {
    try {
      const token = await createTestUser(username, password);
      const fullUrl = `${url}/${new mongoose.Types.ObjectId().toString()}`;
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
      const fullUrl = `${url}/${new mongoose.Types.ObjectId().toString()}`;
      await got(fullUrl, {
        method,
      });
      throw new FailedTest();
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(403);
      expect(errors[0].message).to.eq('You are not authorized to access this route');
    }
  });

  it("should return a 403 status if the user is not a file's owner", async () => {
    try {
      const ownerToken = await createTestUser(username, password);
      const otherToken = await createTestUser('MaliciousUser', password);
      const file = await createTestFile(filename, ownerToken);
      const fullUrl = `${url}/${file.id.toString()}`;
      await got(fullUrl, {
        method,
        headers: {
          Authorization: `Bearer ${otherToken}`
        }
      });
      throw new FailedTest();
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(403);
      expect(errors[0].message).to.eq('You are not authorized to access this route');
    }
  });

  it('should delete a file', async () => {
    const token = await createTestUser(username, password);
    const file = await createTestFile(filename, token);
    const fullUrl = `${url}/${file.id.toString()}`;
    const res = await got(fullUrl, {
      method,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const { message } = JSON.parse(res.body);
    const fileFromDb = await File.findOne({ filename: file.filename });
    expect(res.statusCode).to.eq(200);
    expect(message).to.eq('File deleted successfully');
    expect(fileFromDb).to.be.null;
  });
});
