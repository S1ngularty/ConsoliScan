const mongoose = require("mongoose");
const Product = require("../models/productModel");
const Category = require("../models/categoryModel");

// Helper function to resolve product identifiers (barcode, name, or ID) to IDs
const resolveProductIdentifiers = async (identifiers) => {
  const productIds = [];
  const notFound = [];

  for (const identifier of identifiers) {
    const trimmedId = identifier.trim();
    if (!trimmedId) continue;

    // Try to find by ID, barcode, or name
    let product = await Product.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(trimmedId) ? trimmedId : null },
        { barcode: trimmedId },
        { name: { $regex: new RegExp(`^${trimmedId}$`, "i") } },
        { sku: trimmedId },
      ],
      deletedAt: null,
    });

    if (product) {
      productIds.push(product._id);
    } else {
      notFound.push(trimmedId);
    }
  }

  return { productIds, notFound };
};

// ═══════════════════════════════════════════════
//  BULK PRICE UPDATE
// ═══════════════════════════════════════════════
exports.bulkPriceUpdate = async (req, res) => {
  try {
    const { products, updateType, value } = req.body;
    // updateType: 'SET' | 'INCREASE_PERCENT' | 'DECREASE_PERCENT' | 'INCREASE_AMOUNT' | 'DECREASE_AMOUNT'

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ message: "Products array is required" });
    }

    // Resolve product identifiers to IDs
    const { productIds, notFound } = await resolveProductIdentifiers(products);

    if (productIds.length === 0) {
      return res.status(404).json({
        message: "No products found",
        notFound,
      });
    }

    const updates = [];

    for (const productId of productIds) {
      const product = await Product.findById(productId);
      if (!product) continue;

      let newPrice = product.price;

      switch (updateType) {
        case "SET":
          newPrice = parseFloat(value);
          break;
        case "INCREASE_PERCENT":
          newPrice = product.price * (1 + parseFloat(value) / 100);
          break;
        case "DECREASE_PERCENT":
          newPrice = product.price * (1 - parseFloat(value) / 100);
          break;
        case "INCREASE_AMOUNT":
          newPrice = product.price + parseFloat(value);
          break;
        case "DECREASE_AMOUNT":
          newPrice = product.price - parseFloat(value);
          break;
      }

      product.price = Math.max(0, newPrice);
      await product.save();

      updates.push({
        productId: product._id,
        name: product.name,
        oldPrice: product.price,
        newPrice: product.price,
      });
    }

    res.status(200).json({
      message: `Successfully updated ${updates.length} products`,
      updates,
      notFound: notFound.length > 0 ? notFound : undefined,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to bulk update prices",
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════
//  BULK STOCK UPDATE
// ═══════════════════════════════════════════════
exports.bulkStockUpdate = async (req, res) => {
  try {
    const { products, quantity, operation } = req.body;
    // operation: 'SET' | 'ADD' | 'SUBTRACT'

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ message: "Products array is required" });
    }

    // Resolve product identifiers to IDs
    const { productIds, notFound } = await resolveProductIdentifiers(products);

    if (productIds.length === 0) {
      return res.status(404).json({
        message: "No products found",
        notFound,
      });
    }

    const results = [];

    for (const productId of productIds) {
      const product = await Product.findById(productId);
      if (!product) continue;

      const oldStock = product.stockQuantity;
      let newStock = oldStock;

      switch (operation) {
        case "SET":
          newStock = quantity;
          break;
        case "ADD":
          newStock = oldStock + quantity;
          break;
        case "SUBTRACT":
          newStock = Math.max(0, oldStock - quantity);
          break;
      }

      product.stockQuantity = newStock;
      await product.save();

      results.push({
        productId: product._id,
        name: product.name,
        oldStock,
        newStock,
      });
    }

    res.status(200).json({
      message: `Successfully updated stock for ${results.length} products`,
      results,
      notFound: notFound.length > 0 ? notFound : undefined,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to bulk update stock",
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════
//  BULK CATEGORY ASSIGNMENT
// ═══════════════════════════════════════════════
exports.bulkCategoryAssignment = async (req, res) => {
  try {
    const { products, categoryId } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ message: "Products array is required" });
    }

    // Resolve product identifiers to IDs
    const { productIds, notFound } = await resolveProductIdentifiers(products);

    if (productIds.length === 0) {
      return res.status(404).json({
        message: "No products found",
        notFound,
      });
    }

    // Verify category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { category: categoryId } },
    );

    res.status(200).json({
      message: `Successfully updated category for ${result.modifiedCount} products`,
      modifiedCount: result.modifiedCount,
      notFound: notFound.length > 0 ? notFound : undefined,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to bulk assign category",
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════
//  BULK DELETE
// ═══════════════════════════════════════════════
exports.bulkDelete = async (req, res) => {
  try {
    const { products } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ message: "Products array is required" });
    }

    // Resolve product identifiers to IDs
    const { productIds, notFound } = await resolveProductIdentifiers(products);

    if (productIds.length === 0) {
      return res.status(404).json({
        message: "No products found",
        notFound,
      });
    }

    // Soft delete by setting deletedAt
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { deletedAt: new Date() } },
    );

    res.status(200).json({
      message: `Successfully deleted ${result.modifiedCount} products`,
      deletedCount: result.modifiedCount,
      notFound: notFound.length > 0 ? notFound : undefined,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to bulk delete products",
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════
//  EXPORT PRODUCTS TO CSV
// ═══════════════════════════════════════════════
exports.exportProducts = async (req, res) => {
  try {
    const products = await Product.find({ deletedAt: null })
      .populate("category", "name")
      .lean();

    const csv = [
      ["SKU", "Name", "Category", "Price", "Stock", "Barcode", "Status"].join(
        ",",
      ),
      ...products.map((p) =>
        [
          p.sku,
          `"${p.name}"`,
          `"${p.category?.name || ""}"`,
          p.price,
          p.stock,
          p.barcode,
          p.status,
        ].join(","),
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=products-${new Date().getTime()}.csv`,
    );
    res.send(csv);
  } catch (error) {
    res.status(500).json({
      message: "Failed to export products",
      error: error.message,
    });
  }
};

// ═══════════════════════════════════════════════
//  IMPORT PRODUCTS FROM CSV (simplified)
// ═══════════════════════════════════════════════
exports.importProducts = async (req, res) => {
  try {
    const { products } = req.body;
    // Expected: products = [{sku, name, category, price, stock, barcode}]

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ message: "Products array is required" });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [],
    };

    for (const productData of products) {
      try {
        // Check if product exists by SKU
        const existing = await Product.findOne({ sku: productData.sku });

        if (existing) {
          // Update existing product
          Object.assign(existing, productData);
          await existing.save();
        } else {
          // Create new product
          await Product.create(productData);
        }

        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push({
          sku: productData.sku,
          error: err.message,
        });
      }
    }

    res.status(200).json({
      message: `Import complete: ${results.success} successful, ${results.failed} failed`,
      ...results,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to import products",
      error: error.message,
    });
  }
};
