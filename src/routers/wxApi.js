const express = require('express')
var router = express.Router();
var request = require('request');
var xmlreader = require("xmlreader");
var wxpay = require('../utils/wxpayUtils');
var serviceAccountConfig = require('../../config/serviceAccount.json')
var wxKeysConfig = require('../../config/wxKeysConfig.json');
var { serviceAccountCB, getServiceAccountUserInfo } = require('../utils/commonUtils')

//微信相关接口
//访问微信服务器获取用户信息
router.post('/getUeserInfoFromWx', async (req, res, next) => {
    try {
        request('https://api.weixin.qq.com/sns/jscode2session?appid=' + req.body.appid + '&secret=' + req.body.secret + '&js_code=' + req.body.js_code + '&grant_type=authorization_code', function (err, response, body) {
            if (!err && response.statusCode == 200) {
                res.send({
                    data: { ...JSON.parse(body), message: '获取成功！' }
                })
            }
        })
    } catch (error) {
        next(error)
    }
})

//微信支付
router.post("/wxPay", async (req, res) => {
    try {
        let out_trade_no = req.body.orderid
        let money = req.body.price
        let openid = req.body.openid
        let nonce_str = wxpay.createNonceStr();
        let timestamp = wxpay.createTimeStamp();
        let body = '测试微信支付';
        let total_fee = wxpay.getmoney(money);
        let spbill_create_ip = req.connection.remoteAddress; // 服务ip
        let trade_type = 'JSAPI' // 小程序： 'JSAPI'
        let sign = wxpay.paysignjsapi(wxKeysConfig.appid, openid, body, wxKeysConfig.mch_id, nonce_str, wxKeysConfig.notify_url, out_trade_no, spbill_create_ip, total_fee, trade_type, wxKeysConfig.mchkey)
        //组装xml数据
        var formData = "<xml>";
        formData += "<appid>" + wxKeysConfig.appid + "</appid>";
        formData += "<body><![CDATA[" + "测试微信支付" + "]]></body>";
        formData += "<mch_id>" + wxKeysConfig.mch_id + "</mch_id>";
        formData += "<nonce_str>" + nonce_str + "</nonce_str>";
        formData += "<notify_url>" + wxKeysConfig.notify_url + "</notify_url>";
        formData += "<openid>" + openid + "</openid>";
        formData += "<out_trade_no>" + out_trade_no + "</out_trade_no>";
        formData += "<spbill_create_ip>" + spbill_create_ip + "</spbill_create_ip>";
        formData += "<total_fee>" + total_fee + "</total_fee>";
        formData += "<trade_type>JSAPI</trade_type>";
        formData += "<sign>" + sign + "</sign>";
        formData += "</xml>";
        // 请求微信统一支付接口
        request({ url: wxKeysConfig.wxPayUrl, method: 'POST', body: formData }, function (err, response, body) {
            if (!err && response.statusCode == 200) {
                xmlreader.read(body.toString("utf-8"), function (errors, response) {
                    if (null !== errors) {
                        return;
                    }
                    var prepay_id = response.xml.prepay_id.text();
                    let package = "prepay_id=" + prepay_id;
                    let signType = "MD5";
                    let minisign = wxpay.paysignjsapix(wxKeysConfig.appid, nonce_str, package, signType, timestamp, wxKeysConfig.mchkey);
                    // 返回数据到前端
                    res.send({
                        status: '200',
                        data: {
                            'appId': wxKeysConfig.appid,
                            'mchid': wxKeysConfig.mch_id,
                            'prepayId': prepay_id,
                            'nonceStr': nonce_str,
                            'timeStamp': timestamp,
                            'package': package,
                            'paySign': minisign
                        }
                    });
                });
            }
        });
    } catch (error) {
        next(error)
    }
})

router.post('/wxPayResult', async (req, res, next) => {
    try {
        res.send({
            wxPayResult: req.body
        })
    } catch (error) {
        next(error)
    }
})
//获取token
router.post('/getToken', async (req, res, next) => {
    try {
        request(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${req.body.type === 'miniProgram' ? wxKeysConfig.appid : serviceAccountConfig.appid}&secret=${req.body.type === 'miniProgram' ? wxKeysConfig.appsecret : serviceAccountConfig.appsecret}`, function (err, response, body) {
            if (!err && response.statusCode == 200) {
                res.send({
                    data: { ...JSON.parse(body), message: '获取token成功！' }
                })
            }
        })
    } catch (error) {
        next(error)
    }
})

//获取手机号
router.post('/getPhoneNumber', async (req, res, next) => {
    try {
        request({
            url: `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${req.app.get('miniProgramToken')}`,
            method: "POST",
            json: true,
            headers: {
                "content-type": "application/json",
            },
            body: { code: req.body.code }
        }, function (err, response, body) {
            if (!err && response.statusCode == 200) {
                res.send({
                    data: { ...body, message: '获取手机号码成功！' }
                })
            }
        })
    } catch (error) {
        next(error)
    }
})
//公众号推送
router.get('/pushServiceAccount', async (req, res, next) => {
    try {
        res.end(req.query.echostr)
    } catch (error) {
        next(error)
    }
})

router.post('/pushServiceAccount', async (req, res, next) => {
    try {
        serviceAccountCB(req.body.xml,req.app.get('serviceAccountToken'))
        res.end("")
    } catch (error) {
        next(error)
    }
})

router.post('/getServiceUserInfo', async (req, res, next) => {
    try {
        let serviceAccountUserInfo = await getServiceAccountUserInfo(req.body.serviceOpenid,req.app.get('serviceAccountToken'))
        res.send({
            serviceAccountUserInfo,
            message: '查询成功！'
        })
    } catch (error) {
        next(error)
    }
})

module.exports = router