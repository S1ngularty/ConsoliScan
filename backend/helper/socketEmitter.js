let io = null;

exports.setSocketInstance = (instance) => {
  io = instance;
};

exports.emitCheckout = (checkoutCode, event, payload) => {
  io.to(`checkout:${checkoutCode}`).emit(event, payload);
};
