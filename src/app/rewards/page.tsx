'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Leaf, CheckCircle, AlertCircle, Clock, RefreshCcw, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Mock data - you'll replace this with your actual API calls
const mockUserStats = {
  binsReported: 1,
  rewardsEarned: 0,
  level: 'Eco Beginner',
  nftsClaimed: 0
};

// Sample NFT ABI - you'll need to replace this with your actual contract ABI
const mockNftAbi = [
  "function mintNFT(address recipient, string memory tokenURI) public returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)"
];

export default function RewardsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userStats, setUserStats] = useState(mockUserStats);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [isMinting, setIsMinting] = useState(false);
  const [transactionHash, setTransactionHash] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Check if user is authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Function to connect MetaMask wallet
  const connectWallet = async () => {
    setIsConnecting(true);
    setErrorMessage('');
    
    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        throw new Error("Please install MetaMask to claim your NFT rewards");
      }
      
      // Request access to the user's Ethereum accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Check if we're on Sepolia testnet
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7') { // Sepolia chainId is 0xaa36a7
        // Prompt user to switch to Sepolia
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xaa36a7' }],
          });
        } catch (switchError) {
          // If Sepolia is not added to MetaMask, add it
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0xaa36a7',
                  chainName: 'Sepolia Testnet',
                  nativeCurrency: {
                    name: 'Sepolia ETH',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/demo'],
                  blockExplorerUrls: ['https://sepolia.etherscan.io']
                }],
              });
            } catch (addError) {
              throw new Error("Failed to add Sepolia network");
            }
          } else {
            throw switchError;
          }
        }
      }
      
      setWalletAddress(accounts[0]);
      setWalletConnected(true);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setErrorMessage(error.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Function to mint NFT - This is a mock implementation
  const mintNFT = async () => {
    // Check if user has reported enough bins
    if (userStats.binsReported < 1) {
      setErrorMessage("You need to report at least 1 bin to claim this NFT");
      return;
    }
    
    if (!walletConnected) {
      setErrorMessage("Please connect your wallet first");
      return;
    }
    
    setIsMinting(true);
    setErrorMessage('');
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // Replace with your actual NFT contract address on Sepolia
      const nftContractAddress = "0x0000000000000000000000000000000000000000"; 
      
      // Connect to the contract
      const nftContract = new ethers.Contract(
        nftContractAddress,
        mockNftAbi,
        signer
      );
      
      // Call the mint function - in a real implementation
      // This would interact with your deployed NFT contract
      // For now, we'll simulate a success
      
      // Normally, you'd do something like this:
      // const tx = await nftContract.mintNFT(
      //   walletAddress, 
      //   "https://yourapi.com/metadata/burger-nft.json"
      // );
      // await tx.wait();
      // setTransactionHash(tx.hash);
      
      // For the mock implementation:
      setTimeout(() => {
        setTransactionHash("0x" + Math.random().toString(16).substr(2, 64));
        setUserStats(prev => ({
          ...prev,
          nftsClaimed: prev.nftsClaimed + 1,
          rewardsEarned: prev.rewardsEarned + 1
        }));
      }, 2000);
      
    } catch (error) {
      console.error("Error minting NFT:", error);
      setErrorMessage(error.message || "Failed to mint NFT");
    } finally {
      setIsMinting(false);
    }
  };
  
  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#edf7f2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-[#edf7f2]">
      <header className="bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            <Link href="/home" className="flex items-center">
              <motion.div
                className="flex items-center"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Leaf className="h-7 w-7 text-[#4CAF50] mr-2" />
                <h1 className="text-2xl font-bold">
                  <span className="text-[#4CAF50]">BIN</span>
                  <span className="text-gray-800">track</span>
                </h1>
              </motion.div>
            </Link>

            <motion.nav
              className="hidden md:flex items-center space-x-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Link href="/home" className="text-gray-800 hover:text-[#4CAF50] transition-colors">
                Home
              </Link>
              <Link href="/map" className="text-gray-800 hover:text-[#4CAF50] transition-colors">
                Map
              </Link>
              <Link href="/rewards" className="text-[#4CAF50] font-medium transition-colors">
                Rewards
              </Link>
            </motion.nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl font-bold text-center mb-2">Your Eco Rewards</h2>
          <p className="text-gray-600 text-center">Earn NFTs and rewards by contributing to a cleaner environment</p>
        </motion.div>

        {/* Stats Section */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Bins Reported</h3>
            <p className="text-3xl font-bold text-[#4CAF50]">{userStats.binsReported}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Rewards Earned</h3>
            <p className="text-3xl font-bold text-[#4CAF50]">{userStats.rewardsEarned}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-medium text-gray-800 mb-2">NFTs Claimed</h3>
            <p className="text-3xl font-bold text-[#4CAF50]">{userStats.nftsClaimed}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Your Level</h3>
            <p className="text-xl font-bold text-[#4CAF50]">{userStats.level}</p>
          </div>
        </motion.div>

        {/* NFT Rewards Section */}
        <motion.div
          className="bg-white rounded-xl shadow-md overflow-hidden mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800">Available NFT Rewards</h3>
            <p className="text-gray-600">Claim exclusive BINtrack NFTs on the Sepolia testnet</p>
          </div>

          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/3">
                <div className="bg-[#f0f9f1] rounded-lg p-4 flex items-center justify-center h-64 mb-4">
                  <div className="text-center">
                    <div className="w-48 h-48 mx-auto rounded-lg overflow-hidden bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                      <Image 
                        src="/burger-nft.png" 
                        alt="Burger NFT" 
                        width={160} 
                        height={160}
                        className="object-cover"
                        // If you don't have this image, replace with:
                        // unoptimized
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-2/3">
                <h4 className="text-xl font-bold text-gray-800 mb-2">Burger NFT Token</h4>
                <p className="text-gray-600 mb-4">
                  Limited edition NFT rewarded to eco-conscious citizens who report waste bins in their community.
                  Minted on Sepolia testnet, this NFT represents your contribution to a cleaner environment.
                </p>
                
                <div className="mb-6">
                  <h5 className="text-sm font-medium text-gray-600 mb-2">Requirements:</h5>
                  <div className="flex items-center">
                    <CheckCircle className={w-5 h-5 ${userStats.binsReported >= 1 ? 'text-green-500' : 'text-gray-300'} mr-2} />
                    <span className={userStats.binsReported >= 1 ? 'text-gray-800' : 'text-gray-500'}>
                      Report at least 1 bin
                    </span>
                  </div>
                </div>
                
                {errorMessage && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4 flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {transactionHash ? (
                  <div className="bg-green-50 text-green-600 p-4 rounded-md mb-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="font-semibold">NFT Minted Successfully!</span>
                    </div>
                    <div className="text-sm flex items-center">
                      <span className="mr-1">Transaction:</span>
                      <a 
                        href={https://sepolia.etherscan.io/tx/${transactionHash}}
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="text-green-700 underline flex items-center"
                      >
                        {${transactionHash.substring(0, 8)}...${transactionHash.substring(transactionHash.length - 8)}}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <>
                    {!walletConnected ? (
                      <button
                        onClick={connectWallet}
                        disabled={isConnecting}
                        className="w-full md:w-auto bg-green-500 hover:bg-green-600 transition-colors text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center"
                      >
                        {isConnecting ? (
                          <>
                            <RefreshCcw className="w-5 h-5 mr-2 animate-spin" />
                            Connecting Wallet...
                          </>
                        ) : (
                          <>Connect MetaMask Wallet</>
                        )}
                      </button>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-3 rounded-md text-sm">
                          <p className="text-gray-700">Connected Wallet:</p>
                          <p className="font-mono text-gray-600">{${walletAddress.substring(0, 8)}...${walletAddress.substring(walletAddress.length - 8)}}</p>
                        </div>
                        
                        <button
                          onClick={mintNFT}
                          disabled={isMinting || userStats.binsReported < 1}
                          className={`w-full md:w-auto font-medium py-3 px-6 rounded-lg flex items-center justify-center ${
                            userStats.binsReported < 1 
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-green-500 hover:bg-green-600 transition-colors text-white'
                          }`}
                        >
                          {isMinting ? (
                            <>
                              <RefreshCcw className="w-5 h-5 mr-2 animate-spin" />
                              Minting NFT...
                            </>
                          ) : (
                            <>Claim Burger NFT</>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* How it works section */}
        <motion.div
          className="bg-white rounded-xl shadow-md overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800">How It Works</h3>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🗑</span>
                </div>
                <h4 className="text-lg font-medium text-gray-800 mb-2">Report Bins</h4>
                <p className="text-gray-600">Find and report waste bins in your community to help others locate them easily.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <h4 className="text-lg font-medium text-gray-800 mb-2">Connect Wallet</h4>
                <p className="text-gray-600">Connect your MetaMask wallet to receive NFTs on the Sepolia testnet.</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏆</span>
                </div>
                <h4 className="text-lg font-medium text-gray-800 mb-2">Claim Rewards</h4>
                <p className="text-gray-600">Earn exclusive NFTs as a thank you for your contribution to waste management.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}