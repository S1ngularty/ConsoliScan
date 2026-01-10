import { app } from "../configs/firebase.js";
import { signInWithPopup, getAuth, GoogleAuthProvider } from "firebase/auth";

export async function googleSignIn() {
  try {
    console.log(`${import.meta.env.VITE_APP_API}api/v1/signIn`);
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
    console.log(data);
  } catch (error) {
    return console.log(error);
  }
}
