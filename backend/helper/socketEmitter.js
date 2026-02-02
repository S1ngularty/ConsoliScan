let io = null;

exports.setSocketInstance = (instance) => {
  io = instance;
};

exports.emitCheckout = (checkoutCode, event, payload) => {
  console.log(`checkout:${checkoutCode}`)
  io.to(`checkout:${checkoutCode}`).emit(event, payload);
};
