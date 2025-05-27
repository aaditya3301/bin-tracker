'use client';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { useAuth } from '@/lib/auth';
import EditProfileModal from '@/components/profile/EditProfileModal';
import EditPersonalInfoModal from '@/components/profile/EditPersonalInfoModal';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  User, 
  MapPin, 
  Mail, 
  Edit3, 
  Trophy, 
  Coins, 
  Trash2, 
  Gift,
  Leaf,
  Star,
  Award
} from 'lucide-react';

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  occupation: string;
  // Blockchain synced data
  binsReported: number;
  binsUtilized: number;
  totalEcoCoins: number;
  hasCoupon: boolean;
  hasBadge: boolean;
  badge: string;
}

const ProfilePage = () => {
  const { session, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<UserData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    occupation: '',
    binsReported: 0,
    binsUtilized: 0,
    totalEcoCoins: 0,
    hasCoupon: false,
    hasBadge: false,
    badge: 'Eco Newbie',
  });
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPersonalInfoModalOpen, setIsPersonalInfoModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Function to sync data from rewards page localStorage - FIXED
  const syncRewardsData = () => {
    try {
      // Method 1: Check for connected wallet addresses in localStorage
      const allKeys = Object.keys(localStorage);
      
      // Look for userData_[address] pattern (this is what rewards page uses)
      const userDataKeys = allKeys.filter(key => key.startsWith('userData_'));
      
      if (userDataKeys.length > 0) {
        // Use the most recent wallet data
        const latestKey = userDataKeys[userDataKeys.length - 1];
        const address = latestKey.replace('userData_', '');
        
        console.log('🔍 Found wallet address:', address);
        
        // Get the actual data
        const userData = localStorage.getItem(latestKey);
        const binUsed = localStorage.getItem(`binUsed_${address}`);
        
        if (userData) {
          const data = JSON.parse(userData);
          console.log('📊 Synced blockchain data:', data);
          
          return {
            binsReported: data.binCount || 0,
            binsUtilized: binUsed ? Number(binUsed) : 0,
            totalEcoCoins: (data.binCount || 0) * 50, // 50 coins per bin
            hasCoupon: data.hasCoupon || false,
            hasBadge: data.hasBadge || false,
            badge: getBadgeTitle(data.binCount || 0, data.hasBadge || false)
          };
        }
      }
      
      // Method 2: Fallback - check for any address-based keys
      const addressKeys = allKeys.filter(key => key.includes('0x') && key.startsWith('userData_'));
      if (addressKeys.length > 0) {
        const userData = localStorage.getItem(addressKeys[0]);
        if (userData) {
          const data = JSON.parse(userData);
          const address = addressKeys[0].replace('userData_', '');
          const binUsed = localStorage.getItem(`binUsed_${address}`);
          
          return {
            binsReported: data.binCount || 0,
            binsUtilized: binUsed ? Number(binUsed) : 0,
            totalEcoCoins: (data.binCount || 0) * 50,
            hasCoupon: data.hasCoupon || false,
            hasBadge: data.hasBadge || false,
            badge: getBadgeTitle(data.binCount || 0, data.hasBadge || false)
          };
        }
      }
      
      console.log('⚠️ No blockchain data found in localStorage');
    } catch (error) {
      console.error('❌ Error syncing rewards data:', error);
    }
    
    // Return defaults if nothing found
    return {
      binsReported: 0,
      binsUtilized: 0,
      totalEcoCoins: 0,
      hasCoupon: false,
      hasBadge: false,
      badge: 'Eco Newbie'
    };
  };

  // Helper function for badge titles
  const getBadgeTitle = (binCount: number, hasBadge: boolean) => {
    if (hasBadge) return 'Community Hero';
    if (binCount >= 15) return 'Hero Ready';
    if (binCount >= 10) return 'Bin Hunter';
    if (binCount >= 5) return 'Eco Warrior';
    if (binCount >= 1) return 'Eco Explorer';
    return 'Eco Newbie';
  };

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      const nameParts = session.user.name?.split(' ') || ['', ''];
      
      const fetchUserProfile = async () => {
        try {
          // Get blockchain data
          const blockchainData = syncRewardsData();
          
          // Try to get user profile data
          const response = await fetch(`/api/users/${session.user.id}`);
          
          let profileData = {
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(' '),
            email: session.user.email || '',
            phone: '',
            location: '',
            occupation: '',
          };

          if (response.ok) {
            const userData = await response.json();
            profileData = { ...profileData, ...userData };
          }

          // Combine profile data with blockchain data
          setUserData({
            ...profileData,
            ...blockchainData
          });

        } catch (error) {
          console.error('Error fetching user profile:', error);
          const blockchainData = syncRewardsData();
          
          setUserData({
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(' '),
            email: session.user.email || '',
            phone: '',
            location: '',
            occupation: '',
            ...blockchainData
          });
        } finally {
          setIsLoaded(true);
        }
      };
      
      fetchUserProfile();
      
      // Set up interval to sync rewards data every 10 seconds
      const interval = setInterval(() => {
        const blockchainData = syncRewardsData();
        setUserData(prev => ({  
          ...prev,
          ...blockchainData
        }));
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [session, isAuthenticated]);

  const handleProfileUpdate = async (updatedData: Partial<UserData>) => {
    try {
      const response = await fetch(`/api/users/${session?.user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      if (response.ok) {
        setUserData({
          ...userData,
          ...updatedData,
        });
        setIsProfileModalOpen(false);
        setIsPersonalInfoModalOpen(false);
      } else {
        console.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (isLoading || !isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#edf7f2] flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <>
        <Header/>
        <Head>
          <title>My Profile | BINtrack</title>
          <meta name="description" content="User profile on BINtrack" />
        </Head>

        <div className="min-h-screen bg-gradient-to-b from-white to-[#edf7f2]">
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            
            {/* Profile Header - Simplified */}
            <motion.div 
              className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-gradient-to-r from-green-400 to-green-600 p-8 text-white">
                <div className="flex items-center gap-6">
                  {/* Profile Picture */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-white">
                      {session?.user?.image ? (
                        <Image 
                          src={session.user.image} 
                          alt="Profile" 
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center">
                          <span className="text-2xl font-bold text-white">
                            {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">
                      {userData.firstName} {userData.lastName}
                    </h1>
                    <div className="flex items-center gap-4 text-green-100 mb-3">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {userData.email}
                      </div>
                      {userData.location && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {userData.location}
                        </div>
                      )}
                    </div>
                    
                    {/* Badge */}
                    <div className="inline-flex items-center bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-sm font-bold">
                      <Trophy className="h-4 w-4 mr-1" />
                      {userData.badge}
                    </div>
                  </div>

                  {/* Edit Button */}
                  <button 
                    onClick={() => setIsPersonalInfoModalOpen(true)}
                    className="bg-white bg-opacity-20 backdrop-blur-sm text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-all duration-300 flex items-center gap-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    Edit
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Stats Grid - Simplified */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="bg-white rounded-xl p-6 text-center shadow-lg">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trash2 className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{userData.binsReported}</div>
                <div className="text-sm text-gray-600">Bins Found</div>
              </div>

              <div className="bg-white rounded-xl p-6 text-center shadow-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Leaf className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{userData.binsUtilized}</div>
                <div className="text-sm text-gray-600">Bins Used</div>
              </div>

              <div className="bg-white rounded-xl p-6 text-center shadow-lg">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Coins className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">{userData.totalEcoCoins}</div>
                <div className="text-sm text-gray-600">Eco-Coins</div>
              </div>

              <div className="bg-white rounded-xl p-6 text-center shadow-lg">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Gift className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {(userData.hasCoupon ? 1 : 0) + (userData.hasBadge ? 1 : 0)}
                </div>
                <div className="text-sm text-gray-600">NFT Rewards</div>
              </div>
            </motion.div>

            {/* Main Content - Simplified */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Rewards Status */}
              <motion.div 
                className="bg-white rounded-xl shadow-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  Reward Status
                </h2>

                <div className="space-y-4">
                  {/* Zomato Coupon */}
                  <div className={`p-4 rounded-lg border-2 ${userData.hasCoupon ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Zomato 15% Coupon NFT</h3>
                        <p className="text-sm text-gray-600">Requires 1 bin found</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        userData.hasCoupon 
                          ? 'bg-green-100 text-green-800' 
                          : userData.binsReported >= 1 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {userData.hasCoupon ? '✅ Owned' : userData.binsReported >= 1 ? '🎁 Available' : `${userData.binsReported}/1`}
                      </div>
                    </div>
                  </div>

                  {/* Myntra Coupon */}
                  <div className={`p-4 rounded-lg border-2 ${userData.binsReported >= 5 ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Myntra 10% Coupon</h3>
                        <p className="text-sm text-gray-600">Requires 5 bins found</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        userData.binsReported >= 5 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {userData.binsReported >= 5 ? '🎁 Available' : `${userData.binsReported}/5`}
                      </div>
                    </div>
                  </div>

                  {/* Badge Status */}
                  <div className={`p-4 rounded-lg border-2 ${userData.hasBadge ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">Community Hero Badge NFT</h3>
                        <p className="text-sm text-gray-600">Requires 15 bins found</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        userData.hasBadge 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : userData.binsReported >= 15 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {userData.hasBadge ? '✅ Owned' : userData.binsReported >= 15 ? '🎁 Available' : `${userData.binsReported}/15`}
                      </div>
                    </div>
                  </div>
                </div>

                <Link href="/rewards">
                  <button className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors">
                    View Rewards Dashboard
                  </button>
                </Link>
              </motion.div>

              {/* Quick Actions */}
              <motion.div 
                className="bg-white rounded-xl shadow-lg p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                
                <div className="space-y-4">
                  <Link href="/map">
                    <button className="w-full bg-green-50 hover:bg-green-100 text-green-700 py-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-3 border border-green-200">
                      <MapPin className="h-5 w-5" />
                      Find Nearby Bins
                    </button>
                  </Link>
                  
                  <Link href="/report">
                    <button className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-3 border border-blue-200">
                      <Trash2 className="h-5 w-5" />
                      Report New Bin
                    </button>
                  </Link>
                  
                  <Link href="/community">
                    <button className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 py-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-3 border border-purple-200">
                      <Star className="h-5 w-5" />
                      Join Community
                    </button>
                  </Link>
                </div>

                {/* Progress to Next Reward */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Progress to Next Reward</h3>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Community Hero Badge</span>
                      <span>{userData.binsReported}/15 bins</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${Math.min((userData.binsReported / 15) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {15 - userData.binsReported > 0 ? `${15 - userData.binsReported} more bins to unlock!` : 'Badge unlocked! 🎉'}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isProfileModalOpen && (
          <EditProfileModal 
            userData={userData}
            onClose={() => setIsProfileModalOpen(false)}
            onSave={handleProfileUpdate}
          />
        )}

        {/* Edit Personal Info Modal */}
        {isPersonalInfoModalOpen && (
          <EditPersonalInfoModal 
            userData={userData}
            onClose={() => setIsPersonalInfoModalOpen(false)}
            onSave={handleProfileUpdate}
          />
        )}
      </>
    </ProtectedRoute>
  );
};

export default ProfilePage;