const { createLogger, transports, format } = require('winston');

const logger = createLogger({
  format: format.combine(format.timestamp(), format.colorize(), format.simple()),
  transports: [new transports.Console()],
});

module.exports = { logger };