const log4js = require("log4js");

log4js.configure("./config/log4js.json");

const logger = log4js.getLogger(process.env.ENVIRONMENT);

module.exports = logger;
