"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, User, MapPin, Plus, Leaf, ArrowRight, Trophy, Gift, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/auth'
import UserMenu from '@/components/UserMenu'

interface Activity {
  id: string
  type: string
  message: string
  time: string
  icon: 'map' | 'trash' | 'gift' | 'trophy'
  color: 'green' | 'blue' | 'amber' | 'purple'
}

const NearbyBinsMap = dynamic(
  () => import('@/components/NearbyBinsMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-gradient-to-br from-green-50 to-blue-50 h-[300px] rounded-xl flex items-center justify-center border-2 border-dashed border-green-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-green-600 font-medium">Loading nearby bins...</p>
          <p className="text-sm text-gray-500 mt-1">Finding the best routes for you</p>
        </div>
      </div>
    )
  }
);

export default function HomePage() {
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const { isAuthenticated } = useAuth()

  // Function to sync data from blockchain/localStorage
  const syncUserData = () => {
    try {
      const allKeys = Object.keys(localStorage);
      const userDataKeys = allKeys.filter(key => key.startsWith('userData_'));
      
      if (userDataKeys.length > 0) {
        const latestKey = userDataKeys[userDataKeys.length - 1];
        const address = latestKey.replace('userData_', '');
        
        const userData = localStorage.getItem(latestKey);
        const binUsed = localStorage.getItem(`binUsed_${address}`);
        
        if (userData) {
          const data = JSON.parse(userData);
          return {
            binsReported: data.binCount || 0,
            binsUtilized: binUsed ? Number(binUsed) : 0,
            hasCoupon: data.hasCoupon || false,
            hasBadge: data.hasBadge || false
          };
        }
      }
    } catch (error) {
      console.error('Error syncing user data:', error);
    }
    
    return {
      binsReported: 0,
      binsUtilized: 0,
      hasCoupon: false,
      hasBadge: false
    };
  };

  // Generate recent activities based on real data
  const generateRecentActivities = (userData: any): Activity[] => {
    const activities: Activity[] = [];
    const now = new Date();
    
    // Add bin reports
    for (let i = 0; i < userData.binsReported; i++) {
      const date = new Date(now.getTime() - (i * 2 + Math.random() * 5) * 60 * 60 * 1000);
      activities.push({
        id: `bin-${i}`,
        type: 'bin_report',
        message: 'You reported a new bin',
        time: formatTimeAgo(date),
        icon: 'map' as const,
        color: 'green' as const
      });
    }

    // Add bin usage
    for (let i = 0; i < userData.binsUtilized; i++) {
      const date = new Date(now.getTime() - (i * 3 + Math.random() * 8) * 60 * 60 * 1000);
      activities.push({
        id: `used-${i}`,
        type: 'bin_used',
        message: 'You used a bin for disposal',
        time: formatTimeAgo(date),
        icon: 'trash' as const,
        color: 'blue' as const
      });
    }

    // Add rewards
    if (userData.hasCoupon) {
      activities.push({
        id: 'coupon-reward',
        type: 'reward',
        message: 'You earned Zomato 15% Coupon NFT',
        time: 'Yesterday',
        icon: 'gift' as const,
        color: 'amber' as const
      });
    }

    if (userData.hasBadge) {
      activities.push({
        id: 'badge-reward',
        type: 'badge',
        message: 'You earned Community Hero Badge NFT',
        time: '2 days ago',
        icon: 'trophy' as const,
        color: 'purple' as const
      });
    }

    // Sort by most recent and take top 5
    return activities.slice(0, 5);
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  useEffect(() => {
    // Sync data on component mount
    const userData = syncUserData();
    const activities = generateRecentActivities(userData);
    setRecentActivities(activities);

    // Set up interval to sync data every 10 seconds
    const interval = setInterval(() => {
      const updatedData = syncUserData();
      const updatedActivities = generateRecentActivities(updatedData);
      setRecentActivities(updatedActivities);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Card animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 50, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        delay: i * 0.2,
        duration: 0.6,
        type: "spring",
        stiffness: 100
      }
    }),
    hover: {
      y: -10,
      scale: 1.05,
      transition: {
        duration: 0.3,
        type: "spring",
        stiffness: 300
      }
    }
  };

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
              <Link href="/rewards" className="text-gray-800 hover:text-[#4CAF50] transition-colors">
                Rewards
              </Link>
              <Link href="/community" className="text-gray-800 hover:text-[#4CAF50] transition-colors">
                Community
              </Link>
            </motion.nav>
          
            <motion.div
              className="flex items-center space-x-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <Link href="/auth/signin">
                  <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105">
                    Login/Sign Up
                  </button>
                </Link>
              )}
            </motion.div>
          </div>
        </div>
      </header>

      <div className="container mx-auto">
        <motion.div
          className="mb-8 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Hero section with background image */}
          <div className="relative h-[500px] w-full p-5 overflow-hidden">
            <div className="absolute inset-0">
              <img
                src="/Landing 1.png"
                alt="Cleaning Pattern Background"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-green-00 bg-opacity-50"></div>
            </div>

            <div className="relative z-10 h-full flex items-center">
              <div className="container mx-auto px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto">
                  <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
                    <span className="text-green-700">Eco-Tasks for Everyday </span>
                    <span className="text-yellow-400">Heroes</span>
                  </h2>
                  <p className="text-xl text-black mb-8">
                    Track bins. Earn rewards. Make a difference.
                  </p>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="space-x-4 flex items-center justify-center"
                  >
                    <motion.a
                      href="/map"
                      className="px-6 py-3 border-2 border-green-600 text-green-600 rounded-md hover:bg-green-600 hover:text-white transition-all duration-300 transform hover:scale-105"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Locate Dustbin
                    </motion.a>
                    <motion.a
                      href="/report"
                      className="px-6 py-3 border-2 border-green-600 text-green-600 rounded-md hover:bg-green-600 hover:text-white transition-all duration-300 transform hover:scale-105"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Report New Bin
                    </motion.a>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced How We Work Section */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          <div className="relative h-[500px] w-full p-0 overflow-hidden">
            <div className="absolute inset-0">
              <img
                src="/green thing w man.png"
                alt="Cleaning Pattern Background"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-green-00 bg-opacity-50"></div>
            </div>
            
            <div className="relative z-10 h-full">
              <div className="container mx-auto px-30 md:px-40 py-20 md:py-20">
                <motion.div 
                  className="mb-12"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <p className="uppercase tracking-wider mb-2 text-white">
                    HOW WE <span className="text-yellow-400">Work</span>
                  </p>
                  <h2 className="text-3xl md:text-4xl font-bold text-white">
                    Your Journey to a Cleaner City<br />
                    Starts Here
                  </h2>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Animated Cards */}
                  <motion.div
                    className="bg-white bg-opacity-90 rounded-lg p-6 text-gray-800 shadow-lg backdrop-blur-sm"
                    custom={0}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    variants={cardVariants}
                  >
                    <motion.div 
                      className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4 mx-auto"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </motion.div>
                    <h3 className="text-xl font-semibold text-green-600 mb-3 text-center">Spot the Problem</h3>
                    <p className="text-gray-600 text-center">
                      See an overflowing bin? Littered area? Broken disposal unit?
                    </p>
                  </motion.div>
                  
                  <motion.div
                    className="bg-white bg-opacity-90 rounded-lg p-6 text-gray-800 shadow-lg backdrop-blur-sm"
                    custom={1}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    variants={cardVariants}
                  >
                    <motion.div 
                      className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 mx-auto"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </motion.div>
                    <h3 className="text-xl font-semibold text-green-600 mb-3 text-center">Report with Evidence</h3>
                    <p className="text-gray-600 text-center">
                      Open the website, fill out a quick form, and upload the photo.
                    </p>
                  </motion.div>
                  
                  <motion.div
                    className="bg-white bg-opacity-90 rounded-lg p-6 text-gray-800 shadow-lg backdrop-blur-sm"
                    custom={2}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    variants={cardVariants}
                  >
                    <motion.div 
                      className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4 mx-auto"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </motion.div>
                    <h3 className="text-xl font-semibold text-green-600 mb-3 text-center">Earn Eco-Coins</h3>
                    <p className="text-gray-600 text-center">
                      Get rewarded for every valid report you make.
                    </p>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Map and Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-100 md:px-40 ml-40"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Nearby Bins</h3>
                  <p className="text-sm text-gray-500">Find the closest waste disposal points</p>
                </div>
              </div>
              <Link href="/map" className="text-sm text-[#4CAF50] hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            {/* Enhanced Map Container */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl overflow-hidden border-2 border-green-100 shadow-inner">
              <NearbyBinsMap height="300px" />
            </div>
            
            {/* Map Stats */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-bold text-green-600">12</div>
                <div className="text-xs text-gray-600">Bins Found</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-bold text-blue-600">0.8km</div>
                <div className="text-xs text-gray-600">Avg Distance</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-lg font-bold text-purple-600">95%</div>
                <div className="text-xs text-gray-600">Available</div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Recent Activity Section */}
          <motion.div 
            className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 mr-40"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
                  <p className="text-sm text-gray-500">Your latest eco-actions</p>
                </div>
              </div>
              <Link href="/profile" className="text-sm text-[#4CAF50] hover:underline flex items-center gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, index) => (
                  <motion.div 
                    key={activity.id}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 bg-${activity.color}-100`}>
                      {activity.icon === 'map' && <MapPin className={`h-4 w-4 text-${activity.color}-600`} />}
                      {activity.icon === 'trash' && <Trash2 className={`h-4 w-4 text-${activity.color}-600`} />}
                      {activity.icon === 'gift' && <Gift className={`h-4 w-4 text-${activity.color}-600`} />}
                      {activity.icon === 'trophy' && <Trophy className={`h-4 w-4 text-${activity.color}-600`} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm">No recent activity</p>
                  <p className="text-xs">Start by reporting a bin to see your activity here!</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer remains the same */}
      <footer className="bg-white mt-12 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center mt-9">
                <Leaf className="h-7 w-7 text-[#4CAF50] mr-2" />
                <span className="text-2xl font-bold text-green-700">BIN<span className="font-bold italic text-black">track</span></span>
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
    </main>
  )
}