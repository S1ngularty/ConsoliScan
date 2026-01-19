const mongoose = require("mongoose");

const beneficiarySchema = new mongoose.Schema(
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
    dateIssued: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
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
      required: true,
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

beneficiarySchema.index({ user: 1, idNumber: 1 });

module.exports = mongoose.Schema("Beneficiary", beneficiarySchema);
