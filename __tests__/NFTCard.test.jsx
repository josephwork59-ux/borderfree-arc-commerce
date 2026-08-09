import { render, screen } from '@testing-library/react';

import NFTCard from '../components/NFTCard';
import { NFTContext } from '../context/NFTContext';

const nft = {
  tokenId: 1,
  image: 'https://example.com/nft.png',
  name: 'Cool NFT',
  price: '1.5',
  seller: '0x1234567890abcdef1234567890abcdef12345678',
  owner: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
};

const renderWithCurrency = (ui) => render(
  <NFTContext.Provider value={{ nftCurrency: 'USDC' }}>
    {ui}
  </NFTContext.Provider>,
);

describe('NFTCard', () => {
  it('renders the NFT name, price, and currency', () => {
    renderWithCurrency(<NFTCard nft={nft} />);

    expect(screen.getByText('Cool NFT')).toBeInTheDocument();
    expect(screen.getByText('1.5')).toBeInTheDocument();
    expect(screen.getByText('USDC')).toBeInTheDocument();
  });

  it('shows the seller address by default', () => {
    renderWithCurrency(<NFTCard nft={nft} />);

    expect(screen.getByText('0x123...5678')).toBeInTheDocument();
  });

  it('shows the owner address when onProfilePage is set', () => {
    renderWithCurrency(<NFTCard nft={nft} onProfilePage />);

    expect(screen.getByText('0xabc...abcd')).toBeInTheDocument();
  });

  it('links to the nft-details page for this token', () => {
    renderWithCurrency(<NFTCard nft={nft} />);

    expect(screen.getByRole('link')).toHaveAttribute('href', expect.stringContaining('/nft-details'));
  });
});
