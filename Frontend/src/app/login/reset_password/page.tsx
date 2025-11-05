"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams, useRouter } from "next/navigation";
import Background from "../../component/Background/background";
import Footer from "../../component/Footer/Footer";
import Header from "../../component/Header/Header";
import "../../component/button.css";
import "./reset_password.css";

const ResetPassword: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [message, setMessage] = useState("");

  const token = searchParams.get("token");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage("❌ Passwords do not match.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:3000/reset-password", {
        token: token,
        newPassword: newPassword
      });

      if (res.data.success) {
        setMessage("✅ Password has been reset successfully.");
        setTimeout(() => router.push("/login?tab=login"), 2000);
      } else {
        setMessage("❌ Reset failed.");
      }
    } catch (err) {
      setMessage("❌ Invalid or expired link.");
    }
  };

  return (
    <div>
      <Background />
      <Header />
      <div className="reset-container">
        <h2>🔑 Reset Password</h2>
        <form onSubmit={handleReset}>
          <label>New Password:</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const value = e.target.value;
              setNewPassword(e.target.value);

              // Check password validity
              const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
              setPasswordError(passwordRegex.test(value) ? "" : "Password must contain uppercase, lowercase, and a number.");
            }}
            required
          />
          {passwordError && (
              <p className="error-message">{passwordError}</p>
          )}

          <label>Confirm Password:</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <button type="submit">Reset Password</button>
        </form>
        {message && <p className="response-msg">{message}</p>}
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
