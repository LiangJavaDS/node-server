var express = require('express')
var fs = require('fs');
var router = express.Router();
var config = require('../../config/txCos.json')
var https = require('https');
var COS = require('cos-nodejs-sdk-v5');
var multer = require("multer");
var multerMiddleware = multer()  //实例化multer
var cos = new COS({
    SecretId: config.SecretId,
    SecretKey: config.SecretKey
});

router.post('/search', async (req, res, next) => {
    try {
        cos.getBucket({
            Bucket: 'runners-1307290574', /* 必须 */
            Region: 'ap-beijing',     /* 必须 */
            // Prefix: req.path,         /* 非必须 */
        }, function (err, data) {
            if (err) {
                res.send({
                    data: err,
                    message: '查询失败。。。'
                })
            } else {
                res.send({
                    data,
                    message: '查询成功！'
                })
            }
        });
    } catch (error) {
        next(error)
    }
})

router.post('/upload', multerMiddleware.single('file'), async (req, res, next) => {
    try {
        cos.putObject({
            Bucket: 'runners-1307290574', /* 填入您自己的存储桶，必须字段 */
            Region: 'ap-beijing',  /* 存储桶所在地域，例如ap-beijing，必须字段 */
            Key: req.body.folder + req.file.originalname,  /* 存储在桶里的对象键（例如1.jpg，a/b/test.txt），必须字段 */
            Body: Buffer.from(req.file.buffer), /* 必须 */
        }, function (err, data) {
            if (err) {
                res.send({
                    data: err,
                    message: '上传失败'
                })
            } else {
                res.send({
                    data,
                    message: '上传成功'
                })
            }
        });
    } catch (error) {
        next(error)
    }
})

router.post('/saveAvatar', function (req1, res1, next) {
    try {
        let url = req1.body.filePath
        var req = https.get(url, function (res) {
            var imgData = "";
            res.setEncoding("binary"); //一定要设置response的编码为binary否则会下载下来的图片打不开
            res.on("data", function (chunk) {
                imgData += chunk;
            });
            res.on("end", async function () {
                await cos.putObject({
                    Bucket: 'runners-1307290574', /* 填入您自己的存储桶，必须字段 */
                    Region: 'ap-beijing',  /* 存储桶所在地域，例如ap-beijing，必须字段 */
                    Key: req1.body.folder + req1.body.fileName,
                    Body: Buffer.from(imgData, "binary"), /* 必须 */
                }, function (err, data) {
                    if (err) {
                        res1.send({
                            data: err,
                            message: '失败！'
                        });
                    } else {
                        res1.send({
                            data: {
                                cloudPath: data.Location.replace("runners-1307290574.cos.ap-beijing.myqcloud.com",
                                    "https://static.runners.ink")
                            },
                            message: '成功！'
                        });
                    }
                });
            });
            res.on("error", function (err) {
                console.log("请求失败");
            });
        });
        req.on('error', function (err) {
            console.log("请求失败2" + err.message);
        });
    } catch (error) {
        next(error)
    }
});

module.exports = router