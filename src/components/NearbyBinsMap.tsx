"use client"

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Loader2 } from 'lucide-react'

// Fix for Leaflet icons in Next.js
const fixLeafletIcons = () => {
  // Only run on client side
  if (typeof window !== 'undefined') {
    // Dynamically import Leaflet
    import('leaflet').then((L) => {
      // Fix icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
      });
    });
  }
};

// Recenter map when user location changes
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1 });
  }, [center, zoom, map]);
  return null;
}

interface BinLocation {
  id: string;
  binName: string;
  location: { lat: number; lng: number };
  distance?: number; // distance in meters
  address: string;
}

interface NearbyBinsMapProps {
  height?: string;
  width?: string;
  className?: string;
}

export default function NearbyBinsMap({ height = "300px", width = "100%", className = "" }: NearbyBinsMapProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nearbyBins, setNearbyBins] = useState<BinLocation[]>([]);

  // Fix Leaflet icons
  useEffect(() => {
    fixLeafletIcons();
  }, []);
  
  // Get user location and nearby bins
  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log("User location obtained:", latitude, longitude);
          setUserLocation([latitude, longitude]);
          
          // Fetch nearby bins after getting location
          fetchNearbyBins(latitude, longitude);
        },
        (err) => {
          console.error("Geolocation error:", err);
          setError("Unable to access your location. Please enable location services.");
          setLoading(false);
          
          // Use fallback location
          const fallbackLat = 40.7128; // Example: NYC
          const fallbackLng = -74.0060;
          console.log("Using fallback location");
          setUserLocation([fallbackLat, fallbackLng]);
          fetchNearbyBins(fallbackLat, fallbackLng);
        },
        { timeout: 10000 }
      );
    } else {
      console.log("Geolocation not supported");
      setError("Your browser doesn't support geolocation.");
      setLoading(false);
      
      // Use fallback location
      const fallbackLat = 40.7128; // Example: NYC
      const fallbackLng = -74.0060;
      setUserLocation([fallbackLat, fallbackLng]);
      fetchNearbyBins(fallbackLat, fallbackLng);
    }
  }, []);
  
  // Fetch nearby bins (mocked data for now)
  const fetchNearbyBins = async (lat: number, lng: number) => {
    try {
      console.log("Fetching bins near:", lat, lng);
      
      // Mock bin data with locations around the user's position
      const mockBins: BinLocation[] = [
        {
          id: "bin1",
          binName: "City Park Bin #1",
          location: { lat: lat + 0.002, lng: lng + 0.001 },
          address: "North entrance, City Park"
        },
        {
          id: "bin2",
          binName: "Main Street Bin",
          location: { lat: lat - 0.001, lng: lng + 0.002 },
          address: "123 Main St, Corner Shop"
        },
        {
          id: "bin3",
          binName: "Community Center Bin",
          location: { lat: lat + 0.0015, lng: lng - 0.0018 },
          address: "Community Center Parking Lot"
        }
      ];
      
      // Calculate distance for each bin
      const binsWithDistance = mockBins.map(bin => {
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
      console.log("Bins loaded:", sortedBins.length);
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
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };
  
  // Loading state
  if (loading) {
    return (
      <div 
        style={{ height, width }}
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
      >
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-[#4CAF50] mx-auto animate-spin" />
          <p className="mt-2 text-sm text-gray-600">Finding nearby bins...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error || !userLocation) {
    return (
      <div 
        style={{ height, width }}
        className={`flex items-center justify-center bg-red-50 rounded-lg ${className}`}
      >
        <div className="text-center p-4">
          <p className="text-red-600 mb-2">⚠️ {error || "Unable to load map"}</p>
          <p className="text-sm text-gray-600">Please ensure location services are enabled.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div style={{ height, width }} className={className}>
      {typeof window !== 'undefined' && (
        <MapContainer
          center={userLocation}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {/* Update center when user location changes */}
          <ChangeView center={userLocation} zoom={15} />
          
          {/* User marker */}
          <Marker position={userLocation}>
            <Popup>
              <div className="text-center">
                <p className="font-medium">Your Location</p>
              </div>
            </Popup>
          </Marker>
          
          {/* Bin markers */}
          {nearbyBins.map(bin => (
            <Marker 
              key={bin.id}
              position={[bin.location.lat, bin.location.lng]}
            >
              <Popup>
                <div>
                  <h3 className="font-bold text-[#4CAF50]">{bin.binName}</h3>
                  <p className="text-sm">{bin.address}</p>
                  <p className="text-xs mt-1 text-gray-600">
                    Distance: {formatDistance(bin.distance)}
                  </p>
                  <button 
                    className="mt-2 text-xs bg-[#4CAF50] hover:bg-[#3ea043] text-white py-1 px-2 rounded"
                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${bin.location.lat},${bin.location.lng}`, '_blank')}
                  >
                    Directions
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
}