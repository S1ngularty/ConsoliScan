import axios from "axios";
import { timeAgo } from "../utils/parseDate";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_APP_API;
axios.defaults.headers.post["Content-Type"] = "application/json";

export async function getMe() {
  try {
    const result = await axios.post(`api/v1/me`);
    if (!result) throw new Error("failed to get current user");
    return result.data.result;
  } catch (error) {
    return null;
  }
}

export async function getAllUser() {
  try {
    const result = await axios.get(`api/v1/user`, {
      headers: {
        "Cache-Control": "no-cache",
      },
    });
    if (!result) throw new Error("failed to access the resource");
    let data = result.data.result;
    data = data.map((user) => {
      return {
        ...user,
        lastLogin: timeAgo(user.lastLogin),
      };
    });
    return data;
  } catch (error) {
    return error;
  }
}

export async function getUser(id = "") {
  try {
    const result = await axios.get(`api/v1/user/${id}`);
    if (!result) throw new Error("failed to get the user");
    const data = result.data;
    return data;
  } catch (error) {
    return error;
  }
}

export async function updateProfile(id = "", data = {}) {
  try {
    const isUpdated = await axios.put(`api/v1/profile/user/${id}`, data);
    if (!isUpdated) throw new Error("failed to update the user profile");
    const data = isUpdated.data.result;
    return data;
  } catch (error) {
    return error;
  }
}

export async function createUser(userInfo) {
  try {
    const result = await axios.post("api/v1/user", userInfo, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    if (!result) throw new Error("failed to create User");
    return result.data.result;
  } catch (error) {
    return error;
  }
}

export async function editUser(userInfo, userId) {
  try {
    const result = await axios.put(`api/v1/profile/user/${userId}`, userInfo, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    if (!result) throw new Error("failed to create User");
    return result.data.result;
  } catch (error) {
    return error;
  }
}

export async function updateAvatar(file, userId) {
  try {
    if (!file) throw new Error("Please upload a file first!");
    if (!String(file.type).startsWith("image/"))
      throw new Error("invalid file type");
    if (file.size > 5 * 1024 * 1024) throw new Error("image is too big");

    const formData = new FormData();
    formData.append("avatar", file);

    const isUpload = await axios.put(
      `api/v1/profile/user/${userId}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    if (!isUpload) throw new Error("failed to update the avatar");
    // return isUpload;
  } catch (error) {
    return error;
  }
}

export async function deleteUser(id) {
  const result = await axios.delete(`api/v1/user/${String(id).trim()}`);
  if (!result) throw new Error("failed to delete the user");
  return true;
}

export async function updatePermission(id, data) {
  if (!id) throw new Error("missing id field");
  if (!data) throw new Error("empty fields to update");
  const result = await axios.put(`/api/v1/user/roles/${id}`, data);
  if (!result) throw new Error("something went wrong");
  return result.data.result;
}

export async function fetchLogs() {
  const logs = await axios.get(`/api/v1/logs`);
  return logs.data.result;
}

export async function fetchEligibles() {
  const beneficiaries = await axios.get("/api/v1/eligible");
  return beneficiaries.data.result;
}

export async function verificationRequest(userId, data) {
  if (!data) throw new Error("undefined data");
  if (!userId) throw new Error("undefined user Id");
  const isSuccess = await axios.put(`/api/v1/eligible/${userId}`, data);
  return isSuccess.data;
}

export async function applyEligibility(id, data) {
  try {
    if (!id || !data) throw new Error("Missing ID or data");

    // Convert data to FormData if it isn't already
    let formData;
    if (data instanceof FormData) {
      formData = data;
    } else {
      formData = new FormData();
      // Explicitly append files and fields
      if (data.idFront) formData.append("idFront", data.idFront);
      if (data.idBack) formData.append("idBack", data.idBack);
      if (data.userPhoto) formData.append("userPhoto", data.userPhoto);

      formData.append("idNumber", data.idNumber);
      formData.append("idType", data.idType);
      formData.append("dateIssued", data.dateIssued);
      if (data.expiryDate) formData.append("expiryDate", data.expiryDate);
      if (data.typeOfDisability)
        formData.append("typeOfDisability", data.typeOfDisability);
    }

    // Pass the ID as a URL parameter, NOT in the body
    const response = await axios.post(`api/v1/eligible/${id}`, formData);

    if (!response) throw new Error("Failed to send request");
    return response.data;
  } catch (error) {
    throw error;
  }
}
