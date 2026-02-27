import axios from "axios";
import { API_URL } from "../constants/config";
import { getToken } from "../utils/authUtil";
import {
  apiFetch,
  handleApiError,
  markServerUp,
} from "../utils/apiErrorHandler";

export const checkout = async (data) => {
  if (!data) throw new Error("empty cart");

  try {
    const result = await axios.post(`${API_URL}api/v1/checkout`, data, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 15000, // 15 second timeout
    });

    const queueId = result.data.result;
    markServerUp();
    return queueId;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const getCheckoutDetails = async (checkoutCode) => {
  if (!checkoutCode) throw new Error("missing checkout code");
  const token = await getToken();

  try {
    const result = await axios.get(
      `${API_URL}api/v1/checkout/${checkoutCode}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000, // 10 second timeout
      },
    );
    markServerUp();
    return result.data.result;
  } catch (error) {
    throw handleApiError(error);
  }
};

export const lockedOrder = async (checkoutCode) => {
  const token = await getToken();
  if (!token) throw new Error("missing token");
  const response = await apiFetch(`${API_URL}api/v1/checkout/${checkoutCode}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  const result = await response.json();
  return result;
};

export const payOrder = async (checkoutCode) => {
  const token = await getToken();
  if (!token) return;
  const response = await apiFetch(
    `${API_URL}api/v1/checkout/paid/${checkoutCode}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );

  const result = await response.json();
  return result;
};
