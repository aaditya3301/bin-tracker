"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, User, MapPin, Plus, Leaf, ArrowRight } from "lucide-react"
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
  const router = useRouter()
  // Mock session data for UI elements that need it
  const session = {
    user: {
      name: "User",
      image: null
    }
  }
  
  const [stats, setStats] = useState({
    binsReported: 0,
    rewardsEarned: 0,
    tasksCompleted: 0,
  })

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
              <Link href="/" className="text-gray-800 hover:text-[#4CAF50] transition-colors">
                Home
              </Link>
              <Link href="/map" className="text-gray-800 hover:text-[#4CAF50] transition-colors">
                Map
              </Link>
              <Link href="/rewards" className="text-gray-800 hover:text-[#4CAF50] transition-colors">
                Rewards
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
                src="/Landing 1.png" // Replace with your actual image path
                alt="Cleaning Pattern Background"
                className="w-full h-full object-cover"
              />
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-green-00 bg-opacity-50 ">
                </div>
            </div>

            {/* Content overlay */}
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

        <motion.div
        className="mb-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}>
            <div className="relative h-[500px] w-full p-0 overflow-hidden">
            <div className="absolute inset-0">
              <img
              src="/green thing w man.png"
              alt="Cleaning Pattern Background"
              className="w-full h-full object-cover"
              />
              {/* Dark overlay for better text visibility */}
              <div className="absolute inset-0 bg-green-00 bg-opacity-50"></div>
            </div>
            
            {/* Content overlaid on the image */}
            <div className="relative z-10 h-full">
              <div className="container mx-auto px-30 md:px-40 py-20 md:py-20">
              <div className="mb-12">
                <p className="uppercase tracking-wider mb-2 text-white">
                HOW WE <span className="text-yellow-400">Work</span>
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-white">
                Your Journey to a Cleaner City<br />
                Starts Here
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white bg-opacity-90 rounded-lg p-6 text-gray-800 shadow-lg backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-green-600 mb-3">Spot the Problem</h3>
                <p className="text-gray-600">
                  See an overflowing bin? Littered area? Broken disposal unit?
                </p>
                </div>
                
                <div className="bg-white bg-opacity-90 rounded-lg p-6 text-gray-800 shadow-lg backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-green-600 mb-3">Report with Evidence</h3>
                <p className="text-gray-600">
                  Open the website, fill out a quick form, and upload the photo.
                </p>
                </div>
                
                <div className="bg-white bg-opacity-90 rounded-lg p-6 text-gray-800 shadow-lg backdrop-blur-sm">
                <h3 className="text-xl font-semibold text-green-600 mb-3">Earn Eco-Coins</h3>
                <p className="text-gray-600">
                  Get rewarded for every valid report you make.
                </p>
                </div>
              </div>
              </div>
            </div>
            </div>
          </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100 md:px-40 ml-40"
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
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mr-40"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6 ">
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
    </main>
  )
}