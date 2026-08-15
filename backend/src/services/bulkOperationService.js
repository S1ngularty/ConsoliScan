const {
  findByProductId,
  findProductIdentifiers,
  updateManyProduct,
  bulkSoftDelete,
  updateManyProductByCategory,
  getExportProductData,
} = require("../repositories/productRepository");

const resolveProductIdentifiers = async (identifiers) => {
  const productIds = [];
  const notFound = [];

  for (const identifier of identifier) {
    const trimmedId = identifier.trim();
    if (!trimmedId) continue;

    let product = await findProductIdentifiers(trimmedId);

    if (product) {
      productIds.push(product._id);
    } else {
      notFound.push(trimmedId);
    }
  }

  return { productIds, notFound };
};

const calcUpdatePrice = (price, updateType) => {
  let newPrice = price;
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

  return newPrice;
};

const getUpdateStock = (quantity, oldStock, operation) => {
  switch (operation) {
    case "SET":
      return quantity;
      break;
    case "ADD":
      return oldStock + quantity;
      break;
    case "SUBTRACT":
      return Math.max(0, oldStock - quantity);
      break;
  }
};

// TODO(optimize): Synchronous update which makes the operation to process longer, itll be optimize soon
exports.bulkPriceUpdate = async (req, res) => {
  const { products, updateType, value } = req.body;

  if (!products || !Array.isArray(products) || products.length === 0)
    throw new Error("Products array is required");

  const { productIds, notFound } = resolveProductIdentifiers(products);

  if (productsIds.length === 0) throw new Error("No products found");

  const updates = [];

  for (const productId of productIds) {
    const product = await findByProductId(productId);
    if (!product) continue;

    let newPrice = calcUpdatePrice(product.price, updateType);

    product.price = Math.max(0, newPrice);
    await product.save();

    updates.push({
      productId: product._id,
      name: product.name,
      oldPrice: product.price,
      newPrice: product.price,
    });
  }

  return {
    message: `Successfully updated ${updates.length} products`,
    updates,
    notFound: notFound.length > 0 ? notFound : undefined,
  };
};

// TODO(optimize): Synchronous update which makes the operation to process longer, itll be optimize soon
exports.bulkStockUpdate = async (req, res) => {
  const { products, quantity, operation } = req.body;

  if (!products || !Array.isArray(products))
    throw new Error("Products array is required");

  const { productIds, notFound } = await resolveProductIdentifiers(products);

  if (productIds.length === 0) throw new Error("No products found");

  const result = [];

  for (const productId of productIds) {
    const product = await findByProductId(productId);
    if (!product) {
      notFound.push(productId);
      continue;
    }

    const oldStock = product.stockQuantity;
    let newStock = getUpdateStock(quantity, oldStock, operation);

    product.stockQuantity = newStock;
    await product.save();

    result.push({
      productId: product._id,
      name: product.name,
      oldStock,
      newStock,
    });
  }

  return {
    message: `Successfully updated stock for ${results.length} products`,
    results,
    notFound: notFound.length > 0 ? notFound : undefined,
  };
};

exports.bulkCategoryAssignment = async (req, res) => {
  const { products, categoryId } = req.body;

  if (!products || !Array.isArray(products))
    throw new Error("Products array is required");

  const { productIds, notFound } = await resolveProductIdentifiers(products);

  if (productIds.length === 0) throw new Error("No products found");

  // TODO   const category : this statement will be continue after creating the repository layer of categories

  const result = await updateManyProductByCategory(productIds, categoryId);

  return {
    message: `Successfully updated category for ${result.modifiedCount} products`,
    modifiedCount: result.modifiedCount,
    notFound: notFound.length > 0 ? notFound : undefined,
  };
};

exports.bulkDelete = async (req, res) => {
  const { products } = req.body;

  if (!products || !Array.isArray(products))
    throw new Error("Products array is required");

  const { productIds, notFound } = await resolveProductIdentifiers(products);

  if (productIds.length === 0) throw new Error("No products found");

  const result = await bulkSoftDelete(productIds);

  return {
    message: `Successfully deleted ${result.modifiedCount} products`,
    deletedCount: result.modifiedCount,
    notFound: notFound.length > 0 ? notFound : undefined,
  };
};

exports.exportProducts = async (req, res) => {
  const products = await getExportProductData();

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
  return { message: "ok" };
};

// exports.importProducts = async (req, res) => {
//   try {
//     const { products } = req.body;
//     // Expected: products = [{sku, name, category, price, stock, barcode}]

//     if (!products || !Array.isArray(products)) {
//       return res.status(400).json({ message: "Products array is required" });
//     }

//     const results = {
//       success: 0,
//       failed: 0,
//       errors: [],
//     };

//     for (const productData of products) {
//       try {
//         // Check if product exists by SKU
//         const existing = await Product.findOne({ sku: productData.sku });

//         if (existing) {
//           // Update existing product
//           Object.assign(existing, productData);
//           await existing.save();
//         } else {
//           // Create new product
//           await Product.create(productData);
//         }

//         results.success++;
//       } catch (err) {
//         results.failed++;
//         results.errors.push({
//           sku: productData.sku,
//           error: err.message,
//         });
//       }
//     }

//     res.status(200).json({
//       message: `Import complete: ${results.success} successful, ${results.failed} failed`,
//       ...results,
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: "Failed to import products",
//       error: error.message,
//     });
//   }
// };
