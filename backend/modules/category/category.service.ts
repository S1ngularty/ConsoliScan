import * as CategoryRepository from "./category.repository.js";
import type {
  CategoryListReturn,
  EditableCategoryFields,
  ICategory,
} from "./category.types.js";

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

export const update = async (
  categoryId: string,
  data: EditableCategoryFields,
): Promise<ICategory> => {
  const updateCategory = await CategoryRepository.updateCategory(
    categoryId,
    data,
  );

  if (!updateCategory) throw new Error("Failed to update the category");

  return updateCategory.toObject();
};
