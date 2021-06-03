'use strict';

const { stat, createReadStream, promises: fs } = require('fs');
const { pipeline } = require('stream');
const { File } = require('../models/File');
const { NotFoundError } = require('../errors/NotFoundError');
const { ForbiddenError } = require('../errors/ForbiddenError');
const { ROLES } = require('../utils/constants/roles');
const { logger } = require('../logger');
const { User } = require('../models/User');

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
  const user = await User.findOne({ username: req.params.username });
  if (!user) {
    throw new NotFoundError('A user with that username does not exist');
  }
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

async function downloadFile(req, res) {
  const file = await File.findOne({ _id: req.params.fileId });
  if (!file) {
    throw new NotFoundError('File not found');
  }
  stat(file.path, statErr => {
    if (statErr) {
      throw statErr;
    }
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename=${file.filename}`
    });
    pipeline(createReadStream(file.path), res, pipelineErr => {
      if (pipelineErr) {
        throw pipelineErr;
      }
    });
  });
}

async function deleteFile(req, res) {
  const file = await File.findOne({ _id: req.params.fileId }).exec();
  if (!file) {
    throw new NotFoundError('File not found');
  }
  await fs.rm(file.path).catch(err => {
    if (err.code !== 'ENOENT') {
      throw err;
    }
    logger.log('warn', `A database entry existed for ${file.path} while the file did not. Deleting entry.`);
  });
  await File.deleteOne({ _id: req.params.fileId }).exec();
  return res.status(200).json({ message: 'File deleted successfully' });
}

module.exports = {
  getFile,
  getFiles,
  getUserFiles,
  createFile,
  downloadFile,
  deleteFile
};
