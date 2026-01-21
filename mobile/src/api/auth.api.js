import axios from "axios";
import { API_URL } from "../constants/config";

export async function login(email, password) {
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

  return result.data.result;
}
