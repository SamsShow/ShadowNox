require("@nomicfoundation/hardhat-toolbox");

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
    // Arcology Parallel Blockchain - DevNet
    arcologyDevnet: {
      url: process.env.ARCOLOGY_RPC_URL || "http://localhost:8545",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: parseInt(process.env.ARCOLOGY_CHAIN_ID || "1234"),
      timeout: 60000, // Longer timeout for Arcology parallel execution
      gasPrice: "auto"
    },
    // Arcology Parallel Blockchain - Testnet
    arcologyTestnet: {
      url: process.env.ARCOLOGY_TESTNET_RPC_URL || "https://testnet-rpc.arcology.network",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 4321, // Arcology Testnet chain ID (example)
      timeout: 60000,
      gasPrice: "auto"
    },
    // EVVM virtual blockchain network (legacy - for Fisher bot relay only)
    evvm: {
      url: process.env.EVVM_RPC_URL || "http://localhost:8545",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1337 // EVVM Fisher network
    },
    // Local development
    hardhat: {
      chainId: 118,
      // Increase block gas limit to simulate Arcology's high throughput
      blockGasLimit: 30000000
    }
  },
  remappings: {
    "@pythnetwork/": "../../node_modules/@pythnetwork/"
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD"
  }
};

