import mongoose, { type HydratedDocument, Schema, Model } from "mongoose";
import type { IUser, IUserMethods } from "./user.types.js";
import validator from "validator";
import jwt from "jsonwebtoken"

type UserModel = Model<IUser, {}, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      validate: [validator.isEmail, "field must be in email format"],
      unique: true,
    },
    password: {
      type: String,
      default: null,
      select: false,
    },
    sex: {
      type: String,
      enum: ["male", "female", null],
    },
    age: {
      type: Number,
      // required: true,
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
      default: "Philippines",
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
      enum: ["user", "admin", "super_admin", "checker", "merchandiser"],
    },
    status: {
      type: String,
      default: "active",
      enum: ["active", "inactive"],
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true },
);

userSchema.method("getToken", function () {
  const secret: string | undefined = process.env.JWT_SECRET;
  const exp: string | undefined = process.env.JWT_EXP;
  const payload = {
    userId: this._id,
    name: this.name,
    role: this.role,
    status: this.status,
    email: this.email,
    createdAt: this.createdAt,
  };

  const options: jwt.SignOptions = {
    expiresIn: "7d",
  };

  if (!secret) {
    console.log("Missing JWT Secret");
    return null;
  }
  const token = jwt.sign(payload, secret, options);
  return token;
});

userSchema.method("updateLastLogin", async function () {
  this.lastLogin = new Date();
  await this.save();
});

userSchema.method("buildAuthReturnObject", function () {
  return {
    userId: String(this._id),
    name: this.name,
    email: this.email,
    role: this.role,
    status: this.status,
  };
});

export type UserDocument = HydratedDocument<IUser, IUserMethods>;

export const User = mongoose.model<IUser, UserModel>("User", userSchema);
