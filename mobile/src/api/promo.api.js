import axios from "axios";
import { API_URL } from "../constants/config";
import { getToken } from "../utils/authUtil";

export const applyPromo = async (promoCode) => {
  if (!promoCode) throw new Error("missing promocode");
  const token = await getToken();
  const result = await axios.get(`${API_URL}api/v1/promo/apply/${promoCode}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return result.data?.result;
};

export const applyGuestPromo = async (promoCode, cart) => {
  if (!promoCode) throw new Error("missing promocode");
  if (!cart) throw new Error("cart data is required");

  const result = await axios.post(
    `${API_URL}api/v1/promo/guest/apply/${promoCode}`,
    { cart },
  );

  return result.data?.result;
};
