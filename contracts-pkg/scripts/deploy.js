import { network } from "hardhat";

async function main() {
  const { ethers } = await network.create();
  const nftMarketplace = await ethers.deployContract("NFTMarketplace");

  await nftMarketplace.waitForDeployment();

  console.log("NFTMarketplace deployed to:", await nftMarketplace.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
