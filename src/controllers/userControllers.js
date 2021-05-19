'use strict';

const { User } = require('../models/User');
const { ROLES } = require('../utils/constants/roles');
const { NotFoundError } = require('../errors/NotFoundError');
const { BadRequestError } = require('../errors/BadRequestError');
const { ForbiddenError } = require('../errors/ForbiddenError');

async function getAllUsers(req, res) {
  const users = await User.find().select('-password').exec();
  return res.status(200).json({ users });
}

async function getUser(req, res) {
  const user = await User.findOne({ username: req.params.username }).select('-password').exec();
  if (!user) {
    throw new NotFoundError('User not found');
  }
  if (req.user.username !== user.username && req.user.role !== ROLES.Administrator) {
    throw new ForbiddenError();
  }
  return res.status(200).json({ user });
}

async function createUser(req, res) {
  let user = await User.findOne({ username: req.body.username }).exec();
  if (user) {
    throw new BadRequestError('User already exists');
  }
  user = await User.create(req.body).exec();
  return res.status(201).json({ user });
}

async function updateUser(req, res) {
  const user = await User.findOne({ username: req.params.username }).exec();
  if (!user) {
    throw new NotFoundError('User not found');
  }
  if (req.user.username !== user.username && req.user.role !== ROLES.Administrator) {
    throw new ForbiddenError();
  }
  user.password = req.body.password ?? user.password;
  if (req.user.role === ROLES.Administrator) {
    user.role = req.body.role ?? user.role;
  }
  await user.save();
  return res.status(200).json({ user });
}

async function deleteUser(req, res) {
  const user = await User.findOne({ username: req.params.username }).exec();
  if (!user) {
    throw new NotFoundError('User not found');
  }
  if (req.user.username !== req.params.username && req.user.role !== ROLES.Administrator) {
    throw new ForbiddenError();
  }
  await User.deleteOne({ username: req.params.username }).exec();
  return res.status(200).json({ message: 'User deleted successfully' });
}

module.exports = {
  getAllUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
};
