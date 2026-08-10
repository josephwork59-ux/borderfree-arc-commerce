import { useContext } from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';

import { NFTContext, NFTProvider } from '../context/NFTContext';

jest.mock('web3modal');

jest.mock('ethers', () => ({
  ethers: {
    Contract: jest.fn(),
    BrowserProvider: jest.fn(),
    JsonRpcProvider: jest.fn(),
    parseUnits: jest.fn((value) => BigInt(Math.round(Number(value) * 1e18))),
    formatUnits: jest.fn((value) => (Number(value) / 1e18).toString()),
  },
}));

const wrapper = ({ children }) => <NFTProvider>{children}</NFTProvider>;

let mockContract;

beforeEach(() => {
  jest.clearAllMocks();

  global.fetch.mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ url: 'https://ipfs.filebase.io/ipfs/QmMockHash' }),
  });

  mockContract = {
    getListingPrice: jest.fn().mockResolvedValue(1000n),
    createToken: jest.fn(),
    resellToken: jest.fn(),
    createMarketSale: jest.fn(),
    fetchMarketItems: jest.fn().mockResolvedValue([]),
    fetchItemsListed: jest.fn().mockResolvedValue([]),
    fetchMyNFTs: jest.fn().mockResolvedValue([]),
    tokenURI: jest.fn(),
  };
  ethers.Contract.mockImplementation(() => mockContract);
  ethers.BrowserProvider.mockImplementation(() => ({
    getSigner: jest.fn().mockResolvedValue({}),
  }));
  ethers.JsonRpcProvider.mockImplementation(() => ({}));
  Web3Modal.mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({}),
  }));

  delete window.ethereum;
});

describe('NFTProvider', () => {
  it('exposes USDC as the nftCurrency', () => {
    const { result } = renderHook(() => useContext(NFTContext), { wrapper });

    expect(result.current.nftCurrency).toBe('USDC');
  });

  describe('checkIfWalletIsConnected (runs on mount)', () => {
    it('alerts when MetaMask is not installed', async () => {
      renderHook(() => useContext(NFTContext), { wrapper });

      await waitFor(() => expect(global.alert).toHaveBeenCalledWith(
        'Please install MetaMask app or browser extension.',
      ));
    });

    it('sets currentAccount when a wallet account already exists', async () => {
      window.ethereum = { request: jest.fn().mockResolvedValue(['0xExistingAccount']) };

      const { result } = renderHook(() => useContext(NFTContext), { wrapper });

      await waitFor(() => expect(result.current.currentAccount).toBe('0xExistingAccount'));
    });
  });

  describe('connectWallet', () => {
    it('sets currentAccount on success', async () => {
      window.ethereum = { request: jest.fn().mockResolvedValue(['0xNewAccount']) };

      const { result } = renderHook(() => useContext(NFTContext), { wrapper });

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(result.current.currentAccount).toBe('0xNewAccount');
    });

    it('alerts and does not throw when the user rejects the connection', async () => {
      window.ethereum = { request: jest.fn().mockRejectedValue(new Error('User rejected')) };

      const { result } = renderHook(() => useContext(NFTContext), { wrapper });

      await act(async () => {
        await result.current.connectWallet();
      });

      expect(global.alert).toHaveBeenCalledWith('Unable to connect wallet. Please try again.');
      expect(result.current.currentAccount).toBe('');
    });
  });

  describe('createSale isLoadingNFT lifecycle (regression: used to get stuck true forever)', () => {
    it('is true while the transaction is pending and false again once it resolves', async () => {
      let resolveWait;
      const waitPromise = new Promise((resolve) => { resolveWait = resolve; });
      mockContract.createToken.mockResolvedValue({ wait: () => waitPromise });

      const { result } = renderHook(() => useContext(NFTContext), { wrapper });

      let saleCall;
      act(() => {
        saleCall = result.current.createSale('ipfs://token-uri', '1.5');
      });

      await waitFor(() => expect(result.current.isLoadingNFT).toBe(true));

      await act(async () => {
        resolveWait();
        await saleCall;
      });

      expect(result.current.isLoadingNFT).toBe(false);
    });

    it('resets to false even when the transaction fails after being submitted', async () => {
      mockContract.createToken.mockResolvedValue({
        wait: jest.fn().mockRejectedValue(new Error('transaction reverted')),
      });

      const { result } = renderHook(() => useContext(NFTContext), { wrapper });

      await act(async () => {
        await expect(result.current.createSale('ipfs://token-uri', '1.5')).rejects.toThrow('transaction reverted');
      });

      expect(result.current.isLoadingNFT).toBe(false);
    });
  });

  describe('buyNFT isLoadingNFT lifecycle', () => {
    it('resets isLoadingNFT to false after a successful purchase', async () => {
      mockContract.createMarketSale.mockResolvedValue({ wait: jest.fn().mockResolvedValue({}) });

      const { result } = renderHook(() => useContext(NFTContext), { wrapper });

      await act(async () => {
        await result.current.buyNFT({ tokenId: 1, price: '1.5' });
      });

      expect(result.current.isLoadingNFT).toBe(false);
    });

    it('resets isLoadingNFT to false even when the purchase fails', async () => {
      mockContract.createMarketSale.mockResolvedValue({
        wait: jest.fn().mockRejectedValue(new Error('transaction reverted')),
      });

      const { result } = renderHook(() => useContext(NFTContext), { wrapper });

      await act(async () => {
        await expect(result.current.buyNFT({ tokenId: 1, price: '1.5' })).rejects.toThrow('transaction reverted');
      });

      expect(result.current.isLoadingNFT).toBe(false);
    });
  });

  describe('fetch error handling (regression: used to throw and never resolve)', () => {
    it('fetchNFTs returns an empty array when the contract call fails', async () => {
      mockContract.fetchMarketItems.mockRejectedValue(new Error('RPC unreachable'));

      const { result } = renderHook(() => useContext(NFTContext), { wrapper });

      let items;
      await act(async () => {
        items = await result.current.fetchNFTs();
      });

      expect(items).toEqual([]);
    });

    it('fetchMyNFTsOrListedNFTs returns an empty array when the contract call fails', async () => {
      mockContract.fetchMyNFTs.mockRejectedValue(new Error('RPC unreachable'));

      const { result } = renderHook(() => useContext(NFTContext), { wrapper });

      let items;
      await act(async () => {
        items = await result.current.fetchMyNFTsOrListedNFTs();
      });

      expect(items).toEqual([]);
    });
  });

  describe('uploadToIPFS', () => {
    it('posts the file to /api/upload and returns the gateway URL', async () => {
      const { result } = renderHook(() => useContext(NFTContext), { wrapper });
      const file = new File(['content'], 'nft.png', { type: 'image/png' });

      let url;
      await act(async () => {
        url = await result.current.uploadToIPFS(file);
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/upload', expect.objectContaining({
        method: 'POST',
        body: file,
      }));
      expect(url).toBe('https://ipfs.filebase.io/ipfs/QmMockHash');
    });

    it('alerts and returns undefined when the upload fails', async () => {
      global.fetch.mockResolvedValue({ ok: false });
      const { result } = renderHook(() => useContext(NFTContext), { wrapper });
      const file = new File(['content'], 'nft.png', { type: 'image/png' });

      let url;
      await act(async () => {
        url = await result.current.uploadToIPFS(file);
      });

      expect(global.alert).toHaveBeenCalledWith('Unable to upload file to IPFS. Please try again.');
      expect(url).toBeUndefined();
    });
  });

  describe('createNFT', () => {
    it('uploads to IPFS, creates the sale, and navigates home on success', async () => {
      mockContract.createToken.mockResolvedValue({ wait: jest.fn().mockResolvedValue({}) });
      const router = { push: jest.fn() };

      const { result } = renderHook(() => useContext(NFTContext), { wrapper });

      await act(async () => {
        await result.current.createNFT(
          { name: 'Cool NFT', description: 'desc', price: '1.5' },
          'ipfs://file-uri',
          router,
        );
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/upload', expect.objectContaining({ method: 'POST' }));
      expect(router.push).toHaveBeenCalledWith('/');
    });

    it('alerts and does not navigate when the IPFS upload fails', async () => {
      global.fetch.mockResolvedValue({ ok: false });
      const router = { push: jest.fn() };

      const { result } = renderHook(() => useContext(NFTContext), { wrapper });

      await act(async () => {
        await result.current.createNFT(
          { name: 'Cool NFT', description: 'desc', price: '1.5' },
          'ipfs://file-uri',
          router,
        );
      });

      expect(global.alert).toHaveBeenCalledWith('Unable to create NFT. Please try again.');
      expect(router.push).not.toHaveBeenCalled();
    });

    it('does nothing when required fields are missing', async () => {
      const router = { push: jest.fn() };
      const { result } = renderHook(() => useContext(NFTContext), { wrapper });

      await act(async () => {
        await result.current.createNFT({ name: '', description: '', price: '' }, null, router);
      });

      expect(router.push).not.toHaveBeenCalled();
      expect(mockContract.createToken).not.toHaveBeenCalled();
    });
  });
});
