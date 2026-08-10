import React, { useState, useEffect } from 'react';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import axios from 'axios';

import { MarketAddress, MarketAddressABI } from './constants';

const cryptoTestnet = process.env.NEXT_PUBLIC_TESTNET;

const fetchContract = (signerOrProvider) => new ethers.Contract(MarketAddress, MarketAddressABI, signerOrProvider);

// Web3Modal has nothing to list when there's no injected wallet and no other
// providerOptions configured - without this check it silently renders an
// empty, zero-height modal instead of any usable UI or error message.
const isWalletAvailable = () => {
  if (window.ethereum) return true;
  alert('Please install MetaMask app or browser extension.');
  return false;
};

// Uploads to IPFS via Filebase (pages/api/upload.js) - the S3-style
// credentials never leave the server.
const uploadToFilebase = async (content, fileName, contentType) => {
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'content-type': contentType,
      'x-filename': encodeURIComponent(fileName),
    },
    body: content,
  });

  if (!response.ok) {
    throw new Error('Upload to IPFS failed.');
  }

  const { url } = await response.json();
  return url;
};

export const NFTContext = React.createContext();

export const NFTProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState('');
  const [isLoadingNFT, setIsLoadingNFT] = useState(false);
  const nftCurrency = 'USDC';

  const checkIfWalletIsConnected = async () => {
    if (!isWalletAvailable()) return;

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });

      if (accounts.length) {
        setCurrentAccount(accounts[0]);
      } else {
        console.log('No accounts found.');
      }
    } catch (error) {
      console.log('Error checking wallet connection.', error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const connectWallet = async () => {
    if (!isWalletAvailable()) return;

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

      setCurrentAccount(accounts[0]);
      window.location.reload();
    } catch (error) {
      console.log('Error connecting wallet.', error);
      alert('Unable to connect wallet. Please try again.');
    }
  };

  const uploadToIPFS = async (file) => {
    try {
      return await uploadToFilebase(file, file.name, file.type || 'application/octet-stream');
    } catch (error) {
      console.log('Error uploading file to IPFS.', error);
      alert('Unable to upload file to IPFS. Please try again.');
    }
  };

  const createSale = async (url, formInputPrice, isReselling, id) => {
    if (!isWalletAvailable()) throw new Error('No wallet available.');

    try {
      const web3Modal = new Web3Modal();
      const connction = await web3Modal.connect();
      const provider = new ethers.BrowserProvider(connction);
      const signer = await provider.getSigner();

      const price = ethers.parseUnits(formInputPrice, 'ether');
      const contract = fetchContract(signer);
      const listingPrice = await contract.getListingPrice();

      const transaction = !isReselling
        ? await contract.createToken(url, price, { value: listingPrice.toString() })
        : await contract.resellToken(id, price, { value: listingPrice.toString() });

      setIsLoadingNFT(true);
      await transaction.wait();
    } finally {
      setIsLoadingNFT(false);
    }
  };

  const createNFT = async (formInput, fileUrl, router) => {
    const { name, description, price } = formInput;

    if (!name || !description || !price || !fileUrl) return;

    const data = JSON.stringify({ name, description, image: fileUrl });

    try {
      const url = await uploadToFilebase(data, 'metadata.json', 'application/json');

      await createSale(url, price);

      router.push('/');
    } catch (error) {
      console.log('Error creating NFT.', error);
      alert('Unable to create NFT. Please try again.');
    }
  };

  const fetchNFTs = async () => {
    setIsLoadingNFT(false);

    try {
      const provider = new ethers.JsonRpcProvider(cryptoTestnet);
      const contract = fetchContract(provider);

      const data = await contract.fetchMarketItems();

      const items = await Promise.all(data.map(async ({ tokenId, seller, owner, price: unformattedPrice }) => {
        const tokenURI = await contract.tokenURI(tokenId);
        const { data: { image, name, description } } = await axios.get(tokenURI);
        const price = ethers.formatUnits(unformattedPrice, 'ether');

        return {
          price,
          tokenId: Number(tokenId),
          id: Number(tokenId),
          seller,
          owner,
          image,
          name,
          description,
          tokenURI,
        };
      }));

      return items;
    } catch (error) {
      console.log('Error fetching NFTs.', error);
      return [];
    }
  };

  const fetchMyNFTsOrListedNFTs = async (type) => {
    setIsLoadingNFT(false);

    if (!isWalletAvailable()) return [];

    try {
      const web3Modal = new Web3Modal();
      const connction = await web3Modal.connect();
      const provider = new ethers.BrowserProvider(connction);
      const signer = await provider.getSigner();

      const contract = fetchContract(signer);

      const data = type === 'fetchItemsListed'
        ? await contract.fetchItemsListed()
        : await contract.fetchMyNFTs();

      const items = await Promise.all(data.map(async ({ tokenId, seller, owner, price: unformattedPrice }) => {
        const tokenURI = await contract.tokenURI(tokenId);
        const { data: { image, name, description } } = await axios.get(tokenURI);
        const price = ethers.formatUnits(unformattedPrice, 'ether');

        return {
          price,
          tokenId: Number(tokenId),
          seller,
          owner,
          image,
          name,
          description,
          tokenURI,
        };
      }));

      return items;
    } catch (error) {
      console.log('Error fetching NFTs.', error);
      return [];
    }
  };

  const buyNFT = async (nft) => {
    if (!isWalletAvailable()) return;

    try {
      const web3Modal = new Web3Modal();
      const connction = await web3Modal.connect();
      const provider = new ethers.BrowserProvider(connction);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(MarketAddress, MarketAddressABI, signer);

      const price = ethers.parseUnits(nft.price.toString(), 'ether');

      const transaction = await contract.createMarketSale(nft.tokenId, { value: price });

      setIsLoadingNFT(true);
      await transaction.wait();
    } finally {
      setIsLoadingNFT(false);
    }
  };

  return (
    <NFTContext.Provider value={{ nftCurrency, connectWallet, currentAccount, uploadToIPFS, createNFT, fetchNFTs, fetchMyNFTsOrListedNFTs, buyNFT, createSale, isLoadingNFT }}>
      {children}
    </NFTContext.Provider>
  );
};
