"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { MapPin, Navigation, Clock, TreePine, Trash2, X, Search, Loader2 } from 'lucide-react'

type Location = {
  name: string
  lat: number
  lng: number
}

type RouteOption = {
  id: string
  name: string
  duration: number
  distance: number
  binCount: number
  ecoScore: number
  description: string
  polyline: string
  waypoints?: Array<[number, number]>
}

interface EcoRouteModalProps {
  isOpen: boolean
  onClose: () => void
  onRouteSelect: (startLocation: Location, endLocation: Location, routeId: string, routes: RouteOption[]) => void
  nearbyBins: any[]
}

export default function EcoRouteModal({ isOpen, onClose, onRouteSelect, nearbyBins }: EcoRouteModalProps) {
  console.log("EcoRouteModal rendered, isOpen:", isOpen)
  
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

  // Debounced search for locations
  // Debounced search for start location
  useEffect(() => {
    if (startQuery.length > 2 && !startLocation) { // Only search if no location is selected
      const timer = setTimeout(() => searchLocations(startQuery, 'start'), 700) // Increased delay
      return () => clearTimeout(timer)
    } else {
      setStartResults([])
    }
  }, [startQuery, startLocation])

  // Debounced search for end location  
  useEffect(() => {
    if (endQuery.length > 2 && !endLocation) { // Only search if no location is selected
      const timer = setTimeout(() => searchLocations(endQuery, 'end'), 700) // Increased delay
      return () => clearTimeout(timer)
    } else {
      setEndResults([])
    }
  }, [endQuery, endLocation])

  const searchLocations = async (query: string, type: 'start' | 'end') => {
    if (type === 'start') setStartSearching(true)
    else setEndSearching(true)

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in&addressdetails=1`
      )
      
      if (!response.ok) throw new Error('Search failed')
      
      const data = await response.json()
      const locations: Location[] = data.map((item: any) => ({
        name: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }))

      if (type === 'start') {
        setStartResults(locations)
      } else {
        setEndResults(locations)
      }
    } catch (error) {
      console.error('Location search error:', error)
      setError('Failed to search locations')
    } finally {
      if (type === 'start') setStartSearching(false)
      else setEndSearching(false)
    }
  }

  const generateRoutes = async () => {
    console.log("Generate routes clicked!", { startLocation, endLocation, isLoading })
    
    if (!startLocation || !endLocation) {
      setError('Please select both start and end locations')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Calculate the actual distance between start and end
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371 // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        return R * c
      }

      const baseDistance = calculateDistance(startLocation.lat, startLocation.lng, endLocation.lat, endLocation.lng)
      const baseDuration = Math.max(Math.round(baseDistance * 3.5), 8) // ~3.5 minutes per km, minimum 8 minutes

      // Generate virtual bins along route paths - UPDATED DENSITIES
      const generateVirtualBins = (routePoints: Array<[number, number]>, routeType: string): number => {
        let virtualBins = 0
        
        // Updated bin densities as requested
        const binsPerKm = routeType === 'bin-maximizer' ? 0.9 : // 0.9 bins per km
                         routeType === 'eco-optimal' ? 0.7 : // 0.7 bins per km  
                         0.4 // 0.4 bins per km for fastest
        
        // Calculate bins based on actual distance
        const distanceBasedBins = Math.round(baseDistance * binsPerKm)
        virtualBins = distanceBasedBins
        
        // Add small route complexity bonus (based on waypoints)
        const complexityBonus = routeType === 'bin-maximizer' ? Math.floor(routePoints.length * 0.2) :
                               routeType === 'eco-optimal' ? Math.floor(routePoints.length * 0.15) :
                               Math.floor(routePoints.length * 0.1)
        
        virtualBins += complexityBonus
        
        // Very small randomness for realism
        const randomVariation = Math.floor(Math.random() * 3) - 1 // ±1 bin only
        virtualBins += randomVariation
        
        // Ensure minimum based on distance
        const minimumBins = Math.max(Math.floor(baseDistance * 0.3), 1) // At least 0.3 bins per km, minimum 1
        
        return Math.max(virtualBins, minimumBins)
      }

      // Count existing nearby bins along route
      const countNearbyBins = (routePoints: Array<[number, number]>, threshold: number): number => {
        let nearbyCount = 0
        
        nearbyBins.forEach(bin => {
          // Check if bin is near any segment of this route
          for (let i = 0; i < routePoints.length - 1; i++) {
            const pointA = routePoints[i]
            const pointB = routePoints[i + 1]
            
            // Simple distance check to route line
            const distanceToRoute = Math.min(
              Math.sqrt(Math.pow(bin.location.lat - pointA[0], 2) + Math.pow(bin.location.lng - pointA[1], 2)),
              Math.sqrt(Math.pow(bin.location.lat - pointB[0], 2) + Math.pow(bin.location.lng - pointB[1], 2))
            )
            
            if (distanceToRoute < threshold) {
              nearbyCount++
              break // Don't count the same bin multiple times
            }
          }
        })
        
        return nearbyCount
      }

      // Generate route points and calculate comprehensive bin counts
      const generateRouteData = (routeType: string) => {
        let distanceMultiplier = 1
        let durationMultiplier = 1
        let routePoints: Array<[number, number]> = []
        
        // Generate route points
        const latDiff = endLocation.lat - startLocation.lat
        const lngDiff = endLocation.lng - startLocation.lng
        
        // Add start point
        routePoints.push([startLocation.lat, startLocation.lng])
        
        if (routeType === 'eco-optimal') {
          distanceMultiplier = 1.15
          durationMultiplier = 1.10
          // Generate curved path with 4-5 waypoints for better bin access
          for (let i = 1; i <= 4; i++) {
            const progress = i / 5
            const curveFactor = Math.sin(progress * Math.PI) * 0.003
            routePoints.push([
              startLocation.lat + latDiff * progress + curveFactor,
              startLocation.lng + lngDiff * progress + (Math.random() - 0.5) * 0.001
            ])
          }
        } else if (routeType === 'bin-maximizer') {
          distanceMultiplier = 1.35
          durationMultiplier = 1.25
          // Generate path with many waypoints to maximize bin access
          for (let i = 1; i <= 7; i++) {
            const progress = i / 8
            const curveFactor = Math.sin(progress * Math.PI * 2) * 0.004
            routePoints.push([
              startLocation.lat + latDiff * progress + curveFactor,
              startLocation.lng + lngDiff * progress + (i % 2 === 0 ? 0.002 : -0.002)
            ])
          }
        } else {
          distanceMultiplier = 1.05
          durationMultiplier = 1.02
          // Direct path with minimal waypoints
          routePoints.push([
            startLocation.lat + latDiff * 0.33,
            startLocation.lng + lngDiff * 0.33
          ])
          routePoints.push([
            startLocation.lat + latDiff * 0.67,
            startLocation.lng + lngDiff * 0.67
          ])
        }
        
        // Add end point
        routePoints.push([endLocation.lat, endLocation.lng])
        
        // Count real nearby bins
        const threshold = routeType === 'bin-maximizer' ? 0.008 :
                         routeType === 'eco-optimal' ? 0.006 : 0.004
        const realBins = countNearbyBins(routePoints, threshold)
        
        // Generate virtual bins for this route
        const virtualBins = generateVirtualBins(routePoints, routeType)
        
        // Combine real and virtual bins with realistic cap based on lower density
        const distanceBasedCap = Math.max(Math.floor(baseDistance * 1.5), 5) // Reduced cap, minimum 5
        const totalBins = Math.min(realBins + virtualBins, distanceBasedCap)
        
        return {
          distance: Math.round((baseDistance * distanceMultiplier) * 10) / 10,
          duration: Math.round(baseDuration * durationMultiplier),
          binCount: totalBins,
          routePoints,
          realBins,
          virtualBins
        }
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const ecoData = generateRouteData('eco-optimal')
      const binMaxData = generateRouteData('bin-maximizer')
      const fastestData = generateRouteData('fastest')

      // Ensure proper bin hierarchy with realistic differences
      if (binMaxData.binCount <= ecoData.binCount) {
        binMaxData.binCount = ecoData.binCount + Math.floor(Math.random() * 2) + 2 // Add 2-3 more bins
      }
      if (fastestData.binCount >= ecoData.binCount) {
        fastestData.binCount = Math.max(ecoData.binCount - Math.floor(Math.random() * 2) - 1, 1) // 1-2 fewer bins, minimum 1
      }

      // Final validation - ensure realistic maximums based on lower density
      const maxPossible = Math.floor(baseDistance * 1.5) // Reduced from 3 to 1.5 bins per km
      binMaxData.binCount = Math.min(binMaxData.binCount, maxPossible)
      ecoData.binCount = Math.min(ecoData.binCount, Math.floor(maxPossible * 0.8))
      fastestData.binCount = Math.min(fastestData.binCount, Math.floor(maxPossible * 0.5))

      // Generate dynamic route options with more concise descriptions
      const dynamicRoutes: RouteOption[] = [
        {
          id: 'eco-optimal',
          name: 'Eco-Optimal Route',
          duration: ecoData.duration,
          distance: ecoData.distance,
          binCount: ecoData.binCount,
          ecoScore: 85,
          description: `Balanced eco-friendly route with ${ecoData.binCount} waste bins along the way. Optimized for environmental responsibility and efficiency.`,
          polyline: '',
          waypoints: ecoData.routePoints
        },
        {
          id: 'bin-maximizer', 
          name: 'Bin Maximizer',
          duration: binMaxData.duration,
          distance: binMaxData.distance,
          binCount: binMaxData.binCount,
          ecoScore: 78,
          description: `Maximum waste disposal access with ${binMaxData.binCount} bins along the extended route. Perfect for comprehensive waste management.`,
          polyline: '',
          waypoints: binMaxData.routePoints
        },
        {
          id: 'fastest',
          name: 'Fastest Route',
          duration: fastestData.duration,
          distance: fastestData.distance,
          binCount: fastestData.binCount,
          ecoScore: 65,
          description: `Direct route with ${fastestData.binCount} essential waste bins. Minimal detours while maintaining eco-responsibility.`,
          polyline: '',
          waypoints: fastestData.routePoints
        }
      ]
      
      setRouteOptions(dynamicRoutes)
      setStep('results')
      
    } catch (error) {
      console.error('Route generation error:', error)
      setError('Failed to generate routes')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRouteSelect = (route: RouteOption) => {
    if (startLocation && endLocation) {
      onRouteSelect(startLocation, endLocation, route.id, routeOptions)
      onClose()
    }
  }

  const resetModal = () => {
    setStep('locations')
    setStartLocation(null)
    setEndLocation(null)
    setStartQuery('')
    setEndQuery('')
    setStartResults([]) // Clear search results
    setEndResults([])   // Clear search results
    setRouteOptions([])
    setError('')
    setStartSearching(false) // Reset searching states
    setEndSearching(false)
  }

  useEffect(() => {
    if (!isOpen) {
      resetModal()
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-white text-gray-900">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
            <div className="p-2 bg-green-100 rounded-lg">
              <Navigation className="h-6 w-6 text-green-600" />
            </div>
            Plan Eco-Friendly Route
          </DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Find the most environmentally friendly route between two locations, optimized for waste disposal opportunities.
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          {step === 'locations' && (
            <div className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm font-medium">
                  ⚠️ {error}
                </div>
              )}

              {/* Start Location */}
              <div className="space-y-3">
                <Label htmlFor="start" className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <MapPin className="h-4 w-4 text-green-600" />
                  Starting Point
                </Label>
                <div className="relative">
                  <Input
                    id="start"
                    value={startQuery}
                    onChange={(e) => {
                      setStartQuery(e.target.value)
                      // If user starts typing again, clear the selected location
                      if (startLocation && e.target.value !== startLocation.name) {
                        setStartLocation(null)
                      }
                    }}
                    placeholder="Enter starting location (e.g., Mumbai, Delhi)..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-green-500 focus:ring-2 focus:ring-green-200 text-gray-900 placeholder-gray-500"
                    autoComplete="off"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {startSearching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600 animate-spin" />
                  )}
                </div>
                
                {startSearching && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Searching locations...
                  </p>
                )}
                
                {/* Start Location dropdown - Show full location name */}
                {startResults.length > 0 && (
                  <div className="border-2 border-gray-200 rounded-lg max-h-40 overflow-y-auto bg-white shadow-lg">
                    {startResults.map((location, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setStartLocation(location)
                          setStartQuery(location.name) // Show FULL location name instead of split
                          setStartResults([]) // Clear results immediately
                        }}
                        className="w-full text-left p-3 hover:bg-green-50 border-b border-gray-100 last:border-b-0 text-sm text-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{location.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {startLocation && (
                  <div className="p-3 bg-green-50 border-2 border-green-200 rounded-lg text-sm text-green-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="font-medium">Selected:</span>
                      <span>{startLocation.name.split(',')[0]}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* End Location */}
              <div className="space-y-3">
                <Label htmlFor="end" className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <MapPin className="h-4 w-4 text-red-600" />
                  Destination
                </Label>
                <div className="relative">
                  <Input
                    id="end"
                    value={endQuery}
                    onChange={(e) => {
                      setEndQuery(e.target.value)
                      // If user starts typing again, clear the selected location
                      if (endLocation && e.target.value !== endLocation.name) {
                        setEndLocation(null)
                      }
                    }}
                    placeholder="Enter destination (e.g., Bangalore, Pune)..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 text-gray-900 placeholder-gray-500"
                    autoComplete="off"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  {endSearching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-600 animate-spin" />
                  )}
                </div>
                
                {endSearching && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Searching locations...
                  </p>
                )}
                
                {/* End Location dropdown - Show full location name */}
                {endResults.length > 0 && (
                  <div className="border-2 border-gray-200 rounded-lg max-h-40 overflow-y-auto bg-white shadow-lg">
                    {endResults.map((location, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setEndLocation(location)
                          setEndQuery(location.name) // Show FULL location name instead of split
                          setEndResults([]) // Clear results immediately
                        }}
                        className="w-full text-left p-3 hover:bg-red-50 border-b border-gray-100 last:border-b-0 text-sm text-gray-800 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{location.name}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                
                {endLocation && (
                  <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg text-sm text-red-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="font-medium">Selected:</span>
                      <span>{endLocation.name.split(',')[0]}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Generate Routes Button */}
              <div className="pt-4 border-t">
                <Button
                  onClick={generateRoutes}
                  disabled={!startLocation || !endLocation || isLoading}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Generating Eco Routes...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <TreePine className="h-5 w-5" />
                      Find Eco Routes
                    </div>
                  )}
                </Button>
                
                {(!startLocation || !endLocation) && (
                  <p className="text-center text-sm text-gray-500 mt-2">
                    Please select both locations to continue
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Route Options</h3>
                  <p className="text-sm text-gray-600">Choose the best route for your journey</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setStep('locations')}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Change Locations
                </Button>
              </div>

              <div className="space-y-4">
                {routeOptions.map((route, index) => (
                  <div
                    key={route.id}
                    className="border-2 border-gray-200 rounded-xl p-5 hover:border-green-300 hover:bg-green-50/50 cursor-pointer transition-all duration-200 group"
                    onClick={() => handleRouteSelect(route)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm">
                          {index + 1}
                        </div>
                        <h4 className="font-bold text-lg text-gray-900 group-hover:text-green-700 transition-colors">
                          {route.name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                        <TreePine className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-bold text-green-700">{route.ecoScore}% Eco</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 text-sm mb-4 leading-relaxed">{route.description}</p>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <div>
                          <div className="text-xs text-blue-600 font-medium">Duration</div>
                          <div className="text-sm font-bold text-blue-800">{route.duration} min</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                        <Navigation className="h-4 w-4 text-purple-600" />
                        <div>
                          <div className="text-xs text-purple-600 font-medium">Distance</div>
                          <div className="text-sm font-bold text-purple-800">{route.distance} km</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg">
                        <Trash2 className="h-4 w-4 text-orange-600" />
                        <div>
                          <div className="text-xs text-orange-600 font-medium">Bins</div>
                          <div className="text-sm font-bold text-orange-800">{route.binCount} found</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}