import React, { useState, useEffect } from "react";
import "./Profile.css";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaPencilAlt,
  FaCheck,
  FaCamera,
  FaIdBadge,
  FaBirthdayCake,
  FaVenusMars,
} from "react-icons/fa";
import { MdOutlineDescription } from "react-icons/md";

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatMemberDate(ts) {
  if (!ts) return null;
  const d = ts.toDate
    ? ts.toDate()
    : new Date(ts.seconds ? ts.seconds * 1000 : ts);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDOB(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const Profile = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    bio: "",
    photo: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [memberSince, setMemberSince] = useState(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setForm({
            name: data.name || user.displayName || "",
            email: data.email || user.email || "",
            phone: data.phone || "",
            dob: data.dob || "",
            gender: data.gender || "",
            bio: data.bio || "",
            photo: data.photo || "",
          });
          setMemberSince(data.createdAt || null);
          setProfileExists(true);
          setIsEditing(false);
        } else {
          setForm({
            name: user.displayName || "",
            email: user.email || "",
            phone: "",
            dob: "",
            gender: "",
            bio: "",
            photo: "",
          });
          setProfileExists(false);
          setIsEditing(true);
        }
      } catch (err) {
        console.error(err);
      }
    });
    return () => unsub();
  }, []);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function uploadImageToCloudinary(file) {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", "cinescope_upload");
    data.append("cloud_name", "cinescope");
    try {
      const res = await fetch(
        "https://api.cloudinary.com/v1_1/cinescope/image/upload",
        { method: "POST", body: data },
      );
      const result = await res.json();
      return result.secure_url || null;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  }

  async function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, photo: localUrl }));
    setUploading(true);
    const cloudUrl = await uploadImageToCloudinary(file);
    setUploading(false);
    if (cloudUrl) {
      setForm((prev) => ({ ...prev, photo: cloudUrl }));
      toast.success("Photo uploaded ✅");
      const user = auth.currentUser;
      if (user) {
        await setDoc(
          doc(db, "users", user.uid),
          { photo: cloudUrl },
          { merge: true },
        );
      }
    } else {
      toast.error("Photo upload failed ❌");
    }
  }

  async function handleSave() {
    const user = auth.currentUser;
    if (!user) {
      navigate("/login");
      return;
    }
    if (!form.name || !form.phone) {
      toast.error("Name and Phone are required");
      return;
    }
    try {
      await setDoc(doc(db, "users", user.uid), form, { merge: true });
      toast.success("Profile saved ✅");
      setIsEditing(false);
      setProfileExists(true);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong ❌");
    }
  }

  const InfoCard = ({ icon, label, children, fullWidth = false }) => (
    <div className={`info-card ${fullWidth ? "full-width" : ""}`}>
      <div className="info-card-header">
        <span className="info-icon">{icon}</span>
        <span className="info-label">{label}</span>
      </div>
      <div className="info-value">{children}</div>
    </div>
  );

  return (
    <div className="profile-wrapper">
      <div className="profile-page">
        <div className="profile-hero">
          <div className="avatar-wrap">
            {form.photo ? (
              <img src={form.photo} alt="avatar" className="avatar-img" />
            ) : (
              <div className="avatar-initials">{getInitials(form.name)}</div>
            )}
            <label
              className={`avatar-camera ${uploading ? "uploading" : ""}`}
              title="Change photo"
            >
              <FaCamera />
              <input
                type="file"
                accept="image/*"
                onChange={handleImage}
                hidden
              />
            </label>
            {uploading && <div className="upload-spinner" />}
          </div>

          <div className="hero-info">
            <h1 className="hero-name">{form.name || "Your Name"}</h1>
            {form.gender && <p className="hero-gender">{form.gender}</p>}
            <span className="hero-badge">
              <FaIdBadge /> CineScope Member
            </span>
          </div>
        </div>

        {!isEditing && (
          <div className="info-grid">
            <InfoCard icon={<FaUser />} label="NAME">
              {form.name || "—"}
            </InfoCard>
            <InfoCard icon={<FaEnvelope />} label="EMAIL ADDRESS">
              {form.email || "—"}
            </InfoCard>
            <InfoCard icon={<FaPhone />} label="PHONE NUMBER">
              {form.phone || "—"}
            </InfoCard>
            <InfoCard icon={<FaBirthdayCake />} label="DATE OF BIRTH">
              {formatDOB(form.dob)}
            </InfoCard>
            <InfoCard icon={<FaVenusMars />} label="GENDER">
              {form.gender || "—"}
            </InfoCard>
            <InfoCard icon={<MdOutlineDescription />} label="BIO" fullWidth>
              {form.bio || "—"}
            </InfoCard>
          </div>
        )}

        {isEditing && (
          <div className="edit-grid">
            <div className="edit-field">
              <label>
                Name <span className="req">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
              />
            </div>

            <div className="edit-field">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                disabled
              />
            </div>

            <div className="edit-field">
              <label>
                Phone <span className="req">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+91 1234567890"
              />
            </div>

            <div className="edit-field">
              <label>Date of Birth</label>
              <input
                type="date"
                name="dob"
                value={form.dob}
                onChange={handleChange}
              />
            </div>

            <div className="edit-field">
              <label>Gender</label>
              <div className="gender-options">
                {["Male", "Female", "Other"].map((g) => (
                  <label
                    key={g}
                    className={`gender-chip ${form.gender === g ? "active" : ""}`}
                  >
                    <input
                      type="radio"
                      name="gender"
                      value={g}
                      checked={form.gender === g}
                      onChange={handleChange}
                      hidden
                    />
                    {g}
                  </label>
                ))}
              </div>
            </div>

            <div className="edit-field full-width">
              <label>Bio</label>
              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                placeholder="Tell something about yourself..."
                rows={3}
              />
            </div>
          </div>
        )}

        <div className="profile-footer">
          {memberSince && (
            <p className="member-since">
              <FaCalendarAlt /> Member since: {formatMemberDate(memberSince)}
            </p>
          )}
          <button
            className="edit-profile-btn"
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          >
            {isEditing ? (
              <>
                <FaCheck /> Save Profile
              </>
            ) : (
              <>
                <FaPencilAlt /> Edit Profile
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
