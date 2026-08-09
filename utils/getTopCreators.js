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
      const sum = items.map((item) => Number(item.price)).reduce((prev, curr) => prev + curr, 0);

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
