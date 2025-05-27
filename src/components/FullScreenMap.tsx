"use client"

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Loader2, Navigation, Phone, Clock, Info, MapPin, Route, ArrowRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import EcoRouteModal from './EcoRouteModal'
import L from 'leaflet'

// Fix for Leaflet icons in Next.js
const fixLeafletIcons = () => {
  // Only run on client side
  if (typeof window !== 'undefined') {
    // Dynamically import Leaflet
    import('leaflet').then((L) => {
      // Fix icon paths using type assertion to bypass TypeScript check
      // This is safe as _getIconUrl exists in the runtime Leaflet object
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });
    });
  }
};

// Move map to new location
function FlyToLocation({ position, zoom = 15 }: { position: [number, number]; zoom?: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.flyTo(position, zoom, { 
      duration: 1.5,
      easeLinearity: 0.25
    });
  }, [map, position, zoom]);
  
  return null;
}

interface BinLocation {
  id: string;
  binName: string;
  location: { lat: number; lng: number };
  address: string;
  type: 'general' | 'recycling' | 'compost';
  lastEmptied?: string;
  isAccessible?: boolean;
  distance?: number; // meters
  imageUrl?: string;
}

interface FullScreenMapProps {
  searchLocation: { lat: number; lng: number } | null;
}

export default function FullScreenMap({ searchLocation }: FullScreenMapProps) {
  // Eco-route feature state
  const [ecoRouteModalOpen, setEcoRouteModalOpen] = useState(false)
  const [selectedRoute, setSelectedRoute] = useState<{
    start: { lat: number, lng: number, name: string },
    end: { lat: number, lng: number, name: string },
    routeId: string,
    routeData?: {
      duration: number,
      distance: number,
      binCount: number,
      description: string
    },
    allRoutes?: Array<{
      id: string,
      points: Array<[number, number]>
    }>
  } | null>(null)

  // Original state variables
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nearbyBins, setNearbyBins] = useState<BinLocation[]>([]);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Fix Leaflet icons
  useEffect(() => {
    fixLeafletIcons();
  }, []);
  
  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          
          // If no search location, use user's location
          if (!searchLocation) {
            fetchNearbyBins(latitude, longitude);
          }
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError("Unable to access your location. Please enable location services.");
          setLoading(false);
          
          // Use fallback location if no search location
          if (!searchLocation) {
            const fallbackLat = 40.7128; // NYC
            const fallbackLng = -74.0060;
            setUserLocation([fallbackLat, fallbackLng]);
            fetchNearbyBins(fallbackLat, fallbackLng);
          }
        }
      );
    } else {
      setError("Your browser doesn't support geolocation.");
      setLoading(false);
      
      // Use fallback location if no search location
      if (!searchLocation) {
        const fallbackLat = 40.7128;
        const fallbackLng = -74.0060;
        setUserLocation([fallbackLat, fallbackLng]);
        fetchNearbyBins(fallbackLat, fallbackLng);
      }
    }
  }, []);
  
  // Handle search location changes
  useEffect(() => {
    if (searchLocation) {
      fetchNearbyBins(searchLocation.lat, searchLocation.lng);
    }
  }, [searchLocation]);
  
  // Update the handleRouteSelect function:

  const handleRouteSelect = (
    startLocation: { lat: number, lng: number, name: string },
    endLocation: { lat: number, lng: number, name: string },
    routeId: string,
    allRoutes: Array<{
      id: string,
      name: string,
      polyline: string,
      waypoints?: Array<[number, number]>
    }>
  ) => {
    console.log("Route selected:", { startLocation, endLocation, routeId, allRoutes })
    
    // Find the selected route data
    const selectedRouteData = allRoutes.find(route => route.id === routeId)
    
    // Generate route points based on start and end locations
    const generateRoutePoints = (start: {lat: number, lng: number}, end: {lat: number, lng: number}, routeType: string): Array<[number, number]> => {
      const points: Array<[number, number]> = []
      
      // Add start point
      points.push([start.lat, start.lng])
      
      // Generate intermediate points based on route type
      const latDiff = end.lat - start.lat
      const lngDiff = end.lng - start.lng
      
      if (routeType === 'eco-optimal') {
        // Eco-optimal: slightly curved path with 3-4 waypoints
        for (let i = 1; i <= 3; i++) {
          const progress = i / 4
          const curveFactor = Math.sin(progress * Math.PI) * 0.002 // Small curve
          points.push([
            start.lat + latDiff * progress + curveFactor,
            start.lng + lngDiff * progress
          ])
        }
      } else if (routeType === 'bin-maximizer') {
        // Bin maximizer: more waypoints, slightly longer path
        for (let i = 1; i <= 5; i++) {
          const progress = i / 6
          const curveFactor = Math.sin(progress * Math.PI * 2) * 0.003 // More curves
          points.push([
            start.lat + latDiff * progress + curveFactor,
            start.lng + lngDiff * progress + (i % 2 === 0 ? 0.001 : -0.001)
          ])
        }
      } else {
        // Fastest: direct path with minimal waypoints
        points.push([
          start.lat + latDiff * 0.5,
          start.lng + lngDiff * 0.5
        ])
      }
      
      // Add end point
      points.push([end.lat, end.lng])
      
      return points
    }
    
    // Generate route data with actual points
    const routesWithPoints = allRoutes.map(route => ({
      id: route.id,
      points: generateRoutePoints(startLocation, endLocation, route.id),
      polyline: route.polyline
    }))
    
    setSelectedRoute({
      start: startLocation,
      end: endLocation,
      routeId,
      routeData: selectedRouteData ? {
        duration: (selectedRouteData as any).duration,
        distance: (selectedRouteData as any).distance,
        binCount: (selectedRouteData as any).binCount,
        description: (selectedRouteData as any).description
      } : undefined,
      allRoutes: routesWithPoints
    })
    
    setEcoRouteModalOpen(false)
    
    // Display the selected route on map
    displaySelectedRoute(startLocation, endLocation, routeId, routesWithPoints)
  }
  
  // Add this function to display the route with markers
  const displaySelectedRoute = (
    start: { lat: number, lng: number, name: string },
    end: { lat: number, lng: number, name: string },
    selectedRouteId: string,
    allRoutes: Array<{ id: string, points: Array<[number, number]> }>
  ) => {
    if (!mapRef.current) return
  
    const map = mapRef.current
  
    try {
      // Show success notification
      showRouteNotification(selectedRouteId, start.name, end.name)
    
      // Fit map to show the entire route
      const selectedRoute = allRoutes.find(r => r.id === selectedRouteId)
      if (selectedRoute && selectedRoute.points.length > 0) {
        const bounds = L.latLngBounds(selectedRoute.points.map(point => [point[0], point[1]]))
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    
    } catch (error) {
      console.error('Error displaying route:', error)
      showErrorNotification('Failed to display route on map')
    }
  }

  // Add notification functions
  const showRouteNotification = (routeId: string, startName: string, endName: string) => {
    const routeName = routeId === 'eco-optimal' ? 'Eco-Optimal Route' :
                     routeId === 'bin-maximizer' ? 'Bin Maximizer Route' : 'Fastest Route'
    
    const notification = document.createElement('div')
    notification.innerHTML = `
      <div class="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-[10000] flex items-center gap-3 max-w-md">
        <svg class="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
        <div>
          <div class="font-semibold">${routeName} Selected</div>
          <div class="text-sm opacity-90">${startName.split(',')[0]} → ${endName.split(',')[0]}</div>
        </div>
      </div>
    `
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 4000)
  }

  const showErrorNotification = (message: string) => {
    const notification = document.createElement('div')
    notification.innerHTML = `
      <div class="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-[10000] flex items-center gap-3">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
        <div class="font-semibold">${message}</div>
      </div>
    `
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 3000)
  }

  // Add this function to clear routes
  const clearRoute = () => {
    setSelectedRoute(null)
    
    const notification = document.createElement('div')
    notification.innerHTML = `
      <div class="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gray-500 text-white px-4 py-2 rounded-lg shadow-lg z-[10000] flex items-center gap-2">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
        </svg>
        <div class="font-semibold">Route Cleared</div>
      </div>
    `
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 2000)
  }

  // Fetch bins near specified location
  const fetchNearbyBins = async (lat: number, lng: number) => {
    setLoading(true);
    
    try {
      // In a real app, this would be an API call to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reduced bin count from 8-15 to 6-8
      const binCount = Math.floor(Math.random() * 3) + 6; // Generate 6-8 bins instead of 8-15
      const mockBins = generateBinsAround(lat, lng, binCount);
      
      setNearbyBins(mockBins);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching nearby bins:", err);
      setError("Failed to fetch nearby bins");
      setLoading(false);
    }
  };
  
  // Calculate distance between two coordinates in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // distance in meters
    
    return Math.round(d);
  };

  // Generate mock bins around a given location
  const generateBinsAround = (centerLat: number, centerLng: number, count: number): BinLocation[] => {
    const bins: BinLocation[] = [];
    const binTypes = ['general', 'recycling', 'compost'] as const;
    const binNames = [
      'Main Street Bin', 'Park Avenue Recycling', 'Town Square Compost',
      'Central Plaza Bin', 'Market Street Recycling', 'Community Garden Compost',
      'Library Corner Bin', 'Shopping Center Recycling', 'School Yard Compost',
      'Bus Stop Bin', 'City Hall Recycling', 'Playground Compost',
      'Train Station Bin', 'Hospital Recycling', 'Sports Center Compost'
    ];
    
    const addresses = [
      '123 Main Street', '456 Park Avenue', '789 Oak Drive',
      '321 Elm Street', '654 Pine Road', '987 Maple Lane',
      '147 Cedar Avenue', '258 Birch Street', '369 Willow Way',
      '159 Spruce Circle', '753 Aspen Court', '951 Poplar Drive'
    ];

    for (let i = 0; i < count; i++) {
      // Generate random coordinates within ~1km radius
      const radiusInDegrees = 0.01; // Roughly 1km
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * radiusInDegrees;
      
      const lat = centerLat + radius * Math.cos(angle);
      const lng = centerLng + radius * Math.sin(angle);
      
      const binType = binTypes[Math.floor(Math.random() * binTypes.length)];
      const distance = calculateDistance(centerLat, centerLng, lat, lng);
      
      bins.push({
        id: `bin-${i + 1}`,
        binName: binNames[i % binNames.length],
        location: { lat, lng },
        address: addresses[i % addresses.length],
        type: binType,
        lastEmptied: `${Math.floor(Math.random() * 7) + 1} days ago`,
        isAccessible: Math.random() > 0.3, // 70% accessible
        distance: distance
      });
    }
    
    return bins.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  };

  // Helper function to check if a point is near a line segment
  const isPointNearLine = (
    pointLat: number, pointLng: number,
    line1Lat: number, line1Lng: number,
    line2Lat: number, line2Lng: number,
    threshold: number
  ) => {
    // Calculate the minimum distance from point to line segment
    const A = pointLat - line1Lat;
    const B = pointLng - line1Lng;
    const C = line2Lat - line1Lat;
    const D = line2Lng - line1Lng;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = dot / lenSq;
    
    let closestLat, closestLng;
    
    if (param < 0) {
      closestLat = line1Lat;
      closestLng = line1Lng;
    }
    else if (param > 1) {
      closestLat = line2Lat;
      closestLng = line2Lng;
    }
    else {
      closestLat = line1Lat + param * C;
      closestLng = line1Lng + param * D;
    }
    
    const distance = Math.sqrt(
      Math.pow(pointLat - closestLat, 2) + 
      Math.pow(pointLng - closestLng, 2)
    );
    
    return distance < threshold;
  };

  // Format distance for display
  const formatDistance = (meters: number | undefined): string => {
    if (meters === undefined) return "Unknown";
    if (meters < 1000) return `${meters} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Get bin type color
  const getBinTypeColor = (type: string): string => {
    switch (type) {
      case 'recycling': return '#2196F3'; // Blue
      case 'compost': return '#8BC34A'; // Green
      case 'general': return '#9E9E9E'; // Gray
      default: return '#4CAF50';
    }
  };
  
  // Loading state
  if (loading && !userLocation && !searchLocation) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center p-4">
          <Loader2 className="h-10 w-10 text-green-600 mx-auto animate-spin mb-4" />
          <p className="text-gray-600">Finding waste bins near you...</p>
        </div>
      </div>
    );
  }
  
  // Error state with no fallback
  if (error && !userLocation && !searchLocation) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-red-50">
        <div className="text-center p-6 max-w-md">
          <div className="bg-red-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Info className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-red-800 mb-2">Location Access Required</h2>
          <p className="mb-4 text-red-700">{error}</p>
          <p className="text-sm text-gray-600 mb-4">
            This feature requires access to your location to find nearby waste bins.
            Please enable location services in your browser settings and refresh the page.
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 hover:bg-red-700"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }
  
  // Determine map center location
  const mapCenter = searchLocation 
    ? [searchLocation.lat, searchLocation.lng] as [number, number]
    : userLocation || [40.7128, -74.0060] as [number, number];
  
  return (
    <div className="h-full w-full relative">
      {typeof window !== 'undefined' && (
        <MapContainer
          center={mapCenter}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Add Eco-Route button */}
          <div className="absolute top-4 right-4 z-[999] flex">
            <Button 
              className="bg-green-600 hover:bg-green-700 h-10 whitespace-nowrap"
              onClick={() => {
                console.log("Eco-Route button clicked!"); // Add this debug log
                setEcoRouteModalOpen(true);
              }}
            >
              <Route className="h-4 w-4 mr-1" />
              Eco-Route
            </Button>
          </div>
          
          {/* Add route display logic */}
          {selectedRoute && selectedRoute.allRoutes && selectedRoute.allRoutes.map(route => (
  <Polyline
    key={route.id}
    positions={route.points}
    color={
      route.id === 'eco-optimal' ? '#10b981' : // Green for eco-optimal
      route.id === 'bin-maximizer' ? '#6366f1' : // Purple for bin-maximizer
      '#ef4444' // Red for fastest
    }
    weight={
      route.id === selectedRoute.routeId ? 
        (route.id === 'eco-optimal' ? 6 : 5) : // Make eco-optimal even thicker
        3
    }
    opacity={
      route.id === selectedRoute.routeId ? 
        (route.id === 'eco-optimal' ? 1 : 0.8) : // Full opacity for eco-optimal
        0.4 // Other routes more faded
    }
    dashArray={route.id === selectedRoute.routeId ? undefined : '5, 5'}
  >
    <Popup>
      <div className="p-2">
        <p className="font-medium">
          {route.id === 'eco-optimal' ? 'Eco-Optimal Route' :
            route.id === 'bin-maximizer' ? 'Bin Maximizer Route' : 'Fastest Route'}
        </p>
        <p className="text-xs text-gray-500">
          {route.id === selectedRoute.routeId ? 'Selected route' : 'Click to select this route'}
        </p>
      </div>
    </Popup>
  </Polyline>
))}

          {/* Add this to highlight bins near the selected route */}
          {selectedRoute && nearbyBins.map(bin => {
            // Check if bin is near the selected route
            const isNearRoute = selectedRoute.allRoutes?.find(route => {
              if (route.id !== selectedRoute.routeId) return false;
              
              // Check each segment of the route
              for (let i = 0; i < route.points.length - 1; i++) {
                const pointA = route.points[i];
                const pointB = route.points[i + 1];
                
                // Check if bin is near this segment
                if (isPointNearLine(
                  bin.location.lat, bin.location.lng,
                  pointA[0], pointA[1],
                  pointB[0], pointB[1],
                  0.005 // threshold in degrees
                )) {
                  return true;
                }
              }
              return false;
            });
            
            if (isNearRoute) {
              return (
                <Circle
                  key={`highlight-${bin.id}`}
                  center={[bin.location.lat, bin.location.lng]}
                  radius={20}
                  pathOptions={{
                    color: selectedRoute.routeId === 'eco-optimal' ? '#10b981' :
                           selectedRoute.routeId === 'bin-maximizer' ? '#6366f1' : '#ef4444',
                    weight: 3,
                    fillColor: selectedRoute.routeId === 'eco-optimal' ? '#10b981' :
                              selectedRoute.routeId === 'bin-maximizer' ? '#6366f1' : '#ef4444',
                    fillOpacity: 0.3
                  }}
                />
              );
            }
            return null;
          })}

          {/* Add route markers */}
          {selectedRoute && (
            <>
              <Marker
                position={[selectedRoute.start.lat, selectedRoute.start.lng]}
                icon={L.divIcon({
                  html: `<div class="h-4 w-4 rounded-full bg-green-500 border-2 border-white"></div>`,
                  className: 'custom-div-icon',
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                })}
              >
                <Popup>
                  <div className="font-medium">Start: {selectedRoute.start.name}</div>
                </Popup>
              </Marker>
              
              <Marker
                position={[selectedRoute.end.lat, selectedRoute.end.lng]}
                icon={L.divIcon({
                  html: `<div class="h-4 w-4 rounded-full bg-blue-500 border-2 border-white"></div>`,
                  className: 'custom-div-icon',
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                })}
              >
                <Popup>
                  <div className="font-medium">Destination: {selectedRoute.end.name}</div>
                </Popup>
              </Marker>
            </>
          )}
          
          {/* Fly to search location or user location */}
          <FlyToLocation 
            position={mapCenter}
            zoom={searchLocation ? 15 : 14}
          />
          
          {/* Search location marker */}
          {searchLocation && (
            <>
              <Marker position={[searchLocation.lat, searchLocation.lng]}>
                <Popup>
                  <div className="text-center">
                    <p className="font-medium">Search Location</p>
                  </div>
                </Popup>
              </Marker>
              
              {/* Radius circle */}
              <Circle 
                center={[searchLocation.lat, searchLocation.lng]}
                radius={1000} // 1km radius
                pathOptions={{ 
                  fillColor: '#4CAF50',
                  fillOpacity: 0.1,
                  color: '#4CAF50',
                  weight: 1
                }}
              />
            </>
          )}
          
          {/* User location marker */}
          {userLocation && (
            <Marker position={userLocation}>
              <Popup>
                <div className="text-center">
                  <p className="font-medium">Your Location</p>
                </div>
              </Popup>
            </Marker>
          )}
          
          {/* Bin markers */}
          {nearbyBins.map(bin => (
            <Marker 
              key={bin.id}
              position={[bin.location.lat, bin.location.lng]}
              eventHandlers={{
                click: () => setActiveMarker(bin.id)
              }}
            >
              <Popup>
                <div className="max-w-xs">
                  <div 
                    className="h-2 rounded-t-md" 
                    style={{ backgroundColor: getBinTypeColor(bin.type) }}
                  ></div>
                  
                  <div className="p-3">
                    <h3 className="font-bold text-gray-800">{bin.binName}</h3>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                      {bin.address}
                    </p>
                    
                    <div className="mt-3 flex items-center text-xs text-gray-500">
                      <span className="flex items-center mr-3">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        Last emptied: {bin.lastEmptied}
                      </span>
                      
                      <span className={`flex items-center px-2 py-0.5 rounded-full ${
                        bin.isAccessible ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {bin.isAccessible ? 'Accessible' : 'Limited Access'}
                      </span>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-xs bg-blue-50 px-2 py-1 rounded">
                        {formatDistance(bin.distance)} away
                      </div>
                      
                      <Button 
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-xs px-3 h-8"
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${bin.location.lat},${bin.location.lng}`, '_blank')}
                      >
                        <Navigation className="h-3 w-3 mr-1" />
                        Directions
                      </Button>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}

      {/* Route information panel */}
      {selectedRoute && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-[999] max-w-md">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-gray-800 flex items-center">
                {selectedRoute.routeId === 'eco-optimal' ? 'Eco-Optimal Route' : 
                 selectedRoute.routeId === 'bin-maximizer' ? 'Bin Maximizer Route' : 'Fastest Route'}
                
                {selectedRoute.routeId === 'eco-optimal' && (
                  <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                    Recommended
                  </span>
                )}
              </h3>
              <div className="text-sm text-gray-600 mt-1">
                <span className="font-medium">{selectedRoute.start.name.split(',')[0]}</span>
                <ArrowRight className="inline h-3 w-3 mx-1" />
                <span className="font-medium">{selectedRoute.end.name.split(',')[0]}</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedRoute(null)}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-gray-50 rounded p-2 text-center">
              <div className="text-xs text-gray-500">Duration</div>
              <div className="font-medium text-black">
                {selectedRoute.routeData?.duration || 'N/A'} min
              </div>
            </div>
            <div className="bg-gray-50 rounded p-2 text-center">
              <div className="text-xs text-gray-500">Distance</div>
              <div className="font-medium text-black">
                {selectedRoute.routeData?.distance || 'N/A'} km
              </div>
            </div>
            <div className="bg-gray-50 rounded p-2 text-center">
              <div className="text-xs text-gray-500">Bins</div>
              <div className="font-medium text-black">
                {selectedRoute.routeData?.binCount || 'N/A'}
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-600 bg-green-50 p-2 rounded border border-green-100">
            <p className="font-medium text-green-800 mb-1">Route Details:</p>
            <p>{selectedRoute.routeData?.description || 'Route information not available'}</p>
          </div>
          
          {/* Add estimated carbon savings */}
          <div className="mt-2 text-xs text-center bg-blue-50 p-2 rounded border border-blue-100">
            <span className="font-medium text-blue-800">
              🌱 Est. CO₂ savings: {((selectedRoute.routeData?.distance || 0) * 0.2).toFixed(1)}kg
            </span>
          </div>
        </div>
      )}
      
      {/* Add the EcoRouteModal with debug info */}
      <EcoRouteModal 
        isOpen={ecoRouteModalOpen}
        onClose={() => setEcoRouteModalOpen(false)}
        onRouteSelect={handleRouteSelect}
        nearbyBins={nearbyBins}
      />
      
      {/* Update the bin count indicator to show more info */}
      {!loading && nearbyBins.length > 0 && !selectedRoute && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-md text-sm font-medium">
          <div className="flex items-center gap-2">
            <span>{nearbyBins.length} bins found {searchLocation ? 'near this location' : 'around you'}</span>
            <div className="flex gap-1">
              {nearbyBins.filter(b => b.type === 'general').length > 0 && (
                <div className="w-3 h-3 bg-gray-400 rounded-full" title="General waste bins"></div>
              )}
              {nearbyBins.filter(b => b.type === 'recycling').length > 0 && (
                <div className="w-3 h-3 bg-blue-500 rounded-full" title="Recycling bins"></div>
              )}
              {nearbyBins.filter(b => b.type === 'compost').length > 0 && (
                <div className="w-3 h-3 bg-green-500 rounded-full" title="Compost bins"></div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Loading overlay when changing locations */}
      {loading && (searchLocation || userLocation) && (
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center pointer-events-none">
          <div className="bg-white p-3 rounded-lg shadow-lg">
            <Loader2 className="h-6 w-6 text-green-600 animate-spin mx-auto" />
            <p className="text-sm text-gray-600 mt-2">Fetching bins...</p>
          </div>
        </div>
      )}
    </div>
  );
}
