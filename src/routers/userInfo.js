const express = require('express')
var router = express.Router();
const { models } = require('../../models')


router.post('/add', async(req, res, next) => {
    try {
        let data = await models.users.create(req.body)
        res.send({
            data,
            message: '创建成功！'
        })
    } catch (error) {
        next(error)
    }
})
router.post('/search', async(req, res, next) => {
    try {
        let data = await models.users.findOne({
            where: req.body
        })
        res.send({
            data,
            message: '查询成功！'
        })
    } catch (error) {
        next(error)
    }
})
router.post('/update', async(req, res, next) => {
    try {
        let { searchParams, updateParams } = req.body
        await models.users.update(updateParams,{
            where:searchParams
        })
        res.send({
            message: '修改成功！'
        })
    } catch (error) {
        next(error)
    }
})

module.exports = router