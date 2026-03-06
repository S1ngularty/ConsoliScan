import axios from "axios";
import { API_URL } from "../constants/config";
import { handleApiError, markServerUp } from "../utils/apiErrorHandler";

export const getCategories = async () => {
  try {
    const response = await axios.get(`${API_URL}api/v1/category`, {
      timeout: 10000,
    });
    markServerUp();
    return response.data?.result || [];
  } catch (error) {
    throw handleApiError(error);
  }
};
