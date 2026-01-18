const ActivityLogs = require("../models/activityLogsModel");

exports.allLogs = async (request) => {
  const logs = await ActivityLogs.find();
  return logs;
};

exports.createLog = async (userId, action, status, description = "") => {
  if (!userId)return console.log("Missing userId field");
  if (!action)return console.log("Action field is required");
  if (!status)return console.log("Status field is required");
  
  const logged = await ActivityLogs.create({
    user: userId,
    action,
    status,
    description,
  });

  return logged
};
