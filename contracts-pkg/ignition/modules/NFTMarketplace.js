import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("NFTMarketplaceModule", (m) => {
  const nftMarketplace = m.contract("NFTMarketplace");

  return { nftMarketplace };
});
