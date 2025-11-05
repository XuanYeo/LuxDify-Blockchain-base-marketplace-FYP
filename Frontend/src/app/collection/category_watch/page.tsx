"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Background from "../../component/Background/background";
import Footer from "../../component/Footer/Footer";
import Header from "../../component/Header/Header";
import "../../component/button.css";
import "../collection.css";


const CollectionPage: React.FC = () => {
  const [products, setProducts] = useState([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  useEffect(() => {
    const uid = localStorage.getItem("userId");
    if (uid) {
      const parsedId = parseInt(uid);
      setUserId(parsedId);

      // Fetch user's favorite product IDs
      axios.get(`http://localhost:3000/favorites/${parsedId}`).then((res) => {
        if (res.data.success) {
          setFavoriteIds(res.data.favoriteIds.map((id: any) => Number(id)));
        }
      });
    }

    // Fetch all sale products
    axios
      .get("http://localhost:3000/collection/watch")
      .then((res) => {
        if (res.data.success) {
          setProducts(res.data.products);
        } else {
          alert("Failed to load collection.");
        }
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        alert("Something went wrong.");
      });
  }, []);

  return (
    <div>
      <Background />
      <Header />
      <div className="collection-wrapper">
        {/* Sidebar for filtering */}
        <aside className="filter-sidebar">
          <h3>Categories</h3>
          <ul>
            <li><Link href="/collection" className="dropdown_a">All</Link></li>
            <li><Link href="/collection/category_bag" className="dropdown_a">Bag</Link></li>
            <li><Link href="/collection/category_jewelry" className="dropdown_a">Jewelry</Link></li>
            <li><Link href="/collection/category_watch" className="dropdown_a">Watch</Link></li>
            <li><Link href="/collection/category_perfume" className="dropdown_a">Perfume</Link></li>
          </ul>
        </aside>
        <div className="collection-container">
          <h2 className="section-title highlight-title">LuxDify Collection - Watch</h2>
          <div className="product-card-grid">
            {products.map((product: any) => {
              const isOwner = userId === product.Owner_ID;
              const isFavorite = favoriteIds.includes(product.Product_ID);
              return (
                <Link href={`/login`} key={product.Product_ID} className="product-card" style={isOwner ? { boxShadow: "0 0 8px red" } : {}}>
                  <img src={product.Image_URL} alt={product.P_Name} className="nft-img" />
                  <div className="card-content">
                    <h3 className="product-title">{product.metadata?.name || product.P_Name}</h3>
                    <p className="product-description truncate-description">{product.metadata?.description || product.P_Description}</p>
                    <div className="info-row">
                      <span className="price">
                        💰 {product.metadata?.attributes?.find((a: any) => a.trait_type === "Price")?.value || product.P_Price} LD
                      </span>
                      <span className="category">
                        {product.metadata?.attributes?.find((a: any) => a.trait_type === "Category")?.value || product.Category}
                      </span>
                    </div>
                  </div>

                  {/* 🧍 Owner tag */}
                  {isOwner ? (
                    <div className="owner-tag">👤 You (Owner)</div>
                  ) : (
                    <div className="owner-info">👤 {product.ownerName} (ID: {product.Owner_ID})</div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CollectionPage;