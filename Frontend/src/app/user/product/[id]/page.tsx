// Frontend: Next.js - app/product/[id]/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import UserHeader from "../../../component/UserHeader/userheader";
import Footer from "../../../component/Footer/Footer";
import Background from "../../../component/Background/background";
import "./product_detail.css";

const ProductDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id;

  const [product, setProduct] = useState<any>(null);
  const [transactions, setTransactions] = useState([]);
  const [otpInput, setOtpInput] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (id) setUserId(parseInt(id));

    if (productId) {
      axios.get(`http://localhost:3000/product/${productId}`).then((res) => {
        if (res.data.success) {
          setProduct(res.data.product);
          console.log(res.data.product);
        }
      });

      axios.get(`http://localhost:3000/product/${productId}/transactions`).then((res) => {
        if (res.data.success) {
          setTransactions(res.data.transactions);
        }
      });
    }
  }, [productId]);

   const handleBuyConfirm = async () => {
    try {
        const walletInfo = JSON.parse(localStorage.getItem("userWallet") || "{}");
        const response = await axios.post(`http://localhost:3000/buy/${productId}`, {
          buyerId: userId,
          buyerPrivateKey: walletInfo.privateKey,
        });
        alert("✅ Your order has been sent to owner.");
        setShowModal(false);
        // window.location.reload();
        window.location.href = "/user/my_order";
      } catch (err) {
        alert("❌ Purchase failed.");
      }
    };

  if (!product) return <div>Loading...</div>;

  return (
    <div>
      <Background />
      <UserHeader />
      {/* 🚀 Back Button */}
      <div className="back-button-container">
        <button className="back-btn" onClick={() => router.back()}>
          &nbsp; &nbsp; &nbsp; Back
        </button>
      </div>

      <div className="product-detail-wrapper">
        <div className="top-section">
          <div className="left-section">
            <img src={product.Image_URL} alt={product.P_Name} className="product-img" />
          </div>

          <div className="right-section">
            <h2 className="product-title">{product.P_Name}</h2>
            <p className="product-description">{product.P_Description}</p>
            <p className="category">📦 {product.Category}</p>
            <p className="category">👤 Owner: {product.Owner_Name} (ID: {product.Owner_ID})</p>
            <p className="price">💰 Price: {product.P_Price} LD</p>

            {product.status === "sales" && userId !== product.Owner_ID && (
              <button className="buy-button" onClick={() => setShowModal(true)}>
                Buy Product
              </button>
            )}
          </div>
        </div>

        <div className="transaction-history">
          <h3>🧾 Transaction History</h3>
          {transactions.length === 0 ? (
            <p>No transactions yet.</p>
          ) : (
            <ul>
              {transactions.map((tx: any, idx: number) => (
                <li key={idx}>
                  🕓 {tx.Created_At} - {tx.Status}<br />
                  👤 Buyer: {tx.Buyer_ID} | 🛍️ Seller: {tx.Seller_ID}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Purchase</h3>
            <p>Buy for {product.P_Price} LD?</p>
            <div className="modal-actions">
              <button className="confirm-btn" onClick={handleBuyConfirm}>Confirm</button>
              <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ProductDetailPage;
