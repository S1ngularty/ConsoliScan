import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "../utils/authUtil";
import { API_URL } from "../constants/config";

export const PersonalInfo = async (userId) => {
  if (!userId) throw new Error("missing user ID");
  const token = await getToken();
  if (!token) throw new Error("unauthorized access");
  const respose = await axios.get(`${API_URL}api/v1/user/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!respose)
    throw new Error("failed to fetch your info. Please try again later");

  return respose.data.result;
};

export const updateProfile = async (id, data) => {
  const token = await getToken();
  if (!token) throw new Error("no token");
  let formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === "object" || value.uri) {
      formData.append(key, {
        uri: value.uri,
        name: value.name || "upload.jpg",
        type: "image/jpeg",
      });
    } else {
      formData.append(`${key}`, `${value}`);
    }
  }

  const result = await fetch(`${API_URL}api/v1/profile/user/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  if (!result.ok) throw new Error("failed to update your profile");
  let responseData = await result.json();
  return responseData;
};

export const ApplyEligibility = async (id, data) => {
  if (!id || !data) return;
  const token = await getToken();
  if (!token) throw new Error("unauthorized request");

  // If data is already FormData, use it directly; otherwise build it
  let body;
  if (data instanceof FormData) {
    body = data;
  } else {
    body = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (
        (typeof value === "object" &&
          key !== "dateIssued" &&
          key !== "expiryDate" &&
          value !== null) ||
        (typeof value === "object" && value.uri)
      ) {
        // Handle image objects
        body.append(key, {
          uri: value.uri || value,
          name: value.name || `${key}.jpg`,
          type: "image/jpeg",
        });
      } else if (value !== null && value !== undefined) {
        // Skip null/undefined values
        body.append(key, String(value));
      }
    }
  }

  const response = await fetch(`${API_URL}api/v1/eligible/${id}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: body,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "failed to submit the request");
  }

  const responseData = await response.json();
  return responseData;
};

export const fetchHomeData = async () => {
  const token = await getToken();
  const response = await axios.get(`${API_URL}api/v1/customer/home`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response) throw new Error("failed to fetch the data");
  // console.log(response.data.result)
  return response.data?.result;
};
