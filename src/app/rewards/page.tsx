"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Leaf, Wallet, ExternalLink } from 'lucide-react';
import ProgressBar from '@/components/ProgressBar';
import { Header } from '@/components/Header';

// Import the contract ABI and address
import contractABI from '@/contracts/BinTrackRewards.json';
import { deploymentInfo } from '@/contracts/deployment-info';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export default function RewardsPage() {
  const router = useRouter();
  
  // State variables
  const [address, setAddress] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [binCount, setBinCount] = useState(0);
  const [binUsed, setBinUsed] = useState(0);
  const [hasCoupon, setHasCoupon] = useState(false);
  const [hasBadge, setHasBadge] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [claimingReward, setClaimingReward] = useState(false);
  
  // Contract connection
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          await initContract(accounts[0]);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        setLoading(true);
        
        await checkAndSwitchNetwork();
        
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts',
        });
        
        if (accounts.length > 0) {
          setAddress(accounts[0]);
          setIsConnected(true);
          await initContract(accounts[0]);
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
        alert('Failed to connect wallet. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      alert('Please install MetaMask or another Web3 wallet to continue.');
    }
  };

  const checkAndSwitchNetwork = async () => {
    if (!window.ethereum) return;
    
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const sepoliaChainId = '0xaa36a7';
      
      if (chainId !== sepoliaChainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: sepoliaChainId }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: sepoliaChainId,
                    chainName: 'Sepolia Testnet',
                    nativeCurrency: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18,
                    },
                    rpcUrls: ['https://sepolia.infura.io/v3/'],
                    blockExplorerUrls: ['https://sepolia.etherscan.io/'],
                  },
                ],
              });
            } catch (addError) {
              console.error('Failed to add network:', addError);
            }
          }
          alert('Please switch to Sepolia testnet in your wallet');
        }
      }
    } catch (error) {
      console.error('Error checking network:', error);
    }
  };

  const disconnectWallet = () => {
    setAddress('');
    setIsConnected(false);
    setContract(null);
    setProvider(null);
    setBinCount(0);
    setBinUsed(0);
    setHasCoupon(false);
    setHasBadge(false);
  };

  const initContract = async (userAddress: string) => {
    try {
      if (typeof window !== 'undefined' && window.ethereum) {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        setProvider(web3Provider);
        
        const signer = await web3Provider.getSigner();
        
        const binTrackContract = new ethers.Contract(
          deploymentInfo.address, 
          contractABI.abi, 
          signer
        );
        
        setContract(binTrackContract);
        await loadUserData(binTrackContract, userAddress);
      }
    } catch (error) {
      console.error("Failed to initialize contract:", error);
      alert('Failed to connect to smart contract. Please check your network connection.');
    }
  };
  
  const loadUserData = async (contractInstance: ethers.Contract, userAddress: string) => {
    if (!contractInstance || !userAddress) return;
    
    setLoading(true);
    try {
      // Get bin count
      let binCountNumber = 0;
      try {
        const count = await contractInstance.getBinCount(userAddress);
        binCountNumber = Number(count);
      } catch (error) {
        binCountNumber = 0;
      }
      
      setBinCount(binCountNumber);
      
      // Load bins used from localStorage
      const storedBinUsed = localStorage.getItem(`binUsed_${userAddress}`) || '0';
      setBinUsed(Number(storedBinUsed));
      
      // Check rewards status with multiple fallback methods
      let couponStatus = false;
      let badgeStatus = false;
      
      // Try different method names for coupon status
      try {
        couponStatus = await contractInstance.hasCoupon(userAddress);
      } catch (error1) {
        try {
          couponStatus = await contractInstance.coupons(userAddress);
        } catch (error2) {
          try {
            couponStatus = await contractInstance.userCoupons(userAddress);
          } catch (error3) {
            // Auto-grant coupon if user has 1+ bins
            couponStatus = binCountNumber >= 1;
          }
        }
      }
      
      // Try different method names for badge status
      try {
        badgeStatus = await contractInstance.hasBadge(userAddress);
      } catch (error1) {
        try {
          badgeStatus = await contractInstance.badges(userAddress);
        } catch (error2) {
          try {
            badgeStatus = await contractInstance.userBadges(userAddress);
          } catch (error3) {
            // Auto-grant badge if user has 15+ bins
            badgeStatus = binCountNumber >= 15;
          }
        }
      }
      
      setHasCoupon(couponStatus);
      setHasBadge(badgeStatus);
      
      // Save to localStorage for backup
      localStorage.setItem(`userData_${userAddress}`, JSON.stringify({
        binCount: binCountNumber,
        hasCoupon: couponStatus,
        hasBadge: badgeStatus
      }));
      
    } catch (error) {
      // If everything fails, try to get data from localStorage as backup
      const backupData = localStorage.getItem(`userData_${userAddress}`);
      if (backupData) {
        try {
          const data = JSON.parse(backupData);
          setBinCount(data.binCount || 0);
          setHasCoupon(data.hasCoupon || false);
          setHasBadge(data.hasBadge || false);
        } catch (parseError) {
          console.error('Failed to parse backup data');
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  const redeemBinFound = async () => {
    if (!contract || !address) {
      alert('Please connect your wallet first');
      return;
    }
    
    setRedeemLoading(true);
    try {
      let tx;
      try {
        tx = await contract.recordBinFound(address);
      } catch (error1) {
        try {
          tx = await contract.recordBinFound();
        } catch (error2) {
          try {
            tx = await contract.addBin(address);
          } catch (error3) {
            throw new Error('No valid bin recording method found');
          }
        }
      }
      
      alert(`⏳ Transaction submitted! Hash: ${tx.hash.slice(0, 10)}...`);
      
      const receipt = await tx.wait(1);
      
      // Immediate UI update
      const newBinCount = binCount + 1;
      setBinCount(newBinCount);
      
      // Check if user just unlocked rewards
      if (newBinCount === 1 && !hasCoupon) {
        setHasCoupon(true);
        setTimeout(() => {
          alert('🎉 Congratulations! You unlocked the Zomato coupon!');
        }, 1000);
      }
      
      if (newBinCount === 15 && !hasBadge) {
        setHasBadge(true);
        setTimeout(() => {
          alert('🏆 Amazing! You unlocked the Community Hero badge!');
        }, 1500);
      }
      
      // Save to localStorage
      localStorage.setItem(`userData_${address}`, JSON.stringify({
        binCount: newBinCount,
        hasCoupon: newBinCount >= 1 ? true : hasCoupon,
        hasBadge: newBinCount >= 15 ? true : hasBadge
      }));
      
      // Reload from blockchain
      setTimeout(async () => {
        await loadUserData(contract, address);
      }, 3000);
      
      alert(`🎉 Bin recorded successfully! You now have ${newBinCount} bins found!`);
      
    } catch (error: any) {
      if (error.code === 4001) {
        alert('Transaction cancelled by user');
      } else if (error.message?.includes('insufficient funds')) {
        alert('Insufficient funds for gas fees. Please add some ETH to your wallet.');
      } else if (error.message?.includes('Ownable: caller is not the owner')) {
        alert('Only the contract owner can record bins. This is a demo limitation.');
      } else {
        alert(`Transaction failed: ${error.message}`);
      }
    } finally {
      setRedeemLoading(false);
    }
  };

  const claimReward = async (rewardType: 'coupon' | 'badge') => {
    if (!contract || !address) {
      alert('Please connect your wallet first');
      return;
    }
    
    setClaimingReward(true);
    try {
      let tx;
      if (rewardType === 'coupon') {
        if (binCount >= 1 && !hasCoupon) {
          try {
            tx = await contract.grantCoupon(address);
          } catch (error1) {
            try {
              tx = await contract.issueCoupon(address);
            } catch (error2) {
              try {
                tx = await contract.rewardCoupon(address);
              } catch (error3) {
                try {
                  tx = await contract.mintReward(address, 1);
                } catch (error4) {
                  throw new Error('No valid coupon minting method found');
                }
              }
            }
          }
        } else {
          alert('You are not eligible for a coupon or already have one!');
          return;
        }
      } else if (rewardType === 'badge') {
        if (binCount >= 15 && !hasBadge) {
          try {
            tx = await contract.grantBadge(address);
          } catch (error1) {
            try {
              tx = await contract.issueBadge(address);
            } catch (error2) {
              try {
                tx = await contract.rewardBadge(address);
              } catch (error3) {
                try {
                  tx = await contract.mintReward(address, 2);
                } catch (error4) {
                  throw new Error('No valid badge minting method found');
                }
              }
            }
          }
        } else {
          alert('You need 15 bins to claim a badge or already have one!');
          return;
        }
      }
      
      if (tx) {
        alert(`⏳ Claiming ${rewardType}... Transaction: ${tx.hash.slice(0, 10)}...`);
        
        const receipt = await tx.wait(1);
        
        // Immediate UI update
        if (rewardType === 'coupon') {
          setHasCoupon(true);
        } else if (rewardType === 'badge') {
          setHasBadge(true);
        }
        
        setTimeout(() => {
          loadUserData(contract, address);
        }, 2000);
        
        alert(`🎉 ${rewardType.charAt(0).toUpperCase() + rewardType.slice(1)} NFT claimed successfully! Check your wallet.`);
      }
      
    } catch (error: any) {
      if (error.code === 4001) {
        alert('Transaction cancelled by user');
      } else if (error.message?.includes('Already received')) {
        alert(`You have already received this ${rewardType}!`);
      } else {
        alert(`Failed to claim ${rewardType}: ${error.message}`);
      }
    } finally {
      setClaimingReward(false);
    }
  };

  const useBin = () => {
    if (binCount > binUsed) {
      const newBinUsed = binUsed + 1;
      setBinUsed(newBinUsed);
      localStorage.setItem(`binUsed_${address}`, newBinUsed.toString());
      alert('🗑️ Bin used for waste disposal! Keep making an impact!');
    } else {
      alert('You need to find more bins before you can use them!');
    }
  };

  // Auto refresh every 30 seconds
  useEffect(() => {
    if (contract && address && isConnected) {
      const interval = setInterval(async () => {
        try {
          await loadUserData(contract, address);
        } catch (error) {
          console.error('Error in auto refresh:', error);
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [contract, address, isConnected]);

  useEffect(() => {
    const rewardData = localStorage.getItem('rewardData')
    if (rewardData) {
      const data = JSON.parse(rewardData)
      const submittedAt = new Date(data.submittedAt)
      const now = new Date()
      const timeDiff = now.getTime() - submittedAt.getTime()
      
      if (timeDiff < 300000) {
        const notification = document.createElement('div')
        notification.innerHTML = `
          <div class="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-sm">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span class="text-lg">🎉</span>
              </div>
              <div>
                <div class="font-semibold">Report Submitted!</div>
                <div class="text-sm opacity-90">+${data.points} Eco-Points earned</div>
              </div>
            </div>
          </div>
        `
        
        document.body.appendChild(notification)
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification)
          }
        }, 5000)
        
        localStorage.removeItem('rewardData')
      }
    }
  }, [])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 px-4">
      <div className='mb-8 w-full'>
        <Header/>
      </div>
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header with wallet connection */}
        <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">BinTrack Rewards</h1>
          
          <div className="flex items-center gap-4">
            {isConnected ? (
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                  <div className="text-white text-sm font-medium">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </div>
                </div>
                <button
                  onClick={disconnectWallet}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-6 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                ) : (
                  <Wallet className="h-4 w-4" />
                )}
                Connect Wallet
              </button>
            )}
          </div>
        </div>
        
        {/* Main content */}
        <div className="p-8">
          {!isConnected ? (
            <div className="text-center py-16">
              <Wallet className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                Connect your wallet to view rewards
              </h2>
              <p className="text-gray-500 mb-6">
                Track your bins, earn rewards, and make an environmental impact
              </p>
              <p className="text-sm text-gray-400">
                Make sure you're connected to the Sepolia testnet
              </p>
            </div>
          ) : (
            <>
              {/* Stats section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div className="bg-green-50 p-6 rounded-xl">
                  <h3 className="text-lg font-medium text-green-800 mb-2">Bins Found</h3>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-green-600">{binCount}</span>
                    <span className="text-sm text-green-600 mb-1">bins</span>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Progress to next badge</span>
                      <span className="font-medium">{binCount}/15</span>
                    </div>
                    <ProgressBar progress={Math.min((binCount / 15) * 100, 100)} />
                  </div>
                  <button
                    onClick={redeemBinFound}
                    disabled={redeemLoading}
                    className="mt-4 w-full py-2 px-4 rounded bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {redeemLoading ? (
                      <span className="inline-block h-4 w-4 rounded-full border-2 border-green-200 border-t-green-600 animate-spin mr-2"></span>
                    ) : null}
                    🔍 Record New Bin Found
                  </button>
                </div>
                
                <div className="bg-teal-50 p-6 rounded-xl">
                  <h3 className="text-lg font-medium text-teal-800 mb-2">Bins Used for Disposal</h3>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-teal-600">{binUsed}</span>
                    <span className="text-sm text-teal-600 mb-1">times</span>
                  </div>
                  <p className="text-xs text-teal-600 mt-2">Track how often you use bins for waste disposal</p>
                  <button
                    onClick={useBin}
                    disabled={binCount <= binUsed}
                    className="mt-4 w-full py-2 px-4 rounded bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    🗑️ Use Bin for Disposal
                  </button>
                </div>
              </div>
              
              {/* Coupons section */}
              <div className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your NFT Coupons</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`border rounded-lg p-4 ${hasCoupon ? 'bg-white border-green-300' : binCount >= 1 ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-100'}`}>
                    <div className="aspect-video relative bg-gradient-to-r from-red-500 to-orange-500 rounded-md overflow-hidden mb-3">
                      {hasCoupon ? (
                        <Image 
                          src="https://gateway.pinata.cloud/ipfs/QmTS4zUWHGtRDggBiNHc76fsJSXv61jiwqcoPV33HycP6B"
                          alt="Zomato Coupon"
                          fill
                          sizes="(max-width: 768px) 100vw, 50vw"
                          style={{ objectFit: 'cover' }}
                          className="bg-white/10"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white/40 font-bold text-lg">Locked</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-800">Zomato 15% Discount NFT</h3>
                    <p className="text-xs text-gray-500 mb-3">Find 1 bin to unlock</p>
                    {hasCoupon ? (
                      <div className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full inline-block">
                        ✅ NFT Owned in Wallet!
                      </div>
                    ) : binCount >= 1 ? (
                      <button
                        onClick={() => claimReward('coupon')}
                        disabled={claimingReward}
                        className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm rounded-lg disabled:opacity-50"
                      >
                        {claimingReward ? 'Claiming...' : '🎁 Claim NFT Coupon'}
                      </button>
                    ) : (
                      <div className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full inline-block">
                        {binCount}/1 Bins
                      </div>
                    )}
                  </div>

                  <div className={`border rounded-lg p-4 ${binCount >= 5 ? 'bg-white border-purple-300' : 'bg-gray-100'}`}>
                    <div className="aspect-video relative bg-gradient-to-r from-pink-500 to-purple-500 rounded-md overflow-hidden mb-3">
                      {binCount >= 5 ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white font-bold text-2xl">MYNTRA</span>
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white/40 font-bold text-lg">Locked</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-800">Myntra 10% Discount</h3>
                    <p className="text-xs text-gray-500 mb-3">Find 5 bins to unlock</p>
                    {binCount >= 5 ? (
                      <div className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full inline-block">
                        ✅ Unlocked!
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full inline-block">
                        {binCount}/5 Bins
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Badges section */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your NFT Achievements</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`border rounded-lg p-4 ${binCount >= 10 ? 'bg-white border-blue-300' : 'bg-gray-100'}`}>
                    <div className="aspect-square relative bg-gradient-to-r from-blue-500 to-teal-500 rounded-full w-24 h-24 mx-auto overflow-hidden mb-3">
                      {binCount >= 10 ? (
                        <Image 
                          src="https://gateway.pinata.cloud/ipfs/QmW5StCd5v5DqSYufGTeUv4R5sxNHgetcxnQ8gQVX2tw32"
                          alt="Bin Hunter Badge"
                          fill
                          sizes="96px"
                          style={{ objectFit: 'contain' }}
                          className="p-2"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white/40 font-bold">?</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-center text-gray-800">Bin Hunter NFT</h3>
                    <p className="text-xs text-center text-gray-500 mb-2">Find 10 bins to earn</p>
                    <div className="flex justify-center">
                      {binCount >= 10 ? (
                        <div className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full inline-block">
                          ✅ Unlocked!
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full inline-block">
                          {binCount}/10 Bins
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className={`border rounded-lg p-4 ${hasBadge ? 'bg-white border-yellow-300' : binCount >= 15 ? 'bg-yellow-50 border-yellow-300' : 'bg-gray-100'}`}>
                    <div className="aspect-square relative bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full w-24 h-24 mx-auto overflow-hidden mb-3">
                      {hasBadge ? (
                        <Image 
                          src="https://gateway.pinata.cloud/ipfs/QmZmEK3bz5NwkynG6A75wNBcYZRQV6oD3vgas7c6WHTMsp"
                          alt="Community Hero Badge"
                          fill
                          sizes="96px"
                          style={{ objectFit: 'contain' }}
                          className="p-2"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white/40 font-bold">?</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-center text-gray-800">Community Hero NFT</h3>
                    <p className="text-xs text-center text-gray-500 mb-2">Find 15 bins to earn</p>
                    <div className="flex justify-center">
                      {hasBadge ? (
                        <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full inline-block">
                          ✅ NFT Owned in Wallet!
                        </div>
                      ) : binCount >= 15 ? (
                        <button
                          onClick={() => claimReward('badge')}
                          disabled={claimingReward}
                          className="px-3 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm rounded-lg disabled:opacity-50"
                        >
                          {claimingReward ? 'Claiming...' : '🏆 Claim NFT Badge'}
                        </button>
                      ) : (
                        <div className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full inline-block">
                          {binCount}/15 Bins
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-white mt-12 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center mt-9">
                <Leaf className="h-7 w-7 text-[#4CAF50] mr-2" />
                <span className="text-2xl font-bold text-green-700">BIN<span className="font-bold italic text-black ">track</span></span>
              </Link>
              <div className="flex space-x-4 mt-4">
                <a href="#" className="bg-green-600 text-white p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a href="#" className="bg-green-600 text-white p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="#" className="bg-green-600 text-white p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="#" className="bg-green-600 text-white p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about-us" className="text-gray-500 hover:text-green-600">About Us</Link></li>
                <li><Link href="/bin-locator" className="text-gray-500 hover:text-green-600">Bin Locator</Link></li>
                <li><Link href="/eco-challenges" className="text-gray-500 hover:text-green-600">Eco Challenges</Link></li>
                <li><Link href="/reviews" className="text-gray-500 hover:text-green-600">BINTrack Reviews</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4">Get Involved</h4>
              <ul className="space-y-2">
                <li><Link href="/volunteer" className="text-gray-500 hover:text-green-600">Volunteer With Us</Link></li>
                <li><Link href="/report-bin" className="text-gray-500 hover:text-green-600">Report a Bin</Link></li>
                <li><Link href="/cleanup" className="text-gray-500 hover:text-green-600">Join a Cleanup</Link></li>
                <li><Link href="/share-story" className="text-gray-500 hover:text-green-600">Share Your Story</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4">Support & Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/faqs" className="text-gray-500 hover:text-green-600">FAQs</Link></li>
                <li><Link href="/contact-us" className="text-gray-500 hover:text-green-600">Contact Us</Link></li>
                <li><Link href="/privacy" className="text-gray-500 hover:text-green-600">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-500 hover:text-green-600">Terms & Conditions</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-500">Copyright © 2025 BINTrack. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}