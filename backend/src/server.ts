import path from "path";
import dotenv from "dotenv";

// Force dotenv to always look at the project root folder execution context
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const { default: app } = await import("./app.js");
import http from "http";
import connectToDatabase from "./core/configs/database.js";
// const initSocket = require("./initSocket");
connectToDatabase();
const server = http.createServer(app);

const port = Number(process.env.PORT) || 3000;

server.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
