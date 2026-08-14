import user from "../modules/users/user.route.js";
import auth from "../modules/auth/auth.route.js";
import category from "../modules/category/category.route.js";
import product from "../modules/product/product.route.js";
import catalog from "../modules/catalog/catalog.route.js";

export default {
  user,
  auth,
  category,
  product,
  catalog
};

// const product = require("./productRoute");
// const auth = require("./authRoute");
// const user = require("./userRoute");
// const category = require("./categoryRoute");
// const activityLogs = require("./activityLogsRoute");
// const eligible = require("./eligibleRoute");
// const cart = require("./cartRouter");
// const checkoutQueue = require("./queueRoute");
// const order = require("./orderRoutes");
// const promo = require("./promoRoute");
// const loyalty = require("./loyaltyConfigRoute");
// const cashier = require("./cashierRoute");
// const adminDashboard = require("./adminDashboardRoute");
// const savedItems = require("./savedItemsRoute");
// const returns = require("./returnRoute");
// const expense = require("./expenseRoute");
// const supplier = require("./supplierRoute");
// const stockMovement = require("./stockMovementRoute");
// const purchaseOrder = require("./purchaseOrderRoute");
// const storeSettings = require("./storeSettingsRoute");
// const bulkOperations = require("./bulkOperationsRoute");

// module.exports = {
//   product,
//   auth,
//   user,
//   category,
//   activityLogs,
//   eligible,
//   cart,
//   order,
//   checkoutQueue,
//   promo,
//   loyalty,
//   cashier,
//   adminDashboard,
//   savedItems,
//   returns,
//   expense,
//   supplier,
//   stockMovement,
//   purchaseOrder,
//   storeSettings,
//   bulkOperations,
// };
