'use strict';

const got = require('got');
const { createTestUser } = require('./createTestUser');

async function deleteAllFiles() {
  const adminToken = await createTestUser('CleanUp', 'password', { admin: true });
  const res = await got(`http://${process.env.APP_HOSTNAME}:${process.env.APP_PORT}/v1/files`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${adminToken}`
    }
  });
  const { files } = JSON.parse(res.body);
  for (const file of files) {
    await got(`http://${process.env.APP_HOSTNAME}:${process.env.APP_PORT}/v1/files/${file.id}`, { // eslint-disable-line
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
  }
}

module.exports = {
  deleteAllFiles
};
