const BigchainDB = require("bigchaindb-driver");

const keypair = new BigchainDB.Ed25519Keypair();

module.exports = {
  publicKey: keypair.publicKey,
  privateKey: keypair.privateKey.toString(),
};
