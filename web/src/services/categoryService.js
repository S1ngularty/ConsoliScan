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
