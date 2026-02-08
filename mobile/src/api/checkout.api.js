import axios from "axios";
import { API_URL } from "../constants/config";
import { getToken } from "../utils/authUtil";

export const checkout = async (data) => {
  if (!data) throw new Error("empty cart");
  // console.log("CHECKOUT SNAPSHOT:", data);
  // console.log(`${API_URL}api/v1/checkout`);
  const token = await getToken();
  const result = await axios.post(`${API_URL}api/v1/checkout`, data, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const queueId = result.data.result;
  return queueId;
};

export const getCheckoutDetails = async (checkoutCode) => {
  if (!checkoutCode) throw new Error("missing checkout code");
  const token = await getToken();
  const result = await axios
    .get(`${API_URL}api/v1/checkout/${checkoutCode}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .catch((error) => {
      throw new Error("failed to get the checkout details");
    });

  return result.data.result;
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
  if (!token) throw new Error("missing token");
  const response = await fetch(`${API_URL}api/v1/checkout/paid/${checkoutCode}`, {
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