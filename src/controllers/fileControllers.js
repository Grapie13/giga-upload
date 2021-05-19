'use strict';

const { promises: fs } = require('fs');
const { File } = require('../models/File');
const { NotFoundError } = require('../errors/NotFoundError');
const { ForbiddenError } = require('../errors/ForbiddenError');
const { ROLES } = require('../utils/constants/roles');

async function getFiles(req, res) {
  const files = await File.find().populate('owner', '-password').exec();
  return res.status(200).json({ files });
}

async function getFile(req, res) {
  const file = await File.findOne({ _id: req.params.fileId }).populate('owner', '-password').exec();
  if (!file) {
    throw new NotFoundError('File not found');
  }
  return res.status(200).json({ file });
}

async function getUserFiles(req, res) {
  if (req.user.username !== req.params.username && req.user.role !== ROLES.Administrator) {
    throw new ForbiddenError();
  }
  const files = await File.find({ owner: req.user.id }).exec();
  return res.status(200).json({ files });
}

async function createFile(req, res) {
  let file = await File.create({
    owner: req.user.id,
    filename: req.file.filename,
    path: req.file.filePath,
    encoding: req.file.encoding,
    mimetype: req.file.mimetype
  });
  file = await file.populate('owner', '-password').execPopulate();
  return res.status(201).json({ file });
}

async function deleteFile(req, res) {
  const file = await File.findOne({ _id: req.params.fileId }).exec();
  if (!file) {
    throw new NotFoundError('File not found');
  }
  await fs.rm(file.path);
  await File.deleteOne({ _id: req.params.fileId }).exec();
  return res.status(200).json({ message: 'File deleted successfully' });
}

module.exports = {
  getFile,
  getFiles,
  getUserFiles,
  createFile,
  deleteFile
};
