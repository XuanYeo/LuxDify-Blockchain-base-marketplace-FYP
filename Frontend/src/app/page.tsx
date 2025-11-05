"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Header from './component/Header/Header';
import Footer from './component/Footer/Footer';
import Background from './component/Background/background';
import "./home.css";

function VisitorHome() {
  const [popularProducts, setPopularProducts] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:3000/most-popular").then((res) => {
      if (res.data.success) {
        setPopularProducts(res.data.products);
      }
    });

    axios.get("http://localhost:3000/products/latest").then((res) => {
      if (res.data.success) {
        setProducts(res.data.products);
      }
    });

    const sections = document.querySelectorAll('.section');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.2 });

    sections.forEach((section) => observer.observe(section));
    return () => sections.forEach((section) => observer.unobserve(section));
  }, []);

  return (
    <div>
      <Background />
      <Header />

      <div className="home-container">

        {/* 🎯 Hero Banner Section */}
        <section className="hero-banner section animate-pop">
          <img
            src="../../Images/LuxDify _Logo_bg.png"
            alt="LuxDify Logo"
            className="hero-logo"
          />
          <h1 className="hero-title">Welcome to Our Marketplace!</h1>
          <p className="hero-subtitle">Discover the best products, powered by blockchain security 🔒</p>
          <Link href="/login" className="hero-btn">Join Us Now</Link>
        </section>

        {/* 🔥 Most Popular Products Section */}
        <section className="popular-products-section section">
          <h2 className="section-subtitle">🔥 Most Popular Products</h2>
          <div className="product-grid">
            {popularProducts.length === 0 ? (
              <p>No popular products yet.</p>
            ) : (
              popularProducts.map((product: any) => (
                <Link href={`/login`} key={product.Product_ID} className="product-card glow">
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
            <Link href="/login" className="explore-more-btn">
              🌟 Explore More
            </Link>
          </div>
        </section>

        {/* 🆕 Latest Products Section */}
        <section className="latest-products-section section">
          <h2 className="section-subtitle">🆕 Latest Products</h2>
          <div className="product-grid">
            {products.map((product: any) => (
              <Link href={`/login`} key={product.Product_ID} className="product-card glow">
                <img src={product.Image_URL} alt={product.P_Name} className="nft-img" />
                <div className="product-info">
                  <h4>{product.P_Name}</h4>
                  <p>{product.P_Price} LD</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="explore-more-wrapper">
            <Link href="/login" className="explore-more-btn">
              🌟 Explore More
            </Link>
          </div>
        </section>

        {/* 💡 Why Choose Us Section */}
        <section className="why-choose-section section">
          <h2 className="why-choose-title">💡 Why Choose Us?</h2>
          
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">Secure Payments</h3>
              <p className="feature-desc">All transactions protected by blockchain technology.</p>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">🏆</div>
              <h3 className="feature-title">Top Quality Products</h3>
              <p className="feature-desc">We only list products with verified quality standards.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">⚡</div>
              <h3 className="feature-title">Fast & Reliable</h3>
              <p className="feature-desc">Enjoy fast shipping and responsive customer service.</p>
            </div>

            <div className="feature-item">
              <div className="feature-icon">🛡️</div>
              <h3 className="feature-title">Trusted Platform</h3>
              <p className="feature-desc">Thousands of satisfied users across the globe.</p>
            </div>
          </div>
        </section>

        {/* 🚀 Call to Action Section */}
        <section className="call-to-action-section section">
          <h2 className="call-to-action-title">🚀 Ready to Start Your Journey?</h2>
          <p className="call-to-action-subtitle">Join LuxDify and explore the world of luxury now.</p>
          <Link href="http://localhost:3001/login?tab=register" className="call-to-action-btn">
            ✨ Create Your Account
          </Link>
        </section>

      </div>

      <Footer />
    </div>
  );
}

export default VisitorHome;
