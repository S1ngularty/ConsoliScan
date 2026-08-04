import mongoose, { type HydratedDocument, Model, Schema } from "mongoose";
import type { ICategory } from "./category.types.js";

type CategoryModel = Model<ICategory>;

const categorySchema = new Schema<ICategory, CategoryModel>(
  {
    categoryName: {
      type: String,
      unique: true,
      required: true,
    },
    isBNPC: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export type CategoryDocument = HydratedDocument<ICategory>;

export const Category = mongoose.model("Category", categorySchema);
