import market from './NFTMarketplace.json';

// NFTMarketplace deployed to Arc Testnet, includes the fund-loss fix
// (contracts-pkg/contracts/NFTMarketplace.sol) - verified on-chain to match
// the compiled deployedBytecode in ./NFTMarketplace.json byte-for-byte.
export const MarketAddress = '0x091f5097a27A1B4edC59482399849575f9302049';
export const MarketAddressABI = market.abi;
