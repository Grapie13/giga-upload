'use strict';

const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true,
    unique: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  encoding: {
    type: String
  },
  mimetype: {
    type: String
  }
}, {
  toJSON: {
    transform(doc, ret) {
      ret.id = ret._id; // eslint-disable-line
      delete ret._id; // eslint-disable-line
      delete ret.__v; // eslint-disable-line
    }
  }
});

const File = mongoose.model('File', fileSchema);

module.exports = {
  File
};
