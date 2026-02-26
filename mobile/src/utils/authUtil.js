import asyncStorage from "@react-native-async-storage/async-storage";
import { get } from "lodash";

export const storeToken = async (token) => {
  const isStored = await asyncStorage.setItem("token", token);
 return true
};

export const getToken = async () => {
  const token = await asyncStorage.getItem("token");
  return token
};

export const removeToken = async () => {
  const isRemoved = await asyncStorage.removeItem("token");
  if (isRemoved) return true;
  return false;
};

export const storeUser = async (user) => {
  const isStored = await asyncStorage.setItem("user", JSON.stringify(user));
  if (isStored) return true;
  return false;
}

export const getUser = async () => {
  const user = await asyncStorage.getItem("user");
  return JSON.parse(user);
}

export const storeEligibilityStatus = async (status) => {
  console.log("Storing eligibility status:", status);
  const isStored = await asyncStorage.setItem("eligibilityStatus", JSON.stringify(status));
  if (isStored) return true;
  return false;
}

export const getEligibilityStatus = async () => {
  const status = await asyncStorage.getItem("eligibilityStatus");
  return JSON.parse(status);
}
