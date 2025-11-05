"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import UserHeader from '../../component/UserHeader/userheader';
import Footer from '../../component/Footer/Footer';
import Background from '../../component/Background/background';
import "./reload_token.css";

const TokenReload = () => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const userId = parseInt(localStorage.getItem("userId") || "0");
  const walletInfo = JSON.parse(localStorage.getItem("userWallet") || "{}");

  const tokenOptions = ["100", "200", "500", "1000", "1500", "2000", "5000", "10000", "20000"];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert("Please log in first.");
      window.location.href = "/login";
      return;
    }

    if (!imageFile) {
      alert("Please upload a proof of transaction.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("user_id", userId.toString());
      formData.append("amount", amount);
      formData.append("proof", imageFile); // 👈 image proof file

      const res = await axios.post("http://localhost:3000/token-reload-request", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        alert("✅ Token reload request submitted to admin.");
        setAmount("");
        setImageFile(null);
      } else {
        alert("❌ Failed to submit request.");
      }
    } catch (err) {
      console.error("Request error:", err);
      alert("❌ Server error.");
    }

    setLoading(false);
  };

  return (
    <div>
      <Background />
      <UserHeader />

      <div className="token-reload-container">
        <h2>🪙 Purchase LD Token</h2>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <label>Select amount:</label>
          <select value={amount} onChange={(e) => setAmount(e.target.value)} required>
            <option value="">-- Select LD Amount --</option>
            {tokenOptions.map(opt => (
              <option key={opt} value={opt}>{opt} LD</option>
            ))}
          </select>

          <label>Upload Proof of Transaction:</label>
          <input type="file" accept="image/*" onChange={handleImageChange} required />

          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default TokenReload;
