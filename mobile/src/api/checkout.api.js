import axios from "axios";
import { API_URL } from "../constants/config";
import { getToken } from "../utils/authUtil";

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
    return queueId;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout - server is taking too long to respond");
    } else if (
      error.message === "Network Error" ||
      error.code === "ERR_NETWORK"
    ) {
      throw new Error("Cannot reach server - please check your connection");
    }
    throw new Error(error.message || "Failed to checkout");
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
    return result.data.result;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout - server is taking too long to respond");
    } else if (
      error.message === "Network Error" ||
      error.code === "ERR_NETWORK"
    ) {
      throw new Error("Cannot reach server - please check your connection");
    }
    throw new Error("Failed to get the checkout details");
  }
};

export const lockedOrder = async (checkoutCode) => {
  const token = await getToken();
  if (!token) throw new Error("missing token");
  const response = await fetch(`${API_URL}api/v1/checkout/${checkoutCode}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!response.ok) throw new Error("Failed to locked the order");

  const result = await response.json();
  return result;
};

export const payOrder = async (checkoutCode) => {
  const token = await getToken();
  if (!token) return;
  const response = await fetch(
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

  if (!response.ok) throw new Error("Failed to locked the order");

  const result = await response.json();
  return result;
};
