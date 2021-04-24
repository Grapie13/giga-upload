'use strict';

const bcrypt = require('bcrypt');

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function comparePasswords(comparedPassword, hashedPassword) {
  return bcrypt.compare(comparedPassword, hashedPassword);
}

module.exports = {
  hashPassword,
  comparePasswords
};
