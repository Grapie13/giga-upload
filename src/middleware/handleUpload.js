'use strict';

const path = require('path');
const { createWriteStream, stat, promises: { rm } } = require('fs');
const Busboy = require('busboy');
const { pipeline } = require('stream');
const { checkIfDirExists } = require('../utils/checkIfDirExists');

async function handleUpload(req, res, next) {
  const uploadPath = path.join(__dirname, `../../${process.env.UPLOAD_DIR}/${req.user.username}`);
  await checkIfDirExists(uploadPath);

  const busboy = new Busboy({ headers: req.headers });
  req.file = Object.create(null);

  function finish(err) {
    req.unpipe(busboy);
    return next(err);
  }

  function deleteFileAndFinish(err, failedUploadPath) {
    stat(failedUploadPath, async statErr => {
      if (!statErr) {
        await rm(failedUploadPath);
      }
      finish(err);
    });
  }

  busboy.on('file', async (fieldname, fileStream, filename, encoding, mimetype) => {
    const filePath = path.join(uploadPath, filename);
    fileStream.on('end', () => {
      req.file.filename = filename;
      req.file.filePath = filePath;
      req.file.encoding = encoding;
      req.file.mimetype = mimetype;
    });
    stat(filePath, statErr => {
      if (!statErr) {
        fileStream.resume();
        return res.status(400).json({ message: 'File already exists' });
      }
      return pipeline(fileStream, createWriteStream(filePath, { encoding: 'utf-8' }), pipelineErr => {
        if (pipelineErr) {
          return deleteFileAndFinish(pipelineErr, filePath);
        }
        return finish();
      });
    });
  });
  req.on('aborted', finish);
  busboy.on('error', finish);
  req.pipe(busboy);
}

module.exports = {
  handleUpload
};
