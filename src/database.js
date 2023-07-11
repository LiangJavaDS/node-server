const { Sequelize } = require('sequelize');
const dbConfig = require('../config/db');

const {
    dataBaseName,
    userName,
    password,
    host,
    dialect
} = dbConfig

const sequelize = new Sequelize(dataBaseName, userName, password, {
    host,
    dialect
});

module.exports = sequelize;
