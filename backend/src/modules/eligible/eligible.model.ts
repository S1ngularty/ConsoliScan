import mongoose, {
  type HydratedDocument,
  Schema,
  model,
  Model,
} from "mongoose";
import type { DisabilityType, IdType, IEligible } from "./eligible.types.js";

type EligibleModel = Model<IEligible>;

const eligibleSchema = new Schema<IEligible, EligibleModel>(
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
        validator: function (this: IEligible, value: Date) {
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
      required: function (this: IEligible): boolean {
        return this.idType === "pwd";
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

export type EligibleDocument = HydratedDocument<IEligible>;

export const Eligible = model("Eligible", eligibleSchema);
