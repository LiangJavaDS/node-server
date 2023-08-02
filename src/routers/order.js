const express = require('express')
var router = express.Router();
const { models } = require('../../models')
const { formatParam } = require('../utils/commonUtils')

router.post('/add', async (req, res, next) => {
    try {
        let data = await models[req.body.dbTable].create(req.body)
        res.send({
            data,
            message: '创建成功！'
        })
    } catch (error) {
        next(error)
    }
})

router.post('/search', async (req, res, next) => {
    try {
        let { param } = req.body
        let include = null
        formatParam(param)
        if (req.body.type === "orderMainList") {
            include = [
                {
                    model: models[req.body.dbTable + "_orderchats"],
                    as: "chatList"
                },
                {
                    model: models[req.body.dbTable + "_orderlikes"],
                    as: "orderlikes",
                    where: {
                        status: true
                    },
                    required: false
                },
                {
                    model: models.users,
                    as: req.body.dbTable + "publisherInfo"
                },
                {
                    model: models.users,
                    as: req.body.dbTable + "runnerInfo"
                }
            ]
        }
        if (req.body.type === "orderPageList") {
            include = [
                {
                    model: models[req.body.dbTable + "_chatlogs"],
                    as: "chatLogs"
                },
                {
                    model: models.users,
                    as: req.body.dbTable + "publisherInfo"
                },
                {
                    model: models.users,
                    as: req.body.dbTable + "runnerInfo"
                }
            ]
        }
        const data = await models[req.body.dbTable + "_orders"].findAll({
            include,
            where: param,
            order: [["id", "DESC"]],
            ...req.body.otherParam
        })
        res.send({
            data,
            message: '查询成功！'
        })
    } catch (error) {
        next(error)
    }
})

router.post('/update', async (req, res, next) => {
    try {
        let { searchParams, updateParams, dbTable } = req.body
        let data = await models[dbTable].update(updateParams, {
            where: searchParams
        })
        res.send({
            code: data[0],
            message: data[0] === 0 ? '修改失败！' : '修改成功！'
        })
    } catch (error) {
        next(error)
    }
})

module.exports = router