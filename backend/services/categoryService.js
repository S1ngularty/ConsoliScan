const Category = require("../models/categoryModel");

exports.list = async () => {
  const categories = await Category.aggregate([
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "category",
        as: "products",
      },
    },
    {
      $project: {
        categoryName: 1,
        count: { $size: "$products" },
      },
    },
    {
      $sort: { categoryName: 1 },
    },
  ]);

  return categories;
};

exports.create = async (request) => {
  console.log(request.body);
  if (!request.body) throw new Error("undefined request body");
  const { categories } = request.body;
  if (!Array.isArray(categories))
    throw new Error("categories must be array object type");

  return await Category.insertMany(categories, { ordered: false });
};

exports.update = async (request) => {
  const { categoryId } = request.params;
  if (!request.body) throw new Error("undefined request body");
  const updateCategory = await Category.findByIdAndUpdate(
    categoryId,
    request.body,
    { new: true },
  );

  if (!updateCategory) throw new Error("failed to update the category");
  return updateCategory;
};

exports.delete = async (request) => {
  const { categoryId } = request.params;
  if (!categoryId) throw new Error("undefined category id");
  const deleteCategory = await Category.findByIdAndDelete(categoryId);
  if (!deleteCategory) throw new Error("failed to delete the category");
  return deleteCategory;
};
