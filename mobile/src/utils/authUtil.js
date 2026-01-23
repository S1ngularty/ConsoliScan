import asyncStorage from "@react-native-async-storage/async-storage";

export const storeToken = async (token) => {
  const isStored = await asyncStorage.setItem("token", token);
  if (isStored) return true;
  return false;
};

export const getToken = async () => {
  const token = await asyncStorage.getItem("token");
  cont;
};

export const removeToken = async () => {
  const isRemoved = await asyncStorage.removeItem("token");
  if (isRemoved) return true;
  return false;
};
