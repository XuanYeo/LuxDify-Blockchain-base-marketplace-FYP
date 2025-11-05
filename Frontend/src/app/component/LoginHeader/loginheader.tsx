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
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);

  // Function to handle wallet connection
  const connectWallet = async () => {
    try {
      const provider = await detectEthereumProvider();
      
      if (provider && window.ethereum) {  // Added the window.ethereum check
        // Request account access
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        
        // Get the first account
        const account = accounts[0];
        setAccount(account);
        setIsConnected(true);
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', function (accounts: string[]) {
          setAccount(accounts[0]);
        });

      } else {
        alert('Please install MetaMask!');
      }
    } catch (error) {
      console.error(error);
      alert('Error connecting to MetaMask');
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
        <Link href="/#">
          <img src="../../../Images/LuxDify _Logo_bg.png" alt="Luxdify Logo" className="logo-img" />
        </Link>
      </div>
      {/* <div className="search-box">
        <input type="text" placeholder="Search..." />
        <i className="fa-solid fa-magnifying-glass"></i>
      </div> */}
      <nav className="nav">
      <ul>
          <li><Link href="/">Home</Link></li>
          {/* <li><Link href="/user">About</Link></li> */}
          <div className="dropdownmenu" >
            <li><Link href="/collection">Collection</Link>
            <div className="dropdown">
              <ul>
                <li><Link href="/collection/category_bag" className="dropdown_a">Bag</Link></li>
                <li><Link href="/collection/category_jewelry" className="dropdown_a">Jewelry</Link></li>
                <li><Link href="/collection/category_watch" className="dropdown_a">Watch</Link></li>
                <li><Link href="/collection/category_perfume" className="dropdown_a">Perfume</Link></li>
              </ul>
            </div>
            </li>
          </div>
        </ul>
        
        <button className="login-btn" onClick={connectWallet}>
          {isConnected ? formatAddress(account) : 'Connect Wallet'}
        </button>
      </nav>
    </header>
  );
};

export default Header;
