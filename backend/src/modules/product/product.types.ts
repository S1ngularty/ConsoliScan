import mongoose from "mongoose";
import type { ProductDocument } from "./product.model.js";
import type { ICategory } from "../category/category.types.js";

export const BARCODE_TYPES = {
  UPC: "UPC",
  EAN_13: "EAN_13",
  EAN_8: "EAN_8",
  ISBN_10: "ISBN_10",
  ISBN_13: "ISBN_13",
  CODE_128: "CODE_128",
  QR: "QR",
} as const;

export type Barcodes = (typeof BARCODE_TYPES)[keyof typeof BARCODE_TYPES];

export type Units = "kg" | "g" | "pc" | "liter" | "ml" | "pack";

export interface IProductImage {
  public_id?: string;
  url?: string;
}

export interface IProduct {
  name: string;
  slug: string;
  sku: string;
  description: string;

  barcode: string;
  barcodeType: Barcodes;

  category: mongoose.Types.ObjectId;

  price: number;
  srp: number | null;
  salePrice: number | null;
  saleActive: boolean;

  stockQuantity: number;
  unit: Units;
  excludedFromDiscount: boolean;

  images: IProductImage[];

  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export type EditableProductFields = Omit<
  IProduct,
  "createdAt" | "updatedAt" | "deletedAt"
>;

export type SearchProductResult = Pick<
  ProductDocument,
  "_id" | "name" | "barcode" | "sku" | "price" | "stockQuantity" | "images"
> & {
  category: ICategory;
};

export type BarcodeQueryResult = Omit<IProduct, "category"> & {
  category: ICategory;
};

export type BarcodeSearchResult = {
  product?: BarcodeQueryResult;
  barcode: string;
  found: boolean;
};
