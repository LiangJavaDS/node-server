//首先加载express
const cluster = require('cluster');
const cpuNum = require('os').cpus().length;
const host = process.env.NODE_ENV == 'production' ? '0.0.0.0' : '127.0.0.1'
const bodyParser = require('body-parser')
const http = require('http')
const schedule = require('node-schedule')
const { getToken } = require("./utils/commonUtils")
const { Server } = require("socket.io")
const { changeModels, initTable, models } = require('../models')
const xmlparser = require('express-xml-bodyparser')
const socketFun = require('./utils/socketUtils')

if (cluster.isMaster) {
    initTable('main')
    let workers = {}
    for (let i = 0; i < cpuNum; i += 1) {
        const worker = cluster.fork()
        workers[worker.id] = worker
    }

    getToken("miniProgram").then(res => {
        const miniProgramToken = res
        getToken('serviceAccount').then(res1 => {
            const serviceAccountToken = res1
            for (const key in workers) {
                // 发送给主进程
                workers[key].send({
                    type: 'changeToken',
                    miniProgramToken,
                    serviceAccountToken
                })
            }
        })
    })

    const websocket = 'websocket'

    cluster.on('message', (worker, message, handle) => {
        if (message.type === websocket) {
            worker[message.workerId].send({ type: websocket, msgData: message.msgData, socketid: message.socketid })
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
        const newWorker = cluster.fork()
        workers[newWorker.id] = newWorker
        getToken('miniProgram').then(res => {
            const miniProgramToken = res
            getToken('serviceAccount').then(res1 => {
                const serviceAccountToken = res1
                newWorker.send({
                    type: 'changeToken',
                    miniProgramToken,
                    serviceAccountToken
                })
            })
        })
    })

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
    initTable('server')
    const workerId = cluster.worker.id
    process.on("message", (data) => {

        if (data.type === "changeToken") {
            app.set("miniProgramToken", data.miniProgramToken)
            app.set("serviceAccountToken", data.serviceAccountToken)
        }

        if (data.type === "wobSocket") {
            io.socket.sockets.get(data.socketid).emit("onMessage", { msgData: data.msgData })
        }

        if (data.type === "changeModels") {
            changeModels(data.dbTable, 'server')
        }

        if (data.type === "orderChange") {
            io.sockets.sockets.get(data.socketid).emit("orderChange", { msgData: data.msgData })
        }
    })

    app.use(bodyParser.json())
    app.use(xmlparser())
}
// const app = express()
//端口号
// const port = 3000
// const sequelize = require('./database');

// const User = require('../models');

// // 同步模型
// sequelize.sync()
//     .then(() => {
//         console.log('Models synchronized.');
//         // // 初始化创建数据
//         // User.create({
//         //     name: 'John Doe',
//         //     email: 'john@example.com',
//         //     password: 'password'
//         // })
//         //     .then(() => {
//         //         console.log('Data created.');
//         //     })
//         //     .catch((err) => {
//         //         console.log('Error creating data:', err);
//         //     });
//     })
//     .catch((err) => {
//         console.log('Error synchronizing models:', err);
//     });


// //这里仅列举发送GET请求
// app.get('/users', async (req, res) => {
//     try {
//         const users = await User.findAll();
//         console.log('7878users', users)
//         res.send(users);
//     } catch (err) {
//         console.log('Error getting users:', err);
//         res.status(500).send('Error getting users.');
//     }
// });

// app.listen(port, () => console.log('server is start,port is', port))
