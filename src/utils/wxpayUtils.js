const crypto = require('crypto');
const wxconfig = {
    //把金额转为分
    getmoney: function (money) {
        return parseFloat(money) * 100;
    },
    // 随机字符串产生函数  
    createNonceStr: function () {
        return Math.random().toString(36).substr(2, 15);
    },
    // 时间戳产生函数  
    createTimeStamp: function () {
        return parseInt(new Date().getTime() / 1000) + '';
    },
    //签名加密算法
    paysignjsapi: function (appid, openid, body, mch_id, nonce_str, notify_url, out_trade_no, spbill_create_ip, total_fee, trade_type, mchkey) {
        var ret = {
            appid: appid,
            mch_id: mch_id,
            nonce_str: nonce_str,
            body: body,
            notify_url: notify_url,
            openid: openid,
            out_trade_no: out_trade_no,
            spbill_create_ip: spbill_create_ip,
            total_fee: total_fee,
            trade_type: trade_type
        };
        var string = this.raw(ret);
        var key = mchkey;
        string = string + '&key=' + key;
        return crypto.createHash('md5').update(string, 'utf8').digest('hex').toUpperCase();
    },
    // 小程序签名
    paysignjsapix: function (appId, nonceStr, package, signType, timestamp, mchkey) {
        var ret = {
            appId: appId,
            nonceStr: nonceStr,
            package: package,
            signType: signType,
            timeStamp: timestamp,
        };
        var string = this.raw(ret);
        var key = mchkey;
        string = string + '&key=' + key;
        return crypto.createHash('md5').update(string, 'utf8').digest('hex').toUpperCase();
    },
    // 对象序列化，key=value&key1=value1
    raw(args) {
        var keys = Object.keys(args);
        keys = keys.sort()
        var newArgs = {};
        keys.forEach(function (key) {
            newArgs[key] = args[key];
        });
        var string = '';
        for (var k in newArgs) {
            string += '&' + k + '=' + newArgs[k];
        }
        string = string.substr(1);
        return string;
    }
}

module.exports = wxconfig

