const BigchainDB = require("bigchaindb-driver");

const keypair = BigchainDB.Ed25519Keypair();

module.exports = {
  publicKey: keypair.publicKey.toString(),
  privateKey: keypair.privateKey.toString(),
};
