import axios from "axios";
import { API_URL } from "../constants/config";
import { removeToken,storeToken } from "../utils/authUtil";

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
  const data = result.data.result
  const isStored =await storeToken(data.token)
  if(isStored) throw new Eror("failed to store the user token")
  return data;
}

export async function VerifyToken(token){
  const result = await axios.post(`${API_URL}/api/v1/verifyToken`,{},{
    headers:{
      "Authorization":`Bearer ${token}`
    }
  })

  if(!result) return 

  return result.data.result
 }
