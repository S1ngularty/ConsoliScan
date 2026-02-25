import axios from "axios";
import { API_URL } from "../constants/config";
import { getToken } from "../utils/authUtil";
import { handleApiError, markServerUp } from "../utils/apiErrorHandler";

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
    markServerUp();
    return result.data?.result;
  } catch (error) {
    throw handleApiError(error);
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
    markServerUp();
    return result.data?.result;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getPromos = async () => {
  const token = await getToken();

  try {
    const result = await axios.get(`${API_URL}api/v1/promo`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000,
    });
    markServerUp();
    return result.data?.result || [];
  } catch (error) {
    throw handleApiError(error);
  }
};
