const Auth = {
    meta: {
        summary: "接受第三方微信公众号授权"
    }
};

const config = {
    token: process.env.WECHAT_TOKEN,
    appid: process.env.APP_ID,
    appsecret: process.env.APP_SECRET,
    encodingAESKey: process.env.ENCODINGAESKEY
};

//
var _ = require('underscore');
var redisClient = require('../utils/redis_self');

var WXAuth = require('wechat-auth');
/*
 * 获取全局moss_verify_ticket的方法
 * 从redis缓存中读取
 */
var getVerifyTicket = function(callback) {
    return redisClient.get('moss_verify_ticket', function(err, ticket) {
        console.log('--------getVerifyTicket--------');
        if (err) {
            return callback(err);
        } else if (!ticket) {
            return callback(new Error('no moss_verify_ticket'));
        } else {
            return callback(null, ticket);
        }
    });
};

/*
 * 获取全局moss_access_token的方法
 * 从redis缓存中读取
 */
var getComponentToken = function(callback) {
    return redisClient.get('moss_access_token', function(err, token) {
        console.log('--------getComponentToken--------');
        if (err) {
            return callback(err);
        } else {
            return callback(null, JSON.parse(token));
        }
    });
};

/*
 * 保存moss_access_token到redis中
 */
var saveComponentToken = function(token, callback) {

    return redisClient.setex('moss_access_token', 7000, JSON.stringify(token), function(err, reply) {
        console.log('--------saveComponentToken--------');
        if (err) {
            callback(err);
        }
        return callback(null);
    });
};

/**
 * 保存推送的 moss_verify_ticket redis 缓存中， 每隔10分钟推送一次
 */
var wxauth = new WXAuth(config.appid, config.appsecret, getVerifyTicket, getComponentToken, saveComponentToken);

class cwechatAccessToken {
    constructor() {
        redisClient.get('wechat_access_token_list', function(err, ticket) {
            if (!ticket) {
                var _list = {};
                _list.wechatList = [];
                redisClient.setex('wechat_access_token_list', 7000, JSON.stringify(_list));
                redisClient.setex('wechat_access_token_lastrefershtime', 7000, new Date().getTime());
            } else {
                console.log(ticket);
            }
        });
    };

    refreshAuthToken() {

        const _this = this;
        redisClient.get('wechat_access_token_lastrefershtime', function(err, lasttime) {

            if ((new Date().getTime() - lasttime) / 1000 > 3600) {
                redisClient.setex('wechat_access_token_lastrefershtime', 7000, new Date().getTime());

                redisClient.get('wechat_access_token_list', function(err, ticket) {

                    var _list = JSON.parse(ticket);
                    console.log('--------refreshAuthToken--------');

                    _list.wechatList.forEach(function(item) {

                        if (!_.isUndefined(item.authorizer_appid)) {
                            wxauth.refreshAuthToken(item.authorizer_appid, item.authorizer_refresh_token, function(err, reply1) {
                                if (err) {
                                    console.log(err)
                                } else {
                                    reply1.authorizer_appid = item.authorizer_appid;
                                    console.log(reply1);
                                    _this.addTokenByRedis(reply1);
                                }

                            });
                        }

                    })
                });
            }

        });
    }

    addTokenByRedis(accessToken) {
        console.log('--------addTokenByRedis--------');
        redisClient.get('wechat_access_token_list', function(err, ticket) {

            var _list = JSON.parse(ticket);
            var find = _.find(_list.wechatList, function(fitem) {
                return fitem.authorizer_appid == accessToken.authorizer_appid
            })
            if (_.isUndefined(find)) {
                _list.wechatList.push(accessToken);
            } else {
                find.authorizer_refresh_token = accessToken.authorizer_refresh_token;
                find.authorizer_access_token = accessToken.authorizer_access_token;
            }
            redisClient.setex('wechat_access_token_list', 7000, JSON.stringify(_list));
        });
    }

    requestTokenByRedis(wechatApi) {
        console.log('--------requestTokenByRedis--------');
        return new Promise((resolve, reject) => {
            redisClient.get('wechat_access_token_list', function(err, ticket) {

                var _list = JSON.parse(ticket);

                var _wechat = null;
                _list.wechatList.forEach(function(item) {
                    if (item.authorizer_appid == wechatApi) {
                        _wechat = item;
                    }
                })
                resolve(_wechat);
            });
        });
    }
}

var WechatAPI = require('open-wechat-api');
var wechatAccessToken = new cwechatAccessToken();

const schedule = require("node-schedule");
const rule = new schedule.RecurrenceRule();
rule.second = 1;
schedule.scheduleJob(rule, () => wechatAccessToken.refreshAuthToken());

Auth.event = async function(eventInfo, query, ctx) {

    try {
        redisClient.setex('moss_verify_ticket', 7000, ctx.weixin.ComponentVerifyTicket);

        wxauth.getLatestComponentToken(function(err, token) {
            if (err) {
                console.log(err.message);
            } else {
                console.log('--------getLatestComponentToken--------');
                console.log(token);

            }
        });
    } catch (err) {
        console.log(err.message);
    }
    return 'success';
};

Auth.event.meta = {
    summary: "接受第三方微信公众号授权",
    params: {
        type: "object",
        properties: {
            eventInfo: {
                type: "number",
                description: "数1"
            }
        },
        example: {
            a: 1
        }
    },
    returns: {
        type: "string",
        description: "确认返回",
        example: 3
    }
};

Auth.regNewWechat = async function(params, query, ctx) {

    console.log('--------regNewWechat--------');
    console.log(query);
    wxauth.getPreAuthCode(function(err, reply) {
        console.log('--------getPreAuthCode--------');
        console.log(reply);

        wxauth.getAuthToken(query.auth_code, function(err, reply) {
            console.log('--------getAuthToken--------');
            console.log(reply);
            wechatAccessToken.addTokenByRedis(reply.authorization_info);
        });
    });
}

Auth.regNewWechat.meta = {
    summary: "接受第三方微信公众号授权",
    method: "get",
    returns: {
        type: "string",
        description: "确认返回",
        example: 3
    }
};

//https://mp.weixin.qq.com/safe/bindcomponent?action=bindcomponent&auth_type=3&no_scan=1&component_appid=wx10604e57b121749e&pre_auth_code=preauthcode@@@TOOgNq9Im45J3UqVhvAGYpfjVf_1JiACYYJ0-5Pfdks0fomXp1_fSRTO8IfoMxfo&redirect_uri=https://maldives.downtown8.cn/auth/regNewWechat&auth_type=3#wechat_redirect
Auth.reqRegUrl = async function() {
    return new Promise((resolve, reject) => {
        wxauth.getPreAuthCode(function(err, reply) {
            if (err) {
                reject(err)
            } else {
                console.log('--------getRegWechatURL--------');
                console.log(reply.pre_auth_code);
                var url = "https://mp.weixin.qq.com/safe/bindcomponent?action=bindcomponent&auth_type=3&no_scan=1&component_appid=" + process.env.APP_ID + "&pre_auth_code=" + reply.pre_auth_code + "&redirect_uri=https://maldives.downtown8.cn/auth/regNewWechat&auth_type=3#wechat_redirect"
                resolve(url);
            }

        });
    });
}

Auth.reqRegUrl.meta = {
    summary: "获取注册链接",
    method: "get",
    returns: {
        type: "string",
        description: "注册网址",
        example: 3
    }
};


Auth.getFollows = async function() {
    // var notify_URL = JSON.parse(process.env.NOTIFY_URL_LIST);
    

    // var find = _.find(notify_URL, function(item){
    //     return item.appId == 'gh_9d4c7f301157';
    // });

    return wechatAccessToken.requestTokenByRedis("wx5988fca57f1c50d8").then(function(reply) {

        var _item = {};
        _item.authorization_info = {};
        _item.authorization_info = reply;
        var api = new WechatAPI('wx5988fca57f1c50d8', reply);
        var _result = new Promise(function(resolve, reject) {
            api.getFollowers(function(err, result) {

                if (err) {
                    console.log(err);
                    reject(err);
                } else {
                    console.log(result.data);
                    resolve(result.data);
                }
            })
        })
        return _result;
    })

}
Auth.getFollows.meta = {
    summary: "测试能力",
    returns: {
        type: "object",
        description: "确认返回",
        example: {
            a: 1
        }
    }
};
module.exports = Auth;