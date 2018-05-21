const Router = require("koa-router");

module.exports = function(app) {
  var router = new Router();
  router.head("/debug/health", ctx => (ctx.status = 200));
  router.get("/debug/health", ctx => (ctx.body = {}));
  app.use(router.routes(), router.allowedMethods());
};
