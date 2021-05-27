'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { BadRequestError } = require('../errors/BadRequestError');
const { AuthorizationError } = require('../errors/AuthorizationError');

async function register(req, res) {
  let user = await User.findOne({ username: req.body.username }).exec();
  if (user) {
    throw new BadRequestError('A user with that username already exists');
  }
  user = await User.create(req.body).exec();
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
  const user = await User.findOne({ username: req.body.username }).exec();
  if (!user) {
    throw new AuthorizationError();
  }
  const validated = await user.comparePasswords(req.body.password);
  if (!validated) {
    throw new AuthorizationError();
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
