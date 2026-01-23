const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      // required: true,
      // unique:true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      validate: [validator.isEmail, "field must be in email format"],
    },
    password: {
      type: String,
      default: null,
      select:false
    },
    sex: {
      type: String,
      enum: ["male", "female"],
    },
    age: {
      type: Number,
      required: true,
      default: null,
    },
    birthDate: {
      type: Date,
      default: null,
    },
    address: {
      type: String,
      trim: true,
    },
    street: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      default: "United States",
    },
    zipCode: {
      type: String,
      trim: true,
    },
    contactNumber: {
      type: String,
      trim: true,
    },
    avatar: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin", "checker"],
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive"],
    },
    lastLogin: {
      type: Date,
      default: Date.now(),
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true },
);

userSchema.methods.getToken = function () {
  return jwt.sign(
    {
      userId: this._id,
      role: this.role,
      status: this.status,
      email: this.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXP },
  );
};

userSchema.methods.updateLastLogin = function () {
  this.lastLogin = Date.now();
  return;
};

module.exports = mongoose.model("User", userSchema);
