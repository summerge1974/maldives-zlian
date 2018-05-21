const _ = require("lodash");
const dotenv = require("dotenv");
const requireAll = require("require.all");
const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const cors = require("@koa/cors");
const koaStatic = require("koa-static");

dotenv.config({
    path: "./config/.env"
});

const app = new Koa();
app.use(bodyParser());
app.use(cors({
    credentials: true
}));

// 静态文件和前端
app.use(koaStatic("static"));

// 健康检查
require("./health-check")(app);

// 初始化API
require("./api/init")(app);

const config = require("./config/config");
app.listen(config.port, config.host, () =>
    console.log(`[berlin] app started on port ${config.host}:${config.port}/docs`)
);