'use strict';

const got = require('got');
const { User } = require('../../../src/models/User');
const { ROLES } = require('../../../src/utils/constants/roles');

async function createTestUser(username, password, opts = { admin: false }) {
  const res = await got(`http://${process.env.APP_HOSTNAME}:${process.env.APP_PORT}/v1/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ username, password })
  });
  if (opts.admin) {
    const user = await User.findOne({ username });
    user.role = ROLES.Administrator;
    await user.save();
  }
  return JSON.parse(res.body).token;
}

module.exports = {
  createTestUser
};
