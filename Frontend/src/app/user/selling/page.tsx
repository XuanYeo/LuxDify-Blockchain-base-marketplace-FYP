"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import UserHeader from "../../component/UserHeader/userheader";
import Footer from "../../component/Footer/Footer";
import Background from "../../component/Background/background";
import "../../component/button.css";
import "./selling.css";

const MySellingPage = () => {
  const [orders, setOrders] = useState([]);
  const [sellerId, setSellerId] = useState<number | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (id) {
      const parsedId = parseInt(id);
      setSellerId(parsedId);

      axios
        .get(`http://localhost:3000/seller/${parsedId}/orders`)
        .then((res) => {
          if (res.data.success) {
            setOrders(res.data.orders);
          } else {
            alert("Failed to load your orders.");
          }
        })
        .catch((err) => {
          console.error("Error fetching seller orders:", err);
          alert("Something went wrong.");
        });
    } else {
      alert("User not logged in.");
    }
  }, []);

  const markAsDelivered = async (orderId: number) => {
    try {
      const res = await axios.put(
        `http://localhost:3000/order/${orderId}/deliver`
      );
      if (res.data.success) {
        alert(`🚚 Marked as out for delivery. OTP: ${res.data.otp}`);
        setOrders((prevOrders: any) =>
          prevOrders.map((order: any) =>
            order.Order_ID === orderId
              ? { ...order, Status: "out_for_delivery", OTP_Code: res.data.otp }
              : order
          )
        );
      }
    } catch (err) {
      alert("Failed to update order status.");
      console.error(err);
    }
  };

  const rejectOrder = async (orderId: number) => {
    const confirmReject = confirm("Are you sure you want to reject this order? The payment will be refunded to the buyer.");
    if (!confirmReject) return;
  
    try {
      const res = await axios.post(`http://localhost:3000/order/${orderId}/reject`);
      if (res.data.success) {
        alert("➡️ Order rejected. Tokens refunded to buyer.");

        // Remove the rejected order from UI
        setOrders((prevOrders: any) =>
          prevOrders.filter((order: any) => order.Order_ID !== orderId)
        );
      } else {
        alert("❌ Failed to reject order.");
      }
    } catch (err) {
      console.error("Reject order error:", err);
      alert("❌ Blockchain or server error during rejection.");
    }
  };

  return (
    <div>
      <Background />
      <UserHeader />

      <div className="seller-orders-container">
        <h2 className="section-title highlight-title">My Selling Orders</h2>

        {orders.length === 0 ? (
          <p className="no-orders">No selling orders yet.</p>
        ) : (
          <div className="order-card-grid">
            {orders.map((order: any) => (
              <div className="order-card" key={order.Order_ID}>
                <div className={`status-badge status-${order.Status.replaceAll(' ', '-')}`}>
                  {order.Status.replace(/_/g, " ")}
                </div>
              
                <div className="order-card-body">
                  <img src={order.Image_URL} alt={order.P_Name} className="order-product-img" />
              
                  <div className="order-details">
                    <p><strong>📦 {order.P_Name}</strong> (ID: {order.Product_ID})</p>
                    <p>👤 Buyer: {order.Buyer_Name} (ID: {order.Buyer_ID})</p>
                    <div className="address-box">
                      🏠 {order.Buyer_Address}
                    </div>
                    <p>💰 Price: {order.Price} LD</p>
              
                    {order.Status === "out_for_delivery" && (
                      <p>🔐 OTP Code: <strong>{order.OTP_Code}</strong></p>
                    )}
                  </div>
                </div>
              
                <div className="order-action-buttons">
                  {order.Status === "pending" && (
                    <>
                      <button className="delivery-btn" onClick={() => markAsDelivered(order.Order_ID)}>
                        Out for Delivery
                      </button>
                      <button className="cancel-btn" onClick={() => rejectOrder(order.Order_ID)}>
                        Reject Order
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MySellingPage;
