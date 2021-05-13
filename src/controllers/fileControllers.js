'use strict';

const { promises: fs } = require('fs');
const { File } = require('../models/File');

async function getFiles(req, res) {
  const files = await File.find();
  return res.status(200).json({ files });
}

async function getFile(req, res) {
  const file = await File.find({ id: req.params.id });
  if (!file) {
    return res.status(404).json({ message: 'File not found' });
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
  file = await file.populate('User').execPopulate();
  return res.status(201).json({ file });
}

async function deleteFile(req, res) {
  const file = await File.findOne({ id: req.params.fileId });
  if (!file) {
    return res.status(404).json({ message: 'File not found' });
  }
  await fs.rm(file.path);
  await File.deleteOne({ id: req.params.fileId });
  return res.status(200).json({});
}

module.exports = {
  getFile,
  getFiles,
  createFile,
  deleteFile
};
