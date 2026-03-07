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

// Merchandiser-specific scan that doesn't throw error for new products
export const scanProductForMerchandiser = async (data, token) => {
  if (!data) throw new Error("missing product barcode detail");
  try {
    const response = await axios.get(`${API_URL}api/v1/scan/merchandiser`, {
      params: {
        data,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 5000,
    });
    markServerUp();
    return response.data?.result; // Returns { found: true/false, product?: ..., barcode?: ... }
  } catch (error) {
    throw handleApiError(error);
  }
};

export const createProduct = async (productData, token) => {
  try {
    const formData = new FormData();

    // Add product fields
    Object.keys(productData).forEach((key) => {
      if (key === "images" && Array.isArray(productData[key])) {
        // Handle image uploads
        productData[key].forEach((image, index) => {
          if (image.uri) {
            const filename = image.uri.split("/").pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : "image/jpeg";

            formData.append("images", {
              uri: image.uri,
              name: filename,
              type: type,
            });
          }
        });
      } else if (productData[key] !== null && productData[key] !== undefined) {
        formData.append(key, productData[key]);
      }
    });

    const response = await axios.post(`${API_URL}api/v1/product`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000,
    });
    markServerUp();
    return response.data?.result;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateProduct = async (productId, productData, token) => {
  try {
    const formData = new FormData();

    // Add product fields
    Object.keys(productData).forEach((key) => {
      if (key === "images" && Array.isArray(productData[key])) {
        // Handle new image uploads
        productData[key].forEach((image, index) => {
          if (image.uri && !image.url) {
            // New image
            const filename = image.uri.split("/").pop();
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : "image/jpeg";

            formData.append("images", {
              uri: image.uri,
              name: filename,
              type: type,
            });
          }
        });
      } else if (productData[key] !== null && productData[key] !== undefined) {
        formData.append(key, productData[key]);
      }
    });

    const response = await axios.put(
      `${API_URL}api/v1/product/${productId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
        timeout: 30000,
      },
    );
    markServerUp();
    return response.data?.result;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const updateProductStock = async (productId, stockData, token) => {
  try {
    const response = await axios.put(
      `${API_URL}api/v1/product/stocks/${productId}`,
      stockData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      },
    );
    markServerUp();
    return response.data?.result;
  } catch (error) {
    throw handleApiError(error);
  }
};
