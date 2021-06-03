'use strict';

const fs = require('fs');

function checkIfDirExists(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, err => {
      if (err) {
        if (err.code !== 'ENOENT') {
          return reject(err);
        }
        fs.mkdirSync(path, { recursive: true });
      }
      return resolve();
    });
  });
}

module.exports = {
  checkIfDirExists
};
