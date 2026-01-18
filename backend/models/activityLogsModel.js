const mongoose = require("mongoose");

const activityLogsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "UPDATE_PROFILE",
        "CREATE_USER",
        "CHANGE_ROLE",
        "LOGIN",
        "UPDATE_USER",
        "DELETE_USER",
        "CHANGE_STATUS",
        "LOGOUT",
      ],
    },
    status: {
      type: String,
      required: true,
      enum: ["SUCCESS", "WARNING", "FAILED"],
    },
    description: String,
  },
  { timestamps: true },
);

module.exports = mongoose.model("ActivityLogs",activityLogsSchema)