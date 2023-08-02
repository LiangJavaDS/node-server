const express = require('express')
var router = express.Router();
const { models } = require('../../models')


router.post('/add', async (req, res, next) => {
    try {
        let data = await models.campus.create(req.body)
        process.send({ type: "changeModels", dbTable: req.body.code })
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
        let data = await models.campus.findAll()
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
        let { searchParams, updateParams } = req.body
        let findData = await models.campus.findOne({
            where: searchParams
        })
        if (findData) {
            let data = await userInfo.update(updateParams)
        }
        res.send({
            data,
            message: '修改成功！'
        })
    } catch (error) {
        next(error)
    }
})
router.post('/suggestion', async (req, res, next) => {
    try {
        let data = await models.campusSuggestions.create(req.body)
        res.send({
            data,
            message: '创建成功！'
        })
    } catch (error) {
        next(error)
    }
})

module.exports = router