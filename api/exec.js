const _ = require("lodash");

const logger = require("./utils/log");

module.exports = async function(ctrlMeta, actionMeta, ctx) {
  try {
    const ctrl = require(`./controllers/${ctrlMeta.fileName}`);

    if (!ctrl) {
      const error = new Error("Cannot find any implementation.");
      error.status = 404;
      throw error;
    }

    const action = ctrl[actionMeta.name];
    if (!_.isFunction(action)) {
      const error = new Error("Cannot find any implementation.");
      error.status = 404;
      throw error;
    }

    logger.info(`BEGIN: ${ctrlMeta.name}.${actionMeta.name}`);
    logger.debug("QUERY: " + JSON.stringify(ctx.query));
    logger.debug("BODY: " + JSON.stringify(ctx.request.body));

    const result = await action(ctx.request.body, ctx.query, ctx);

    logger.debug("RESULT: " + JSON.stringify(result));
    logger.info(`END: ${ctrlMeta.name}.${actionMeta.name}`);

    ctx.body = result;
  } catch (e) {
    const error = { message: e.message, stack: e.stack };
    logger.error('ERROR: ' + JSON.stringify(error));

    ctx.response.status = e.status || 500;
    ctx.body = error;
  }
};