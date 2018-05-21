var redis = require("redis");
var redisClient = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_DOMAIN);
redisClient.auth(process.env.REDIS_AUTH);

redisClient.on("error", function(err) {
    console.log("Error :", err);
});
redisClient.on('connect', function() {
    console.log('Redis连接成功.');
})


async function get() {
    return new Promise((resolve, reject) => {
        redisClient.get('moss_access_token', function(err, token) {
            if (err ){
                reject(err)
            }else{
                resole(token);
            }
        });
    });
};

async function set() {
    return new Promise((resolve, reject) => {
        redisClient.setex('moss_access_token', 7000, JSON.stringify(token), function(err, reply) {
            if (err ){
                reject(err)
            }else{
                resole(reply);
            }
        });
    });
};

module.exports = redisClient;