const express = require('express')
var router = express.Router();
const { models } = require('../../models')
const { formatParam } = require('../utils/commonUtils')

router.post('/search', async (req, res, next) => {
    try {
        let { param } = req.body
        formatParam(param)
        let data = await models[req.body.dbTable].findAll({
            where: param
        })
        res.send({
            data,
            message: '查询成功！'
        })
    } catch (error) {
        next(error)
    }
})

module.exports = router