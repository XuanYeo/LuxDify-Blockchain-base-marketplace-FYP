"use client";
import React, { useState } from "react";
import axios from "axios";

const UploadProduct = () => {
  const [P_Name, setName] = useState("");
  const [P_Price, setPrice] = useState("");
  const [P_Description, setDescription] = useState("");
  const [Category, setCategory] = useState("");
  const [Status, setStatus] = useState("not_for_sale");
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const ownerId = localStorage.getItem("userId");
    if (!ownerId || !imageFile) return alert("Missing user or image");

    const formData = new FormData();
    formData.append("P_Name", P_Name);
    formData.append("P_Price", P_Price);
    formData.append("P_Description", P_Description);
    formData.append("Category", Category);
    formData.append("Status", Status);
    formData.append("Owner_ID", ownerId);
    formData.append("image", imageFile);

    try {
      const res = await axios.post("http://localhost:3000/uploadProduct", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data.success) {
        alert("Uploaded + Minted Successfully!");
      }
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  return (
    <form onSubmit={handleUpload}>
      <input type="text" placeholder="Name" onChange={(e) => setName(e.target.value)} />
      <input type="number" placeholder="Price" onChange={(e) => setPrice(e.target.value)} />
      <textarea placeholder="Description" onChange={(e) => setDescription(e.target.value)} />
      <select onChange={(e) => setCategory(e.target.value)}>
        <option>Bag</option><option>Watch</option><option>Perfume</option>
      </select>
      <select onChange={(e) => setStatus(e.target.value)}>
        <option value="sales">Sales</option>
        <option value="not_for_sale">Not For Sale</option>
      </select>
      <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
      <button type="submit">Upload</button>
    </form>
  );
};

export default UploadProduct;