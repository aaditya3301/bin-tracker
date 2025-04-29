"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import ProgressBar from '@/components/ProgressBar';

// Import the contract ABI and address
import contractABI from '@/contracts/BinTrackRewards.json';
import { deploymentInfo } from '@/contracts/deployment-info';

export default function RewardsPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  
  // State variables
  const [binCount, setBinCount] = useState(0);
  const [binUsed, setBinUsed] = useState(0);
  const [hasCoupon, setHasCoupon] = useState(false);
  const [hasBadge, setHasBadge] = useState(false);
  const [loading, setLoading] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);
  
  // Contract connection
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  // Initialize contract connection
  useEffect(() => {
    const initContract = async () => {
      if (!isConnected || !address) return;
      
      try {
        // Connect to the provider
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Create contract instance
        const binTrackContract = new ethers.Contract(
          deploymentInfo.address, 
          contractABI.abi, 
          signer
        );
        
        setContract(binTrackContract);
        
        // Load user data
        await loadUserData(binTrackContract);
      } catch (error) {
        console.error("Failed to initialize contract:", error);
      }
    };
    
    initContract();
  }, [address, isConnected]);
  
  // Load user data from contract
  const loadUserData = async (contractInstance: ethers.Contract) => {
    if (!contractInstance || !address) return;
    
    setLoading(true);
    try {
      // Get bin count
      const count = await contractInstance.getBinCount(address);
      setBinCount(Number(count));
      
      // Check if user has rewards
      const couponStatus = await contractInstance.hasCoupon(address);
      setHasCoupon(couponStatus);
      
      const badgeStatus = await contractInstance.hasBadge(address);
      setHasBadge(badgeStatus);
      
      // For demonstration, setting binUsed to a random number
      // In a real app, you'd track this separately
      setBinUsed(Math.floor(count / 2));
      
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to redeem a bin find (increase bin count)
  const redeemBinFound = async () => {
    if (!contract || !address) return;
    
    setRedeemLoading(true);
    try {
      // Call the contract to record a bin find
      const tx = await contract.recordBinFound(address);
      await tx.wait();
      
      // Reload user data
      await loadUserData(contract);
      
    } catch (error) {
      console.error("Error redeeming bin:", error);
    } finally {
      setRedeemLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header with wallet connection */}
        <div className="bg-gradient-to-r from-green-500 to-teal-600 p-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">BinTrack Rewards</h1>
          <ConnectButton showBalance={false} />
        </div>
        
        {/* Main content */}
        <div className="p-8">
          {!isConnected ? (
            <div className="text-center py-16">
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                Connect your wallet to view rewards
              </h2>
              <p className="text-gray-500 mb-6">
                Track your bins, earn rewards, and make an environmental impact
              </p>
            </div>
          ) : loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
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
                </div>
                
                <div className="bg-teal-50 p-6 rounded-xl">
                  <h3 className="text-lg font-medium text-teal-800 mb-2">Bins Used</h3>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-teal-600">{binUsed}</span>
                    <span className="text-sm text-teal-600 mb-1">bins</span>
                  </div>
                  <button
                    onClick={redeemBinFound}
                    disabled={redeemLoading}
                    className="mt-4 w-full py-2 px-4 rounded bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white font-medium shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {redeemLoading ? (
                      <span className="inline-block h-4 w-4 rounded-full border-2 border-teal-200 border-t-teal-600 animate-spin mr-2"></span>
                    ) : null}
                    Record New Bin Found
                  </button>
                </div>
              </div>
              
              {/* Coupons section */}
              <div className="mb-10">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Coupons</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`border rounded-lg p-4 ${hasCoupon ? 'bg-white' : 'bg-gray-100'}`}>
                    <div className="aspect-video relative bg-gradient-to-r from-red-500 to-orange-500 rounded-md overflow-hidden mb-3">
                      {hasCoupon ? (
                        <Image 
                          src="https://gateway.pinata.cloud/ipfs/QmTS4zUWHGtRDggBiNHc76fsJSXv61jiwqcoPV33HycP6B"
                          alt="Zomato Coupon"
                          fill
                          style={{ objectFit: 'cover' }}
                          className="bg-white/10"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white/40 font-bold text-lg">Locked</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-800">Zomato 15% Discount</h3>
                    <p className="text-xs text-gray-500 mb-3">Find 1 bin to unlock</p>
                    {hasCoupon ? (
                      <div className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full inline-block">
                        Earned
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full inline-block">
                        Locked
                      </div>
                    )}
                  </div>

                  <div className="border rounded-lg p-4 bg-gray-100">
                    <div className="aspect-video relative bg-gradient-to-r from-pink-500 to-purple-500 rounded-md overflow-hidden mb-3">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white/40 font-bold text-lg">Locked</span>
                      </div>
                    </div>
                    <h3 className="font-medium text-gray-800">Myntra 10% Discount</h3>
                    <p className="text-xs text-gray-500 mb-3">Find 5 bins to unlock</p>
                    <div className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full inline-block">
                      Locked
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Badges section */}
              <div>
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Achievements</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`border rounded-lg p-4 ${binCount >= 10 ? 'bg-white' : 'bg-gray-100'}`}>
                    <div className="aspect-square relative bg-gradient-to-r from-blue-500 to-teal-500 rounded-full w-24 h-24 mx-auto overflow-hidden mb-3">
                      {binCount >= 10 ? (
                        <Image 
                          src="https://gateway.pinata.cloud/ipfs/QmW5StCd5v5DqSYufGTeUv4R5sxNHgetcxnQ8gQVX2tw32"
                          alt="Bin Hunter Badge"
                          fill
                          style={{ objectFit: 'contain' }}
                          className="p-2"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white/40 font-bold">?</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-center text-gray-800">Bin Hunter</h3>
                    <p className="text-xs text-center text-gray-500 mb-2">Find 10 bins to earn</p>
                    <div className="flex justify-center">
                      {binCount >= 10 ? (
                        <div className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full inline-block">
                          Earned
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full inline-block">
                          {binCount}/10 Bins
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className={`border rounded-lg p-4 ${hasBadge ? 'bg-white' : 'bg-gray-100'}`}>
                    <div className="aspect-square relative bg-gradient-to-r from-yellow-500 to-amber-600 rounded-full w-24 h-24 mx-auto overflow-hidden mb-3">
                      {hasBadge ? (
                        <Image 
                          src="https://gateway.pinata.cloud/ipfs/QmZmEK3bz5NwkynG6A75wNBcYZRQV6oD3vgas7c6WHTMsp"
                          alt="Community Hero Badge"
                          fill
                          style={{ objectFit: 'contain' }}
                          className="p-2"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-white/40 font-bold">?</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-center text-gray-800">Community Hero</h3>
                    <p className="text-xs text-center text-gray-500 mb-2">Find 15 bins to earn</p>
                    <div className="flex justify-center">
                      {hasBadge ? (
                        <div className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full inline-block">
                          Earned
                        </div>
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
    </div>
  );
}