const BigchainDB = require("bigchaindb-driver");

const conn = new BigchainDB.Connection("http://localhost:9984/api/v1/");

module.exports = conn;
