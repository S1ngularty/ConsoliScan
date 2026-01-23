import axios from "axios";
import { API_URL } from "../constants/config";

export const scanProduct = async (data,type) => {
  if (!type || !data) throw new Error("missing product barcode detail");
  const scannedProduct = await axios.get(`${API_URL}api/v1/scan/product`, {
    params: {
      type,
      data,
    },
  });
  return scannedProduct.data.result;
};
