const Exchange = require("../models/ExchangeModel");

exports.registerExchangeEvents = async (socket) => {
  // const { userId, role } = socket.user;

  socket.on("exchange:join", async ({ exchangeId }) => {
    const exchange = await Exchange.findById(exchangeId).lean();

    if (!exchange) {
      console.log(`[Exchange] Exchange not found for ID: ${exchangeId}`);
      return;
    }

    const roomName = `exchange:${exchangeId}`;
    socket.join(roomName);
    console.log(`[Exchange] Socket ${socket.id} joined room: ${roomName}`);

    socket.emit("exchange:state", {
      status: exchange.status,
      exchangeId: exchange._id,
      expiresAt: exchange.qrExpiresAt,
      originalItemId: exchange.originalItemId,
      price: exchange.price,
    });
  });

  socket.on("exchange:sync", async ({ exchangeId }) => {
    const exchange = await Exchange.findById(exchangeId).lean();
    if (!exchange) return;

    socket.emit("exchange:state", {
      status: exchange.status,
      exchangeId: exchange._id,
      expiresAt: exchange.qrExpiresAt,
      originalItemId: exchange.originalItemId,
      price: exchange.price,
    });
  });
};
