const CheckOutQueue = require("../models/checkoutQueueModel");
const User = require("../models/userModel");

exports.registerCheckoutEvents = async (socket) => {
  const { userId, role } = socket.user;

  socket.on("checkout:join", async ({ checkoutCode }) => {
    const checkoutDoc = await CheckOutQueue.findOne({
      checkoutCode,
      status: { $eq: "Pending" },
      expiresAt: { $lte: Date.now() },
    });

    if (!checkout) return;

    if (role === "user" && checkoutDoc.user.toString() !== userId) return;
    if (
      role === "checker" &&
      checkoutDoc.cashier &&
      checkoutDoc.cashier.toString() !== userId
    )
      return;

    socket.join(`checkout:${checkoutCode}`);

    socket.emit("checkout:state", {
      status: checkoutDoc.status,
      totals: checkoutDoc.totals,
      cashier: checkoutDoc.cashier.name,
    });
  });

  socket.on("checkout:sync", async ({ checkoutCode }) => {
    const checkout = await CheckOutQueue.findOne({ checkoutCode });
    if (!checkout) return;

    socket.emit("checkout:state", {
      status: checkout.status,
      totals: checkout.totals,
      cashier: checkout.cashier.name,
    });
  });
};
