'use strict';

const mongoose = require('mongoose');
const { hashPassword, comparePasswords } = require('../utils/passwordUtils');
const { ROLES } = require('../utils/constants/roles');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  role: {
    type: String,
    default: ROLES.User
  },
  password: {
    type: String,
    required: true
  }
}, {
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id; // eslint-disable-line
      delete ret._id; // eslint-disable-line
      delete ret.__v; // eslint-disable-line
    }
  }
});

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    const password = this.get('password');
    const hashedPassword = await hashPassword(password);
    this.set('password', hashedPassword);
  }
});

userSchema.methods.comparePasswords = async function (comparedPassword) {
  return comparePasswords(comparedPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = {
  User
};
