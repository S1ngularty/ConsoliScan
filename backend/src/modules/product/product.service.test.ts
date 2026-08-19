import { describe, it, expect, vi } from "vitest";

import { getBarcode } from "./product.service.js";
import { findProductByBarcode } from "./product.repository.js";
import { BARCODE_TYPES, BarcodeQueryResult } from "./product.types.js";

vi.mock("./product.repository.js", () => ({
  findProductByBarcode: vi.fn(),
}));

describe("getBarcode", () => {
  it("returns the product when the barcode is found", async () => {
    const product: BarcodeQueryResult = {
      name: "Coca Cola",
      slug: "coca-cola",
      sku: "COKE-001",
      description: "Coca Cola 330ml",
      barcode: "4800012345678",
      barcodeType: "EAN_13",
      category: {
        categoryName: "Beverages",
        isBNPC: false,
      },
      price: 50,
      srp: 55,
      salePrice: null,
      saleActive: false,
      stockQuantity: 100,
      unit: "kg",
      excludedFromDiscount: false,
      images: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    };
    vi.mocked(findProductByBarcode).mockResolvedValue(product);

    const result = await getBarcode(BARCODE_TYPES.EAN_13, "123456");

    expect(result).toEqual({
      product,
      found: true,
      barcode: "123456",
    });

    expect(findProductByBarcode).toHaveBeenCalledWith(
      BARCODE_TYPES.EAN_13,
      "123456",
    );
  });

  it("returns null when the product barcode is not found", async () => {
    vi.mocked(findProductByBarcode).mockResolvedValue(null);

    const result = await getBarcode(BARCODE_TYPES.EAN_13, "123456");

    expect(result).toEqual({
      found: false,
      barcode: "123456",
    }); 
  });
});
