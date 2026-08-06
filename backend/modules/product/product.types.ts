import mongoose from "mongoose";
import type { ProductDocument } from "./product.model.js";
import type { ICategory } from "../category/category.types.js";

type Barcodes =
  | "UPC"
  | "EAN_13"
  | "EAN_8"
  | "ISBN_10"
  | "ISBN_13"
  | "CODE_128"
  | "QR";

type Units = "kg" | "g" | "pc" | "liter" | "ml" | "pack";

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
  | "_id"
  | "name"
  | "barcode"
  | "sku"
  | "price"
  | "stockQuantity"
  | "images"
> & {
  category: ICategory;
};
