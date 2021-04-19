'use strict';

const { transports, format, createLogger } = require('winston');

const { combine, printf } = format;
const formatTemplate = printf(({
  level, message, timestamp
}) => `[${new Date(timestamp).toLocaleString()}] ${level}: ${message}`);
const customFormat = combine(
  format.timestamp(),
  formatTemplate
);

const logger = createLogger({
  level: 'info',
  format: customFormat,
  transports: [
    new transports.File({ filename: 'logs/errors.log', level: 'error' }),
    new transports.File({ filename: 'logs/all.log' })
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new transports.Console({
    format: customFormat
  }));
}

module.exports = {
  logger
};
