require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

// Import private key from env file
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Local development network
    hardhat: {
      chainId: 1337
    },
    localhost: {
      url: process.env.LOCALHOST_URL || "http://127.0.0.1:8545",
      chainId: 1337,
    },
    // Ethereum Sepolia testnet
    sepolia: {
      url: process.env.SEPOLIA_URL || "",
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
      gasMultiplier: 1.2
    },
    // Polygon Mumbai testnet
    mumbai: {
      url: process.env.POLYGON_MUMBAI_URL || "",
      accounts: [PRIVATE_KEY],
      chainId: 80001,
      gasMultiplier: 1.5
    }
  },
  // For contract verification
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
      polygonMumbai: process.env.POLYGONSCAN_API_KEY
    }
  },
  // Path configuration (default)
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  // Gas reporter for optimizing gas usage
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    coinmarketcap: process.env.CMC_API_KEY,
    token: "ETH",
    gasPriceApi: "https://api.etherscan.io/api?module=proxy&action=eth_gasPrice"
  }
};