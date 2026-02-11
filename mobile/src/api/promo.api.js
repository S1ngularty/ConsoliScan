import axios from "axios";
import { API_URL } from "../constants/config";
import { getToken } from "../utils/authUtil";

export const applyPromo = async (promoCode) => {
  if (!promoCode) throw new Error("missing promocode");
  const token =await  getToken();
  const result = await axios.get(`${API_URL}api/v1/promo/apply/${promoCode}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return result.data?.result;
};
