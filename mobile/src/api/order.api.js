import axios from "axios";
import { API_URL } from "../constants/config";
import { getToken } from "../utils/authUtil";

export const confirmOrder = async (transaction) => {
  if (!transaction) return;
  const token = await getToken();
  if(!token) throw new Error("missing token")
  const response = await fetch(`${API_URL}api/v1/confirmOrder`, {
    method: "POST",
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ transaction }),
  });

  if (!response.ok) throw new Error("failed to complete the transaction");
  const result = await response.json();
  return result;
};
