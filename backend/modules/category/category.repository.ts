import { type CategoryDocument, Category } from "./category.model.js";
import type { CategoryListReturn, ICategory } from "./category.types.js";

export const fetchCategoryList = async (): Promise<CategoryListReturn[]> => {
  const result = await Category.aggregate([
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
        isBNPC: 1,
        bnpcCategory: 1,
        applicableTo: 1,
        count: { $size: "$products" },
      },
    },
    {
      $sort: { categoryName: 1 },
    },
  ]);

  return result;
};

export const createManyCategories = async (
  categories: ICategory[],
): Promise<CategoryDocument[]> => {
  const result = await Category.insertMany(categories,{ordered:false})

  return result;
};
