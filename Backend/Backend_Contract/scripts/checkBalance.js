const { ethers } = require("ethers");
const tokenAbi = require("../artifacts/contracts/LDToken.sol/LDToken.json").abi;

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

const token = new ethers.Contract("0x4ed7c70F96B99c776995fB64377f0d4aB3B0e1C1", tokenAbi, provider);

async function checkBalance() {
  const balance = await token.balanceOf("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
  console.log("💰 Balance:", ethers.formatUnits(balance, 18), "LD");
}

checkBalance();
