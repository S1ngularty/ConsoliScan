const express = require("express");
const router = express.Router();

const activityLogsController = require("../controllers/activityLogsController");
const authMiddleware = require("../middlewares/authMiddleware");

router
  .route("/logs")
  .get(authMiddleware.verifyToken, activityLogsController.getLogs);

module.exports = router;
