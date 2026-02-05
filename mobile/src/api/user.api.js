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
