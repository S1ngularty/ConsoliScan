import mongoose, {
  type HydratedDocument,
  Model,
  Schema,
  model,
} from "mongoose";
import type { ICatalog } from "./catalog.types.js";

type CatalogModel = Model<ICatalog>;

const catalogVersionSchema = new Schema<ICatalog, CatalogModel>(
  {
    version: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
  },
  { timestamps: true },
);

export type CatalogDocument = HydratedDocument<ICatalog>;

export const Catalog = model("Catalog", catalogVersionSchema);
