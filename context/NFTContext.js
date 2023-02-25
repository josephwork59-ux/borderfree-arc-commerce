import React, { useState, useEffect, useRef } from 'react';
import Web3Modal from 'web3modal';
import { ethers } from 'ethers';
import axios from 'axios';
import { create as ipfsHttpClient } from 'ipfs-http-client';

import { MarketAddress, MarketAddressABI } from './constants';
import nextConfig from '../next.config';

const cryptoTestnet = process.env.NEXT_PUBLIC_TESTNET;
const dedicatedEndPoint = process.env.NEXT_PUBLIC_IPFS_URL;
// console.log(dedicatedEndPoint);

const fetchContract = (signerOrProvider) => new ethers.Contract(MarketAddress, MarketAddressABI, signerOrProvider);

export const NFTContext = React.createContext();

export const NFTProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState('');
  const [isLoadingNFT, setIsLoadingNFT] = useState(false);
  const nftCurrency = 'MATIC';

  // Avoid exposing IPFS API keys to the browser
  const auth = useRef('');
  const client = useRef({});

  const checkIfWalletIsConnected = async () => {
    if (!window.ethereum) return alert('Please install MetaMask app or browser extension.');

    const accounts = await window.ethereum.request({ method: 'eth_accounts' });

    if (accounts.length) {
      setCurrentAccount(accounts[0]);
    } else {
      console.log('No accounts found.');
    }
  };

  useEffect(async() => {
    checkIfWalletIsConnected();

    // Avoid exposing IPFS API keys to the browser
    const {data} = await fetchAuth();
    auth.current = data;
    client.current = getClient(auth.current);
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) return alert('Please install MetaMask app or browser extension.');

    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

    setCurrentAccount(accounts[0]);
    window.location.reload();
  };

  const uploadToIPFS = async (file) => {
    try {
      const added = await client.current.add({ content: file });
      const url = `${dedicatedEndPoint}/ipfs/${added.path}`;

      return url;
    } catch (error) {
      console.log('Error uploading file to IPFS.', error);
    }
  };

  // Avoid exposing IPFS API keys to the browser
  const fetchAuth = async () => {
    const response = await fetch('/api/secure');
    const data = await response.json();
    return data;
  };

  // Avoid exposing IPFS API keys to the browser
  const getClient = (author) => {
    const responseClient = ipfsHttpClient({ 
      host: 'ipfs.infura.io', 
      protocol: 'https',
      port: 5001, 
      apiPath: '/api/v0',
      headers: { 
        authorization: author, 
      },
    });

    return responseClient;
  };

  const createNFT = async (formInput, fileUrl, router) => {
    const { name, description, price } = formInput;

    if (!name || !description || !price || !fileUrl ) return;

    const data = JSON.stringify({ name, description, image: fileUrl });

    try {
      const added = await client.current.add(data);

      const url = `${dedicatedEndPoint}/ipfs/${added.path}`;

      await createSale(url, price);

      router.push('/');
    } catch (error) {
      console.log('Error uploading file to IPFS.', error);
    }
  };

  const createSale = async (url, formInputPrice, isReselling, id) => {
    const web3Modal = new Web3Modal();
    const connction = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connction);
    const signer = provider.getSigner();

    const price = ethers.utils.parseUnits(formInputPrice, 'ether');
    const contract = fetchContract(signer);
    const listingPrice = await contract.getListingPrice();

    const transaction = !isReselling
      ? await contract.createToken(url, price, { value: listingPrice.toString() })
      : await contract.resellToken(id, price, { value: listingPrice.toString() });

    setIsLoadingNFT(true);
    await transaction.wait();
  };

  const fetchNFTs = async () => {
    setIsLoadingNFT(false);
    
    console.log(cryptoTestnet);
    const provider = new ethers.providers.JsonRpcProvider(cryptoTestnet);
    const contract = fetchContract(provider);

    const data = await contract.fetchMarketItems();

    const items = await Promise.all(data.map(async ({ tokenId, seller, owner, price: unformattedPrice }) => {
      const tokenURI = await contract.tokenURI(tokenId);
      const { data: { image, name, description } } = await axios.get(tokenURI);
      const price = ethers.utils.formatUnits(unformattedPrice.toString(), 'ether');

      return {
        price,
        tokenId: tokenId.toNumber(),
        id: tokenId.toNumber(),
        seller,
        owner,
        image,
        name,
        description,
        tokenURI,
      };
    }));

    return items;
  };

  const fetchMyNFTsOrListedNFTs = async (type) => {
    setIsLoadingNFT(false);

    const web3Modal = new Web3Modal();
    const connction = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connction);
    const signer = provider.getSigner();
    
    const contract = fetchContract(signer);

    const data = type === 'fetchItemsListed'
      ? await contract.fetchItemsListed()
      : await contract.fetchMyNFTs();

    const items = await Promise.all(data.map(async ({ tokenId, seller, owner, price: unformattedPrice }) => {
      const tokenURI = await contract.tokenURI(tokenId);
      const { data: { image, name, description } } = await axios.get(tokenURI);
      const price = ethers.utils.formatUnits(unformattedPrice.toString(), 'ether');

      return {
        price,
        tokenId: tokenId.toNumber(),
        seller,
        owner,
        image,
        name,
        description,
        tokenURI,
      };
    }));

    return items;
  };

  const buyNFT = async (nft) => {
    const web3Modal = new Web3Modal();
    const connction = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connction);
    const signer = provider.getSigner();
    
    const contract = new ethers.Contract(MarketAddress, MarketAddressABI, signer);

    const price = ethers.utils.parseUnits(nft.price.toString(), 'ether');

    const transaction = await contract.createMarketSale(nft.tokenId, { value: price });

    setIsLoadingNFT(true);
    await transaction.wait();
    setIsLoadingNFT(false);
  };

  return (
    <NFTContext.Provider value={{ nftCurrency, connectWallet, currentAccount, uploadToIPFS, createNFT, fetchNFTs, fetchMyNFTsOrListedNFTs, buyNFT, createSale, isLoadingNFT }}>
      {children}
    </NFTContext.Provider>
  );
};
