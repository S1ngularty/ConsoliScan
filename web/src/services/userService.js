import axios from "axios";
import { timeAgo } from "../utils/parseDate";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_APP_API;
axios.defaults.headers.put["Content-Type"] = "application/json";
axios.defaults.headers.post["Content-Type"] = "application/json";

export async function getAllUser() {
  try {
    const result = await axios.get(`api/v1/user`);
    if (!result) throw new Error("failed to access the resource");
    console.log(result.data);
    const data = result.data.result;
    let toDisplay = data.map((user) => {
      return {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status:user.status,
        lastLogin: timeAgo(user.lastLogin),
      };
    });
    return toDisplay;
  } catch (error) {
    console.log(error);
    return error;
  }
}

export async function getOneUser(id = "") {
  try {
    const result = await axios.get(`api/v1/user/${id}`);
    if (!result) throw new Error("failed to get the user");
    const data = result.data;
    return data;
  } catch (error) {
    console.log(error);
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
    console.log(error);
    return error;
  }
}
