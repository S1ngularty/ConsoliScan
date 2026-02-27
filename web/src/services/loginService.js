import { app } from "../configs/firebase.js";
import { signInWithPopup, getAuth, GoogleAuthProvider } from "firebase/auth";
import axios from "axios";

export async function signIn(email, password, navigate) {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_APP_API}api/v1/login`,
      { email, password },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      },
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "Login failed");
    }

    const data = response.data;
    sessionStorage.setItem("isLogin", "true");
    // Redirect based on role
    const role = data.user?.role || data.role;
    if (role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/user/dashboard");
    }

    return true;
  } catch (error) {
    console.error(
      "Login Error:",
      error.response?.data?.message || error.message,
    );
    throw new Error(
      error.response?.data?.message || "Invalid email or password",
    );
  }
}

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
      },
    );

    if (!authenticate)
      throw new Error("failed to authecticate, please try again");
    const data = authenticate.data;
    sessionStorage.setItem("isLogin", "true");

    // Redirect based on role
    if (data.result?.role === "admin" || data.role === "admin") {
      navigate("/admin/dashboard");
    } else {
      navigate("/user/dashboard");
    }

    return true;
  } catch (error) {
    throw new Error(error);
  }
}

export async function autoLogin(navigate) {
  const authenticate = await axios.post(
    `${import.meta.env.VITE_APP_API}api/v1/me`,
    {},
    { headers: {}, withCredentials: true },
  );
  if (!authenticate) throw new Error("failed to authenticate using token");
  const data = authenticate.data.result;
  sessionStorage.setItem("isLogin", "true");
  if (data.user?.role === "admin" || data.role === "admin") {
    navigate("/admin/dashboard");
  } else {
    navigate("/user/dashboard");
  }
}

export async function register(userData, navigate) {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_APP_API}api/v1/register`,
      userData,
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      },
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "Registration failed");
    }

    const data = response.data;
    sessionStorage.setItem("isLogin", "true");

    // Redirect to user dashboard
    navigate("/user/dashboard");

    return true;
  } catch (error) {
    console.error(
      "Registration Error:",
      error.response?.data?.message || error.message,
    );
    throw new Error(error.response?.data?.message || "Registration failed");
  }
}
