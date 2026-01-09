const express = require("express");
const app = express();
const cors = require("cors");

const { product } = require("./routes/index");
const productModel = require("./models/productModel");

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//registered Routes
app.use("/api/v1", product);

module.exports = app;
