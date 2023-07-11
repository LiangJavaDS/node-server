//首先加载express
const express = require('express')
const app = express()
//端口号
const port = 3000
const sequelize = require('./database');

const User = require('../model/user');

// 同步模型
sequelize.sync()
    .then(() => {
        console.log('Models synchronized.');
        // // 初始化创建数据
        // User.create({
        //     name: 'John Doe',
        //     email: 'john@example.com',
        //     password: 'password'
        // })
        //     .then(() => {
        //         console.log('Data created.');
        //     })
        //     .catch((err) => {
        //         console.log('Error creating data:', err);
        //     });
    })
    .catch((err) => {
        console.log('Error synchronizing models:', err);
    });


//这里仅列举发送GET请求
app.get('/users', async (req, res) => {
    try {
        const users = await User.findAll();
        console.log('7878users', users)
        res.send(users);
    } catch (err) {
        console.log('Error getting users:', err);
        res.status(500).send('Error getting users.');
    }
});

app.listen(port, () => console.log('server is start,port is', port))
