import Link from 'next/link'
import { motion } from 'framer-motion'
import { Leaf } from 'lucide-react'

export function Header() {
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
           
          </motion.nav>
        </div>
      </div>
    </header>
  )
}