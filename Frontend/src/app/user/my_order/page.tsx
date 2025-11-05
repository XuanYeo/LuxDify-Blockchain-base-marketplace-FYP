"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Background from "../../component/Background/background";
import Footer from "../../component/Footer/Footer";
import UserHeader from "../../component/UserHeader/userheader";
import "./my_order.css";

const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [otpInput, setOtpInput] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [tokenId, setTokenId] = useState<string | null>(null);
  const [metadataUrl, setMetadataUrl] = useState<string | null>(null);


  useEffect(() => {
    const buyerId = localStorage.getItem("userId");
    axios.get(`http://localhost:3000/buyer/orders/${buyerId}`).then((res) => {
      if (res.data.success) setOrders(res.data.orders);
    });
  }, []);

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "status-pending";
      case "out_for_delivery":
        return "status-out-for-delivery";
      case "delivered":
        return "status-delivered";
      default:
        return "";
    }
  };
  const formatStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "Pending";
      case "out_for_delivery":
        return "Out Of Delivery";
      case "delivered":
        return "Delivered";
      default:
        return status;
    }
  };

  const fetchNFTMetadata = async (metadataUrl: string) => {
    try {
      const metadataRes = await axios.get(metadataUrl);
      return metadataRes.data;
    } catch (error) {
      console.error("❌ Failed to fetch NFT metadata:", error);
      return null;
    }
  };

  const handleOtpConfirm = async () => {
    const wallet = JSON.parse(localStorage.getItem("userWallet") || "{}");
    try {
      const res = await axios.post(
        `http://localhost:3000/buyer/confirm-receipt/${selectedOrder.Product_ID}`,
        {
          privateKey: wallet.privateKey,
          otp: otpInput,
        }
      );

      if (res.data.success) {
        alert("✅ Order confirmed and NFT is being transferred.");
        setTokenId(selectedOrder.NFT_TokenID); // 从订单信息中获取 tokenId
        setMetadataUrl(selectedOrder.NFT_Metadata_URL); // 从订单信息中获取 metadataUrl
        console.log("Token ID:", selectedOrder.NFT_TokenID);
        console.log("Metadata URL:", selectedOrder.NFT_Metadata_URL);

        if (window.ethereum && selectedOrder.NFT_Metadata_URL && selectedOrder.NFT_TokenID) {
          const metadata = await fetchNFTMetadata(selectedOrder.NFT_Metadata_URL);
          if (metadata && metadata.image) {
            try {
              console.log("✅ Token ID:", selectedOrder.NFT_TokenID);
              console.log("✅ Image:", metadata.image);
              console.log("✅ Metadata:", metadata);
              await window.ethereum.request({
                method: "wallet_watchAsset",
                params: {
                  type: "ERC721",
                  options: {
                    address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // 合约地址
                    tokenId: selectedOrder.NFT_TokenID,
                    image: metadata.image,
                    symbol: "LD",
                    decimals: 0,
                  },
                },
              });
              console.log("✅ 请求买家添加接收到的 NFT 到 MetaMask");
              alert("✅ NFT transferred! Please check your MetaMask to add the NFT.");
            } catch (addErr) {
              console.error("❌ MetaMask NFT add request failed:", addErr);
              alert("NFT transferred successfully, but failed to request adding to MetaMask. Please add it manually.");
            }
          } else {
            alert("NFT transferred successfully, but image URL not found. Please add it manually.");
          }
        } else {
          alert("NFT transferred successfully, but MetaMask not detected or metadata URL/Token ID missing. Please add it manually.");
        }
        window.location.reload();
      } else {
        alert("❌ OTP confirmation failed.");
      }
    } catch (err) {
      alert("❌ OTP confirmation failed.");
      console.error("❌ OTP confirmation error:", err);
    }
  };

  return (
    <div>
      <Background />
      <UserHeader />
      <div className="orders-container">
        <h2>🧾 My Orders</h2>
        <ul>
          {orders.map((order: any) => (
            <li key={order.Product_ID} className="order-item">
              <div className="order-left">
                <img src={order.Image_URL} alt={order.P_Name} />
                <div className="order-details">
                  <p className="product-name"><strong>{order.P_Name}</strong></p>
                  <p className="product-price">💰 {order.P_Price} LD</p>
                  <p className="seller-info">🛍️ {order.Seller_Name} (ID: {order.Seller_ID})</p>
                  <p className={`order-status ${getStatusClass(order.Status)}`}>
                    {formatStatusText(order.Status)}
                  </p>
                </div>
              </div>
              {order.Status === "out_for_delivery" && (
                <button className="confirm-button" onClick={() => setSelectedOrder(order)}>
                  Confirm Received
                </button>
              )}
            </li>
          ))}
        </ul>

        {selectedOrder && (
          <div className="modal-overlay">
            <form 
              className="modal-content"
              onSubmit={(e) => {
                e.preventDefault();
                handleOtpConfirm();
              }}
            >
              <h3>Enter OTP for: {selectedOrder.P_Name}</h3>
              <input
                type="text"
                className="otp-input"
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="Enter OTP"
                required // ✅ Add required here
              />
              <div className="modal-actions">
                <button type="submit">Confirm OTP</button> {/* ✅ Submit button */}
                <button type="button" onClick={() => setSelectedOrder(null)}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default MyOrdersPage;
