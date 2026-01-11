import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_APP_API;

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
        lastLogin: user.lastLogin,
      };
    });
    return toDisplay;
  } catch (error) {
    console.log(error);
    return error;
  }
}

export async function getOneUser(id) {
  try {
    const result = await axios.get(`api/v1/user/${id}`);
    if (!result) throw new Error("failed to get the user");
    const data = result.data;
    return data;
  } catch (error) {
    console.log(error);
  }
}
