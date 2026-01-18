const activityLogsService = require("../services/activityLogsService")
const controllerWrapper = require("../utils/controllerWrapper")

exports.getLogs = controllerWrapper(activityLogsService.allLogs)