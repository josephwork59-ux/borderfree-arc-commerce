import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/router';

import NFTDetails from '../pages/nft-details';
import { NFTContext } from '../context/NFTContext';

jest.mock('next/router', () => ({ useRouter: jest.fn() }));

// Deliberately mixed-case, matching what ethers v6 returns for contract-read
// addresses (EIP-55 checksummed), to catch the exact bug: comparisons that
// only lowercase one side never match a wallet address that isn't already
// all-lowercase.
const nftQuery = {
  tokenId: '1',
  image: 'https://example.com/nft.png',
  name: 'Cool NFT',
  price: '0.01',
  description: 'A cool NFT',
  seller: '0x000000000000000000000000000000000000dEaD',
  owner: '0xB21A4269A3b4854fEd77CeB35076Dedb47C47894',
  tokenURI: 'https://example.com/metadata.json',
};

const renderWithAccount = (currentAccount) => {
  useRouter.mockReturnValue({ isReady: true, query: nftQuery, push: jest.fn() });

  return render(
    <NFTContext.Provider value={{
      currentAccount, nftCurrency: 'USDC', buyNFT: jest.fn(), isLoadingNFT: false,
    }}
    >
      <NFTDetails />
    </NFTContext.Provider>,
  );
};

describe('NFTDetails owner/seller checks (regression: case-sensitive address comparison)', () => {
  it('shows "List on Marketplace" when the connected account owns the NFT, regardless of address casing', () => {
    // Same address as nft.owner, but lowercase - as some wallets return it.
    renderWithAccount('0xb21a4269a3b4854fed77ceb35076dedb47c47894');

    expect(screen.getByRole('button', { name: 'List on Marketplace' })).toBeInTheDocument();
    expect(screen.queryByText(/buy for/i)).not.toBeInTheDocument();
  });

  it('shows "You cannot buy your own NFT" when the connected account is the seller, regardless of address casing', () => {
    // Same address as nft.seller, but a different case than what's stored.
    renderWithAccount('0x000000000000000000000000000000000000DEAD');

    expect(screen.getByText('You cannot buy your own NFT')).toBeInTheDocument();
  });

  it('shows the Buy button for an unrelated account', () => {
    renderWithAccount('0x1111111111111111111111111111111111111111');

    expect(screen.getByRole('button', { name: /buy for 0.01 usdc/i })).toBeInTheDocument();
  });
});
