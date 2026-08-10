import { getCreators } from '../utils/getTopCreators';

describe('getCreators (regression: floating-point rounding of summed prices)', () => {
  it('preserves a price that JS float rounding would corrupt (0.015 -> "0.01" via toFixed(2))', () => {
    const nfts = [{ seller: '0xSeller1', price: '0.015' }];

    const result = getCreators(nfts);

    expect(result).toEqual([{ seller: '0xSeller1', sum: '0.015' }]);
  });

  it('sums multiple NFTs for the same seller exactly, without floating-point error', () => {
    const nfts = [
      { seller: '0xSeller1', price: '0.01' },
      { seller: '0xSeller1', price: '0.005' },
    ];

    const result = getCreators(nfts);

    expect(result).toEqual([{ seller: '0xSeller1', sum: '0.015' }]);
  });

  it('groups NFTs by seller separately', () => {
    const nfts = [
      { seller: '0xSeller1', price: '1' },
      { seller: '0xSeller2', price: '2' },
    ];

    const result = getCreators(nfts);

    expect(result).toEqual(expect.arrayContaining([
      { seller: '0xSeller1', sum: '1.0' },
      { seller: '0xSeller2', sum: '2.0' },
    ]));
  });
});
