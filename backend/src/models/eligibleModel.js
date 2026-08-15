const mongoose = require("mongoose");

const eligibleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    idNumber: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    idType: {
      type: String,
      enum: ["pwd", "senior"],
      default: "pwd",
      required: true,
    },
    dateIssued: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      validate: {
        validator: function (value) {
          if (this.idType === "senior" && !value) return true;
          return value > this.dateIssued;
        },
        message: "expiry date must be after the date Issued",
      },
    },
    idImage: {
      front: {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
      back: {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
      },
    },
    typeOfDisability: {
      type: String,
      enum: ["visual", "hearing", "physical", "mental", "multiple"],
      validate: {
        validator: function (value) {
          if (this.idType === "pwd") {
            return value != null;
          }
          return value == null;
        },
        message: "if the id is pwd type then disability must not be null",
      },
      default: null,
    },
    userPhoto: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

eligibleSchema.index({ user: 1, idNumber: 1 });

module.exports = mongoose.model("Eligible", eligibleSchema);
