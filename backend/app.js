const express = require("express");
const app = express();
const cors = require("cors");
const cookieParser = require("cookie-parser");

const {
  product,
  auth,
  user,
  category,
  activityLogs,
  eligible,
} = require("./routes/index");
const productModel = require("./models/productModel");

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

//registered Routes
app.use("/api/v1", product);
app.use("/api/v1", auth);
app.use("/api/v1", user);
app.use("/api/v1", category);
app.use("/api/v1", activityLogs);
app.use("/api/v1", eligible);

module.exports = app;
