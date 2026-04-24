import React, { useContext, useState } from "react";
import "./Login.css";
import { BiSolidCameraMovie } from "react-icons/bi";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { MovieContext } from "../Components/Router";
import { updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { FaEye, FaEyeSlash } from "react-icons/fa";
const Login = () => {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const location = useLocation();
  const pendingMovie = location.state?.pendingMovie || null;
  const openMood = location.state?.openMood || false;

  async function handleSignup(email, password) {
    if (password !== confirmPassword) {
      alert("Passwords do not match ❌");
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await updateProfile(userCred.user, {
        displayName: name,
      });

      await setDoc(doc(db, "users", userCred.user.uid), {
        name: name,
        email: email,
        theme: "dark",
        createdAt: serverTimestamp(),
      });

      alert("Signup successful ✅");

      navigate(nextPath, {
        state: {
          pendingMovie,
          openMood: openMood,
        },
      });
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleLogin(email, password) {
    try {
      await signInWithEmailAndPassword(auth, email, password);

      alert("Login successful ✅");
      navigate(nextPath, {
        state: {
          pendingMovie,
          openMood: openMood,
        },
      });
    } catch (err) {
      alert(err.message);
    }
  }
  async function handleForgotPassword() {
    if (!email) {
      alert("Please enter your email first ❗");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent 📩");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="logo-of-login">
          <BiSolidCameraMovie /> CineScope
        </h1>

        <h2>{isSignup ? "Create Your Account" : "Welcome Back"}</h2>

        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();

            if (isSignup) {
              handleSignup(email, password);
            } else {
              handleLogin(email, password);
            }
          }}
        >
          {isSignup && (
            <input
              type="text"
              placeholder="Enter Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <input
            required
            type="email"
            placeholder="Enter Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="password-field">
            <input
              required
              type={showPassword ? "text" : "password"}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <span onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {isSignup && (
            <div className="password-field">
              <input
                required
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <span
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          )}
          {!isSignup && (
            <p
              style={{
                color: "#facc15",
                cursor: "pointer",
                fontSize: "14px",
                marginTop: "5px",
                textAlign: "right",
              }}
              onClick={handleForgotPassword}
            >
              Forgot Password?
            </p>
          )}

          <button type="submit">{isSignup ? "Sign Up" : "Login"}</button>
        </form>

        <p className="signup-text">
          {isSignup ? "Already a CinePhile?" : "New To CineScope?"}{" "}
          <span onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Login" : "Sign Up"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default Login;
