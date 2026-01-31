const BigchainDB = require("bigchaindb-driver");
const crypto = require("crypto");

const conn = require("../utils/bigchain");
const keys = require("../utils/bigchainKey");


async function logConfirmedOrder(order) {
  const hashPayload = {
    orderId: order._id.toString(),
    user: order.user,
    items: order.items,
    baseAmount: order.baseAmount,
    groceryEligibleSubtotal: order.groceryEligibleSubtotal,
    weeklyCapRemainingAtCheckout: order.weeklyCapRemainingAtCheckout,
    seniorPwdDiscountAmount: order.seniorPwdDiscountAmount,
    pointsUsed: order.pointsUsed,
    finalAmountPaid: order.finalAmountPaid,
    pointsEarned: order.pointsEarned,
    confirmedAt: order.confirmedAt
  };

  const hash = crypto
    .createHash("sha256")
    .update(JSON.stringify(hashPayload))
    .digest("hex");

  const assetData = {
    type: "confirmed_order",
    orderId: order._id.toString(),
    finalAmountPaid: order.finalAmountPaid
  };

  const metadata = {
    status: "CONFIRMED",
    confirmedAt: order.confirmedAt,
    hash
  };

  const tx = BigchainDB.Transaction.makeCreateTransaction(
    assetData,
    metadata,
    [
      BigchainDB.Transaction.makeOutput(
        BigchainDB.Transaction.makeEd25519Condition(keys.publicKey)
      )
    ],
    keys.publicKey
  );

  const signedTx = BigchainDB.Transaction.signTransaction(
    tx,
    keys.privateKey
  );

  await conn.postTransactionCommit(signedTx);

  return {
    txId: signedTx.id,
    hash
  };
}

module.exports = {
  logConfirmedOrder
};
