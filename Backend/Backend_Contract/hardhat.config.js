// require("@matterlabs/hardhat-zksync-solc");
// require("@matterlabs/hardhat-zksync-verify");
// require("@nomiclabs/hardhat-ethers");
// require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.23",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  defaultNetwork: "hardhat",

  networks: {
    hardhat: {
      chainId: 31337,
    },
    running: {
      url: "http://127.0.0.1:8545",
      accounts: {
        mnemonic: "test test test test test test test test test test test junk"
      },
      chainId: 31337,
    }
  },
  
  // zksolc: {
  //   version: "1.4.1",
  //   compilerSource: "binary",
  //   settings: {
  //     optimizer: {
  //       enabled: true,
  //     },
  //   },
  // },
  // networks: {
  //   zkSyncSepoliaTestnet: {
  //     url: "https://sepolia.era.zksync.dev",
  //     ethNetwork: "sepolia",
  //     zksync: true,
  //     chainId: 300,
  //     verifyURL:
  //       "https://explorer.sepolia.era.zksync.dev/contract_verification",
  //   },
  //   zkSyncMainnet: {
  //     url: "https://mainnet.era.zksync.io",
  //     ethNetwork: "mainnet",
  //     zksync: true,
  //     chainId: 324,
  //     verifyURL:
  //       "https://zksync2-mainnet-explorer.zksync.io/contract_verification",
  //   },
  // },
  // paths: {
  //   artifacts: "./artifacts-zk",
  //   cache: "./cache-zk",
  //   sources: "./contracts",
  //   tests: "./test",
  // },
};
