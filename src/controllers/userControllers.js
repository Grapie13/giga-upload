'use strict';

const { User } = require('../models/User');
const { ROLES } = require('../utils/constants/roles');

async function getAllUsers(req, res) {
  const users = await User.find().select('-password');
  return res.status(200).json({ users });
}

async function getUser(req, res) {
  const user = await User.findOne({ username: req.params.username }).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (req.user.username !== user.username && req.user.role !== ROLES.Administrator) {
    return res.status(403).json({ message: 'You are not authorized to access this route' });
  }
  return res.status(200).json({ user });
}

async function createUser(req, res) {
  let user = await User.findOne({ username: req.body.username });
  if (user) {
    return res.status(400).json({ message: 'User already exists' });
  }
  user = await User.create(req.body);
  return res.status(201).json({ user });
}

async function updateUser(req, res) {
  const user = await User.findOne({ username: req.params.username });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
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
  const user = await User.findOne({ username: req.params.username });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  if (req.user.username !== req.params.username && req.user.role !== ROLES.Administrator) {
    return res.status(403).json({ message: 'You are not authorized to access this route' });
  }
  await User.deleteOne({ username: req.params.username });
  return res.status(200).end();
}

module.exports = {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
};
