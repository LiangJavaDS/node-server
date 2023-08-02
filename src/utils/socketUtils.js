const { models } = require('../../models')
var request = require('request');

async function orderChange(socket, data, access_token) {
    if (data.type === "sendOrder") {

    }
    if (data.type === "getOrder") {
        let userSocketData = await isOnline(data.publisherOpenid)
        if (userSocketData) {
            process.send({ type: "orderChange", workerId: userSocketData.serverId, socketid: userSocketData.socketid, msgData: data })
        }
        sendServiceAccountMsg(data,access_token,"run")
        sendServiceAccountMsg(data,access_token,"pub")
    }
    if (data.type === "cancelOrder") {

    }
}

function sendServiceAccountMsg(data, access_token, toUser) {
    request({
        url: `https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=${access_token}`,
        method: "POST",
        json: true,
        headers: {
            "content-type": "application/json",
        },
        body: {
            touser: toUser === "run" ? data.runnerServiceOpenid : data.publisherServiceOpenid,
            template_id: data.template_id,
            data: {
                first: { value: toUser === "run" ? "您已成功接收订单" : "您的订单已被接收" },
                keyword1: { value: data.orderid },
                keyword2: { value: data.goodsName },
                keyword3: { value: data.price + "元" },
                keyword4: { value: data.runnerName },
                remark: { value: "感谢您使用RunnersPub,期待与您的一同进步！" }
            }
        }
    })
}

async function isOnline(openid) {
    let userSocketData = await models.sockets.findOne({
        where: { openid }
    })
    if (userSocketData && userSocketData.type === "1") {
        return userSocketData
    } else {
        return false
    }
}

module.exports = { orderChange }