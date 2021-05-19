'use strict';

const { promises: fs } = require('fs');
const { File } = require('../models/File');
const { NotFoundError } = require('../errors/NotFoundError');

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
  return res.status(200).end();
}

module.exports = {
  getFile,
  getFiles,
  createFile,
  deleteFile
};
