import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_APP_API;

export const fetchProducts = async () => {
  const result = await axios.get(`api/v1/product`);
  if (!result) throw new Error("failed to fetch the products");
  const data = result.data.result;
  return data;
};

