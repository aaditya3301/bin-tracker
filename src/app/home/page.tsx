"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, User, MapPin, Plus, Leaf, ArrowRight } from "lucide-react"
import { useSession } from "next-auth/react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import dynamic from 'next/dynamic'

const NearbyBinsMap = dynamic(
  () => import('@/components/NearbyBinsMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="bg-gray-100 h-[300px] rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500 mx-auto mb-3"></div>
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    )
  }
);

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState({
    binsReported: 0,
    rewardsEarned: 0,
    tasksCompleted: 0,
  })

  // Redirect if not authenticated - with improved logging and conditional handling
  useEffect(() => {
    console.log("Auth status:", status, "Session:", session);
    
    // Only redirect if explicitly unauthenticated
    if (status === "unauthenticated") {
      console.log("User is unauthenticated, redirecting to login");
      router.push("/")
    }
  }, [status, router, session])

  // Loading state
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#edf7f2] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
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
                  <span className="text-gray-800">Track</span>
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
                Dashboard
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
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Search className="h-5 w-5 text-gray-600" />
              </button>
              
              <div className="relative">
                <Link href="/profile">
                  <div className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-[#4CAF50] text-white flex items-center justify-center overflow-hidden">
                      {session?.user?.image ? (
                        <img src={session.user.image} alt={session.user.name || "User"} className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <span className="hidden md:block text-sm font-medium text-gray-700">
                      {session?.user?.name?.split(' ')[0] || "User"}
                    </span>
                  </div>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 px-4 md:px-6">
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-2xl font-bold text-gray-800">Welcome back, {session?.user?.name?.split(' ')[0] || "User"}!</h2>
          <p className="text-gray-600 mt-1">Here's your waste management dashboard</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-600">Bins Reported</h3>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
            </div>
            <p className="text-3xl font-bold">{stats.binsReported}</p>
            <div className="mt-2 text-sm text-green-600 flex items-center">
              <ArrowRight className="h-3 w-3 mr-1" />
              <span>Report a bin</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-600">Rewards Earned</h3>
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="8" />
                  <path d="M12 6v12M8 12h8" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold">{stats.rewardsEarned}</p>
            <div className="mt-2 text-sm text-amber-600 flex items-center">
              <ArrowRight className="h-3 w-3 mr-1" />
              <span>View rewards</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-600">Tasks Completed</h3>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <path d="M22 4 12 14.01l-3-3" />
                </svg>
              </div>
            </div>
            <p className="text-3xl font-bold">{stats.tasksCompleted}</p>
            <div className="mt-2 text-sm text-blue-600 flex items-center">
              <ArrowRight className="h-3 w-3 mr-1" />
              <span>View completed tasks</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="mb-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/map">
              <motion.div 
                className="bg-[#4CAF50] rounded-xl shadow-lg p-6 text-white cursor-pointer hover:shadow-xl transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-white/20 p-3">
                    <MapPin className="h-8 w-8" />
                  </div> 
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Bin Locator</h3>
                    <p className="opacity-90">Find the nearest waste bins around you</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-white/80">
                  <span className="text-sm">Open interactive map</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </div>
              </motion.div>
            </Link>
            
            <Link href="/report">
              <motion.div 
                className="bg-gradient-to-r from-[#3b8cbd] to-[#1d6fa5] rounded-xl shadow-lg p-6 text-white cursor-pointer hover:shadow-xl transition-all"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-white/20 p-3">
                    <Plus className="h-8 w-8" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">Bin Reporter</h3>
                    <p className="opacity-90">Add new bin locations to the community</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center text-white/80">
                  <span className="text-sm">Report a new bin</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </div>
              </motion.div>
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Nearby Bins</h3>
              <Link href="/map" className="text-sm text-[#4CAF50] hover:underline">
                View all
              </Link>
            </div>
            
            <div className="bg-gray-100 h-[300px] rounded-lg overflow-hidden">
              <NearbyBinsMap height="300px" />
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Recent Activity</h3>
              <button className="text-sm text-[#4CAF50] hover:underline">
                View all
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">You reported a new bin</p>
                  <p className="text-xs text-gray-500">Today at 10:32 AM</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg className="h-4 w-4 text-amber-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 6v12M8 12h8" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">You earned 10 points</p>
                  <p className="text-xs text-gray-500">Yesterday at 3:45 PM</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <path d="M22 4 12 14.01l-3-3" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">Task completed: Clean local park</p>
                  <p className="text-xs text-gray-500">April 21, 2025</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}