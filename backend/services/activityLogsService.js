const ActivityLogs = require("../models/activityLogsModel");
const User = require("../models/userModel");

exports.allLogs = async (request) => {
  const logs = await ActivityLogs.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "user",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $project: {
        "user.avatar": 0,
        "user.zipCode": 0,
        "user.street": 0,
        "user.state": 0,
        "user.address": 0,
        "user.country": 0,
        "user.lastLogin": 0,
        "user.firebaseUid": 0,
        "user.status": 0,
        "user.__v": 0,
        __v: 0,
      },
    },
    {
      $addFields: {
        activityLogId: "$_id",
      },
    },
    {
      $replaceRoot: {
        newRoot: {
          $mergeObjects: ["$$ROOT", "$user"],
        },
      },
    },
    {
      $unset: "user",
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  return logs;
};

exports.createLog = async (userId, action, status, description = "") => {
  if (!userId) return console.log("Missing userId field");
  if (!action) return console.log("Action field is required");
  if (!status) return console.log("Status field is required");

  const logged = await ActivityLogs.create({
    user: userId,
    action,
    status,
    description,
  });

  return logged;
};
