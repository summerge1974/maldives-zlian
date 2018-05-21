const _ = require("lodash");

module.exports = class {
  constructor(ctrls) {
    const meta = {};
    _.each(ctrls, (ctrl, name) => {
      meta[name] = buildCtrlMeta(ctrl, name);
    });

    this.getCtrls = function() {
      return _.map(meta, (x, name) => new CtrlMeta(x, name));
    }
  }
};

class CtrlMeta {
  constructor(meta, name) {
    const keys = _.uniq(_.concat(cascadeMetaKeys, _.keys(meta)));
    _.each(_.filter(keys, x => x !== 'path'), key => {
      Object.defineProperty(this, key, {
        get: () => getFinalMetaValue(key, meta, defaultMeta)
      });
    });

    Object.defineProperty(this, 'fileName', {
      get: () => getCtrlFileName(name)
    });

    Object.defineProperty(this, 'path', {
      get: () => meta.path || `/${name}`
    });

    this.getActions = function() {
      return _.map(meta.actions, (x, name) => new ActionMeta(meta, x, name));
    };
  }  
}

class ActionMeta {
  constructor(ctrlMeta, meta, name) {
    const keys = _.uniq(_.concat(cascadeMetaKeys, _.keys(meta)));    
    _.each(_.filter(keys, x => x !== 'path'), key => {
      Object.defineProperty(this, key, {
        get: () => getFinalMetaValue(key, meta, ctrlMeta, defaultMeta)
      });
    });
    
    Object.defineProperty(this, 'path', {
      get: () => meta.path || `/${name}`
    });
  }
}

const cascadeMetaKeys = ["method", "public", "anonymous", "multipleBiz"];

const defaultMeta = {
  method: "post",
  public: true,
  anonymous: true
};

function buildCtrlMeta(ctrl, name) {
  const meta = _.extend({}, ctrl.meta);
  meta.name = name;

  meta.actions = {};
  const keys = _.filter(_.keys(ctrl), k => k !== "meta");
  _.each(keys, key => {
    meta.actions[key] = buildActionMeta(ctrl[key], key);
  });

  return meta;
}

function buildActionMeta(action, name) {
  const meta = _.extend({}, action.meta);
  meta.name = name;

  return meta;
}

function getFinalMetaValue(key, ...metas) {
  let value;
  _.each(_.reverse(metas), meta => {
    if (_.has(meta, key)) {
      value = meta[key];
    }
  });
  return value;
}

// 获取controller文件名
function getCtrlFileName(text) {
  if (!text) return text;
  return text.replace(/([A-Z])/g, g => '-' + g[0].toLowerCase());
}