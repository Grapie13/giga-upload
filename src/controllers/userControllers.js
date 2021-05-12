'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { ROLES } = require('../utils/constants/roles');

async function getAllUsers(req, res) {
  const users = await User.find().select('-password');
  return res.status(200).json({ users });
}

async function createUser(req, res) {
  const user = await User.create(req.body);
  const tokenPayload = {
    id: user.id,
    username: user.username
  };
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });
  return res.status(201).json({ token });
}

async function updateUser(req, res) {
  const user = await User.findOne({ username: req.params.username });
  if (req.user.username !== user.username && req.user.role !== ROLES.Administrator) {
    return res.status(403).json({ message: 'You are not authorized to access this route' });
  }
  user.password = req.body.password ?? user.password;
  if (req.user.role === ROLES.Administrator) {
    user.role = req.body.role ?? user.role;
  }
  await user.save();
  return res.status(200).json({ user });
}

async function deleteUser(req, res) {
  if (req.user.username !== req.params.username && req.user.role !== ROLES.Administrator) {
    return res.status(403).json({ message: 'You are not authorized to access this route' });
  }
  await User.deleteOne({ username: req.params.username });
  return res.status(200).end();
}

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};
