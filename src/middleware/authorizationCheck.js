'use strict';

const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

async function authorizationCheck(req, res, next) {
  const bearer = req.get('Authorization');
  if (!bearer) {
    return res.status(403).json({ message: 'No token' });
  }
  const splitToken = bearer.split(' ')[1];
  try {
    const payload = jwt.verify(splitToken, process.env.JWT_SECRET);
    req.user = await User.findOne({ username: payload.username });
    return next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid token' });
  }
}

module.exports = {
  authorizationCheck
};
