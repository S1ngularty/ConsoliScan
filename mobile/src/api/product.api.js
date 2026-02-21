import axios from "axios";
import { API_URL } from "../constants/config";

export const scanProduct = async (data) => {
  if (!data) throw new Error("missing product barcode detail");
  const scannedProduct = await axios.get(`${API_URL}api/v1/scan/product`, {
    params: {
      data,
    },
  });
  return scannedProduct.data.result;
};
