import dotenv from "dotenv";
dotenv.config({ path: "./core/configs/.env" });
import app from "./app.js";
import http from "http";
import connectToDatabase from "./core/configs/database.js";
// const initSocket = require("./initSocket");
connectToDatabase();
const server = http.createServer(app);

const port = Number(process.env.PORT) || 3000;

server.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
