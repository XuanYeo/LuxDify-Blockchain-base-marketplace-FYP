"use client";

import Image from "next/image";
import React, { useEffect, useState } from 'react';
import axios from "axios";
import Link from "next/link";
import UserHeader from '../component/UserHeader/userheader';
import Footer from '../component/Footer/Footer';
import Background from '../component/Background/background';
import walletService from '../services/WalletService';
import "../home.css";

function UserHome() {

  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState('0');
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [userName, setUserName] = useState("");
  const [products, setProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);

  useEffect(() => {
    const userId = parseInt(localStorage.getItem("userId") || "0");
    if (!userId) {
      alert("❌ Please log in first. ❌");
      window.location.href = "/login";
      return;
    }

    const connectWallet = async () => {
      try {
        const walletInfo = JSON.parse(localStorage.getItem('userWallet') || '{}');
        if (walletInfo?.privateKey) {
          const result = await walletService.connectWithPrivateKey(walletInfo.privateKey);
          if (result) {
            setWalletAddress(result.address);
            setWalletBalance(result.balance);
            setIsWalletConnected(true);
          }
        }
      } catch (error) {
        console.error("Failed to connect wallet:", error);
      }
    };
    connectWallet();

    axios.get(`http://localhost:3000/user/${userId}`).then((res) => {
      if (res.data.success) {
        setUserName(res.data.user.name);
      }
    });

    axios.get("http://localhost:3000/products/latest").then((res) => {
      if (res.data.success) {
        setProducts(res.data.products);
      }
    });

    axios.get("http://localhost:3000/most-popular").then((res) => {
      if (res.data.success) {
        setPopularProducts(res.data.products);
      }
    });

    const sections = document.querySelectorAll('.section');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.2,
    });

    sections.forEach((section) => {
      observer.observe(section);
    });
    return () => sections.forEach((section) => observer.unobserve(section));

  }, []);

  return (
    <div>
      <Background />
      <UserHeader />

      <div className="home-container">

        {/* ✨ Welcome Section */}
        <section className="welcome-section section animate-pop">
          <h1 className="welcome-title">Welcome back, {userName}!</h1>
          <p className="welcome-subtitle">Explore new products, manage your sales, and reload tokens easily 🚀</p>
        </section>

        {/* 🪙 Wallet Balance Section */}
        <section className="balance-section section">
          <h3>Your LD Token Balance</h3>
          <div className="token-balance">{walletBalance} LD</div>
        </section>

        {/* 🚀 Quick Action Buttons Section */}
        <section className="quick-actions section">
          <Link href="/user/portfolio/upload_product" className="quick-action-btn">➕ Upload Product</Link>
          <Link href="/user/my_order" className="quick-action-btn">📦 My Orders</Link>
          <Link href="/user/selling" className="quick-action-btn">🛒 My Selling</Link>
          <Link href="/user/reload_token" className="quick-action-btn">🔄 Purchase Tokens</Link>
        </section>

        {/* 🔥 Most Popular Products Section */}
        <section className="popular-products-section section">
          <h2 className="section-subtitle">🔥 Most Popular Products</h2>
          <div className="product-grid">
            {popularProducts.length === 0 ? (
              <p>No popular products yet.</p>
            ) : (
              popularProducts.map((product: any) => (
                <Link href={`/user/product/${product.Product_ID}`} key={product.Product_ID} className="product-card glow">
                  <img src={product.Image_URL} alt={product.P_Name} className="nft-img" />
                  <div className="product-info">
                    <h4>{product.P_Name}</h4>
                    <p>{product.P_Price} LD</p>
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="explore-more-wrapper">
            <Link href="/user/collection" className="explore-more-btn">
              🌟 Explore More
            </Link>
          </div>
        </section>

        {/* 🆕 Latest Products Section */}
        <section className="latest-products-section section">
          <h2 className="section-subtitle">🆕 Latest Products</h2>
          <div className="product-grid">
            {products.map((product: any) => (
              <Link href={`/user/product/${product.Product_ID}`} key={product.Product_ID} className="product-card glow">
                <img src={product.Image_URL} alt={product.P_Name} className="nft-img" />
                <div className="product-info">
                  <h4>{product.P_Name}</h4>
                  <p>{product.P_Price} LD</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="explore-more-wrapper">
            <Link href="/user/collection" className="explore-more-btn">
              🌟 Explore More
            </Link>
          </div>
        </section>

      </div>

      <Footer />
    </div>
  );
}

export default UserHome;
