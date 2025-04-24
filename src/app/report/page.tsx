"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"

import { 
  Leaf, 
  ArrowLeft, 
  Upload, 
  MapPin, 
  Info,
  Check,
  Loader2,
  Navigation,
  AlertTriangle
} from "lucide-react"
import { useSession } from "next-auth/react"
import Image from "next/image"
import EXIF from 'exif-js';
import dynamic from 'next/dynamic'

const MapWithNoSSR = dynamic(
    () => import('../../components/LocationMap'),
    { ssr: false }
  );

// Import this if you decide to use a map visualization
// import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

export default function BinReportPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formStep, setFormStep] = useState(1)
  const [success, setSuccess] = useState(false)
  const [locationError, setLocationError] = useState("")
  const [locationStatus, setLocationStatus] = useState("idle") // idle, loading, success, error
  
  const [formData, setFormData] = useState({
    binName: "",
    binType: "general",
    location: "",
    address: "",
    details: "",
    imageFile: null,
    imagePreview: "",
    // Geolocation data
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
    // For extracted EXIF data from image
    imageLatitude: null,
    imageLongitude: null,
    imageTimestamp: null
  })

  // Get user's current location when they reach step 2
  useEffect(() => {
    if (formStep === 2) {
      getCurrentLocation()
    }
  }, [formStep])

  // Function to get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      setLocationStatus("error")
      return
    }
    
    setLocationStatus("loading")
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        })
        setLocationStatus("success")
        setLocationError("")
        
        // Optional: You could auto-populate address field using reverse geocoding
        // reverseGeocode(position.coords.latitude, position.coords.longitude)
      },
      (error) => {
        console.error("Error getting location", error)
        setLocationError(`Unable to retrieve your location: ${error.message}`)
        setLocationStatus("error")
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

// Add this import at the top of your file

// Then replace the extractImageMetadata function with:
const extractImageMetadata = (file: File) => {
  return new Promise<{
    hasLocation: boolean;
    latitude: number | null;
    longitude: number | null;
    timestamp: number;
  }>((resolve, reject) => {
    EXIF.getData(file as any, function(this: any) {
      try {
        // Check if the image has GPS data
        const lat = EXIF.getTag(this, "GPSLatitude");
        const latRef = EXIF.getTag(this, "GPSLatitudeRef");
        const lng = EXIF.getTag(this, "GPSLongitude");
        const lngRef = EXIF.getTag(this, "GPSLongitudeRef");
        const dateTime = EXIF.getTag(this, "DateTime");
        
        if (lat && lng) {
          // Convert coordinates from degrees, minutes, seconds to decimal
          const latDecimal = lat[0] + lat[1]/60 + lat[2]/3600;
          const lngDecimal = lng[0] + lng[1]/60 + lng[2]/3600;
          
          // Apply direction reference (N/S, E/W)
          const latitude = latRef === "N" ? latDecimal : -latDecimal;
          const longitude = lngRef === "E" ? lngDecimal : -lngDecimal;
          
          resolve({
            hasLocation: true,
            latitude,
            longitude,
            timestamp: dateTime ? new Date(dateTime).getTime() : new Date().getTime()
          });
        } else {
          resolve({
            hasLocation: false,
            latitude: null,
            longitude: null,
            timestamp: new Date().getTime()
          });
        }
      } catch (error) {
        console.error("Error parsing EXIF data:", error);
        resolve({
          hasLocation: false,
          latitude: null,
          longitude: null,
          timestamp: new Date().getTime()
        });
      }
    });
  });
};

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({
        ...formData,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      })
      
      // Try to extract location data from image
      try {
        const metadata = await extractImageMetadata(file)
        if (metadata.hasLocation) {
          setFormData(prev => ({
            ...prev,
            imageFile: file,
            imagePreview: URL.createObjectURL(file),
            imageLatitude: metadata.latitude,
            imageLongitude: metadata.longitude,
            imageTimestamp: metadata.timestamp
          }))
        }
      } catch (err) {
        console.error("Error extracting image metadata:", err)
      }
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Prepare the data for submission
    const submissionData = {
      ...formData,
      // Use image geolocation if available, otherwise use device geolocation
      submittedLatitude: formData.imageLatitude || formData.latitude,
      submittedLongitude: formData.imageLongitude || formData.longitude,
      submissionTime: new Date().toISOString(),
      userId: session?.user?.id || "anonymous"
    }
    
    // In a real app, you would upload the image to your server/cloud storage
    // and send the metadata to your database
    
    // For now, we'll simulate an API call
    console.log("Submission data:", submissionData)
    
    // Simulate API call delay
    setTimeout(() => {
      setIsSubmitting(false)
      setSuccess(true)
      
      // Redirect to home after success
      setTimeout(() => {
        router.push("/home")
      }, 3000)
    }, 2000)
  }

  const refreshLocation = () => {
    getCurrentLocation()
  }

  // Success screen remains the same
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#edf7f2] py-12 px-4">
        <div className="max-w-lg mx-auto">
          <motion.div
            className="bg-white rounded-xl shadow-lg p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Check className="h-10 w-10 text-[#4CAF50]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h2>
            <p className="text-gray-600 mb-6">
              Your bin report has been successfully submitted. Our team will verify the location soon.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              You've earned 5 points for contributing to the community!
            </p>
            <Link href="/home">
              <button className="w-full py-3 bg-[#4CAF50] text-white rounded-lg hover:bg-green-600 transition-colors">
                Back to Dashboard
              </button>
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#edf7f2]">
      {/* Header stays the same */}
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
                  <span className="text-gray-800">Track</span>
                </h1>
              </motion.div>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - Keep the same structure but modify Step 2 for location */}
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          <Link href="/home" className="flex items-center text-gray-600 hover:text-[#4CAF50] mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>Back to Dashboard</span>
          </Link>

          {/* Form Card */}
          <motion.div
            className="bg-white rounded-xl shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Form Header */}
            <div className="bg-[#4CAF50] px-6 py-4 text-white">
              <h2 className="text-xl font-semibold flex items-center">
                <MapPin className="mr-2 h-5 w-5" />
                Report a New Bin
              </h2>
              <p className="text-sm opacity-80 mt-1">Help your community find waste bins easily</p>
            </div>

            {/* Form Steps - Keep the same */}
            <div className="flex items-center px-6 py-4 border-b">
              <div 
                className={`flex items-center justify-center h-8 w-8 rounded-full text-sm ${
                  formStep >= 1 ? "bg-[#4CAF50] text-white" : "bg-gray-200 text-gray-600"
                } mr-2`}
              >
                1
              </div>
              <div className={`h-1 flex-grow ${formStep >= 2 ? "bg-[#4CAF50]" : "bg-gray-200"} mx-2`}></div>
              <div 
                className={`flex items-center justify-center h-8 w-8 rounded-full text-sm ${
                  formStep >= 2 ? "bg-[#4CAF50] text-white" : "bg-gray-200 text-gray-600"
                } mx-2`}
              >
                2
              </div>
              <div className={`h-1 flex-grow ${formStep >= 3 ? "bg-[#4CAF50]" : "bg-gray-200"} mx-2`}></div>
              <div 
                className={`flex items-center justify-center h-8 w-8 rounded-full text-sm ${
                  formStep >= 3 ? "bg-[#4CAF50] text-white" : "bg-gray-200 text-gray-600"
                } ml-2`}
              >
                3
              </div>
            </div>

            {/* Form Body */}
            <div className="px-6 py-6">
              <form onSubmit={handleSubmit}>
                {formStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Basic Information</h3>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bin Name
                      </label>
                      <input
                        type="text"
                        name="binName"
                        value={formData.binName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                        placeholder="E.g., Park Entrance Bin"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bin Type
                      </label>
                      <select
                        name="binType"
                        value={formData.binType}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                        required
                      >
                        <option value="general">General Waste</option>
                        <option value="recycling">Recycling</option>
                        <option value="compost">Compost</option>
                        <option value="paper">Paper</option>
                        <option value="plastic">Plastic</option>
                        <option value="glass">Glass</option>
                        <option value="electronic">Electronic Waste</option>
                        <option value="hazardous">Hazardous Waste</option>
                      </select>
                    </div>

                    <div className="mt-6">
                      <button
                        type="button"
                        onClick={() => setFormStep(2)}
                        className="w-full py-2 bg-[#4CAF50] text-white rounded-md hover:bg-green-600 transition-colors"
                      >
                        Next: Location Details
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Updated Step 2 with geolocation capabilities */}
                {formStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Location Information</h3>
                    
                    {/* Location Status Indicator */}
                    <div className={`mb-5 p-3 rounded-md ${
                      locationStatus === 'success' ? 'bg-green-50 border border-green-100' : 
                      locationStatus === 'error' ? 'bg-red-50 border border-red-100' :
                      locationStatus === 'loading' ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'
                    }`}>
                      <div className="flex items-start">
                        {locationStatus === 'success' && (
                          <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        )}
                        {locationStatus === 'error' && (
                          <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                        )}
                        {locationStatus === 'loading' && (
                          <Loader2 className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0 animate-spin" />
                        )}
                        {locationStatus === 'idle' && (
                          <Info className="h-5 w-5 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
                        )}
                        
                        <div className="flex-1">
                          {locationStatus === 'success' && (
                            <>
                              <p className="text-sm font-medium text-green-800">Location detected successfully</p>
                              <p className="text-xs text-green-700 mt-1">
                                Coordinates: {formData.latitude?.toFixed(6)}, {formData.longitude?.toFixed(6)}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Accuracy: ~{Math.round(formData.accuracy || 0)}m
                              </p>
                            </>
                          )}
                          {locationStatus === 'error' && (
                            <>
                              <p className="text-sm font-medium text-red-800">Location detection failed</p>
                              <p className="text-xs text-red-700 mt-1">{locationError}</p>
                            </>
                          )}
                          {locationStatus === 'loading' && (
                            <p className="text-sm font-medium text-blue-800">Detecting your location...</p>
                          )}
                          {locationStatus === 'idle' && (
                            <p className="text-sm font-medium text-gray-800">
                              We need your location to accurately place the bin on the map
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Location action buttons */}
                      <div className="mt-3 flex justify-end">
                        {(locationStatus === 'error' || locationStatus === 'success') && (
                          <button
                            type="button"
                            onClick={refreshLocation}
                            className="text-xs bg-white px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 flex items-center"
                          >
                            <Navigation className="h-3 w-3 mr-1" />
                            {locationStatus === 'error' ? 'Try Again' : 'Refresh Location'}
                          </button>
                        )}
                        
                        {locationStatus === 'idle' && (
                          <button
                            type="button"
                            onClick={getCurrentLocation}
                            className="text-xs bg-[#4CAF50] text-white px-3 py-1 rounded hover:bg-green-600 flex items-center"
                          >
                            <Navigation className="h-3 w-3 mr-1" />
                            Detect My Location
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Optional: Render a map preview here */}
                    {formData.latitude && formData.longitude && (
  <div className="mb-5">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      Location Preview
    </label>
    <div className="h-[200px] bg-gray-100 rounded-md overflow-hidden relative">
      <MapWithNoSSR 
        latitude={formData.latitude} 
        longitude={formData.longitude} 
        accuracy={formData.accuracy} 
      />
    </div>
    <p className="text-xs text-gray-500 mt-1">
      This is where the bin will be placed on the map
    </p>
  </div>
)}

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location Name
                      </label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                        placeholder="E.g., Central Park"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Address
                      </label>
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                        placeholder="Enter the full address or provide detailed location"
                        required
                      ></textarea>
                      <p className="text-xs text-gray-500 mt-1">
                        Please provide the address even though we have your coordinates. 
                        This helps others find the bin more easily.
                      </p>
                    </div>

                    <div className="flex space-x-4 mt-6">
                      <button
                        type="button"
                        onClick={() => setFormStep(1)}
                        className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormStep(3)}
                        className="flex-1 py-2 bg-[#4CAF50] text-white rounded-md hover:bg-green-600 transition-colors"
                      >
                        Next: Additional Details
                      </button>
                    </div>
                  </motion.div>
                )}

                {formStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Additional Details</h3>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description or Notes
                      </label>
                      <textarea
                        name="details"
                        value={formData.details}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CAF50] focus:border-transparent"
                        placeholder="Any additional details about this bin (size, condition, accessibility, etc.)"
                      ></textarea>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload Photo
                      </label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        {formData.imagePreview ? (
                          <div className="text-center">
                            <div className="h-48 w-full relative mb-2">
                              <Image 
                                src={formData.imagePreview}
                                alt="Bin preview"
                                fill
                                style={{ objectFit: 'contain' }}
                                className="rounded-md" 
                              />
                            </div>
                            
                            {/* Show if image has geolocation data */}
                            {formData.imageLatitude && formData.imageLongitude && (
                              <div className="mt-2 mb-2 text-xs text-green-600 bg-green-50 p-2 rounded flex items-center justify-center">
                                <Info className="h-3 w-3 mr-1" />
                                Geolocation data found in image
                              </div>
                            )}
                            
                            <button 
                              type="button"
                              onClick={() => setFormData({...formData, imageFile: null, imagePreview: "", imageLatitude: null, imageLongitude: null, imageTimestamp: null})}
                              className="text-sm text-red-600 hover:text-red-500"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1 text-center">
                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                              <label
                                htmlFor="file-upload"
                                className="relative cursor-pointer rounded-md bg-white font-medium text-[#4CAF50] hover:text-green-600"
                              >
                                <span>Upload a file</span>
                                <input
                                  id="file-upload"
                                  name="file-upload"
                                  type="file"
                                  className="sr-only"
                                  accept="image/*"
                                  onChange={handleFileChange}
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                            <p className="text-xs text-blue-500 mt-2">
                              Tip: If your photo has location data, we'll extract it automatically
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center mb-4 mt-6">
                      <Info className="h-5 w-5 text-blue-500 mr-2" />
                      <p className="text-xs text-gray-600">
                        By submitting this form, you confirm that the information provided is accurate
                        to the best of your knowledge.
                      </p>
                    </div>

                    <div className="flex space-x-4 mt-6">
                      <button
                        type="button"
                        onClick={() => setFormStep(2)}
                        className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || !formData.latitude || !formData.longitude}
                        className={`flex-1 py-2 text-white rounded-md flex items-center justify-center
                          ${(!formData.latitude || !formData.longitude) ? 
                            "bg-gray-400 cursor-not-allowed" : 
                            "bg-[#4CAF50] hover:bg-green-600 transition-colors"
                          }`}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Report"
                        )}
                      </button>
                    </div>
                    
                    {(!formData.latitude || !formData.longitude) && (
                      <p className="text-xs text-red-500 mt-2 text-center">
                        Location data is required. Please go back to step 2 and allow location access.
                      </p>
                    )}
                  </motion.div>
                )}
              </form>
            </div>

            {/* Form Footer */}
            <div className="bg-gray-50 px-6 py-4">
              <div className="flex items-start">
                <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0">
                  <Info className="h-3 w-3 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-600">
                    Your contribution helps make waste disposal more accessible for everyone.
                    You'll earn rewards points for verified bin reports!
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    Geolocation data is used only to accurately place the bin on our maps.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}