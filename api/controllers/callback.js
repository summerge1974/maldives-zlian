const Callback = {
    meta: {
        summary: "接受第三方微信公众号消息与事件"
    }
};
var _ = require('underscore');
var needle = require('needle');


Callback.handle = async function(body, query, ctx) {
    console.log('------------------------');

    var notify_URL = JSON.parse(process.env.NOTIFY_URL_LIST);
    console.log(ctx.weixin);

    var find = _.find(notify_URL, function(item) {
        return item.realAppId == ctx.weixin.ToUserName;
    })
    if (!_.isUndefined(find)) {
        console.log(find.notifyUrl);

        return new Promise((resolve, reject) => {
            needle.post(encodeURI(find.notifyUrl + "appId=" + find.appId), ctx.weixin, {
                json: true
            }, function(error, resp) {
                console.log('------------request------------');
                if (error) {
                    console.log(error);
                    reject(error);
                } else {
                    console.log(resp.body);
                    resolve(resp.body);
                }
            });
        });

    } else {
        console.log('appid not find~~');
    }
    console.log('------------------------');


    // if (ctx.weixin.MsgType == 'text') {
    //     return {
    //         content: '我收到你的消息了，你说：' + ctx.weixin.Content,
    //         type: 'text'
    //     };
    // } else {
    //     return {
    //         content: '呵呵，没学会其他功能',
    //         type: 'text'
    //     };
    // }


    return;
};

Callback.handle.meta = {
    summary: "接受第三方微信公众号消息与事件",
    method: "post",
    path: "/handle/:appid",
    returns: {
        type: "number",
        description: "",
        example: 3
    }
};


var redisClient = require('../utils/redis_self');

Callback.getWechatToken = async function(body, query, ctx) {
    console.log('------------------------');
    console.log(query);

    return new Promise((resolve, reject) => {
        redisClient.get('wechat_access_token_list', function(err, ticket) {
            var _result = {
                "access_token": ""
            };
            var _list = JSON.parse(ticket);
            var find = _.find(_list.wechatList, function(fitem) {
                return query.appId == fitem.authorizer_appid
            })

            if (!_.isUndefined(find)) {

                _result.access_token = find.authorizer_access_token;
                resolve(_result);
            } else {
                reject(_result);
            }

        });
    });
};

Callback.getWechatToken.meta = {
    summary: "获取微信Token",
    method: "post",
    path: "/getWechatToken",
    returns: {
        type: "object",
        description: "",
        example: {
            "access_token": ""
        }
    }
};

module.exports = Callback;