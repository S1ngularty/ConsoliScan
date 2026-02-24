import axios from "axios";
import { API_URL } from "../constants/config";
import { getToken } from "../utils/authUtil";

export const applyPromo = async (promoCode) => {
  if (!promoCode) throw new Error("missing promocode");
  const token = await getToken();

  try {
    const result = await axios.get(
      `${API_URL}api/v1/promo/apply/${promoCode}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000, // 10 second timeout
      },
    );
    return result.data?.result;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout - server is taking too long to respond");
    } else if (
      error.message === "Network Error" ||
      error.code === "ERR_NETWORK"
    ) {
      throw new Error("Cannot reach server - please check your connection");
    }
    throw new Error(error.message || "Failed to apply promo code");
  }
};

export const applyGuestPromo = async (promoCode, cart) => {
  if (!promoCode) throw new Error("missing promocode");
  if (!cart) throw new Error("cart data is required");

  try {
    const result = await axios.post(
      `${API_URL}api/v1/promo/guest/apply/${promoCode}`,
      { cart },
      { timeout: 10000 }, // 10 second timeout
    );
    return result.data?.result;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout - server is taking too long to respond");
    } else if (
      error.message === "Network Error" ||
      error.code === "ERR_NETWORK"
    ) {
      throw new Error("Cannot reach server - please check your connection");
    }
    throw new Error(error.message || "Failed to apply guest promo code");
  }
};
