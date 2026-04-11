import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAiMNekGg16XP_7wBv8IgVfLXL2ARUyw_Y",
  authDomain: "cinescope-ab6b5.firebaseapp.com",
  projectId: "cinescope-ab6b5",
  storageBucket: "cinescope-ab6b5.firebasestorage.app",
  messagingSenderId: "730715543244",
  appId: "1:730715543244:web:d428fd17b369e14aa99469",
  measurementId: "G-49M71C1R58"
};

const app=initializeApp(firebaseConfig);
export const auth=getAuth(app);
export const db=getFirestore(app);