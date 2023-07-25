const { Sequelize, DataTypes } = require('sequelize');
const env = process.env.NODE_ENV;
const config = require(__dirname + '/../config/config.json')[env];

const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: 'localhost',
    dialect: 'mysql'
});

const models = {}

const users = sequelize.define('users', {
    openid: {
        type: Sequelize.STRING,
        unique: true
    },
    unionid: {
        type: Sequelize.STRING,
        unique: true
    },
    serviceOpenid: {
        type: Sequelize.STRING,
        unique: true
    },
    avatarUrl: {
        type: Sequelize.STRING
    },
    gender: {
        type: Sequelize.STRING
    },
    nickName: {
        type: Sequelize.STRING
    },
    campus: {
        type: Sequelize.STRING
    },
    type: {
        type: Sequelize.STRING
    },
    phoneNumber: {
        type: Sequelize.STRING
    }
});

const campus = sequelize.define('campus', {
    name: {
        type: Sequelize.STRING
    },
    address: {
        type: Sequelize.STRING
    },
    code: {
        type: Sequelize.STRING
    }
});

const campussuggestions = sequelize.define('campussuggestions', {
    openid: {
        type: Sequelize.STRING
    },
    name: {
        type: Sequelize.STRING
    },
    sex: {
        type: Sequelize.STRING
    },
    age: {
        type: Sequelize.INTEGER
    },
    grade: {
        type: Sequelize.STRING
    },
    wxAccount: {
        type: Sequelize.STRING
    },
    qqAccount: {
        type: Sequelize.STRING
    },
    email: {
        type: Sequelize.STRING
    },
    campusName: {
        type: Sequelize.STRING
    },
    campusNature: {
        type: Sequelize.STRING
    },
    campusAddress: {
        type: Sequelize.STRING
    },
    isJoin: {
        type: Sequelize.STRING
    },
    desc: {
        type: Sequelize.STRING
    }
});

const sockets = sequelize.define('sockets', {
    openid: {
        type: Sequelize.STRING,
        unique: true
    },
    socketid: {
        type: Sequelize.STRING
    },
    type: {
        type: Sequelize.STRING
    },
    serverId: {
        type: Sequelize.STRING
    },
});

models.users = users
models.campus = campus
models.campussuggestions = campussuggestions
models.sockets = sockets

async function initTable(mark) {
    if (mark === "main") {
        users.sync()
        campus.sync()
        campussuggestions.sync()
        sockets.sync()
    }
    let campusArr = await models.campus.findAll()
    for (const item of campusArr) {
        changeModels(item.code, mark)
    }
}

function changeModels(dbTable, mark) {
    //订单表
    const table_orders = sequelize.define(dbTable + "_orders", {
        orderid: {
            type: Sequelize.STRING,
            unique: true
        },
        campus: {
            type: Sequelize.STRING
        },
        goodsName: {
            type: Sequelize.STRING
        },
        goodsAddress: {
            type: Sequelize.STRING
        },
        goodsPrice: {
            type: Sequelize.FLOAT
        },
        wxAccount: {
            type: Sequelize.STRING
        },
        qqAccount: {
            type: Sequelize.STRING
        },
        mobile: {
            type: Sequelize.STRING
        },
        selfAddress: {
            type: Sequelize.STRING
        },
        price: {
            type: Sequelize.FLOAT
        },
        photos: {
            type: Sequelize.STRING
        },
        desc: {
            type: Sequelize.STRING
        },
        publisherOpenid: {
            type: Sequelize.STRING
        },
        runnerOpenid: {
            type: Sequelize.STRING
        },
        status: {
            type: Sequelize.INTEGER
        },
    });
    models[dbTable + "_orders"] = table_orders
    //订单点赞表
    const table_orderlikes = sequelize.define(dbTable + "_orderlikes", {
        orderid: {
            type: Sequelize.STRING,
        },
        openid: {
            type: Sequelize.STRING
        },
        status: {
            type: Sequelize.BOOLEAN
        },
    });
    models[dbTable + "_orderlikes"] = table_orderlikes
    //订单打赏表
    const table_ordersupports = sequelize.define(dbTable + "_ordersupports", {
        orderid: {
            type: Sequelize.STRING
        },
        openid: {
            type: Sequelize.STRING
        },
        price: {
            type: Sequelize.FLOAT
        },
    });
    models[dbTable + "_ordersupports"] = table_ordersupports
    //订单评论表
    const table_orderchats = sequelize.define(dbTable + "_orderchats", {
        orderid: {
            type: Sequelize.STRING
        },
        fromOpenid: {
            type: Sequelize.STRING
        },
        fromName: {
            type: Sequelize.STRING
        },
        toOpenid: {
            type: Sequelize.STRING
        },
        toName: {
            type: Sequelize.STRING
        },
        content: {
            type: Sequelize.STRING
        },
    });
    models[dbTable + "_orderchats"] = table_orderchats
    //订单聊天记录表
    const table_chatlogs = sequelize.define(dbTable + "_chatlogs", {
        orderid: {
            type: Sequelize.STRING,
            unique: true
        },
        content: {
            type: Sequelize.TEXT
        },
    });
    models[dbTable + "_chatlogs"] = table_chatlogs

    table_orders.hasMany(table_orderchats, { sourceKey: "orderid", foreignKey: "orderid", as: "chatList" })
    table_orderchats.belongsTo(table_orders, { targetKey: "orderid", foreignKey: "orderid", as: "chatList" })

    table_orders.hasMany(table_orderlikes, { sourceKey: "orderid", foreignKey: "orderid", as: "orderlikes" })
    table_orderlikes.belongsTo(table_orders, { targetKey: "orderid", foreignKey: "orderid", as: "orderlikes" })

    table_orders.hasOne(models.users, { sourceKey: "publisherOpenid", foreignKey: "openid", as: dbTable + "publisherInfo" })
    models.users.belongsTo(table_orders, { targetKey: "publisherOpenid", foreignKey: "openid", as: dbTable + "publisherInfo" })
    table_orders.hasOne(models.users, { sourceKey: "runnerOpenid", foreignKey: "openid", as: dbTable + "runnerInfo" })
    models.users.belongsTo(table_orders, { targetKey: "runnerOpenid", foreignKey: "openid", as: dbTable + "runnerInfo" })

    table_orders.hasOne(table_chatlogs, { sourceKey: "orderid", foreignKey: "orderid", as: "chatLogs" })
    table_chatlogs.belongsTo(table_orders, { targetKey: "orderid", foreignKey: "orderid", as: "chatLogs" })
    if (mark === "main") {
        table_orders.sync()
        table_orderlikes.sync()
        table_ordersupports.sync()
        table_orderchats.sync()
        table_chatlogs.sync()
    }
}

module.exports = { models, changeModels, initTable };