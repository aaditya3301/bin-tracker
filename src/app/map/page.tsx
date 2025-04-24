"use client"

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Search, ArrowLeft, Loader2, MapPin, Filter, X } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
  const { data: session, status } = useSession()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchLocation, setSearchLocation] = useState<{lat: number, lng: number} | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/")
    }
  }, [status, router])

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

  if (status === "loading") {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-green-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/home" className="p-2 rounded-full hover:bg-gray-100">
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </Link>
              <h1 className="text-lg font-semibold text-gray-800">Find Waste Bins</h1>
            </div>

            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                className="mr-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-1" />
                Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar - Fixed at top of content */}
      <div className="bg-white shadow-md p-3 z-10">
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
          <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
            <div className="pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              ref={searchInputRef}
              placeholder="Search for a location..."
              className="flex-1 py-2 px-3 bg-transparent outline-none"
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

      {/* Filters - Conditionally shown */}
      {showFilters && (
        <div className="bg-white border-b p-3 shadow-sm">
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

      {/* Map Container - Takes remaining height */}
      <div className="flex-1 relative">
        <FullScreenMap searchLocation={searchLocation} />
      </div>
    </div>
  )
}