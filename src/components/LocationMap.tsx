"use client"

import { useEffect, useState } from 'react'
import L from 'leaflet'

// Leaflet CSS is now loaded via the layout file, so no need to import it here

// Fix Leaflet's default icon issue
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
})

export default function LocationMap({
  latitude,
  longitude,
  accuracy = 50
}) {
  const [map, setMap] = useState(null)
  
  // Dynamically load Leaflet components only on client-side
  const [leafletModules, setLeafletModules] = useState(null)
  
  useEffect(() => {
    // Dynamically import Leaflet components in useEffect to avoid SSR issues
    async function loadLeaflet() {
      const { MapContainer, TileLayer, Marker, Popup, Circle } = await import('react-leaflet')
      setLeafletModules({ MapContainer, TileLayer, Marker, Popup, Circle })
    }
    
    loadLeaflet()
  }, [])
  
  // Validate coordinates
  if (!latitude || !longitude || !leafletModules) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading map...</p>
      </div>
    )
  }
  
  const { MapContainer, TileLayer, Marker, Popup, Circle } = leafletModules
  
  return (
    <MapContainer 
      center={[latitude, longitude]} 
      zoom={15} 
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
      whenReady={(map) => setMap(map.target)}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[latitude, longitude]} icon={icon}>
        <Popup>
          Bin location <br />
          Accuracy: ~{Math.round(accuracy)}m
        </Popup>
      </Marker>
      {accuracy && (
        <Circle 
          center={[latitude, longitude]}
          radius={accuracy}
          pathOptions={{ color: '#4CAF50', fillColor: '#4CAF5033', weight: 1 }}
        />
      )}
    </MapContainer>
  )
}