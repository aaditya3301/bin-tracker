"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import BinDetector from '@/components/BinDetector'
import { Loader2, MapPin, Camera, Check, AlertTriangle, ArrowLeft, Leaf } from 'lucide-react'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'

// Import your UI components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'

const MapWithNoSSR = dynamic(
  () => import('../../components/LocationMap'),
  { ssr: false }
);

export default function BinReportPage() {
  // Remove session: const { data: session, status } = useSession()
  // Add mock session for UI elements if needed
  const session = {
    user: {
      name: "User",
      image: null
    }
  }
  
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formStep, setFormStep] = useState(1)
  const [success, setSuccess] = useState(false)
  const [locationError, setLocationError] = useState("")
  const [locationStatus, setLocationStatus] = useState("idle")
  const [confidence, setConfidence] = useState(0)
  
  // Form fields
  const [imageUrl, setImageUrl] = useState("")
  const [binName, setBinName] = useState("")
  const [binAddress, setBinAddress] = useState("")
  const [binDescription, setBinDescription] = useState("")
  const [location, setLocation] = useState({ lat: 0, lng: 0 })
  
  // Validation states
  const [binDetected, setBinDetected] = useState(false)
  const [formErrors, setFormErrors] = useState({
    binName: false,
    binAddress: false,
    location: false
  })
  
  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      setBinDetected(false) // Reset detection status when image changes
    }
  }
  
  // Request new image upload
  const handleRequestNewImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }
  
  // Get current location
  const getCurrentLocation = () => {
    setLocationStatus("loading")
    setLocationError("")
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setLocation({ lat: latitude, lng: longitude })
          setLocationStatus("success")
          setFormErrors({...formErrors, location: false})
        },
        (error) => {
          setLocationError(`Error getting location: ${error.message}`)
          setLocationStatus("error")
        }
      )
    } else {
      setLocationError("Geolocation is not supported by your browser")
      setLocationStatus("error")
    }
  }
  
  // Handle detection completion
  const handleDetectionComplete = (isBin: boolean, confidence: number) => {
    console.log(`Detection complete: isBin=${isBin}, confidence=${confidence}`)
    setBinDetected(isBin)
    
    // Store confidence as percentage
    const confidencePercent = confidence * 100
    setConfidence(confidencePercent)
  }
  
  // Move to next step
  const goToNextStep = () => {
    if (formStep === 1) {
      if (!binDetected) {
        alert("Please upload a clear image of a waste bin first")
        return
      }
      setFormStep(2)
    } else if (formStep === 2) {
      // Check required fields before moving to location step
      const errors = {
        binName: !binName.trim(),
        binAddress: !binAddress.trim(),
        location: false
      }
      
      setFormErrors(errors)
      
      if (errors.binName || errors.binAddress) {
        return
      }
      
      setFormStep(3)
    }
  }
  
  // Go to previous step
  const goToPreviousStep = () => {
    if (formStep > 1) {
      setFormStep(formStep - 1)
    }
  }
  
  // Validate form
  const validateForm = () => {
    const errors = {
      binName: !binName.trim(),
      binAddress: !binAddress.trim(),
      location: location.lat === 0 && location.lng === 0
    }
    
    setFormErrors(errors)
    return !Object.values(errors).includes(true)
  }
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsSubmitting(true)
    
    try {
      // Submit bin report to your API
      const response = await fetch('/api/bins/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          binName,
          binAddress,
          binDescription,
          location,
          imageUrl // You'd actually upload the image to storage and save the URL
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit bin report')
      }
      
      // Store reward data for the rewards page
      localStorage.setItem('rewardData', JSON.stringify({
        points: 50, // Points earned for reporting a bin
        reportType: 'bin_report',
        submittedAt: new Date().toISOString(),
        binName: binName,
        location: binAddress
      }))
      
      setSuccess(true)
      setTimeout(() => {
        router.push('/rewards') // Redirect to rewards page instead of home
      }, 2000)
      
    } catch (error) {
      console.error('Error submitting bin report:', error)
      alert('Report Submitted Successfully.')
      // Even on error, redirect to rewards page for demo
      setTimeout(() => {
        router.push('/rewards')
      }, 1000)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // REMOVE AUTHENTICATION CHECK
  // useEffect(() => {
  //   if (status === "unauthenticated") {
  //     router.push('/')
  //   }
  // }, [status, router])

  // REMOVE LOADING STATE CHECK
  // if (status === "loading") {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-b from-white to-[#edf7f2] p-6 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600 mx-auto mb-4"></div>
  //         <p className="text-gray-600">Loading...</p>
  //       </div>
  //     </div>
  //   )
  // }
  
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-[#edf7f2] p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-green-800 mb-2">Report Submitted!</h2>
          <p className="text-gray-600 mb-4">Thank you for reporting this waste bin. Your contribution helps keep our community clean.</p>
          <div className="bg-green-50 p-3 rounded-lg border border-green-100 mb-4">
            <p className="text-sm text-green-800 font-medium">🎉 You've earned 50 Eco-Points!</p>
            <p className="text-xs text-green-700">Check your rewards and badges</p>
          </div>
          <p className="text-sm text-gray-500">Redirecting to rewards page...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-[#edf7f2]">
      <Header />
      <div className="p-4 md:p-6">
      <div className="container mx-auto">
        <motion.div
          className="mb-8 relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Add this new section */}
          <div className="relative h-[500px] w-full p-2">
            <div className="relative h-[200px] rounded-xl overflow-hidden mb-6">
              <img
                src="/Rectangle 57.png" // Make sure to add this image to your public folder
                alt="Community cleanup volunteers"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/00"></div>
            </div>
            
            <div className="text-center mb-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white z-10 mt-20">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                See a Mess? Help Us Fix It.
              </h2>
              <p className="text-gray-600 mb-4">
                Spotted an overflowing bin or a broken waste unit? Don't just walk by—report it and be part of the change.
              </p>
              <p className="text-gray-600">
                Our community-driven reporting system lets you flag waste issues quickly and easily. Just upload a photo, drop a pin, and submit the details.
                Every valid report earns you Eco-Coins as a thank-you for keeping the city clean.
              </p>
            </div>
          </div>
        </motion.div>

          {/* Existing progress steps and form */}
            <h1 className="text-2xl font-bold text-green-800 mb-6 text-center">Report a Waste Bin</h1>
          
          {/* Progress Steps */}
          <div className="mb-6 relative">
            {/* Background line */}
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200 -z-10"></div>
            
            {/* Progress line */}
            <div 
              className="absolute top-4 left-0 h-0.5 bg-green-600 transition-all duration-300 -z-10"
              style={{ 
                width: `${formStep === 1 ? '0%' : formStep === 2 ? '50%' : '100%'}`,
                right: formStep === 3 ? '0' : 'auto'
              }}
            />

            <div className="flex items-center justify-between ml-72 mr-72 mb-24">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex flex-col items-center relative">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-sm border transition-colors
                      ${formStep === step 
                        ? 'bg-green-600 text-white border-green-600' 
                        : formStep > step 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'bg-white text-gray-400 border-gray-200'}`}
                  >
                    {formStep > step ? <Check className="h-5 w-5" /> : step}
                  </div>
                  <span className={`text-xs ${
                    formStep === step 
                      ? 'font-medium text-green-800' 
                      : formStep > step 
                        ? 'text-green-700' 
                        : 'text-gray-500'
                  }`}>
                    {step === 1 ? 'Verify Image' : step === 2 ? 'Details' : 'Location'}
                  </span>

                  {/* Add connecting lines between steps */}
                  {step < 3 && (
                    <div 
                      className={`absolute top-5 left-12 w-[calc(100%+180px)] h-0.5 -z-10
                        ${formStep > step ? 'bg-green-600' : 'bg-green-600'}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
     
          
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 border border-gray-100 ml-72 mr-72">
            {/* Step 1: Image Upload */}
            {formStep === 1 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Upload Bin Image</h2>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    ref={fileInputRef}
                  />
                  
                  {!imageUrl ? (
                    <div>
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500 mb-2">Take or upload a clear photo of the waste bin</p>
                      <Button
                        type="button"
                        onClick={handleRequestNewImage}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Upload Image
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <BinDetector
                        imageUrl={imageUrl}
                        onDetectionComplete={handleDetectionComplete}
                        onRequestNewImage={handleRequestNewImage}
                      />
                    </div>
                  )}
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button
                    type="button"
                    onClick={goToNextStep}
                    disabled={!binDetected || confidence < 70}
                    className="bg-green-600 hover:bg-green-700 px-5 py-2 h-auto"
                  >
                    Continue to Details
                    {binDetected && confidence < 70 && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                        Low confidence
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 2: Bin Details */}
            {formStep === 2 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-8">Bin Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="binName" className="flex items-center text-black mb-2">
                      Bin Name/ID <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                      id="binName"
                      value={binName}
                      onChange={(e) => {
                        setBinName(e.target.value)
                        if (e.target.value) setFormErrors({...formErrors, binName: false})
                      }}
                      placeholder="E.g., Central Park Bin #3"
                      className={`text-black ${formErrors.binName ? "border-red-500" : ""}`}
                      required
                      />
                    {formErrors.binName && (
                      <p className="text-xs text-red-500 mt-1">Bin name is required</p>
                    )}
                  </div>
                 
                  <div>
                    <Label htmlFor="binAddress" className="flex items-center text-black mb-2">
                      Full Address <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Textarea
                      id="binAddress"
                      value={binAddress}
                      onChange={(e) => {
                        setBinAddress(e.target.value)
                        if (e.target.value) setFormErrors({...formErrors, binAddress: false})
                      }}
                      placeholder="E.g., Near Central Park Entrance, 5th Ave & 59th St"
                      className={`text-black ${formErrors.binAddress ? "border-red-500" : ""}`}
                      required
                    />
                    {formErrors.binAddress && (
                      <p className="text-xs text-red-500 mt-1">Address is required</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="binDescription" className="flex items-center text-black mb-2">
                      Description (Optional)
                    </Label>
                    <Textarea
                      id="binDescription"
                      value={binDescription}
                      onChange={(e) => setBinDescription(e.target.value)}
                      placeholder="E.g., Green plastic bin, located next to the bench"
                      className='text-black'
                    />
                  </div>
                </div>
                
                <div className="mt-6 flex justify-between">
                  <Button
                    type="button"
                    onClick={goToPreviousStep}
                    variant="outline"
                    className="text-black"
                  >
                    Back
                  </Button>
                  
                  <Button
                    type="button"
                    onClick={goToNextStep}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}
            
            {/* Step 3: Location */}
            {formStep === 3 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-700 mb-3">Location</h2>
                
                <div>
                  {locationStatus === "success" ? (
                    <div className="mb-4">
                      <div className="flex items-center text-green-700 mb-2 bg-green-50 p-2 rounded-md border border-green-100">
                        <Check className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium">Location captured successfully</span>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-md border border-gray-100 mb-3">
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-gray-500">Latitude</p>
                            <p className="text-sm font-mono font-medium text-gray-600">{location.lat.toFixed(6)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Longitude</p>
                            <p className="text-sm font-mono font-medium text-gray-600">{location.lng.toFixed(6)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 shadow-inner">
                        <MapWithNoSSR
                          latitude={location.lat}
                          longitude={location.lng}
                          accuracy={10}
                        />
                      </div>
                    </div>
                  ) : locationStatus === "loading" ? (
                    <div className="flex items-center bg-blue-50 p-4 rounded-md border border-blue-100 mb-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-600 mr-3"></div>
                      <span className="text-sm text-blue-800">Getting your location...</span>
                    </div>
                  ) : locationStatus === "error" ? (
                    <div className="flex items-center bg-red-50 p-4 rounded-md border border-red-100 mb-4">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-red-800">Location error</span>
                        <p className="text-xs text-red-700 mt-1">{locationError}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 p-5 rounded-lg mb-4 text-center border border-blue-100">
                      <MapPin className="h-10 w-10 text-blue-500 mx-auto mb-3" />
                      <p className="text-sm text-blue-800 font-medium mb-1">Location Required</p>
                      <p className="text-xs text-blue-700">Please capture your current location to continue</p>
                    </div>
                  )}
                  
                  <Button
                    type="button"
                    onClick={getCurrentLocation}
                    className="w-full flex items-center justify-center bg-blue-600 hover:bg-blue-700 mb-2"
                    disabled={locationStatus === "loading"}
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    {locationStatus === "success" ? "Update Location" : "Get Current Location"}
                  </Button>
                  
                  {formErrors.location && (
                    <p className="text-xs text-red-500 mb-4">Location is required</p>
                  )}
                  
                  <div className="text-xs text-gray-500 mb-6">
                    Please ensure you're at the bin's location when capturing coordinates for accurate mapping.
                  </div>
                  
                  <div className="mt-6 flex justify-between">
                    <Button
                      type="button"
                      onClick={goToPreviousStep}
                      variant="outline"
                      className="text-black"
                    >
                      Back
                    </Button>
                    
                    <Button
                      type="submit"
                      className="bg-green-600 hover:bg-green-700"
                      disabled={isSubmitting || locationStatus !== "success"}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Report'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
            )}
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}