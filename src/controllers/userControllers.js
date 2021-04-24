'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

async function createUser(req, res) {
  const user = await User.create(req.body);
  const tokenPayload = {
    id: user.id,
    username: user.username
  };
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });

  res.status(201).json({ token });
}

module.exports = {
  createUser
};
