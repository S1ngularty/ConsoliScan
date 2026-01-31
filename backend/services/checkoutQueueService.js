const Queue = require("../models/checkoutQueueModel");
const crypto = require("crypto");

exports.checkout = async (request) => {
  if (!request.body) throw new Error("empty request content");
  const { userId } = request.user;
  const data = { ...request.body };
  console.log(request.body);
  const checkoutCode = `CHK-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const expiresAt = Date.now() + 10 * 60 * 1000;
  data.user = userId;
  data.checkoutCode = checkoutCode;
  data.expiresAt = expiresAt

//   const isQueue = await Queue.create({ ...data });

  return {
    checkoutCode,
    expiresAt
  };
};
