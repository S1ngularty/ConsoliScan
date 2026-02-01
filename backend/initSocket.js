const jwtToken = require("jsonwebtoken");
const { Server } = require("socket.io");
let io = null;

 const initSocket = (rawServer) => {
  io = new Server(rawServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT"],
    },
  });
  console.log("socket initialization is successful")
  io.use((socket, next) => {
   try {
     const token = socket.handshake.auth.token;
    const payload = jwtToken.verify(token, process.env.JWT_SECRET);
    if(!payload) return
    socket.user = payload;
    next();
   } catch (error) {
    console.error(error)
    next(new Error("Unauthorized"))
   }
  });

  io.on("connection", (socket) => {
    console.log("client id:", socket.id)
  });
};

module.exports = initSocket