import axios from "axios";
import { API_URL } from "../constants/config";
import { handleApiError, markServerUp } from "../utils/apiErrorHandler";

export const getCatalog = async () => {
  try {
    const response = await axios.get(`${API_URL}api/v1/catalog`, {
      timeout: 10000, // 10 second timeout
    });
    markServerUp();
    return response.data?.result || [];
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getCatalogVersion = async () => {
  try {
    const response = await axios.get(`${API_URL}api/v1/catalog/version`, {
      timeout: 10000, // 10 second timeout
    });
    markServerUp();
    const result = response.data?.result;
    if (typeof result === "number") return result;
    if (typeof result?.version === "number") return result.version;
    return Number(result?.version || 0);
  } catch (error) {
    throw handleApiError(error);
  }
};

export const scanProduct = async (data) => {
  if (!data) throw new Error("missing product barcode detail");
  try {
    const scannedProduct = await axios.get(`${API_URL}api/v1/scan/product`, {
      params: {
        data,
      },
      timeout: 3000, // 10 second timeout
    });
    markServerUp();
    if (!scannedProduct.data?.result) {
      throw new Error("scanned product not found");
    }
    return scannedProduct.data.result;
  } catch (error) {
    throw handleApiError(error);
  }
};
