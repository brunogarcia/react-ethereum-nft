import { ethers } from "ethers";
import React, { useEffect, useState } from "react";

import './styles/App.css';
import contract from './utils/contract.json';

const App = () => {
  /*
  * Just a state variable we use to store our user's public wallet. Don't forget to import useState.
  */
  const [token, setToken] = useState<number | null>(null);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const [currentAccount, setCurrentAccount] = useState("");

  /*
  * Gotta make sure this is async.
  */
  const checkIfWalletIsConnected = async () => {
    const { ethereum } = window;

    if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
    } else {
        console.log("We have the ethereum object", ethereum);
    }

   /*
    * Check if we're authorized to access the user's wallet
    */
   const accounts = await ethereum.request({ method: 'eth_accounts' });

    /*
    * User can have multiple authorized accounts, we grab the first one if its there!
    */
    const isValidAccount = accounts && Array.isArray(accounts) && accounts.length !== 0;
    if (isValidAccount) {
      const [account] = accounts;
      console.log("Found an authorized account:", account);
      setCurrentAccount(account);
      setupEventListener();
    } else {
      console.log("No authorized account found");
    }
  }

/*
  * Connect wallet
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      /*
      * Fancy method to request access to account.
      */
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      /*
      * Boom! This should print out public address once we authorize Metamask.
      */
      const isValidAccount = accounts && Array.isArray(accounts) && accounts.length !== 0;
      if (isValidAccount) {
        const [account] = accounts;
        console.log("Connected", account);
        setCurrentAccount(account); 
        setupEventListener();
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Setup our listener.
  const setupEventListener = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, contract.abi, signer);

        // This will essentially "capture" our event when our contract throws it.
        // If you're familiar with webhooks, it's very similar to that!
        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber())
          setToken(tokenId.toNumber());
        });

        console.log("Setup event listener!")
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  /*
  * Ask the smart contract to mint our NFT
  */
  const askContractToMintNft = async () => {
    setToken(null);
    setButtonDisabled(true);

    try {
      const { ethereum } = window;  
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const connectedContract = new ethers.Contract(import.meta.env.VITE_CONTRACT_ADDRESS, contract.abi, signer);
  
        console.log("Going to pop wallet now to pay gas...")
        let nftTxn = await connectedContract.makeAnEpicNFTList();
  
        console.log("Mining...please wait.")
        await nftTxn.wait();
        
        console.log(`Mined, see transaction: https://goerli.etherscan.io/tx/${nftTxn.hash}`);

        connectedContract.on("NewEpicNFTMinted", (from, tokenId) => {
          console.log(from, tokenId.toNumber())
          setToken(tokenId.toNumber());
        });
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    } finally {
      setButtonDisabled(false);
    }
  }

  // Render Methods
  const renderNotConnectedContainer = () => (
    <button onClick={connectWallet} className="cta-button connect-wallet-button">
      Connect to Wallet
    </button>
  );

  const renderMintButton = () => (
    <button
      onClick={askContractToMintNft}
      disabled={buttonDisabled}
      className="cta-button connect-wallet-button">
      { buttonDisabled ? "Minting..." : "Mint NFT" }
    </button>
  )

  const openSeaLink = () => {
    const { VITE_CONTRACT_ADDRESS } = import.meta.env;
    return `https://testnets.opensea.io/assets/${VITE_CONTRACT_ADDRESS}/${token}`;
  }

  const renderMintMessage = () => (
    <div className="minted-container">
      <p>Hey there! We've minted your NFT and sent it to your wallet.</p>
      <p>It may be blank right now. It can take a max of 10 min to show up.</p>
      <p>
          Check it out on <a href={openSeaLink()} target="_blank">OpenSea</a>
      </p>
    </div>
  )

  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  return (
    <div className="App">
      <div className="container">
        <div className="header-container">
          <p className="header gradient-text">My NFT Collection</p>
          <p className="sub-text">
            Each unique. Each beautiful. Discover your NFT today.
          </p>
          {currentAccount === "" ? renderNotConnectedContainer() : renderMintButton()}
        </div>
        {token && renderMintMessage()}
        <div className="footer-container">
          <a
            className="footer-text"
            href="https://github.com/brunogarcia"
            target="_blank"
            rel="noreferrer"
          >Bruno Garcia</a>
        </div>
      </div>
    </div>
  );
};

export default App;
