"use client";
import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import '../Header/Header.css';
import detectEthereumProvider from '@metamask/detect-provider';
import Link from 'next/link';
import walletService from '../../services/WalletService';


const Header: React.FC = () => {

  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState('0');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      connectWallet();
    }
  }, []);

  // Function to handle wallet connection
  const connectWallet = async () => {
    try {
      setIsLoading(true); // Show loading
      // Get wallet info from localStorage
      const walletInfo = JSON.parse(localStorage.getItem('userWallet') || '{}');
      
      if (walletInfo && walletInfo.privateKey) {
        // Connect wallet using the private key
        const result = await walletService.connectWithPrivateKey(walletInfo.privateKey);
        
        if (result) {
          setWalletAddress(result.address);
          setWalletBalance(result.balance);
          console.log("Wallet connected automatically:", result.address);
        }
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsLoading(false); // Hide loading
    }
  };

  // Function to format address for display
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  function logout() {
    // localStorage.removeItem('userId');
    // clear everything
    localStorage.clear();
  
    // Redirect to login
    window.location.href = "/login";
  }

  return (
    <header className="header">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" integrity="sha512-Evv84Mr4kqVGRNSgIGL/F/aIDqQb7xQ2vcrdIwxfjThSH8CSR7PBEakCr51Ck+w+/U6swU2Im1vVX0SVk9ABhg==" crossOrigin="anonymous" referrerPolicy="no-referrer" />
      <div className="logo">
        <Link href="/admin">
          <img src="../../../Images/LuxDify _Logo_bg.png" alt="Luxdify Logo" className="logo-img" />
        </Link>
      </div>
      {/* <div className="search-box">
        <input type="text" placeholder="Search..." />
        <i className="fa-solid fa-magnifying-glass"></i>
      </div> */}
      <nav className="nav">
      <ul>
          <li><Link href="/admin">Home</Link></li>
          {/* <li><Link href="/user">About</Link></li> */}
          <div className="dropdownmenu" >
            <li><Link href="/admin/collection">Collection</Link>
            <div className="dropdown">
              <ul>
                <li><Link href="/admin/collection/category_bag" className="dropdown_a">Bag</Link></li>
                <li><Link href="/admin/collection/category_jewelry" className="dropdown_a">Jewellery</Link></li>
                <li><Link href="/admin/collection/category_watch" className="dropdown_a">Watch</Link></li>
                <li><Link href="/admin/collection/category_perfume" className="dropdown_a">Perfume</Link></li>
              </ul>
            </div>
            </li>
          </div>
          {/* <li><Link href="/user">Help</Link></li> */}
          <div className="dropdownmenu">
            <li><Link href="/admin/profile"><i className="fa-regular fa-circle-user fa-2xl"></i></Link></li>
            <div className="dropdown">
              <ul>
                <li><Link href="/admin/profile" className="dropdown_a">Profile</Link></li>
                <li><Link href="/admin/token_reload" className="dropdown_a">Token Request</Link></li>
                <li><a className="dropdown_a" onClick={logout}>Logout</a></li>
              </ul>
            </div>
          </div>
        </ul>
        <div className="wallet-display">
          {isLoading ? (
            <div className="wallet-loading">
              <i className="fa fa-spinner fa-spin" style={{ color: 'white', fontSize: '14px' }}></i>
              <p style={{ marginLeft: '5px', fontSize: '12px' }}>Connecting wallet...</p>
            </div>
          ) : (
            <>
              <p><strong>Wallet:</strong> {walletAddress ? formatAddress(walletAddress) : '-'}</p>
              <p><strong>Balance:</strong> {walletBalance} LD</p>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;
