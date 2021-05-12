'use strict';

const path = require('path');
const { createWriteStream, stat, promises: fs } = require('fs');
const Busboy = require('busboy');
const { pipeline } = require('stream');
const { checkIfDirExists } = require('../utils/checkIfDirExists');

async function handleUpload(req, res, next) {
  const uploadPath = path.join(__dirname, `../../${process.env.UPLOAD_DIR}`);
  await checkIfDirExists(uploadPath);

  const bboy = new Busboy({ headers: req.headers });

  function abort(err) {
    req.unpipe(bboy);
    res.status(413).json({ message: err.message });
  }

  function finish() {
    req.unpipe(bboy);
    next();
  }

  function deleteFileAndAbort(err, failedUploadPath) {
    stat(failedUploadPath, async statErr => {
      if (!statErr) {
        await fs.rm(failedUploadPath);
      }
    });
    abort(err);
  }

  bboy.on('file', (fieldname, fileStream, filename, encoding, mimetype) => {
    const filePath = path.join(uploadPath, filename);
    fileStream.on('end', () => {
      req.file = {
        filename,
        filePath,
        encoding,
        mimetype
      };
    });
    pipeline(fileStream, createWriteStream(filePath), pipelineErr => {
      if (pipelineErr) {
        deleteFileAndAbort(pipelineErr, filePath);
      }
    });
  });
  req.on('aborted', abort);
  bboy.on('error', abort);
  bboy.on('finish', finish);
  req.pipe(bboy);
}

module.exports = {
  handleUpload
};
