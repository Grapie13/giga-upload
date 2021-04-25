'use strict';

const path = require('path');
const fs = require('fs');
const Busboy = require('busboy');
const { checkIfDirExists } = require('../utils/checkIfDirExists');

async function handleUpload(req, res, next) {
  const uploadPath = path.join(__dirname, '../../uploads');
  await checkIfDirExists(uploadPath);

  req.body = Object.create(null);

  const bboy = new Busboy({ headers: req.headers });
  bboy.on('file', async (fieldname, fileStream, filename, encoding, mimetype) => {
    const filePath = path.join(__dirname, `../../uploads/${filename}`);
    req.file = {
      filePath, filename, encoding, mimetype
    };
    fileStream.pipe(fs.createWriteStream(filePath));
  });
  bboy.on('error', err => {
    req.unpipe(bboy);
    return next(err);
  });
  bboy.on('finish', () => {
    req.unpipe(bboy);
    return next();
  });
  req.pipe(bboy);
}

module.exports = {
  handleUpload
};
