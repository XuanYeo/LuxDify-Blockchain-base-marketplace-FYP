"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import UserHeader from '../../../component/UserHeader/userheader';
import Footer from '../../../component/Footer/Footer';
import Background from '../../../component/Background/background';
import walletService from '../../../services/WalletService';
import "./upload_product.css";
import { form } from "framer-motion/client";

const UploadProduct: React.FC = () => {
  const [P_Name, setName] = useState("");
  const [P_Price, setPrice] = useState("");
  const [P_Description, setDescription] = useState("");
  const [Category, setCategory] = useState("");
  const [Status, setStatus] = useState("not_for_sale");
  const [ImageFile, setImageFile] = useState<File | null>(null);
  const router = useRouter();


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const ownerId = parseInt(localStorage.getItem("userId") || "0");
    const walletInfo = JSON.parse(localStorage.getItem('userWallet') || '{}');
    //const userPrivateKey = await walletService.connectWithPrivateKey(walletInfo.privateKey);
    const userPrivateKey = walletInfo.privateKey;

    if (!userPrivateKey) {
      alert("Missing wallet information. Please login again.");
      return;
    }
    if (!ownerId) {
      alert("User not logged in.");
      window.location.href = "/login";
      return;
    }
    if (!ImageFile) {
      alert("Please upload an image.");
      return;
    }


    try {
      const formData = new FormData();
      formData.append("image", ImageFile);
      formData.append("P_Name", P_Name);
      formData.append("P_Price", P_Price);
      formData.append("P_Description", P_Description);
      formData.append("Category", Category);
      formData.append("Status", Status);
      formData.append("Owner_ID", ownerId.toString());
      formData.append("userPrivateKey", userPrivateKey);

      const res = await axios.post("http://localhost:3000/uploadProduct", formData);
      if (res.data.success) {
        alert("✅ Product uploaded and NFT minted!");

        const tokenId = res.data.tokenId;
        const metadataUrl = res.data.metadataUrl;
        console.log("✅ NFT minted! Token ID:", tokenId);

        // 获取 NFT metadata（从 Pinata URL）
        const metadataRes = await axios.get(metadataUrl);
        const metadata = metadataRes.data;
        console.log("NFT Metadata:", metadata);
        console.log("token Id:", tokenId);

        // 尝试添加 NFT 到 MetaMask
        if (window.ethereum) {
          try {
            await window.ethereum.request({
              method: "wallet_watchAsset",
              params: {
                type: "ERC721",
                options: {
                  address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // 合约地址
                  tokenId: tokenId,
                  image: metadata.image,
                  symbol: "LD",
                  decimals: 0,
                },
              },
            });
          } catch (addErr) {
            console.error("❌ MetaMask NFT upload Fail：", addErr);
          }
        }
        // Optionally reset form
        setName("");
        setPrice("");
        setDescription("");
        setCategory("");
        setStatus("not_for_sale");
        setImageFile(null);

      } else {
        alert("❌ Upload failed.");
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("❌ An error occurred while uploading.");
    }
  };

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

      <div className="upload-container">
        <h2 className="section-title highlight-title">Upload Product</h2>
        <form onSubmit={handleUpload}>
          <div>
            <label>🖼️ Product Image:</label>
            <input type="file" accept="image/*" onChange={handleImageChange} required />
          </div>
          <div>
            <label>Product Name:</label>
            <input type="text" value={P_Name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label>Price (LD):</label>
            <input type="number" value={P_Price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
          <div>
            <label>Description:</label>
            <textarea value={P_Description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div>
            <label>Category:</label>
            <select value={Category} onChange={(e) => setCategory(e.target.value)} required>
              <option value="">-- Select --</option>
              <option value="Bag">Bag</option>
              <option value="Jewelry">Jewelry</option>
              <option value="Watch">Watch</option>
              <option value="Perfume">Perfume</option>
            </select>
          </div>
          <div>
            <label>🟢 Status:</label>
            <select value={Status} onChange={(e) => setStatus(e.target.value)}>
              <option value="sales">Sales</option>
              <option value="not_for_sale">Not for Sale</option>
            </select>
          </div>
          <button type="submit">Upload Product</button>
        </form>
      </div>

      <Footer />
    </div>
  );
};

export default UploadProduct;
