const Test = {
  meta: {
    summary: "测试"
  }
};


/*
   { AppId: 'wx10604e57b121749e',
     Encrypt: '4X6swIByoGrh13GFA91YCFtL2ee0Sgf4uhmDouUZc0PamzP7n3ri/wBtfnSXgSFOt80H1hEdNWKAjjd1vAhkJ5A73zTMcYMTvF1QD+7ODUNFyrX7lUoKXTWqIUiNeOZmi20P+ZbDAg5SIA7QvQuAaDGMe/0sesF0Gsuv0HsYmW8sIGZVJDsz4fUWcGtkrU70kVb0mi/ImdGDUmnu/zi03ClvBKN09kGvKYoPssPjTganxKqzt/JFynzUxyn2DoadiOqp/sLweM21KyheczmSqj8ezS7eZF8FJOswqXJHVYHwk3IkXdheG0wpwD0K5IMi5c6eKTh3IazlK3fWoMFcQjnx0aqYeJMG7dTaqfSwOytj52tMiYxid7IlJRNnbRA1zFwO6mGfHJA4fcMWnz+a+vy92NNKXSUI76qGVLCYAfFbWRLoom07343abCEATiUZ/Knrt2aL4zrGtCwErfWt/Q==' } 

{ signature: '74ae9da32b5cb0c3517dc3a7346306037f5ab059',
  timestamp: '1526291123',
  nonce: '758498639',
  encrypt_type: 'aes',
  msg_signature: '05fe041b65c9ae035fe6d94ebf18f81dde22b5d8' }
*/

var decrypt = function (key, iv, crypted) {
    crypted = new Buffer(crypted, 'base64').toString('binary');
    var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    var decoded = decipher.update(crypted, 'binary', 'utf8');
    decoded += decipher.final('utf8');
    return decoded;
};

var sha1 = require('sha1')
Test.add = async function({ a, b }) {

    var arr = [];
    arr.push('758498639');
    arr.push('downtown#2013');
    arr.push('1526291123');
 
    arr.sort();

    var dev_msg_signature=sha1(arr.join(''));

    console.log(dev_msg_signature);


  return a + b;
};

Test.add.meta = {
  summary: "做加法",
  params: {
    type: "object",
    properties: {
      a: { type: "number", description: "数1" },
      b: { type: "number", description: "数2" }
    },
    example: {
      a: 1,
      b: 2
    }
  },
  returns: {
    type: "number",
    description: "两个数的和",
    example: 3
  }
};

Test.minus = async function({}, ctx) {
  const { a, b } = ctx.params;
  return a - b;
};

Test.minus.meta = {
	summary: "做减法",
	method: 'get',
	path: "/minus/:a/:b",
  returns: {
    type: "number",
    description: "两个数的差",
    example: 3
  }
};

module.exports = Test;
