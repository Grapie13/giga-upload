'use strict';

const { User } = require('../models/User');

async function userExistsCheck(req, res, next) {
  const username = req.params.username ?? req.body.username;
  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }
  const user = await User.findOne({ username });
  if (!user) {
    return res.status(404).json({ message: 'User does not exist' });
  }
  return next();
}

module.exports = {
  userExistsCheck
};
