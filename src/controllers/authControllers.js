'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

async function register(req, res) {
  let user = await User.findOne({ username: req.body.username });
  if (user) {
    return res.status(400).json({ message: 'User already exists' });
  }
  user = await User.create(req.body);
  const tokenPayload = {
    id: user.id,
    username: user.username
  };
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });
  return res.status(201).json({ token });
}

async function login(req, res) {
  const user = await User.findOne({ username: req.body.username });
  if (!user) {
    return res.status(400).json({ message: 'Invalid username or password' });
  }
  const validated = await user.comparePasswords(req.body.password);
  if (!validated) {
    return res.status(400).json({ message: 'Invalid username or password' });
  }
  const tokenPayload = {
    id: user.id,
    username: user.username
  };
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });
  return res.status(200).json({ token });
}

module.exports = {
  register,
  login
};
