import React, { useState } from 'react';
import './Footer.css';
import axios from 'axios';

const Footer: React.FC = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      alert("❌ Please enter a valid email address.");
      return;
    }

    try {
      const res = await axios.post("http://localhost:3000/subscribe", { email });
      if (res.data.success) {
        alert("✅ Subscription successful!");
        setEmail("");
      } else {
        alert("❌ Subscription failed.");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      alert("❌ Something went wrong.");
    }
  };

  return (
    <footer className="footer">
      <div className="subscribe">
        <strong>Get the updates</strong><br />
        <input
          type="email"
          placeholder="Enter your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={handleSubscribe}>Subscribe</button>
      </div>
      <div className="footer-category-label"><strong></strong></div>
      <div className="social-icons">
        <i className="fab fa-facebook"></i>
        <i className="fab fa-instagram"></i>
        <i className="fab fa-youtube"></i>
        <i className="fab fa-x-twitter"></i>
      </div>
      <div className="footer-bottom">
        <div>
          <a href="#">Terms</a> | <a href="#">Privacy policy</a>
        </div>
        <div>@ 2025 TP069256 FYP</div>
      </div>
    </footer>
  );
};

export default Footer;
