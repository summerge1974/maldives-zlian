const _ = require("lodash");
const requireAll = require("require.all");
const swaggerUi = require("koa2-swagger-ui");

const Meta = require("./meta");
const ctrls = requireAll(__dirname + "/controllers");
const meta = new Meta(ctrls);

module.exports = function(app) {
  const swaggerConfig = {
    title: "[Swagger] maldives",
    hideTopbar: true,
    routePrefix: "/docs",
    swaggerOptions: {
      docExpansion: "none",
      defaultModelsExpandDepth: 10,
      defaultModelExpandDepth: 10
    }
  };
  swaggerConfig.swaggerOptions.spec = buildSpec(meta);

  app.use(swaggerUi(swaggerConfig));
};

function buildSpec(meta) {
  const spec = {
    swagger: "2.0",
    info: {
      title: "maldives",
      version: "1.0.0"
    },
    basePath: "/",
    tags: [],
    paths: {},
    securityDefinitions: {
      auth: {
        type: "apiKey",
        name: "Authorization",
        in: "header"
      }
    }
  };

  const ctrls = meta.getCtrls();

  _.each(ctrls, ctrl => {
    const paths = buildCtrlSpec(spec, ctrl);

    if (_.keys(paths).length > 0) {
      _.extend(spec.paths, paths);
      spec.tags.push({
        name: ctrl.name,
        description: ctrl.summary
      });
    }
  });

  return spec;
}

function buildCtrlSpec(spec, ctrl) {
  const paths = {};

  const actions = ctrl.getActions();
  _.each(actions, action => {
    const actionPath = convertRouteParams(action.path);
    const path = `${ctrl.path}${actionPath}`;
    const actionSpec = buildActionSpec(ctrl, action);
    if (actionSpec) {
      paths[path] = actionSpec;
    }
  });

  return paths;
}

function buildActionSpec(ctrl, action) {
  if (!action.public) return null;

  return {
    [action.method]: {
      tags: [ctrl.name],
      summary: action.summary,
      parameters: buildParameterSpec(action),
      responses: buildResponseSpec(action),
      security: action.anonymous ? null : [{ auth: [] }]
    }
  };
}

function buildParameterSpec(action) {
  const spec = [];

  if (action.params) {
    spec.push({
      in: action.method === "get" ? "query" : "body",
      name: "params",
      required: true,
      schema: action.params
    });
  }

  buildRouteParams(action, spec);

  return spec;
}

function buildResponseSpec(action) {
  if (!action.returns) return {};

  const spec = {
    "200": {
      description: "",
      schema: action.returns
    }
  };

  return spec;
}

const routeParamRegex = /:([a-zA-Z_$][a-zA-Z_$0-9]*)/g;

function convertRouteParams(path) {
  return path.replace(routeParamRegex, "{$1}");
}

function buildRouteParams(action, spec) {
  const matches = action.path.match(routeParamRegex);
  _.each(matches, x => {
    spec.push({
      in: "path",
      name: x.substr(1),
      required: true,
      schema: { type: "string" }
    });
  });
}
