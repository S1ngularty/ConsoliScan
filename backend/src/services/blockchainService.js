const BigchainDB = require("bigchaindb-driver");
const crypto = require("crypto");

const conn = require("../utils/bigchain");
const keys = require("../utils/bigchainKey");

async function logConfirmedOrder(order) {
  const hashPayload = order;

  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(hashPayload))
    .digest("hex");

  const assetData = {
    type: "confirmed_order",
    orderId: order._id.toString(),
    finalAmountPaid: order.finalAmountPaid,
  };

  const metadata = {
    status: "CONFIRMED",
    confirmedAt: order.confirmedAt,
    hash,
  };

  const tx = BigchainDB.Transaction.makeCreateTransaction(
    assetData,
    metadata,
    [
      BigchainDB.Transaction.makeOutput(
        BigchainDB.Transaction.makeEd25519Condition(keys.publicKey),
      ),
    ],
    keys.publicKey,
  );

  const signedTx = BigchainDB.Transaction.signTransaction(tx, keys.privateKey);

  await conn.postTransactionCommit(signedTx);

  return {
    txId: signedTx.id,
    hash,
  };
}

async function logExchangeCompleted(exchangeData) {
  const hashPayload = exchangeData;

  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(hashPayload))
    .digest("hex");

  const assetData = {
    type: "exchange_completed",
    exchangeId: exchangeData.exchangeId.toString(),
    orderId: exchangeData.orderId.toString(),
    originalItemId: exchangeData.originalItemId.toString(),
    replacementItemId: exchangeData.replacementItemId.toString(),
    price: exchangeData.price,
  };

  const metadata = {
    status: "COMPLETED",
    completedAt: exchangeData.completedAt,
    hash,
  };

  const tx = BigchainDB.Transaction.makeCreateTransaction(
    assetData,
    metadata,
    [
      BigchainDB.Transaction.makeOutput(
        BigchainDB.Transaction.makeEd25519Condition(keys.publicKey),
      ),
    ],
    keys.publicKey,
  );

  const signedTx = BigchainDB.Transaction.signTransaction(tx, keys.privateKey);

  await conn.postTransactionCommit(signedTx);

  return {
    txId: signedTx.id,
    hash,
  };
}

module.exports = {
  logConfirmedOrder,
  logExchangeCompleted,
};
