# LuxDify - Decentralized Luxury Item Marketplace

LuxDify is a blockchain-based web application enabling secure listing, purchasing, and NFT-based ownership of luxury products.

---

## A. Project Setup

### 1) Prerequisites

Make sure the following are installed on your system:

- Node.js (v18+)
- MySQL Server
- Hardhat (Ethereum local testnet)
- Git
- MetaMask Extension

---

## 2) Database Setup (MySQL)

To run the LuxDify platform locally, a MySQL database must be properly set up with the correct schema and credentials.

1. Create the Database
   
   Open your MySQL terminal or use a GUI tool like phpMyAdmin or MySQL Workbench, and execute:
   
   ```sql
   CREATE DATABASE mydatabase;
   ```

2. Configure Database Connection
   
   In your backend project, set the database credentials inside `backend/server.js` file (line 26). Example credentials:
   
   ```js
   const db = mysql.createConnection({
     host: "localhost",
     user: "root",
     password: "1234",
     database: "mydatabase"
   });
   ```

3. Create Required Tables
   
   Use the SQL table structure refer to the "4.3.2 Database Table Structure" section in the project documentation.
   
   Your system requires the following tables:
   
   - `user`
   - `product`
   - `orders`
   - `favorites`
   - `token_reload`
   
   Make sure to create these with the exact columns and constraints as specified.

---

### 3) Backend Setup

1. Navigate to backend folder:
   
   ```bash
   cd backend
   ```

2. Install dependencies:
   
   ```bash
   npm install
   ```

---

### 4) Frontend Setup

1. Navigate to frontend folder:
   
   ```bash
   cd frontend
   ```

2. Install dependencies:
   
   ```bash
   npm install
   ```

--- 

### 5) Blockchain Development (Hardhat)

1. Navigate to backend contract folder:
   
   ```bash
   cd backend/Backend_Contract
   ```

2. Start local Ethereum node (keep running):
   
   ```bash
   npx hardhat node
   ```

3. Open a new terminal and navigate to backend contract folder:
   
   ```bash
   cd backend/Backend_Contract
   ```

4. Deploy smart contracts:
   
   ```bash
   npx hardhat run scripts/deploy.js --network localhost
   ```

5. Output:
   
   <img src="file:///C:/Users/User/AppData/Roaming/marktext/images/2025-04-30-10-50-45-image.png" title="" alt="" width="639">

6. In your backend project, set the deploy address inside `backend > nftHelper.js` file (line 9 & 10). Example Deployed address:
   
   ![](C:\Users\User\AppData\Roaming\marktext\images\2025-04-30-11-02-39-image.png)
   
   ```bash
   LDToken = tokenContractAddress
   ProductNFT = nftContractAddress
   ```

7. Also in backend, set the Pinata credentials inside `backend > nftHelper.js` file (line 11). Example:
   
   ![](C:\Users\User\AppData\Roaming\marktext\images\2025-04-30-11-05-05-image.png)
   
   ```bash
   const pinata = new pinataSDK("API Key", "API Secret");
   ```

8. In your frontend project, set the Token Address same with the Deployed LDToken address inside `frontend > src > app > services > WalletService.ts` file (line 4). Example:
   
   ![](C:\Users\User\AppData\Roaming\marktext\images\2025-04-30-11-18-33-image.png)
   
   ```bash
   LDToken = TOKEN_CONTRACT_ADDRESS
   ```

9. Also in your frontend, set the `window.ethereum.request` address same with the Deployed ProductNFT address inside `frontend > src > app > user > my_order > page.ts` file (line 90). Example:
   
   ![](C:\Users\User\AppData\Roaming\marktext\images\2025-04-30-11-25-28-image.png)
   
   ```bash
   ProductNFT = address
   ```

10. Also in your frontend, set the `window.ethereum.request` address same with the Deployed ProductNFT address inside `frontend > src > app > user > portfolio > upload_product > page.ts` file (line 84). Example:
    
    ![](C:\Users\User\AppData\Roaming\marktext\images\2025-04-30-11-26-51-image.png)
    
    ```bash
    ProductNFT = address
    ```

---

## B. Run the Project

1. Make sure you are running `npx hardhat node` in terminal

2. After that, open a new terminal and navigate to backend folder:
   
   ```bash
   cd backend
   ```

3. Start the backend server:
   
   ```bash
   npm start
   ```

4. Then, Open a new terminal and navigate to frontend folder:
   
   ```bash
   cd frontend
   ```

5. Start development server:
   
   ```bash
   cd npm run dev
   ```

##### Now can Visit `http://localhost:3000` to see the running project.

---

## Contact

Mail: [xuan.yeo.08@gmail.com](mailto:xuan.yeo.08@gmail.com)

Project by Yeo Yue Xuan (TP069256) | APU FYP 2025
