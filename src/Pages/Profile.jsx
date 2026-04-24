import React, { useState, useEffect } from "react";
import "./Profile.css";
import { FaCamera } from "react-icons/fa";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
const Profile = () => {
  const [form, setForm] = useState({
    name: "",
    dob: "",
    gender: "",
    phone: "",
    email: "",
    photo: "",
  });

  const [isEditing, setIsEditing] = useState(true);
  const [profileExists, setProfileExists] = useState(false);
  const navigate = useNavigate();
  const [image, setImage] = useState(
    "https://cdn-icons-png.flaticon.com/512/149/149071.png",
  );

  async function uploadImageToCloudinary(file) {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "cinescope_upload");
    data.append("cloud_name", "CineScope");

    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/CineScope/image/upload",
        {
          method: "POST",
          body: data,
        },
      );

      const result = await res.json();
      return result.secure_url;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        return;
      }

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          setForm({
            name: data.name || "",
            email: data.email || "",
            dob: data.dob || "",
            gender: data.gender || "",
            phone: data.phone || "",
            photo: data.photo || "",
          });

          if (data.photo) {
            setImage(data.photo);
          }

          setProfileExists(true);
          setIsEditing(false);
        } else {
          setForm({
            name: user.displayName || "",
            email: user.email || "",
            dob: "",
            gender: "",
            phone: "",
          });
          setProfileExists(false);
          setIsEditing(true);
        }
      } catch (error) {
        console.error(error);
      }
    });

    return () => unsubscribe();
  }, []);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;

    setImage(URL.createObjectURL(file));

    const imageUrl = await uploadImageToCloudinary(file);

    if (imageUrl) {
      setForm((prev) => ({
        ...prev,
        photo: imageUrl,
      }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      toast.warning("Please login first ⚠️");
      navigate("/login");
      return;
    }
    if (!form.name || !form.phone) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await setDoc(doc(db, "users", user.uid), form, { merge: true });

      toast.success("Profile Saved ✅");

      setIsEditing(false);
      setProfileExists(true);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong ❌");
    }
  }

  return (
    <div className="profile-wrapper">
      <div className="profile-card">
        <div className="profile-image">
          <img src={form.photo || image} alt="profile" />

          <label className="edit-icon">
            <FaCamera />

            <input type="file" onChange={handleImage} hidden />
          </label>
        </div>

        <form onSubmit={handleSubmit}>
          <label>Name</label>

          <input
            type="text"
            name="name"
            placeholder="Enter name"
            value={form.name}
            onChange={handleChange}
            disabled={!isEditing && profileExists}
          />

          <label>Date of Birth</label>

          <input
            type="date"
            name="dob"
            value={form.dob}
            onChange={handleChange}
            disabled={!isEditing && profileExists}
          />

          <label>Gender</label>

          <div className="gender">
            <label>
              <input
                type="radio"
                name="gender"
                value="Male"
                checked={form.gender === "Male"}
                onChange={handleChange}
                disabled={!isEditing && profileExists}
              />
              Male
            </label>

            <label>
              <input
                type="radio"
                name="gender"
                value="Female"
                checked={form.gender === "Female"}
                onChange={handleChange}
                disabled={!isEditing && profileExists}
              />
              Female
            </label>
          </div>

          <label>Phone</label>

          <input
            type="text"
            name="phone"
            placeholder="+91 1234567890"
            value={form.phone}
            onChange={handleChange}
            disabled={!isEditing && profileExists}
          />

          <label>Email</label>

          <input
            type="email"
            name="email"
            placeholder="example@email.com"
            value={form.email}
            onChange={handleChange}
            disabled={true}
          />

          <button
            type="button"
            onClick={(e) => {
              if (isEditing) {
                handleSubmit(e);
              } else {
                setIsEditing(true);
              }
            }}
          >
            {isEditing ? "Save Changes" : "Edit Profile"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
