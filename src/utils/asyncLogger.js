'use strict';

const { logger } = require('../logger');

function asyncLogger(level, message) {
  return new Promise((resolve, reject) => {
    let messageCopy = message;
    if (typeof messageCopy !== 'string' || !(messageCopy instanceof String)) {
      messageCopy = JSON.stringify(messageCopy);
    }
    logger.log(level, messageCopy, err => {
      if (err) {
        return reject(err);
      }
      return resolve();
    });
  });
}

module.exports = {
  asyncLogger
};
