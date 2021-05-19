'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models/User');
const { ForbiddenError } = require('../errors/ForbiddenError');

async function authorizationCheck(req, res, next) {
  const bearer = req.get('Authorization');
  if (!bearer) {
    return next(new ForbiddenError());
  }
  const splitToken = bearer.split(' ')[1];
  try {
    const payload = jwt.verify(splitToken, process.env.JWT_SECRET);
    req.user = await User.findOne({ username: payload.username });
    return next();
  } catch (err) {
    return next(new ForbiddenError());
  }
}

module.exports = {
  authorizationCheck
};
