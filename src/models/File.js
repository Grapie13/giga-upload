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
});

const File = mongoose.model('File', fileSchema);

module.exports = {
  File
};
