import axios from "axios";
import { API_URL } from "../constants/config";

export const getCatalog = async () => {
  const response = await axios.get(`${API_URL}api/v1/catalog`);
  return response.data?.result || [];
};

export const getCatalogVersion = async () => {
  const response = await axios.get(`${API_URL}api/v1/catalog/version`);
  const result = response.data?.result;
  if (typeof result === "number") return result;
  if (typeof result?.version === "number") return result.version;
  return Number(result?.version || 0);
};

export const scanProduct = async (data) => {
  if (!data) throw new Error("missing product barcode detail");
  const scannedProduct = await axios.get(`${API_URL}api/v1/scan/product`, {
    params: {
      data,
    },
  });
  return scannedProduct.data.result;
};
