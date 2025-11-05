import { create } from "ipfs-http-client";
import { ethers } from "ethers";
import ProductNFT from "./Backend_Contract/artifacts/contracts/ProductNFT.sol/ProductNFT.json" assert { type: "json" };
import LDToken from "./Backend_Contract/artifacts/contracts/LDToken.sol/LDToken.json" assert { type: "json" };
import pinataSDK from '@pinata/sdk';
import path from 'path';
import fs from 'fs';

const tokenContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const nftContractAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const pinata = new pinataSDK("116702b76ba7f864210b", "67e839d81c0f6f550fedb6ae9a13cc29d8430744a19bc8f620e25c56d2c3f307"); // Replace with your Pinata credentials

export async function uploadToPinataImage(buffer, originalName) {
  const tempPath = path.join("temp", originalName);
  fs.writeFileSync(tempPath, buffer);

  const readableStreamForFile = fs.createReadStream(tempPath);
  const result = await pinata.pinFileToIPFS(readableStreamForFile, {
    pinataMetadata: { name: originalName },
  });

  fs.unlinkSync(tempPath);
  return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
}

export async function uploadMetadataToPinata(metadataObj) {
  const result = await pinata.pinJSONToIPFS(metadataObj, {
    pinataMetadata: { name: metadataObj.name || "product-metadata" },
  });

  return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
}

export async function createOrder(tokenId, otp, buyerPrivateKey, priceInLD) {
  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
  const wallet = new ethers.Wallet(buyerPrivateKey, provider);
  const contract = new ethers.Contract(nftContractAddress, ProductNFT.abi, wallet);

  const price = ethers.utils.parseUnits(priceInLD, 18);

  // Approve token transfer first
  const ldToken = new ethers.Contract(tokenContractAddress, LDToken.abi, wallet);
  const approveTx = await ldToken.approve(nftContractAddress, price);
  await approveTx.wait();

  const tx = await contract.createOrder(tokenId, price, otp);
  return await tx.wait();
}

export async function markAsDelivered(tokenId, otp, buyerPrivateKey) {
  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
  const wallet = new ethers.Wallet(buyerPrivateKey, provider);
  const contract = new ethers.Contract(nftContractAddress, ProductNFT.abi, wallet);
  console.log("🔑 Wallet signer address:", wallet.address);

  const tx = await contract.markAsDelivered(tokenId, otp);
  return await tx.wait();
}

export async function rejectOrder(tokenId, sellerPrivateKey) {
  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
  const wallet = new ethers.Wallet(sellerPrivateKey, provider);
  const contract = new ethers.Contract(nftContractAddress, ProductNFT.abi, wallet);

  const tx = await contract.rejectOrder(tokenId);
  return await tx.wait();
}

export async function mintNFT(metadataURI, userPrivateKey, ownerAddress) {
  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
  const wallet = new ethers.Wallet(userPrivateKey, provider);
  const contract = new ethers.Contract(nftContractAddress, ProductNFT.abi, wallet);

  //const toAddress = wallet.address; // mint 到自己的钱包地址
  const tx = await contract.mintNFT(ownerAddress, metadataURI);
  // const tx = await contract.mintNFT(toAddress, metadataURI);
  const receipt = await tx.wait();

  // Get the token ID from the emitted event (tokenCount in your smart contract)
  const tokenId = receipt.events[0].args.tokenId.toString();

  // Immediately approve contract to transfer NFT
  const approveTx = await contract.approve(nftContractAddress, tokenId);
  await approveTx.wait();

  return tokenId;
  // return { tokenId, toAddress };
}

// Utility to mint LD tokens (for admin use)
export async function mintLDToken(toAddress, amountInLD, adminPrivateKey) {
  const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
  const wallet = new ethers.Wallet(adminPrivateKey, provider);
  const ldToken = new ethers.Contract(tokenContractAddress, LDToken.abi, wallet);

  const amount = ethers.utils.parseUnits(amountInLD, 18);
  const tx = await ldToken.mint(toAddress, amount);
  return await tx.wait();
}