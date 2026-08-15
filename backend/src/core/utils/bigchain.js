const BigchainDB = require("bigchaindb-driver");

const conn = new BigchainDB.Connection(`${process.env.BIG_CHAIN_URL}/api/v1/`);

module.exports = conn;
