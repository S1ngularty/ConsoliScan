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
  cart,
  order
} = require("./routes/index");
const productModel = require("./models/productModel");

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8081",
  "https://your-backend-name.onrender.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow mobile apps / Postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS not allowed"));
    },
    credentials: true,
  }),
);

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
app.use("/api/v1", cart);
app.use("/api/v1", order);

module.exports = app;
