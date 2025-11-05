"use client";
import React, { useState } from "react";
import axios from "axios";
import Background from "../../component/Background/background";
import Footer from "../../component/Footer/Footer";
import Header from "../../component/Header/Header";
import "../../component/button.css";
import "./forget_password.css";

const ForgetPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:3000/forgot-password", { email });
      setMessage(res.data.message);
    } catch (error) {
      setMessage("Failed to send reset email. Please try again.");
    }
  };

  return (
    <div>
      <Background />
      <Header />
      <div className="forget-container">
        <h2>🔐 Forgot Password</h2>
        <form onSubmit={handleSubmit}>
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button type="submit">Send Reset Link</button>
        </form>
        {message && <p className="response-msg">{message}</p>}
      </div>
      <Footer />
    </div>
  );
};

export default ForgetPassword;
