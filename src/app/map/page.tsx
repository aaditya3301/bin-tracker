"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, ArrowLeft, Loader2, MapPin, Filter, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Header } from '@/components/Header'
import {Footer} from '@/components/Footer'

// Dynamically import the map component to handle client-side loading
const FullScreenMap = dynamic(
  () => import('@/components/FullScreenMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 text-green-600 mx-auto animate-spin" />
          <p className="mt-4 text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }
);

export default function MapPage() {
  // Remove: const { data: session, status } = useSession()
  // Add mock session for UI elements if needed
  const session = {
    user: {
      name: "User",
      image: null
    }
  }
  
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchLocation, setSearchLocation] = useState<{lat: number, lng: number} | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Handle search submit
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    
    try {
      // Use Nominatim OpenStreetMap API for geocoding (free, no API key needed)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      const results = await response.json()
      
      if (results && results.length > 0) {
        const { lat, lon } = results[0]
        setSearchLocation({
          lat: parseFloat(lat),
          lng: parseFloat(lon)
        })
      } else {
        // Location not found
        alert("Location not found. Please try another search.")
      }
    } catch (error) {
      console.error("Search error:", error)
      alert("Error searching for location. Please try again.")
    } finally {
      setIsSearching(false)
    }
  }

  // Clear search
  const clearSearch = () => {
    setSearchQuery("")
    setSearchLocation(null)
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Search and Filters */}
          <div className="mb-8">
            <div className="bg-white shadow-md p-3 rounded-lg">
              <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
                <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
                  <div className="pl-3">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    ref={searchInputRef}
                    placeholder="Search for a location..."
                    className="flex-1 py-2 px-3 bg-transparent outline-none text-black"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-gray-600" 
                      onClick={clearSearch}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 disabled:bg-green-300"
                  >
                    {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : "Search"}
                  </button>
                </div>
              </form>
            </div>
            
            {showFilters && (
              <div className="bg-white mt-4 p-3 rounded-lg shadow-sm">
                <div className="max-w-2xl mx-auto">
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" className="bg-green-50 border-green-200 text-green-700">
                      All Bins
                    </Button>
                    <Button size="sm" variant="outline">Recycling</Button>
                    <Button size="sm" variant="outline">General Waste</Button>
                    <Button size="sm" variant="outline">Compost</Button>
                    
                    <div className="ml-auto flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Radius:</span>
                      <select className="text-sm border rounded p-1">
                        <option>500m</option>
                        <option>1km</option>
                        <option>2km</option>
                        <option>5km</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Map Container - Now with fixed height */}
            <div className="h-[400px] rounded-lg overflow-hidden shadow-lg">
            <FullScreenMap searchLocation={searchLocation} />
            </div>
          <div className="text-center mb-6 size-0.30 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white z-10 mt-96 ">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Looking for a Bin Near You?</h2>
            <p className="text-lg text-gray-600 mb-6">
              Find the closest smart waste bin and make the right disposal, right now.
              Take the guesswork out of waste disposal—our live bin locator helps you identify nearby bins.
            </p>
            
            {/* Add the route legend */}
            <div className="flex justify-center items-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-6 w-6 text-blue-500" fill="currentColor" />
                <span className="text-sm text-gray-600">Verified Routes</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-6 w-6 text-yellow-500" fill="currentColor" />
                <span className="text-sm text-gray-600">Unverified Routes</span>
              </div>
            </div>
            
          </div>
        </div>
      </main>
            <div className='mt-60'>
      <Footer />
      </div>
    </div>
  )
}