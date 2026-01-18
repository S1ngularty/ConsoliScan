const product = require("./productRoute");
const auth = require("./authRoute");
const user = require("./userRoute");
const category = require("./categoryRoute")
const activityLogs = require("./activityLogsRoute")

module.exports = {
  product,
  auth,
  user,
  category,
  activityLogs
};
