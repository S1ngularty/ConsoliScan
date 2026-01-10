const express = require("express");
const app = express();
const cors = require("cors");

const { product, auth, user } = require("./routes/index");
const productModel = require("./models/productModel");

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//registered Routes
app.use("/api/v1", product);
app.use("/api/v1", auth);
app.use("/api/v1", user);

module.exports = app;
