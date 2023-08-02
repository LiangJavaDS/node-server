//web服务
const cluster = require('cluster');
const cpuNum = require('os').cpus().length;
const host = process.env.NODE_ENV == 'production' ? '0.0.0.0' : '127.0.0.1'
const bodyParser = require('body-parser')
const express = require('express')
const http = require('http')
const schedule = require("node-schedule");
const { getToken } = require("./utils/commonUtils")
const { Server } = require("socket.io");
const { changeModels, initTable, models } = require('../models')
const xmlparser = require('express-xml-bodyparser')
const socketFunc = require('./utils/socketUtils')

if (cluster.isMaster) {
    initTable("main")
    let workers = {}
    for (var i = 0; i < cpuNum; i++) {
        let worker = cluster.fork()
        workers[worker.id] = worker
    }
    //注意此处将来可能出现表未创建的错误
    getToken("miniProgram").then(res => {
        let miniProgramToken = res
        getToken("serviceAccount").then(res1 => {
            console.log("7878res1", res1)
            let serviceAccountToken = res1
            for (const key in workers) {
                workers[key].send({ type: "changeToken", miniProgramToken, serviceAccountToken })
            }
        })
    })
    cluster.on("message", (worker, message, handle) => {
        if (message.type === "webSocket") {
            workers[message.workerId].send({ type: "webSocket", msgData: message.msgData, socketid: message.socketid })
        }
        if (message.type === "changeModels") {
            changeModels(message.dbTable, "main")
            for (const key in workers) {
                workers[key].send({ type: "changeModels", dbTable: message.dbTable })
            }
        }
        if (message.type === "orderChange") {
            workers[message.workerId].send({ type: "orderChange", msgData: message.msgData, socketid: message.socketid })
        }
    })
    cluster.on('exit', (worker, code, signal) => {
        let newWorker = cluster.fork();
        workers[newWorker.id] = newWorker
        getToken("miniProgram").then(res => {
            let miniProgramToken = res
            getToken("serviceAccount").then(res1 => {
                let serviceAccountToken = res1
                newWorker.send({ type: "changeToken", miniProgramToken, serviceAccountToken })
            })
        })
    });
    const job = schedule.scheduleJob("0 0 */1 * * *", function () {
        getToken("miniProgram").then(res => {
            let miniProgramToken = res
            getToken("serviceAccount").then(res1 => {
                let serviceAccountToken = res1
                for (const key in workers) {
                    workers[key].send({ type: "changeToken", miniProgramToken, serviceAccountToken })
                }
            })
        })
    });
} else {
    const app = express()
    initTable("server")
    let workerId = cluster.worker.id
    process.on("message", (data) => {
        if (data.type === "changeToken") {
            app.set("miniProgramToken", data.miniProgramToken)
            app.set("serviceAccountToken", data.serviceAccountToken)
        }
        if (data.type === "webSocket") {
            io.sockets.sockets.get(data.socketid).emit("onMessage", { msgData: data.msgData })
        }
        if (data.type === "changeModels") {
            changeModels(data.dbTable, "server")
        }
        if (data.type === "orderChange") {
            io.sockets.sockets.get(data.socketid).emit("orderChange", { msgData: data.msgData })
        }
    })
    app.use(bodyParser.json())
    app.use(xmlparser())
    //业务逻辑
    app.use('/wx/txCos', require('./routers/txCos.js'))
    app.use('/wx/userInfo', require('./routers/userInfo.js'));
    app.use('/wx/campus', require('./routers/campus.js'));
    app.use('/wx/order', require('./routers/order.js'));
    app.use('/wx/chatLogs', require('./routers/chatLogs'));
    app.use('/wx/wxApi', require('./routers/wxApi'));
    app.use('/wx/orderOpration', require('./routers/orderOpration'));

    //上线测试
    app.get('/wx/test', async (req, res, next) => {
        try {
            res.send({
                env: process.env.NODE_ENV,
                message: '上线测试成功！'
            })
        } catch (error) {
            next(error)
        }
    })
    app.use((err, req, res, next) => {
        if (err) {
            res.status(500).json({
                message: err.message
            })
        }
    })

    const server = http.createServer(app);
    const io = new Server(server);
    io.on('connection', (socket) => {
        socket.on("userData", async (data) => {
            let findData = await models.sockets.findOne({
                where: { openid: data.openid }
            })
            if (findData) {
                await models.sockets.update({ socketid: data.socketid, type: data.type, serverId: workerId }, {
                    where: { openid: data.openid }
                })
            } else {
                await models.sockets.create({ ...data, serverId: workerId })
            }
        });
        socket.on("isChatLogTable", async (data) => {
            let findChatLog = await models[data.dbTable].findOne({
                where: { orderid: data.orderid }
            })
            if (findChatLog) {
                socket.emit("getAllChatLog", { allChatLog: JSON.parse(findChatLog.content) })
            } else {
                await models[data.dbTable].create({ orderid: data.orderid, content: "[]" })
            }
        })
        socket.on('sendMessage', async (data) => {
            let findData = await models.sockets.findOne({
                where: { openid: data.toopenid }
            })
            if (findData && findData.type === "1") {
                process.send({ type: "webSocket", workerId: findData.serverId, socketid: findData.socketid, msgData: data.msgData })
                // socket.to(findData.socketid).emit("onMessage", { msgData: data.msgData })
            } else {
                console.log('9898走公众号')
            }
            let findChatLog = await models[data.dbTable].findOne({
                where: { orderid: data.msgData.orderid }
            })
            let newContentArr = JSON.parse(findChatLog.content)
            newContentArr.push(data.msgData)
            let newContentStr = JSON.stringify(newContentArr)
            await models[data.dbTable].update({ content: newContentStr }, {
                where: { orderid: data.msgData.orderid }
            })
        })
        socket.on('orderChange', async (data) => {
            socketFunc.orderChange(socket, data, app.get('serviceAccountToken'))
        })
        socket.on('disconnect', async (data) => {
            await models.sockets.update({ type: "2" }, {
                where: { socketid: socket.id }
            })
        })
    });
    server.listen(8087, host)
}


//配置nodemon
// 1、npm install nodemon -D
// 2、修改 package.json 中的启动命令