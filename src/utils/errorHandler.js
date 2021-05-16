'use strict';

function errorHandler(err, req, res, next) { // eslint-disable-line
  if (err.message === 'File already exists') {
    return res.status(400).json({ message: err.message });
  }
  return res.status(500).json({ message: err.toString() });
}

module.exports = {
  errorHandler
};
