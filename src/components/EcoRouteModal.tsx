"use client"

import { useState, useEffect } from 'react'
import { X, Search, Route, Loader2, Map, ArrowRight, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Location = {
  name: string
  lat: number
  lng: number
}

type RouteOption = {
  id: string
  name: string
  duration: number // in minutes
  distance: number // in km
  binCount: number
  ecoScore: number // 0-100
  description: string
}

interface EcoRouteModalProps {
  isOpen: boolean
  onClose: () => void
  onRouteSelect: (startLocation: Location, endLocation: Location, routeId: string) => void
  nearbyBins: any[] // Use your bin type here
}

export default function EcoRouteModal({ isOpen, onClose, onRouteSelect, nearbyBins }: EcoRouteModalProps) {
  const [step, setStep] = useState<'locations' | 'results'>('locations')
  const [isLoading, setIsLoading] = useState(false)
  const [startLocation, setStartLocation] = useState<Location | null>(null)
  const [endLocation, setEndLocation] = useState<Location | null>(null)
  const [startQuery, setStartQuery] = useState('')
  const [endQuery, setEndQuery] = useState('')
  const [startResults, setStartResults] = useState<Location[]>([])
  const [endResults, setEndResults] = useState<Location[]>([])
  const [routeOptions, setRouteOptions] = useState<RouteOption[]>([])
  const [startSearching, setStartSearching] = useState(false)
  const [endSearching, setEndSearching] = useState(false)
  const [error, setError] = useState('')

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('locations')
      setStartLocation(null)
      setEndLocation(null)
      setStartQuery('')
      setEndQuery('')
      setRouteOptions([])
      setError('')
    }
  }, [isOpen])

  // If not open, don't render anything
  if (!isOpen) return null;

  // Search for locations
  const searchLocations = async (query: string, isStart: boolean) => {
    if (query.length < 3) {
      if (isStart) {
        setStartResults([])
        setStartSearching(false)
      } else {
        setEndResults([])
        setEndSearching(false)
      }
      return
    }

    if (isStart) {
      setStartSearching(true)
    } else {
      setEndSearching(true)
    }

    try {
      // Using Nominatim OpenStreetMap search API
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
      )

      if (!response.ok) {
        throw new Error('Location search failed')
      }

      const data = await response.json()
      
      const locations: Location[] = data.map((item: any) => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }))

      if (isStart) {
        setStartResults(locations)
        setStartSearching(false)
      } else {
        setEndResults(locations)
        setEndSearching(false)
      }
    } catch (err) {
      console.error('Error searching locations:', err)
      setError('Failed to search locations. Please try again.')
      if (isStart) {
        setStartSearching(false)
      } else {
        setEndSearching(false)
      }
    }
  }

  // Handle location selection
  const selectLocation = (location: Location, isStart: boolean) => {
    if (isStart) {
      setStartLocation(location)
      setStartQuery(location.name.split(',')[0])
      setStartResults([])
    } else {
      setEndLocation(location)
      setEndQuery(location.name.split(',')[0])
      setEndResults([])
    }
  }

  // Generate route options with AI
  const generateRouteOptions = async () => {
    if (!startLocation || !endLocation) {
      setError('Please select both start and end locations')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // In a real implementation, you'd call your routing API here
      // For this demo, we'll simulate generating routes
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Calculate distance between points in km using Haversine formula
      const distance = calculateDistance(startLocation, endLocation)
      
      // Simulate finding bins along route
      const binsAlongRoute = nearbyBins.filter(bin => {
        // Check if bin is roughly within the bounding box of the route with some buffer
        const isWithinBounds = 
          bin.location.lat >= Math.min(startLocation.lat, endLocation.lat) - 0.01 &&
          bin.location.lat <= Math.max(startLocation.lat, endLocation.lat) + 0.01 &&
          bin.location.lng >= Math.min(startLocation.lng, endLocation.lng) - 0.01 &&
          bin.location.lng <= Math.max(startLocation.lng, endLocation.lng) + 0.01
        
        if (!isWithinBounds) return false
        
        // Check if roughly along route (within some distance of the straight line)
        return isPointNearLine(
          bin.location.lat, bin.location.lng,
          startLocation.lat, startLocation.lng,
          endLocation.lat, endLocation.lng,
          0.005 // threshold in degrees (roughly 500m)
        )
      })
      
      // Generate mock route options
      const routes: RouteOption[] = [
        {
          id: 'eco-optimal',
          name: 'Eco-Optimal Route',
          duration: Math.round(distance * 3), // ~20km/h walking/cycling
          distance: Math.round(distance * 10) / 10,
          binCount: binsAlongRoute.length,
          ecoScore: 95,
          description: 'Best balance of travel time and bin access'
        },
        {
          id: 'bin-maximizer',
          name: 'Bin Maximizer',
          duration: Math.round(distance * 3.5), // slightly slower
          distance: Math.round((distance * 1.15) * 10) / 10, // slightly longer
          binCount: Math.min(binsAlongRoute.length + 3, nearbyBins.length),
          ecoScore: 85,
          description: 'More bins, slightly longer travel time'
        },
        {
          id: 'fastest',
          name: 'Fastest Route',
          duration: Math.round(distance * 2.5), // faster
          distance: Math.round((distance * 0.95) * 10) / 10, // shorter
          binCount: Math.max(binsAlongRoute.length - 2, 0),
          ecoScore: 75,
          description: 'Quickest path with fewer waste bins'
        }
      ]

      setRouteOptions(routes)
      setStep('results')
    } catch (err) {
      console.error('Error generating routes:', err)
      setError('Failed to generate routes. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle route selection
  const handleRouteSelect = (routeId: string) => {
    if (startLocation && endLocation) {
      onRouteSelect(startLocation, endLocation, routeId)
      onClose()
    }
  }

  // Helper function to calculate distance between two points using Haversine formula
  const calculateDistance = (point1: Location, point2: Location) => {
    const R = 6371 // Earth's radius in km
    const dLat = (point2.lat - point1.lat) * Math.PI / 180
    const dLon = (point2.lng - point1.lng) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c // Distance in km
  }

  // Helper function to check if a point is near a line segment
  const isPointNearLine = (
    pointLat: number, pointLng: number,
    line1Lat: number, line1Lng: number,
    line2Lat: number, line2Lng: number,
    threshold: number
  ) => {
    // Calculate the minimum distance from point to line segment
    // Simplified method for demo purposes
    const A = pointLat - line1Lat
    const B = pointLng - line1Lng
    const C = line2Lat - line1Lat
    const D = line2Lng - line1Lng
    
    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = dot / lenSq
    
    let closestLat, closestLng
    
    if (param < 0) {
      closestLat = line1Lat
      closestLng = line1Lng
    }
    else if (param > 1) {
      closestLat = line2Lat
      closestLng = line2Lng
    }
    else {
      closestLat = line1Lat + param * C
      closestLng = line1Lng + param * D
    }
    
    const distance = Math.sqrt(
      Math.pow(pointLat - closestLat, 2) + 
      Math.pow(pointLng - closestLng, 2)
    )
    
    return distance < threshold
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[1000]">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Route className="h-5 w-5 text-green-600 mr-2" />
              <h2 className="text-lg font-semibold">Eco-Friendly Route Planner</h2>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Find the optimal route with low carbon footprint and easy access to waste bins.
          </p>
        </div>

        {/* Content */}
        <div className="p-4">
          {step === 'locations' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="start">Starting Point</Label>
                <div className="relative">
                  <Input
                    id="start"
                    placeholder="Enter starting location"
                    value={startQuery}
                    onChange={(e) => {
                      setStartQuery(e.target.value)
                      searchLocations(e.target.value, true)
                    }}
                    className="pr-8"
                  />
                  {startSearching ? (
                    <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                  )}
                  
                  {startResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-md border shadow-lg max-h-60 overflow-auto">
                      <ul className="py-1">
                        {startResults.map((location, i) => (
                          <li 
                            key={i} 
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => selectLocation(location, true)}
                          >
                            {location.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end">Destination</Label>
                <div className="relative">
                  <Input
                    id="end"
                    placeholder="Enter destination"
                    value={endQuery}
                    onChange={(e) => {
                      setEndQuery(e.target.value)
                      searchLocations(e.target.value, false)
                    }}
                    className="pr-8"
                  />
                  {endSearching ? (
                    <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-gray-400" />
                  ) : (
                    <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
                  )}
                  
                  {endResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white rounded-md border shadow-lg max-h-60 overflow-auto">
                      <ul className="py-1">
                        {endResults.map((location, i) => (
                          <li 
                            key={i} 
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => selectLocation(location, false)}
                          >
                            {location.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {startLocation && endLocation && (
                <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mt-4">
                  <div className="flex items-start">
                    <div className="min-w-[24px]">
                      <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="h-2 w-2 rounded-full bg-green-600"></span>
                      </div>
                      <div className="h-8 w-0.5 bg-gray-300 mx-auto"></div>
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium">{startLocation.name.split(',')[0]}</p>
                      <p className="text-xs text-gray-500 mt-1 mb-2">{startLocation.name.split(',').slice(1, 3).join(',')}</p>
                      <p className="text-sm font-medium">{endLocation.name.split(',')[0]}</p>
                      <p className="text-xs text-gray-500 mt-1">{endLocation.name.split(',').slice(1, 3).join(',')}</p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-100">
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 'results' && (
            <div>
              <div className="mb-4">
                <div className="text-sm text-gray-500 mb-2">Route options from</div>
                <div className="flex items-center">
                  <span className="font-medium">{startLocation?.name.split(',')[0]}</span>
                  <ArrowRight className="h-4 w-4 mx-2 text-gray-400" />
                  <span className="font-medium">{endLocation?.name.split(',')[0]}</span>
                </div>
              </div>

              <div className="space-y-3">
                {routeOptions.map((route) => (
                  <div 
                    key={route.id}
                    className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleRouteSelect(route.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium flex items-center">
                          {route.name}
                          {route.id === 'eco-optimal' && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full ml-2 flex items-center">
                              <Leaf className="h-3 w-3 mr-1" />
                              Recommended
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{route.description}</p>
                      </div>
                      <div className="bg-green-50 px-2 py-1 rounded-md">
                        <div className="text-sm font-semibold text-green-700">
                          {route.ecoScore}%
                        </div>
                        <div className="text-xs text-green-600">Eco-score</div>
                      </div>
                    </div>
                    
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-500">Duration</div>
                        <div className="font-medium">{route.duration} min</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-500">Distance</div>
                        <div className="font-medium">{route.distance} km</div>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <div className="text-xs text-gray-500">Bins</div>
                        <div className="font-medium">{route.binCount}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          {step === 'locations' && (
            <div className="flex justify-end">
              <Button 
                type="button" 
                onClick={onClose} 
                variant="outline" 
                className="mr-2"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!startLocation || !endLocation || isLoading}
                onClick={generateRouteOptions}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Routes...
                  </>
                ) : (
                  <>
                    Find Eco-Routes
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}

          {step === 'results' && (
            <Button 
              type="button" 
              onClick={() => setStep('locations')}
              variant="outline"
            >
              Back to Locations
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}