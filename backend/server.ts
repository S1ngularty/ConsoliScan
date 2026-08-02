import dotenv from "dotenv";
dotenv.config({ path: "./configs/.env" });
import app from "./app.js";
import http from "http";
// const initSocket = require("./initSocket");
// require("./configs/database")();

const server = http.createServer(app);

const port = Number(process.env.PORT) || 3000;

server.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
