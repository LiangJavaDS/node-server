const express = require('express')
var router = express.Router();
const { models } = require('../../models')
const { formatParam } = require('../utils/commonUtils')

router.post('/add', async (req, res, next) => {
    try {
        let { param, dbTable } = req.body
        formatParam(param)
        let data = await models[dbTable].create(param)
        res.send({
            message: '操作成功！'
        })
    } catch (error) {
        next(error)
    }
})

router.post('/update', async (req, res, next) => {
    try {
        let { searchParams, updateParams, dbTable } = req.body
        let data = await models[dbTable].update(updateParams,{
            where:searchParams
        })
        res.send({
            message: '操作成功！'
        })
    } catch (error) {
        next(error)
    }
})

router.post('/search', async (req, res, next) => {
    try {
        let { param, dbTable } = req.body
        formatParam(param)
        let data = await models[dbTable].findAll({
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

router.post('/delete', async (req, res, next) => {
    try {
        let { param, dbTable } = req.body
        formatParam(param)
        let data = await models[dbTable].destroy({
            where: param
        })
        res.send({
            message: '删除成功！'
        })
    } catch (error) {
        next(error)
    }
})

router.post('/changeLikes', async (req, res, next) => {
    try {
        let { param, dbTable } = req.body
        let findData = await models[dbTable].findOne({
            where: param
        })
        if (findData) {
            let data = await models[dbTable].update({ status: true }, {
                where: param
            })
        } else {
            let data = await models[dbTable].create({ ...param, status: true })
        }
        res.send({
            message: '创建成功！'
        })
    } catch (error) {
        next(error)
    }
})

module.exports = router