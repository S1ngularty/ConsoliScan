import { app } from "../configs/firebase.js";
import { signInWithPopup, getAuth, GoogleAuthProvider } from "firebase/auth";
import axios from "axios";

export async function googleSignIn(navigate) {
  try {
    const auth = getAuth(app);
    const googleProvider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, googleProvider);
    const token = await result.user.getIdToken();
    const authenticate = await axios.post(
      `${import.meta.env.VITE_APP_API}api/v1/signIn`,
      { token },
      {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      }
    );

    if (!authenticate)
      throw new Error("failed to authecticate, please try again");
    const data = authenticate.data;
    sessionStorage.setItem("isLogin","true")
    navigate("/admin/dashboard");
    return true;
  } catch (error) {
    return console.log(error);
  }
}

export async function autoLogin(navigate) {
  const authenticate = await axios.post(
    `${import.meta.env.VITE_APP_API}api/v1/me`,
    {},
    { headers: {}, withCredentials: true }
  );
  if (!authenticate) throw new Error("failed to authenticate using token");
  const data = authenticate.data;
  sessionStorage.setItem("isLogin","true")
  navigate("/admin/dashboard");
}
