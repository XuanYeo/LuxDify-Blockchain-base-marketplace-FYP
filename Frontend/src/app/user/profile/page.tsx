"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import UserHeader from '../../component/UserHeader/userheader';
import Footer from '../../component/Footer/Footer';
import Background from '../../component/Background/background';
import "../../component/button.css";
import "./profile.css";

const UserProfile = () => {
  const [user, setUser] = useState<any>({});
  const [editMode, setEditMode] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showChangePassword, setShowChangePassword] = useState(false);

  const userId = localStorage.getItem("userId");

  useEffect(() => {
    if (!userId) return;
    axios.get(`http://localhost:3000/user/${userId}`).then((res) => {
      if (res.data.success) setUser(res.data.user);
    });
  }, [userId]);

  const updateProfile = async () => {
    try {
      const { name, email, gender, phone_number, address } = user;

      const res = await axios.put(`http://localhost:3000/user/${userId}/update`, {
        name,
        email,
        gender,
        phone_number,
        address,
      });
      if (res.data.success) {
        alert("✅ Profile updated.");
        setEditMode(false);
      } else alert("❌ Update failed.");
    } catch (err) {
      alert("❌ Error updating profile.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // returns "YYYY-MM-DD"
  };

  const changePassword = async () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return alert("❌ Password must contain uppercase, lowercase, and a number.");
    }
    if (newPassword !== confirmNewPassword) return alert("❌ Passwords do not match.");

    try {
      const res = await axios.put(`http://localhost:3000/user/${userId}/password`, {
        oldPassword,
        newPassword,
      });

      if (res.data.success) {
        alert("✅ Password changed.");
        setOldPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      } else {
        alert("❌ " + res.data.message);
      }
    } catch (err) {
      alert("❌ Failed to change password.");
    }
  };

  return (
    <div>
      <Background />
      <UserHeader />
        <div className="profile-container">
        <h2 className="profile-title">👤 My Profile</h2>

        <form className={`profile-section ${editMode ? 'animate-slide' : ''}`} onSubmit={(e) => { e.preventDefault(); }}>
          <label className="form-label">Name:</label>
          <input className="form-input" disabled={!editMode} value={user.name || ""} onChange={(e) => setUser({ ...user, name: e.target.value })} required />

          <label className="form-label">Email:</label>
          <input className="form-input" disabled={!editMode} value={user.email || ""} onChange={(e) => setUser({ ...user, email: e.target.value })} required />

          <label className="form-label">Gender:</label>
          <select className="form-input" disabled={!editMode} value={user.gender || ""} onChange={(e) => setUser({ ...user, gender: e.target.value })} required>
              <option value="">Select</option>
              <option value="pns">Prefer not to say</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
          </select>

          <label className="form-label">Date of Birth:</label>
          <input className="form-input" type="date" value={user.DOB ? formatDate(user.DOB) : ""} readOnly disabled />

          <label className="form-label">Phone Number:</label>
          <input className="form-input" disabled={!editMode} value={user.phone_number || ""} onChange={(e) => setUser({ ...user, phone_number: e.target.value })} required />

          <label className="form-label">Address:</label>
          <textarea className="form-input" disabled={!editMode} rows={3} value={user.address || ""} onChange={(e) => setUser({ ...user, address: e.target.value })} required />

          {editMode ? (
              <button className="btn save-btn" onClick={() => updateProfile()} type="submit">💾 Save Changes</button>
          ) : (
              <button className="btn edit-btn" onClick={() => setEditMode(true)}>✏️ Edit</button>
          )}
        </form>

        <hr />

        {!showChangePassword ? (
          <button className="btn change-btn" onClick={() => setShowChangePassword(true)}>
              🔐 Change Password
          </button>
        ) : (
          <form className={`password-section ${showChangePassword ? 'animate-slide' : ''}`} onSubmit={(e) => { e.preventDefault(); changePassword(); }}>
            <h3 className="section-title">🔐 Change Password</h3>
            <input
                className="form-input"
                type="password"
                placeholder="Old Password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
            />
            <input
                className="form-input"
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
            />
            <input
                className="form-input"
                type="password"
                placeholder="Confirm New Password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
            />
            <div className="button-row">
                <button className="btn change-btn" type="submit">🔁 Confirm Change</button>
                <button className="btn cancel-btn" type="button" onClick={() => setShowChangePassword(false)}>Cancel</button>
            </div>
          </form>

        )}

        </div>
      <Footer />
    </div>
  );
};

export default UserProfile;
