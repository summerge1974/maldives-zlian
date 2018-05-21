module.exports = function(app) {
  // 初始化路由
  require("./router")(app);
  // 初始化文档
  require("./docs")(app);



};