import * as CategoryRepository from "./category.repository.js";
import type { CategoryListReturn, ICategory } from "./category.types.js";

export const list = async (): Promise<CategoryListReturn[]> => {
  const categories = await CategoryRepository.fetchCategoryList();

  return categories;
};

export const create = async (categories: ICategory[]): Promise<ICategory[]> => {
  if (!Array.isArray(categories))
    throw new Error("categories must be an array");

  const createdCategories = (
    await CategoryRepository.createManyCategories(categories)
  ).map((cat) => cat.toObject());

  return createdCategories;
};



