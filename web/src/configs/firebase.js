// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth} from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBl8h0yP64HWD4FMtHMQKC--FAEoNhMADs",
  authDomain: "singularity-9b3ba.firebaseapp.com",
  projectId: "singularity-9b3ba",
  storageBucket: "singularity-9b3ba.firebasestorage.app",
  messagingSenderId: "1004361058566",
  appId: "1:1004361058566:web:200f85d2155bd86173b687",
  measurementId: "G-332N7E06EH"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

