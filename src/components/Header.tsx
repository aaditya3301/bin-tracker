'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Leaf, Search, User } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import UserMenu from './UserMenu'

export function Header() {
  const { session, isAuthenticated } = useAuth()

  return (
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
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Search className="h-5 w-5 text-gray-600" />
            </button>
            
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
  )
}