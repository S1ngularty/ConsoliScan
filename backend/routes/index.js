const product = require("./productRoute");
const auth = require("./authRoute");
const user = require("./userRoute");
const category = require("./categoryRoute")
const activityLogs = require("./activityLogsRoute")
const eligible = require("./eligibleRoute")
const cart = require("./cartRouter")
const checkoutQueue = require("./queueRoute")
const order = require("./orderRoutes")

module.exports = {
  product,
  auth,
  user,
  category,
  activityLogs,
  eligible,
  cart,
  order,
  checkoutQueue
};
