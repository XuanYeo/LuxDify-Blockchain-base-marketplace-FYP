"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminHeader from '../../component/AdminHeader/adminheader';
import Footer from '../../component/Footer/Footer';
import Background from '../../component/Background/background';
import "./admin_reload.css";

const AdminTokenReload = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await axios.get("http://localhost:3000/token/pending-requests");
      if (res.data.success) setRequests(res.data.data);
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (request_id: number) => {
    const adminKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // input your admin wallet address private key
    if (!adminKey) return;
  
    try {
      const res = await axios.post("http://localhost:3000/token/approve", {
        request_id,
        adminPrivateKey: adminKey,
      });
      alert(res.data.message);
      fetchRequests(); // Refresh after approval
    } catch (err: any) {
      console.error("Approval error:", err);
      alert("❌ Failed to approve: " + (err.response?.data?.error || err.message));
    }
  };

  const handleReject = async (request_id: number) => {
    const admin_reason = prompt("Enter rejection reason:");
    if (!admin_reason) return;

    try {
      const res = await axios.post("http://localhost:3000/token/reject", {
        request_id,
        admin_reason
      });
      alert(res.data.message);
      fetchRequests();
    } catch (err: any) {
        console.error("Approval error:", err);
      alert("Failed to reject: " + err.message);
    }
  };

  return (
    <div>
      <Background />
      <AdminHeader />

      <div className="admin-token-reload">
        <h2>📄 Pending LD Token Purchase Requests</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="reload-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Wallet</th>
                <th>Amount</th>
                <th>Proof</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req: any) => (
                <tr key={req.request_id}>
                  <td>{req.user_id}</td>
                  <td>{req.name}</td>
                  <td>{req.email}</td>
                  <td>{req.wallet}</td>
                  <td>{req.amount}</td>
                  <td>
                    <a href={req.proof_path} target="_blank" rel="noreferrer" className="proof-btn">
                      View Proof
                    </a>
                  </td>
                  <td>{req.status}</td>
                  <td>
                    <button onClick={() => handleApprove(req.request_id)}>✅ Approve</button>
                    <button onClick={() => handleReject(req.request_id)}>❌ Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AdminTokenReload;
