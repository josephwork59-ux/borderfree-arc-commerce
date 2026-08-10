import { ethers } from 'ethers';

// Create a function that returns an array of most popular sellers
// A top seller is a person with a high sum of all NFTs they've listed

export const getCreators = (nfts) => {
  if (nfts) {
    const creators = nfts.reduce((creatorMap, nft) => {
      const items = creatorMap.get(nft.seller) || [];
      items.push(nft);
      creatorMap.set(nft.seller, items);

      return creatorMap;
    }, new Map());

    return Array.from(creators, ([seller, items]) => {
      // Sum in wei (BigInt) rather than as JS numbers - floating point can't
      // represent most decimal prices exactly (e.g. 0.015), which previously
      // showed the wrong total after rounding.
      const sumWei = items.reduce(
        (total, item) => total + ethers.parseUnits(item.price.toString(), 'ether'),
        0n,
      );
      const sum = ethers.formatUnits(sumWei, 'ether');

      return ({ seller, sum });
    });
  }
};

// Input
// [
//     {price: '2', seller "A"}
//     {price: '3', seller "B"}
//     {price: '3', seller "A"}
//     {price: '4', seller "C"}
// ]

// Output
// [
//     {price: '5', seller "A"}
//     {price: '4', seller "C"}
//     {price: '3', seller "B"}
// ]
