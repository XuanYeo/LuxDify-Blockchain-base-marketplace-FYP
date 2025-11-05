// Frontend: Next.js - app/product/owner/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import UserHeader from "../../../../component/UserHeader/userheader";
import Footer from "../../../../component/Footer/Footer";
import Background from "../../../../component/Background/background";
import "./userproduct.css";

const OwnerProductDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;

  const [product, setProduct] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("");
  const [fadeClass, setFadeClass] = useState("");

  useEffect(() => {
    if (productId) {
      axios.get(`http://localhost:3000/product/${productId}`).then((res) => {
        if (res.data.success) {
          setProduct(res.data.product);
          setDescription(res.data.product.P_Description);
          setPrice(res.data.product.P_Price);
          setStatus(res.data.product.status);
        }
      });
    }
  }, [productId]);

  const handleUpdate = async () => {
    try {
      setFadeClass("fade-out");
      setTimeout(async () => {
        await axios.put(`http://localhost:3000/product/${productId}/update`, {
          newDescription: description,
          newPrice: parseFloat(price),
          newStatus: status,
        });
        alert("✅ Product updated successfully.");
        setEditing(false);
        setFadeClass("fade-in");
      }, 400); // Match fade-out duration
    } catch (err) {
      console.error("❌ Update failed:", err);
      alert("❌ Failed to update product.");
    }
  };

  if (!product) return <div>Loading...</div>;
  
  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await axios.put(`http://localhost:3000/updateStatus/${productId}`, {
        newStatus,
      });

      if (res.data.success) {
        setStatus(newStatus);
        setProduct((prev: any) => ({ ...prev, status: newStatus }));
      } else {
        alert("Failed to update status.");
      }
    } catch (error) {
      console.error("Status update error:", error);
      alert("Error updating status.");
    }
  };

  return (
    <div className="product-page">
      <Background />
      <UserHeader />
      {/* 🚀 Back Button */}
      <div className="back-button-container">
        <button className="back-btn" onClick={() => router.back()}>
          &nbsp; &nbsp; &nbsp; Back
        </button>
      </div>
      <div className="product-detail-container">
        <img src={product.Image_URL} alt={product.P_Name} className="product-img" />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdate();
          }}
          className={`product-info ${fadeClass}`}
        >
          <h3 className="product-title">{product.P_Name}</h3>

          {editing ? (
            <>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="edit-input"
                rows={4}
                required 
              />
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="edit-input"
                required  
              />
              <div className="edit-actions">
                <button type="submit" className="confirm-btn">Save</button> {/* 👈 submit type */}
                <button
                  type="button"
                  onClick={() => {
                    setFadeClass("fade-out");
                    setTimeout(() => {
                      setEditing(false);
                      setFadeClass("fade-in");
                    }, 400);
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="product-description">{description}</p>
              <p className="category">📦 {product.Category}</p>
              <p className="price">💰 Price: {price} LD</p>
              {product.status === "not_available" ? (
                <div className="productStatus-tag disabled">Not Available</div>
              ) : (
                <select
                  className={`productStatus-tag ${status}`}
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                >
                  <option value="sales">For Sale</option>
                  <option value="not_for_sale">Not For Sale</option>
                </select>
              )}
              <button
                type="button"
                onClick={() => {
                  setFadeClass("fade-out");
                  setTimeout(() => {
                    setEditing(true);
                    setFadeClass("fade-in");
                  }, 400);
                }}
                className="edit-btn"
              >
                Edit Product
              </button>
            </>
          )}
        </form>
      </div>
      <Footer />
    </div>
  );
};

export default OwnerProductDetailPage;
