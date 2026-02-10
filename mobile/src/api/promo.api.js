import axios from "axios";
import { API_URL } from "../constants/config";
import { getToken } from "../utils/authUtil";

export const applyPromo = async (promoId) => {
  if (!promoId) throw new Error("missing promocode");

  const result = await axios.get(`${API_URL}api/v1/promo/apply`);

  return result.data?.result;
};
