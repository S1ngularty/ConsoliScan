const BigchainDB = require("bigchaindb-driver");

const conn = new BigchainDB.Connection(process.env.BIG_CHAIN_URL);

module.exports = conn;
