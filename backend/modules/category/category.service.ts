import * as CategoryRepository from "./category.repository.js";
import type { CategoryListReturn } from "./category.types.js";

export const list = async (): Promise<CategoryListReturn[]> => {
  const categories = await CategoryRepository.fetchCategoryList();

  return categories;
};
