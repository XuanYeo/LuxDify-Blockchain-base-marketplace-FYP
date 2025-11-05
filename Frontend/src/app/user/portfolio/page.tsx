"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import UserHeader from '../../component/UserHeader/userheader';
import Footer from '../../component/Footer/Footer';
import Background from '../../component/Background/background';
import "./portfolio.css";
import "../../component/button.css";
import Link from "next/link";

const UserProductList: React.FC = () => {
  const [products, setProducts] = useState([]);
  const [ownerId, setOwnerId] = useState<number | null>(null);

  useEffect(() => {
    const id = localStorage.getItem("userId");
    if (id) {
      const parsedId = parseInt(id);
      setOwnerId(parsedId);

      // Fetch only after userId is set
      axios
        .get(`http://localhost:3000/portfolio/${parsedId}`)
        .then((res) => {
          if (res.data.success) {
            setProducts(res.data.products);
            console.log("Fetched products:", res.data.products);
          } else {
            alert("Failed to load your products.");
          }
        })
        .catch((err) => {
          console.error("Error fetching user products:", err);
          alert("Something went wrong.");
        });
    } else {
      alert("User not logged in.");
    }
  }, []);

  const handleStatusChange = async (productId: number, newStatus: string) => {
    try {
      console.log("Fetched products:", productId);
      const res = await axios.put(`http://localhost:3000/updateStatus/${productId}`, {
        newStatus,
      });
  
      if (res.data.success) {
        setProducts((prevProducts: any) =>
          prevProducts.map((product: any) =>
            product.Product_ID === productId ? { ...product, status: newStatus } : product
          )
        );
      } else {
        alert("Failed to update status.");
      }
    } catch (error) {
      console.error("Status update error:", error);
      alert("Error updating status.");
    }
  };

  return (
    <div>
      <Background />
      <UserHeader />
      <div className="user-products-container">
        <Link href="/user/portfolio/upload_product" className="upload-btn">Upload Product</Link>
        <h2 className="section-title highlight-title">My Products</h2>
        {products.length === 0 ? (
          <p className="no-products">You haven't uploaded any products yet.</p>
        ) : (
          <div className="product-card-grid">
            {products.map((product: any) => (
              <div className="product-card" key={product.Product_ID}>
                <Link href={`/user/portfolio/product/${product.Product_ID}`} key={product.Product_ID} >
                  {product.status === "not_available" ? (
                    <div className="status-tag disabled">Not Available</div>
                  ) : (
                    <select
                      className={`status-tag ${product.status}`}
                      value={product.status}
                      onClick={(e) => {
                        e.preventDefault(); // Stop link navigation
                        e.stopPropagation(); // Stop bubbling
                      }}
                      onChange={(e) => {
                        e.preventDefault(); // Prevent redirect
                        handleStatusChange(product.Product_ID, e.target.value);
                      }}
                    >
                      <option value="sales">For Sale</option>
                      <option value="not_for_sale">Not For Sale</option>
                    </select>
                  )}
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
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default UserProductList;
