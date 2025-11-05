"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import Background from "../../component/Background/background";
import Footer from "../../component/Footer/Footer";
import UserHeader from "../../component/UserHeader/userheader";
import "../../component/button.css";
import "./favorite.css";

const FavoritesPage: React.FC = () => {
  const [products, setProducts] = useState([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);

  useEffect(() => {
    const uid = localStorage.getItem("userId");
    if (uid) {
      const parsedId = parseInt(uid);
      setUserId(parsedId);

      // Step 1: Get user's favorite IDs
      axios.get(`http://localhost:3000/favorites/${parsedId}`).then((res) => {
        if (res.data.success) {
          const favIds = res.data.favoriteIds.map((id: any) => Number(id));
          setFavoriteIds(favIds);

          // Step 2: Fetch all products and filter by favIds
          axios.get("http://localhost:3000/collection").then((res2) => {
            if (res2.data.success) {
              const filtered = res2.data.products.filter((p: any) => favIds.includes(p.Product_ID));
              setProducts(filtered);
            }
          });
        }
      });
    }
  }, []);

  const toggleFavorite = async (productId: number) => {
    if (!userId) return alert("Please log in first.");

    const isFav = favoriteIds.includes(productId);
    try {
      if (isFav) {
        await axios.delete("http://localhost:3000/favorite", {
          data: { userId, productId },
        });
        setFavoriteIds((prev) => prev.filter((id) => id !== productId));
        setProducts((prev) => prev.filter((p: any) => p.Product_ID !== productId));
      }
    } catch (err) {
      console.error("Unfavorite failed:", err);
      alert("Failed to unfavorite.");
    }
  };

  return (
    <div>
      <Background />
      <UserHeader />
      <div className="collection-container">
        <h2 className="section-title">❤️ My Favorites</h2>
        <div className="product-card-grid">
          {products.length === 0 ? (
            <p className="no-products">You haven’t favorited any products yet.</p>
          ) : (
            products.map((product: any) => {
              const isOwner = userId === product.Owner_ID;
              const isFavorite = favoriteIds.includes(product.Product_ID);
              return (
                <Link
                  href={`/user/product/${product.Product_ID}`}
                  key={product.Product_ID}
                  className="product-card"
                  style={isOwner ? { boxShadow: "0 0 8px red" } : {}}
                >
                  <img src={product.Image_URL} alt={product.P_Name} className="nft-img" />
                  {/* Favorite toggle (only unfav here) */}
                  <div
                    className="favorite-icon"
                    onClick={(e) => {
                      toggleFavorite(product.Product_ID);
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <i className={isFavorite ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
                  </div>
                  {isOwner ? (
                    <div className="owner-tag">You (Owner)</div>
                  ) : (
                    <div className="owner-info">{product.ownerName} (ID: {product.Owner_ID})</div>
                  )}
                  {/* Card Content */}
                  <div className="card-content">
                    <h3 className="product-title">{product.metadata?.name || product.P_Name}</h3>
                    <p className="product-description truncate-description">{product.metadata?.description || product.P_Description}</p>
                    <div className="info-row">
                      <span className="price">
                        💰 {product.metadata?.attributes?.find((a: any) => a.trait_type === "Price")?.value || product.P_Price} LD
                      </span>
                      <span className="category">
                        📦 {product.metadata?.attributes?.find((a: any) => a.trait_type === "Category")?.value || product.Category}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FavoritesPage;
