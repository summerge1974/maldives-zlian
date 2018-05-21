const _ = require("lodash");
const requireAll = require("require.all");
const Router = require("koa-router");
const xmlParser = require("koa-xml-parser");

const Meta = require("./meta");
const ctrls = requireAll(__dirname + "/controllers");
const meta = new Meta(ctrls);
const exec = require("./exec");

module.exports = function(app) {
    const router = new Router();

    const config = {
        token: process.env.WECHAT_TOKEN,
        appid: process.env.APP_ID,
        appsecret: process.env.APP_SECRET,
        encodingAESKey: process.env.ENCODINGAESKEY
    };

    const wechat = require("./wechat");
    router.use("/auth/event", wechat(config).middleware());

    router.use('/callback/handle/:appid', wechat(config).middleware());

    const ctrls = meta.getCtrls();
    _.each(ctrls, ctrl => {
        const ctrlRouter = buildCtrlRouter(ctrl);
        router.use(ctrl.path, ctrlRouter.routes(), ctrlRouter.allowedMethods());
    });
    app.use(router.routes(), router.allowedMethods());
};

function buildCtrlRouter(ctrl) {
    const router = new Router();
    const actions = ctrl.getActions();

    _.each(actions, action => {
        if (action.public) {
            router[action.method](action.path, ctx => exec(ctrl, action, ctx));
        }
    });

    return router;
}