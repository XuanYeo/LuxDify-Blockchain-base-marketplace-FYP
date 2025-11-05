import express from "express";
import cors from "cors";
import mysql from "mysql2";
import bycrypt from "bcrypt";
import { ethers } from 'ethers';
import { getUnassignedAccount, initializeAssignedAccounts, keepOnlyFirstAssignedAccount } from './hardhatAccounts.js';

import { mintNFT, uploadToPinataImage, uploadMetadataToPinata, createOrder, markAsDelivered, rejectOrder, mintLDToken } from "./nftHelper.js";
import multer from "multer";

import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";
import crypto from "crypto";

import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const app = express();

app.use(express.json());
// Configure CORS before other middleware
app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001"], // Add your frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

/* Database Credential */
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1234",
    database: "mydatabase"
})

// Initialize assigned wallets from database
db.query("SELECT wallet FROM user WHERE wallet IS NOT NULL", (err, results) => {
    if (!err && results) {
        const addresses = results.map(row => row.wallet);
        initializeAssignedAccounts(addresses);
        console.log(`Initialized ${addresses.length} assigned wallet addresses`);
    }
});

/* Register */
const salt = 5;
app.post("/register", (req, res) => {
  try {
      const { name, email, password, address, gender, DOB, phone_number } = req.body;

      // First, check if username or email already exists
      // const checkSql = "SELECT * FROM user WHERE name = ? OR email = ?";
      // db.query(checkSql, [name, email], (err, data) => {
      const checkSql = "SELECT * FROM user WHERE name = ?";
      db.query(checkSql, [name], (err, data) => {
          if (err) {
              console.error('Database check error:', err);
              return res.status(500).json({ success: false, error: "Database error" });
          }

          if (data.length > 0) {
              // Username or email already taken
              return res.status(400).json({ success: false, error: "Username or Email already exists" });
          } else {
              // Proceed to register
              const hardhatAccount = getUnassignedAccount();
              const insertSql = `INSERT INTO user (name, password, email, address, wallet, private_key, gender, DOB, phone_number) 
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

              bycrypt.hash(password, salt, (err, hash) => {
                  if (err) {
                      console.error('Hash error:', err);
                      return res.status(500).json({ success: false, error: "Error hashing password" });
                  }

                  const values = [
                      name,
                      hash,
                      email,
                      address,
                      hardhatAccount.address,
                      hardhatAccount.privateKey,
                      gender,
                      DOB,
                      phone_number
                  ];

                  db.query(insertSql, values, (err, result) => {
                      if (err) {
                          console.error('Database insert error:', err);
                          return res.status(500).json({ success: false, error: err.message });
                      }

                      return res.status(200).json({
                          success: true,
                          result: result,
                          wallet: {
                              address: hardhatAccount.address,
                              privateKey: hardhatAccount.privateKey
                          }
                      });
                  });
              });
          }
      });
  } catch (error) {
      console.error('Server error:', error);
      res.status(500).json({ success: false, error: "Internal server error" });
  }
});

/* Login */
app.post("/login", (req, res) => {
    const sql = "SELECT * FROM user WHERE `name` = ?";
    db.query(sql, [req.body.name], (err, result) => {
        if (err) return res.json({Error: "Error"});
        else {
            if (result.length > 0){
                bycrypt.compare(req.body.password.toString(), result[0].password, (err, response) => {
                    if (err) return res.json({Error: "Error"});
                    if (response) {
                      // ✅ Reset assigned accounts before sending response
                      // keepOnlyFirstAssignedAccount();

                      // Include wallet data in the successful login response
                      return res.json({
                          Status: "Success",
                          userData: {
                              user_id: result[0].user_id,
                              name: result[0].name,
                              email: result[0].email,
                              role: result[0].role,
                              wallet: {
                                  address: result[0].wallet_address,
                                  privateKey: result[0].private_key
                              }
                          }
                      })
                    }
                    else return res.json({Error: "Wrong Password"});
                })
            } else {
                return res.json({Error: "User not found"});
            }
        }
    })
})

/* Forget Password */
app.post("/forgot-password", (req, res) => {
  const { email } = req.body;
  const sql = "SELECT * FROM user WHERE email = ?";
  db.query(sql, [email], (err, results) => {
      if (err || results.length === 0) return res.status(400).json({ error: "Email not found." });

      const user = results[0];
      const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: "15m" });

      const resetLink = `http://localhost:3001/login/reset_password?token=${token}`; // adjust port/frontend link

      const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
          },
      });

      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: "Reset Your Password",
          html: `<p>You requested a password reset.</p>
                 <p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 15 minutes.</p>`,
      };

      transporter.sendMail(mailOptions, (err, info) => {
          if (err) return res.status(500).json({ error: "Failed to send email." });
          res.json({ success: true, message: "Password reset link sent to email." });
      });
  });
});

/* Reset Password */
app.post("/reset-password", (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: "Missing token or password." });

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const email = decoded.email;

      bcrypt.hash(newPassword, 10, (err, hash) => {
          if (err) return res.status(500).json({ error: "Password hashing failed." });

          const sql = "UPDATE user SET password = ? WHERE email = ?";
          db.query(sql, [hash, email], (err, result) => {
              if (err) return res.status(500).json({ error: "Database update failed." });
              res.json({ success: true, message: "Password has been reset successfully." });
          });
      });
  } catch (err) {
      res.status(400).json({ error: "Invalid or expired token." });
  }
});

/* Subscribe */
app.post("/subscribe", (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: "Email required" });

  // Encrypt email using a basic algorithm (for demonstration)
  const encryptedEmail = crypto.createHash('sha256').update(email).digest('hex');

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // e.g. your-email@gmail.com
      pass: process.env.EMAIL_PASS  // use App Password from Google
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // send to yourself
    subject: "📥 New Subscription Received",
    html: `<p><strong>Encrypted Email:</strong> ${encryptedEmail}</p><p>Original Email: ${email}</p>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("❌ Email send failed:", error);
      return res.status(500).json({ success: false, message: "Email failed to send" });
    }
    return res.status(200).json({ success: true, message: "Subscribed successfully" });
  });
});

/* Display Profile */
app.get("/user/:id", (req, res) => {
  const userId = parseInt(req.params.id);
  const sql = "SELECT user_id, name, email, gender, DOB, phone_number, address FROM user WHERE user_id = ?";
  db.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (result.length === 0) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, user: result[0] });
  });
});

/* Update Profile */
app.put("/user/:id/update", (req, res) => {
  const userId = parseInt(req.params.id);
  const { name, email, gender, phone_number, address } = req.body;

  const sql = `
    UPDATE user SET 
      name = ?, 
      email = ?, 
      gender = ?, 
      phone_number = ?, 
      address = ?
    WHERE user_id = ?
  `;

  db.query(sql, [name, email, gender, phone_number, address, userId], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.status(200).json({ success: true, message: "✅ User info updated successfully" });
  });
});

/* Update Password */
app.put("/user/:id/password", (req, res) => {
  const userId = parseInt(req.params.id);
  const { oldPassword, newPassword } = req.body;

  const getUserSql = "SELECT password FROM user WHERE user_id = ?";
  db.query(getUserSql, [userId], (err, result) => {
    if (err) {
      console.error("Error fetching user:", err);
      return res.status(500).json({ success: false, message: "Database error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const hashedPassword = result[0].password;

    // Compare old password
    bcrypt.compare(oldPassword, hashedPassword, (err, isMatch) => {
      if (err || !isMatch) {
        return res.status(401).json({ success: false, message: "Old password is incorrect" });
      }

      // Hash new password
      bcrypt.hash(newPassword, 10, (err, hash) => {
        if (err) {
          console.error("Hashing error:", err);
          return res.status(500).json({ success: false, message: "Failed to hash new password" });
        }

        const updateSql = "UPDATE user SET password = ? WHERE user_id = ?";
        db.query(updateSql, [hash, userId], (err, result) => {
          if (err) {
            console.error("Update error:", err);
            return res.status(500).json({ success: false, message: "Failed to update password" });
          }

          return res.status(200).json({ success: true, message: "Password changed successfully" });
        });
      });
    });
  });
});

/* upload Product */
const storage = multer.memoryStorage();
const upload = multer({ storage });
app.post("/uploadProduct", upload.single("image"), async (req, res) => {
  const {
    P_Name, P_Price, P_Description,
    Category, Owner_ID, Status, userPrivateKey
  } = req.body;

  const imageBuffer = req.file?.buffer;
  if (!imageBuffer) return res.status(400).json({ success: false, error: "Image missing" });

  try {
    const imageUrl = await uploadToPinataImage(imageBuffer, req.file.originalname);

    const userWalletQuery = "SELECT wallet FROM user WHERE user_id = ?";
    db.query(userWalletQuery, [Owner_ID], async (err, rows) => {
      if (err || rows.length === 0) {
        return res.status(400).json({ success: false, error: "Owner wallet not found" });
      }

      const Owner_Address = rows[0].wallet;

      const metadata = {
        name: P_Name,
        // description: P_Description,
        image: imageUrl,
        // ownerAddress: Owner_Address,
        attributes: [
          { trait_type: "Category", value: Category },
          // { trait_type: "Price", value: P_Price }
        ]
      };

      const metadataUrl = await uploadMetadataToPinata(metadata);
      const tokenId = await mintNFT(metadataUrl, userPrivateKey, Owner_Address);

      const sql = `
        INSERT INTO product (
          P_Name, P_Price, P_Description, Category,
          Owner_ID, Status, Image_URL, NFT_TokenID, NFT_Metadata_URL
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        P_Name, P_Price, P_Description, Category,
        Owner_ID, Status || "not_for_sale",
        imageUrl, tokenId, metadataUrl
      ];

      db.query(sql, values, (err, result) => {
        if (err) {
          console.error("❌ DB error:", err);
          return res.status(500).json({ success: false, error: err.message });
        }
        res.status(200).json({ success: true, tokenId, metadataUrl });
      });
    });
  } catch (err) {
    console.error("❌ Upload/mint error:", err);
    res.status(500).json({ success: false, error: "Upload or mint failed." });
  }
});

/* Display Product */
app.get("/portfolio/:Owner_ID", (req, res) => {
    const ownerId = parseInt(req.params.Owner_ID);
    const sql = `
      SELECT * FROM product 
      WHERE Owner_ID = ? 
      ORDER BY 
        CASE 
          WHEN Status = 'sales' THEN 0 
          WHEN Status = 'not_for_sale' THEN 1 
          WHEN Status = 'not_available' THEN 2 
          ELSE 3 
        END
    `;
    db.query(sql, [ownerId], (err, result) => {
        if (err) {
            console.error("Fetch error:", err);
            return res.status(500).json({ success: false, error: err.message });
        }
        res.status(200).json({ success: true, products: result });
    });
});

/* Update Status */
app.put("/updateStatus/:Product_ID", (req, res) => {
    const productId = parseInt(req.params.Product_ID);
    const { newStatus } = req.body;
    console.log("Fetched products:", productId);
  
    const sql = `UPDATE product SET Status = ? WHERE Product_ID = ?`;
    db.query(sql, [newStatus, productId], (err, result) => {
      if (err) {
        console.error("Update error:", err);
        return res.status(500).json({ success: false, error: err.message });
      }
      res.status(200).json({ success: true });
    });
});

/* Display Collection */
app.get("/collection", async (req, res) => {
  const sql = `
    SELECT p.*, u.name AS ownerName 
    FROM product p 
    JOIN user u ON p.Owner_ID = u.user_id
    WHERE p.Status = 'sales'
    ORDER BY p.Product_ID DESC
  `;
  db.query(sql, async (err, results) => {
    
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.status(200).json({ success: true, products: results });
  //   if (err) {
  //     console.error("Fetch error:", err);
  //     return res.status(500).json({ success: false, error: err.message });
  //   }

  //   // Helper function to add a delay
  //   const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  //   // Helper function to fetch metadata with retries
  //   const fetchMetadata = async (product, retries = 3, backoff = 1000) => {
  //     try {
  //       if (!product.NFT_Metadata_URL) {
  //         console.warn(`Missing NFT_Metadata_URL for product ID: ${product.Product_ID}`);
  //         return product;
  //       }

  //       const metadataUrl = product.NFT_Metadata_URL;

  //       // Validate URL format
  //       if (!metadataUrl.startsWith("https://gateway.pinata.cloud/ipfs/")) {
  //         console.warn(`Invalid NFT_Metadata_URL format for product ID: ${product.Product_ID}: ${metadataUrl}`);
  //         return product;
  //       }

  //       const response = await fetch(metadataUrl);
  //       if (!response.ok) {
  //         if (response.status === 429 && retries > 0) {
  //           console.warn(`Rate limit hit for product ID: ${product.Product_ID}, retrying after ${backoff}ms...`);
  //           await delay(backoff);
  //           return fetchMetadata(product, retries - 1, backoff * 2); // Exponential backoff
  //         }
  //         console.warn(`IPFS fetch failed for product ID: ${product.Product_ID}, URL: ${metadataUrl}, Status: ${response.status}`);
  //         return product;
  //       }

  //       const contentType = response.headers.get("content-type");
  //       if (!contentType || !contentType.includes("application/json")) {
  //         console.warn(`Invalid content type for product ID: ${product.Product_ID}, URL: ${metadataUrl}, Content-Type: ${contentType}`);
  //         return product;
  //       }

  //       const metadata = await response.json();
  //       return {
  //         ...product,
  //         metadata,
  //       };
  //     } catch (err) {
  //       console.warn(`IPFS fetch failed for product ID: ${product.Product_ID}, URL: ${metadataUrl}, Error: ${err.message}`);
  //       return product;
  //     }
  //   };

  //   // Process products in batches
  //   const batchSize = 5;
  //   const enriched = [];
  //   for (let i = 0; i < results.length; i += batchSize) {
  //     const batch = results.slice(i, i + batchSize);
  //     const batchResults = await Promise.all(
  //       batch.map(async (product) => {
  //         await delay(1000); // Increased delay between individual requests
  //         return fetchMetadata(product);
  //       })
  //     );
  //     enriched.push(...batchResults);
  //     if (i + batchSize < results.length) {
  //       await delay(5000); // Delay between batches
  //     }
  //   }

  //   res.status(200).json({ success: true, products: enriched });
  });
});
/* Display Category (Bag) */
app.get("/collection/bag", async (req, res) => {
  const sql = `
    SELECT p.*, u.name AS ownerName 
    FROM product p 
    JOIN user u ON p.Owner_ID = u.user_id
    WHERE p.Status = 'sales' AND p.Category = 'Bag'
    ORDER BY p.Product_ID DESC
  `;
  db.query(sql, async (err, results) => {
    
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.status(200).json({ success: true, products: results });
  });
});
/* Display Category (Jewelry) */
app.get("/collection/jewelry", async (req, res) => {
  const sql = `
    SELECT p.*, u.name AS ownerName 
    FROM product p 
    JOIN user u ON p.Owner_ID = u.user_id
    WHERE p.Status = 'sales' AND p.Category = 'Jewelry'
    ORDER BY p.Product_ID DESC
  `;
  db.query(sql, async (err, results) => {
    
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.status(200).json({ success: true, products: results });
  });
});
/* Display Category (Watch) */
app.get("/collection/watch", async (req, res) => {
  const sql = `
    SELECT p.*, u.name AS ownerName 
    FROM product p 
    JOIN user u ON p.Owner_ID = u.user_id
    WHERE p.Status = 'sales' AND p.Category = 'Watch'
    ORDER BY p.Product_ID DESC
  `;
  db.query(sql, async (err, results) => {
    
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.status(200).json({ success: true, products: results });
  });
});
/* Display Category (Perfume) */
app.get("/collection/perfume", async (req, res) => {
  const sql = `
    SELECT p.*, u.name AS ownerName 
    FROM product p 
    JOIN user u ON p.Owner_ID = u.user_id
    WHERE p.Status = 'sales' AND p.Category = 'Perfume'
    ORDER BY p.Product_ID DESC
  `;
  db.query(sql, async (err, results) => {
    
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.status(200).json({ success: true, products: results });
  });
});
/* Display Popular */
app.get("/most-popular", async (req, res) => {
  const sql = `
    SELECT 
      p.*, 
      u.name AS ownerName,
      COUNT(o.Product_ID) AS purchase_count
    FROM product p
    JOIN user u ON p.Owner_ID = u.user_id
    LEFT JOIN orders o ON o.Product_ID = p.Product_ID
    WHERE p.Status = 'sales'
    GROUP BY p.Product_ID
    ORDER BY purchase_count DESC
    LIMIT 8;
  `;

  db.query(sql, async (err, results) => {
    
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.status(200).json({ success: true, products: results });
  });
});
// Display Latest Products
app.get("/products/latest", (req, res) => {
  const sql = `
    SELECT * 
    FROM product 
    WHERE Status = 'sales'
    ORDER BY Created_At DESC
    LIMIT 8
  `;

  db.query(sql, async (err, results) => {
    
    if (err) {
      console.error("Fetch error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }
    res.status(200).json({ success: true, products: results });
  });
});
// Display User Info
app.get("/user/:userId", (req, res) => {
  const userId = parseInt(req.params.userId);

  const sql = `
    SELECT name 
    FROM user 
    WHERE user_id = ?
  `;

  db.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("User fetch error:", err);
      return res.status(500).json({ success: false, error: err.message });
    }

    if (result.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({ success: true, user: result[0] });
  });
});

/* Add Favorites */
app.post("/favorite", (req, res) => {
  const { userId, productId } = req.body;
  const sql = "INSERT IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)";
  db.query(sql, [userId, productId], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.status(200).json({ success: true, message: "Product favorited." });
  });
});
/* Remove Favorites */
app.delete("/favorite", (req, res) => {
  const { userId, productId } = req.body;
  const sql = "DELETE FROM favorites WHERE user_id = ? AND product_id = ?";
  db.query(sql, [userId, productId], (err) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.status(200).json({ success: true, message: "Favorite removed." });
  });
});
/* Display Favorites */
app.get("/favorites/:userId", (req, res) => {
  const userId = parseInt(req.params.userId);
  const sql = "SELECT product_id FROM favorites WHERE user_id = ?";
  db.query(sql, [userId], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    const favoriteIds = result.map(r => r.product_id);
    res.status(200).json({ success: true, favoriteIds });
  });
});

/* Display Product Details */
app.get("/product/:Product_ID", (req, res) => {
  const productId = parseInt(req.params.Product_ID); // ✅ fixed param name
  const sql = `
    SELECT 
      p.*, 
      u.name AS Owner_Name
    FROM product p
    JOIN user u ON p.Owner_ID = u.user_id
    WHERE p.Product_ID = ?
  `;
  db.query(sql, [productId], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (result.length === 0) return res.status(404).json({ success: false, error: "Product not found" });
    res.status(200).json({ success: true, product: result[0] });
  });
});

/* Display Transaction Timestamp */
app.get("/product/:productId/transactions", (req, res) => {
  const productId = parseInt(req.params.productId); // ✅ fixed param name
  const sql = `
    SELECT Order_ID, Buyer_ID, Seller_ID, Price, Status, OTP_Code,
      DATE_FORMAT(Created_At, '%Y-%m-%d %H:%i:%s') as Created_At,
      DATE_FORMAT(Updated_At, '%Y-%m-%d %H:%i:%s') as Updated_At
    FROM orders
    WHERE Product_ID = ?
    ORDER BY Created_At DESC
  `;
  db.query(sql, [productId], (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.status(200).json({ success: true, transactions: results });
  });
});

/* Buy Product */
import { v4 as uuidv4 } from 'uuid';
app.post("/buy/:Product_ID", async (req, res) => {
  try {
    const productId = parseInt(req.params.Product_ID);
    const { buyerId, buyerPrivateKey } = req.body;

    const sql = "SELECT * FROM product WHERE Product_ID = ? AND Status = 'sales'";
    db.query(sql, [productId], async (err, result) => {
      if (err || result.length === 0) {
        return res.status(400).json({ success: false, error: "Product not available" });
      }
      const product = result[0];

      // ✅ Use the helper to create order on blockchain
      const otpCode = uuidv4().slice(0, 6); // Generate 6-char OTP
      const priceInEther = product.P_Price.toString();
      const tokenId = product.NFT_TokenID;
      console.log("About to create order for tokenId:", tokenId);

      try {
        await createOrder(product.NFT_TokenID, otpCode, buyerPrivateKey, priceInEther);
      } catch (blockchainErr) {
        console.error("❌ Blockchain order failed:", blockchainErr);
        return res.status(500).json({ success: false, error: "Blockchain transaction failed." });
      }

      const insertOrderSQL = `INSERT INTO orders (Product_ID, NFT_TokenID, Buyer_ID, Seller_ID, Price, Status, OTP_Code)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const orderValues = [
        product.Product_ID,
        product.NFT_TokenID,
        buyerId,
        product.Owner_ID,
        product.P_Price,
        "pending",
        otpCode
      ];

      db.query(insertOrderSQL, orderValues, (insertErr) => {
        if (insertErr) {
          console.error("DB order insert error:", insertErr);
          return res.status(500).json({ success: false, error: "Order DB insert failed" });
        }

        const updateStatusSQL = "UPDATE orders SET Status = 'pending' WHERE Product_ID = ?";
        db.query(updateStatusSQL, [productId]);

        const updateProductSQL = "UPDATE product SET Status = 'not_available' WHERE Product_ID = ?";
        db.query(updateProductSQL, [productId], (updateErr) => {
          if (updateErr) {
            console.error("Product status update error:", updateErr);
            return res.status(500).json({ success: false, error: "Product status update failed" });
          }
          res.status(200).json({ success: true, message: "Order placed and product marked unavailable" });
        });
      });
    });
  } catch (err) {
    console.error("❌ Buy failed:", err);
    res.status(500).json({ success: false, error: "Order failed." });
  }
});

/* Seller rejects order */
app.post("/order/:orderId/reject", async (req, res) => {

  const orderId = parseInt(req.params.orderId);

  const getOrderSql = "SELECT * FROM orders WHERE Order_ID = ?";
  db.query(getOrderSql, [orderId], async (err, orderRows) => {
    if (err || orderRows.length === 0)
      return res.status(404).json({ success: false, error: "Order not found" });

    const order = orderRows[0];
    const tokenId = order.NFT_TokenID;
    const sellerId = order.Seller_ID;
    

    // 🔍 Step 2: Get seller private key from user table
    const getSellerSql = "SELECT private_key FROM user WHERE user_id = ?";
    db.query(getSellerSql, [sellerId], async (err, sellerRows) => {
      if (err || sellerRows.length === 0)
        return res.status(404).json({ success: false, error: "Seller not found" });

      const sellerPrivateKey = sellerRows[0].private_key;

      console.log("➡️ /order/:orderId/reject endpoint hit!");
      console.log("Seller ID:", sellerId);
      console.log("Seller Private Key:", sellerPrivateKey);  // Make sure it's NOT undefined

      try {
        // ⛓️ Call smart contract to reject order & refund
        await rejectOrder(tokenId, sellerPrivateKey);

        // ✅ Delete order from DB
        const deleteSql = "DELETE FROM orders WHERE Order_ID = ?";
        db.query(deleteSql, [orderId], (err) => {
          if (err) console.error("❌ Failed to delete order from DB:", err);
        });

        res.status(200).json({
          success: true,
          message: "✅ Order rejected and tokens refunded to buyer.",
        });
      } catch (err) {
        console.error("❌ Smart contract rejectOrder failed:", err);
        res.status(500).json({ success: false, error: "Blockchain refund failed" });
      }
    });
  });
});

/* Display Order (Seller) */
app.get("/seller/:sellerId/orders", (req, res) => {
  const sellerId = parseInt(req.params.sellerId);
  const sql = `
    SELECT 
      o.Order_ID,
      o.Product_ID,
      o.Buyer_ID,
      o.Seller_ID,
      o.Price,
      o.Status,
      o.Created_At,
      o.OTP_Code,
      p.P_Name, 
      p.Image_URL,
      u.name AS Buyer_Name,
      u.address AS Buyer_Address  -- ADD this line
    FROM orders o
    JOIN product p ON o.Product_ID = p.Product_ID
    JOIN user u ON o.Buyer_ID = u.User_ID
    WHERE o.Seller_ID = ?
    ORDER BY 
      CASE 
        WHEN o.Status = 'pending' THEN 1
        WHEN o.Status = 'out_for_delivery' THEN 2
        WHEN o.Status = 'delivered' THEN 3
        ELSE 4
      END, o.Created_At DESC
  `;

  db.query(sql, [sellerId], (err, result) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    return res.status(200).json({ success: true, orders: result });
  });
});

/* Change Order Status */
app.put("/order/:Order_ID/deliver", (req, res) => {
  const orderId = parseInt(req.params.Order_ID);

  const sql = `
    UPDATE orders SET Status = 'out_for_delivery'
    WHERE Order_ID = ?
  `;

  db.query(sql, [orderId], (err, result) => {
    if (err) {
      console.error("Error updating status:", err);
      return res.status(500).json({ success: false, error: err.message });
    }

    // Get updated order with OTP
    const fetchSql = `SELECT OTP_Code FROM orders WHERE Order_ID = ?`;
    db.query(fetchSql, [orderId], (fetchErr, fetchResult) => {
      if (fetchErr) {
        return res.status(500).json({ success: false, error: "Fetch OTP failed." });
      }
      res.status(200).json({
        success: true,
        message: "Order marked as out for delivery.",
        otp: fetchResult[0].OTP_Code,
      });
    });
  });
});

/* Display Order (Buyer) */
app.get("/buyer/orders/:buyerId", (req, res) => {
  const { buyerId } = req.params;
  const sql = `
    SELECT 
      o.*, 
      p.P_Name, 
      p.Image_URL, 
      p.NFT_Metadata_URL, 
      p.NFT_TokenID, 
      p.P_Price,
      u.user_id AS Seller_ID, 
      u.name AS Seller_Name
    FROM orders o
    JOIN product p ON o.Product_ID = p.Product_ID
    JOIN user u ON p.Owner_ID = u.user_id
    WHERE o.Buyer_ID = ?
    ORDER BY o.Created_At DESC
  `;
  db.query(sql, [buyerId], (err, results) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    res.status(200).json({ success: true, orders: results });
  });
});

/* Confirm received */
app.post("/buyer/confirm-receipt/:productId", async (req, res) => {
  const { productId } = req.params;
  const { privateKey, otp } = req.body;

  const getTokenSql = "SELECT NFT_TokenID FROM product WHERE Product_ID = ?";
  db.query(getTokenSql, [productId], async (err, result) => {
    if (err || result.length === 0)
      return res.status(400).json({ success: false, error: "Product not found" });

    const tokenId = result[0].NFT_TokenID;
    console.log("✅ transfered tokenId:", tokenId);

    try {
      await markAsDelivered(tokenId, otp, privateKey);

      // ✅ Update order status
      const updateOrderSql = "UPDATE orders SET Status = 'delivered' WHERE Product_ID = ?";
      db.query(updateOrderSql, [productId], (err) => {
        if (err) console.error("Order DB update error:", err);
      });

      // ✅ Get buyer ID
      const getBuyerSql = "SELECT Buyer_ID FROM orders WHERE Product_ID = ?";
      db.query(getBuyerSql, [productId], (err, rows) => {
        if (err || rows.length === 0) {
          console.error("Buyer ID fetch error:", err);
          return res.status(500).json({ success: false, error: "Buyer not found" });
        }

        const buyerId = rows[0].Buyer_ID;

        // ✅ Update product owner
        const updateOwnerSql = "UPDATE product SET Owner_ID = ?, status = 'not_for_sale' WHERE Product_ID = ?";
        db.query(updateOwnerSql, [buyerId, productId], (err) => {
          if (err) console.error("Product owner update error:", err);
        });

        res.status(200).json({
          success: true,
          message: "✅ Delivery confirmed. NFT transferred and owner updated.",
        });
      });
    } catch (err) {
      console.error("❌ markAsDelivered error:", err);
      res.status(500).json({ success: false, error: "Blockchain transaction failed" });
    }
  });
});

/* Update product (description, price, and status) */
app.put("/product/:id/update", (req, res) => {
  const productId = parseInt(req.params.id);
  const { newPrice, newDescription, newStatus } = req.body;

  if (!newPrice || !newDescription || !newStatus) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  const updateSql = `
    UPDATE product
    SET P_Price = ?, P_Description = ?, status = ?
    WHERE Product_ID = ?
  `;

  db.query(updateSql, [newPrice, newDescription, newStatus, productId], (err, result) => {
    if (err) {
      console.error("❌ Update error:", err);
      return res.status(500).json({ success: false, error: "Database update failed" });
    }

    res.status(200).json({
      success: true,
      message: "✅ Product updated successfully",
    });
  });
});

/* Submit token reload request */ 
app.post("/token-reload-request", upload.single("proof"), async (req, res) => {
  const { user_id, amount } = req.body;
  const file = req.file;

  if (!file || !file.buffer) {
    return res.status(400).json({ success: false, error: "Proof image is required" });
  }

  try {
    // Upload image buffer to Pinata
    const pinataUrl = await uploadToPinataImage(file.buffer, file.originalname);

    const insertSql = `
      INSERT INTO token_reload (user_id, amount, status, proof_path)
      VALUES (?, ?, 'pending', ?)
    `;
    db.query(insertSql, [user_id, amount, pinataUrl], (err, result) => {
      if (err) {
        console.error("Insert token reload error:", err);
        return res.status(500).json({ success: false, error: "Database error" });
      }
      res.json({ success: true, message: "Reload request submitted with proof.", proofUrl: pinataUrl });
    });
  } catch (err) {
    console.error("Pinata upload error:", err);
    res.status(500).json({ success: false, error: "Upload to Pinata failed" });
  }
});

/* Display pending requests (admin) */ 
app.get("/token/pending-requests", (req, res) => {
  const sql = `
    SELECT r.request_id, r.user_id, u.name, u.email, u.wallet, r.amount, r.status, r.proof_path, r.created_at
    FROM token_reload r 
    JOIN user u ON r.user_id = u.user_id 
    WHERE r.status = 'pending'
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error("❌ SQL ERROR on /token/pending-requests:");
      console.error(err); // Full log
      return res.status(500).json({ success: false, error: err.message });
    }

    console.log("✅ Pending requests fetched:", rows);
    res.status(200).json({ success: true, data: rows });
  });
});

/* Approve request (admin) */
app.post("/token/approve", async (req, res) => {
  const { request_id, adminPrivateKey } = req.body;

  // Get request and user wallet
  const sql = `SELECT r.*, u.wallet FROM token_reload r JOIN user u ON r.user_id = u.user_id WHERE r.request_id = ? ORDER BY r.request_id DESC`;
  db.query(sql, [request_id], async (err, rows) => {
      if (err || rows.length === 0) return res.status(404).json({ success: false, error: "Request not found" });

      const { wallet, amount } = rows[0];

      try {
          await mintLDToken(wallet, amount.toString(), adminPrivateKey);
          // Mark as approved
          db.query(`UPDATE token_reload SET status = 'approved' WHERE request_id = ?`, [request_id]);
          res.status(200).json({ success: true, message: "Token transferred" });
      } catch (err) {
          console.error("Transfer error:", err);
          res.status(500).json({ success: false, error: "Token transfer failed" });
      }
  });
});

/* Reject request (admin + email) */
app.post("/token/reject", (req, res) => {
  const { request_id, admin_reason } = req.body;

  const sql = `SELECT r.*, u.email, u.name FROM token_reload r JOIN user u ON r.user_id = u.user_id WHERE r.request_id = ?`;
  db.query(sql, [request_id], (err, rows) => {
      if (err || rows.length === 0) return res.status(404).json({ success: false, error: "Request not found" });

        console.log("❌ ERROR");
      const { email, name } = rows[0];

      db.query(`UPDATE token_reload SET status = 'rejected', admin_reason = ? WHERE request_id = ?`, [admin_reason, request_id]);

      // Send email
      const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS
          }
      });

      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: "[LuxDify] Your Token Reload Request was Rejected",
          text: `Hi ${name},\n\nYour request to reload LD tokens was rejected for the following reason:\n\n${admin_reason}\n\nPlease contact support if you have questions.\n\nRegards,\nLuxDify Admin Team`
      };

      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              console.error("Email error:", error);
              return res.status(500).json({ success: false, error: "Email failed" });
          } else {
              res.status(200).json({ success: true, message: "Rejected and email sent" });
          }
      });
  });
});


app.listen(3000, () => {
    console.log("Server is running on port 3000");
})
