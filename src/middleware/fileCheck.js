'use strict';

const path = require('path');
const fs = require('fs');
const Busboy = require('busboy');

function fileCheck(req, res, next) {
  const uploadPath = path.join(__dirname, '../../uploads');

  fs.stat(uploadPath, err => {
    if (err) {
      if (err.code !== 'ENOENT') {
        next(err);
      }
      fs.mkdirSync(uploadPath);
    }
  });

  req.body = Object.create(null);

  const bboy = new Busboy({ headers: req.headers });
  bboy.on('file', async (fieldname, fileStream, filename, encoding, mimetype) => {
    const filePath = path.join(__dirname, `../../uploads/${filename}`);
    req.file = {
      fieldname, filePath, filename, encoding, mimetype
    };
    fileStream.pipe(fs.createWriteStream(filePath));
  });
  bboy.on('field', (fieldname, val) => {
    req.body[fieldname] = val;
  });
  bboy.on('error', err => {
    req.unpipe(bboy);
    next(err);
  });
  bboy.on('finish', () => {
    req.unpipe(bboy);
    next();
  });
  req.pipe(bboy);
}

module.exports = {
  fileCheck
};
