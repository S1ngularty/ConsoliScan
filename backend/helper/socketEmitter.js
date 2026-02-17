let io = null;

exports.setSocketInstance = (instance) => {
  io = instance;
};

exports.emitCheckout = (checkoutCode, event, payload) => {
  console.log(`checkout:${checkoutCode}`);
  io.to(`checkout:${checkoutCode}`).emit(event, payload);
};

/* ── Emit directly to a room (for exchange events) ── */
exports.emitToRoom = (roomName, event, payload) => {
  console.log(`[Socket] Emitting ${event} to room: ${roomName}`);
  io.to(roomName).emit(event, payload);
};
