import { expect } from "chai";
import { network } from "hardhat";

async function deployMarketplaceFixture() {
  const { ethers } = await network.create();
  const [, seller, buyer] = await ethers.getSigners();
  const marketplace = await ethers.deployContract("NFTMarketplace");
  const listingPrice = await marketplace.getListingPrice();

  return {
    ethers, marketplace, seller, buyer, listingPrice,
  };
}

describe("NFTMarketplace", function () {
  it("pays the seller, not the zero address, when an NFT is sold", async function () {
    const {
      ethers, marketplace, seller, buyer, listingPrice,
    } = await deployMarketplaceFixture();

    const price = ethers.parseUnits("1", "ether");

    await marketplace.connect(seller).createToken("ipfs://token-uri", price, { value: listingPrice });

    const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);

    await marketplace.connect(buyer).createMarketSale(1, { value: price });

    const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);

    expect(sellerBalanceAfter - sellerBalanceBefore).to.equal(price);
    expect(await ethers.provider.getBalance(ethers.ZeroAddress)).to.equal(0n);
  });

  it("transfers ownership of the NFT to the buyer", async function () {
    const {
      ethers, marketplace, seller, buyer, listingPrice,
    } = await deployMarketplaceFixture();

    const price = ethers.parseUnits("1", "ether");

    await marketplace.connect(seller).createToken("ipfs://token-uri", price, { value: listingPrice });
    await marketplace.connect(buyer).createMarketSale(1, { value: price });

    expect(await marketplace.ownerOf(1)).to.equal(buyer.address);
  });
});
