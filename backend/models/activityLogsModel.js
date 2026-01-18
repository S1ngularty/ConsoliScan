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
        "LOGIN",
        "UPDATE_USER",
        "DELETE_USER",
        "VALIDATE_USER_MEMBERSHIP_ID",
        "CHANGE_PERMISSION",

        "UPDATE_PRODUCT",
        "DELETE_PRODUCT",
        "CREATE_PRODUCT",
        "TEMPORARY_DELETE",
        "PERMANENT_DELETE",
        "RESTORE_PRODUCT",

        "UPDATE_CATEGORY",
        "DELETE_CATEGORY",
        "CREATE_CATEGORY",

        "UPDATE_DISCOUNT",
        "DELETE_DISCOUNT",
        "CREATE_DISCOUNT",

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

module.exports = mongoose.model("ActivityLogs", activityLogsSchema);
