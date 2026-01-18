const ActivityLogs = require("../models/activityLogsModel");

exports.allLogs = async (request) => {
  const logs = await ActivityLogs.find();
  if (logs instanceof Error) throw new Error("failed to fetch log datas");
  return logs;
};

exports.createLog = async (userId, action, status, description = "") => {
  if (!userId) throw new Error("Missing userId field");
  if (!action) throw new Error("Action field is required");
  if (!status) throw new Error("Status field is required");

  const logged = await ActivityLogs.create({
    user: userId,
    action,
    status,
    description,
  });

  if (!logged) throw new Error("failed to logged that activity");
};
