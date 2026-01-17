import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_APP_API;

export const fetchCategories = async () => {
  const result = await axios.get(`/api/v1/category`);
  if (!result.data.success) throw new Error("failed to fetch data");
  return result.data.result;
};
