import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_APP_API;
axios.defaults.headers.put["Content-Type"] = "application/json";
axios.defaults.headers.post["Content-Type"] = "application/json";

export const fetchCategories = async () => {
  const result = await axios.get(`/api/v1/category`);
  if (!result.data.success) throw new Error("failed to fetch data");
  return result.data.result;
};

export const createCategory = async (categories) => {
  if (!categories) throw new Error("categories is undefined");
  const result = await axios.post(`api/v1/category`, { categories });
  if (!result) throw new Error("something went wrong!");
  return result.data.result;
};

export const updateCategory = async (categoryName, categoryId) => {
  if (!categoryId && !categoryName)
    throw new Error("missing identifier or a field");
  const isSave = await axios.put(`api/v1/category/${categoryId}`, {
    categoryName,
  });
  if (!isSave) throw new Error("failed to save the changes.");
  return true;
};

export const deleteCategory = async (categoryId) => {
  if (!categoryId) throw new Error("missing category id");
  const isDeleted = await axios.delete(`api/v1/category/${categoryId}`);
  if (!isDeleted) throw new Error("failed to delete the category");
  return true;
};
