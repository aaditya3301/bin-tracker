"use client"

import { useEffect, useState, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Loader2, Navigation, Phone, Clock, Info, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Fix for Leaflet icons in Next.js
const fixLeafletIcons = () => {
  // Only run on client side
  if (typeof window !== 'undefined') {
    // Dynamically import Leaflet
    import('leaflet').then((L) => {
      // Fix icon paths
      delete L.Icon.Default.prototype._getIconUrl;
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
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nearbyBins, setNearbyBins] = useState<BinLocation[]>([]);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const mapRef = useRef(null);

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
  
  // Fetch bins near specified location
  const fetchNearbyBins = async (lat: number, lng: number) => {
    setLoading(true);
    
    try {
      // In a real app, this would be an API call to your backend
      // Using mock data for demonstration
      
      // Generate some bins around the target location
      const generateBinsAround = (centerLat: number, centerLng: number, count: number): BinLocation[] => {
        const bins: BinLocation[] = [];
        const binTypes: ('general' | 'recycling' | 'compost')[] = ['general', 'recycling', 'compost'];
        const streets = ['Main St', 'Park Ave', 'Oak Rd', 'Maple Dr', 'Cedar Ln', 'Pine St'];
        
        for (let i = 0; i < count; i++) {
          // Random offset within ~1km
          const latOffset = (Math.random() - 0.5) * 0.02;
          const lngOffset = (Math.random() - 0.5) * 0.02;
          
          const binLat = centerLat + latOffset;
          const binLng = centerLng + lngOffset;
          
          const binType = binTypes[Math.floor(Math.random() * binTypes.length)];
          const street = streets[Math.floor(Math.random() * streets.length)];
          const streetNumber = Math.floor(Math.random() * 200) + 1;
          
          bins.push({
            id: `bin-${i}-${Date.now()}`,
            binName: `${binType.charAt(0).toUpperCase() + binType.slice(1)} Bin #${i+1}`,
            location: { lat: binLat, lng: binLng },
            address: `${streetNumber} ${street}`,
            type: binType,
            lastEmptied: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            isAccessible: Math.random() > 0.2,
            imageUrl: `/images/${binType}-bin.jpg` // You'd need to add these images
          });
        }
        
        return bins;
      };
      
      // Generate 8-15 bins
      const binCount = Math.floor(Math.random() * 8) + 8;
      const bins = generateBinsAround(lat, lng, binCount);
      
      // Calculate distance from search location for each bin
      const binsWithDistance = bins.map(bin => {
        const distance = calculateDistance(
          lat, lng,
          bin.location.lat, bin.location.lng
        );
        return { ...bin, distance };
      });
      
      // Sort by distance
      const sortedBins = binsWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      setNearbyBins(sortedBins);
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
    <div className="h-full w-full">
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
      
      {/* Bin count indicator */}
      {!loading && nearbyBins.length > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-md text-sm font-medium">
          {nearbyBins.length} bins found {searchLocation ? 'near this location' : 'around you'}
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