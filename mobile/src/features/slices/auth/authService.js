import axios from "axios";
import { API_URL } from "../../../constants/config";
import { removeToken, storeEligibilityStatus, storeToken, storeUser } from "../../../utils/authUtil";

export async function loginApi({ email, password }) {
  if (!email.trim()) throw new Error("Email is required");
  if (!/\S+@\S+\.\S+/.test(email)) throw new Error("Invalid email format");
  if (!password) throw new Error("missing email field");

  const result = await axios.post(
    `${API_URL}api/v1/login`,
    { email, password },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
  const data = result.data.result;
  const isStored = await storeToken(data.token);
  storeUser(data.user);
  if (data.user.role === "user") storeEligibilityStatus(data.eligibilityStatus);
  if (!isStored) throw new Error("failed to store the user token");
  return data;
}

export async function verifyTokenApi(token) {
  const result = await axios.post(
    `${API_URL}api/v1/me`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!result) throw new Error("expired token, unauthorized access");

  const data = result.data.result;

  storeUser(data.user);
  if (data.user.role === "user") storeEligibilityStatus(data.eligibilityStatus);

  return data;
}

export async function registerApi(userData) {
  const isSuccess = await axios.post(`${API_URL}api/v1/register`, userData);
  if (isSuccess.data?.result?.token)
    await storeToken(isSuccess.data.result.token);

  storeUser(isSuccess.data.result.user);

  return isSuccess.data.result;
}
