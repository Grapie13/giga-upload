'use strict';

const { expect } = require('chai');
const got = require('got');
const mongoose = require('mongoose');
const { createReadStream } = require('fs');
const { join } = require('path');
const FormData = require('form-data');
const { loadEnv } = require('./utils/loadEnv');
const { connectDb } = require('./utils/connectDb');
const { User } = require('../../src/models/User');
const { FailedTest } = require('../shared utils/FailedTest');
const { createTestUser } = require('./utils/createTestUser');
const { createTestFile } = require('./utils/createTestFile');
const { deleteAllFiles } = require('./utils/deleteAllFiles');

describe('POST /v1/files', () => {
  const username = 'Tester';
  const password = 'password';
  const method = 'POST';
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

  function createFormData() {
    const formData = new FormData();
    formData.append('file', createReadStream(join(__dirname, `../../${filename}`)), filename);
    return formData;
  }

  it('should return a 403 status if the user is not authenticated', async () => {
    try {
      const formData = createFormData();
      await got(url, {
        method,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`
        },
        body: formData
      });
      throw new FailedTest();
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(403);
      expect(errors[0].message).to.eq('You are not authorized to access this route');
    }
  });

  it('should return a 400 status if the file already exists on the server', async () => {
    try {
      const token = await createTestUser(username, password);
      await createTestFile(filename, token);
      const formData = createFormData();
      await got(url, {
        method,
        headers: {
          'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      throw new FailedTest();
    } catch (err) {
      const { errors } = JSON.parse(err.body);
      expect(err.statusCode).to.eq(400);
      expect(errors[0].message).to.eq('File already exists on the server');
    }
  });

  it('should create a new file', async () => {
    const token = await createTestUser(username, password);
    const formData = createFormData();
    const res = await got(url, {
      method,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`,
        Authorization: `Bearer ${token}`
      },
      body: formData
    });
    const { file } = JSON.parse(res.body);
    expect(res.statusCode).to.eq(201);
    expect(file.filename).to.eq(filename);
    expect(file.owner.username).to.eq(username);
  });
});
