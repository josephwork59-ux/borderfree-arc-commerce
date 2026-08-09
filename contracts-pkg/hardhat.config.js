import { defineConfig, configVariable } from "hardhat/config";
import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    // Arc Testnet (Circle) - https://docs.arc.io/arc/references/connect-to-arc
    // Native gas currency is USDC (18 decimals, not the usual 6).
    arcTestnet: {
      type: "http",
      chainType: "l1",
      url: configVariable("NEXT_PUBLIC_TESTNET"),
      accounts: [configVariable("NEXT_PUBLIC_PRIVATE_KEY")],
      chainId: 5042002,
    },
  },
  verify: {
    etherscan: {
      apiKey: configVariable("NEXT_PUBLIC_ARCSCAN_API_KEY"),
    },
  },
});
