'use strict';

const got = require('got');
const FormData = require('form-data');
const { createReadStream } = require('fs');
const { join } = require('path');

async function createTestFile(filename, authToken) {
  const formData = new FormData();
  formData.append('file', createReadStream(join(__dirname, `../../../${filename}`)), filename);
  const res = await got(`http://${process.env.APP_HOSTNAME}:${process.env.APP_PORT}/v1/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': `multipart/form-data; boundary=${formData.getBoundary()}`
    },
    body: formData
  });
  const { file } = JSON.parse(res.body);
  return file;
}

module.exports = {
  createTestFile
};
