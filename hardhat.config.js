const fs = require('fs');
require("@nomicfoundation/hardhat-toolbox");

const privateKey = fs.readFileSync('.secret').toString().trim();

module.exports = {
  networks: {
    mumbai: {
      url: process.env.NEXT_PUBLIC_TESTNET,
      accounts: [
        process.env.NEXT_PUBLIC_PRIVATE_KEY,
      ],
      chainId: 80001
    },
  },
  etherscan: {
    apiKey: process.env.NEXT_PUBLIC_POLYGONSCAN_API_KEY
  },
  solidity: '0.8.4',
};
