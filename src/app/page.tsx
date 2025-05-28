'use client';

import { useEffect, useState, ComponentProps } from 'react';
import Navbar from '../components/Navbar';
import styles from '../styles/Home.module.css';
import Image from "next/image";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Leaf } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';

// Feature data
const features = [
  {
    title: "Locate Nearby Bins",
    description: "Our interactive map shows all verified waste bins in your area.",
    icon: "🗺️"
  },
  {
    title: "Report New Bins",
    description: "Contribute to the community by reporting new bin locations.",
    icon: "📍"
  },
  {
    title: "Earn Rewards",
    description: "Get rewards for responsible waste disposal and reporting.",
    icon: "🏆"
  },
];

type NavbarWithAuthProps = ComponentProps<typeof Navbar> & {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
};

const NavbarWithAuth = Navbar as React.ComponentType<NavbarWithAuthProps>;

export default function Home() {
  const router = useRouter();
  const { signIn } = useAuth();
  
  const handleGetStarted = () => {
    router.push('/home');
  };

  const handleAuth = () => {
    router.push('/auth/signin');
  };

  return (
    <main className="min-h-screen">
      {/* Header Navigation */}
      <nav className="bg-white shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
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
                <span className="text-gray-800">track</span>
              </h1>
            </motion.div>
          </Link>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="\home" className="text-gray-700 hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors">
                  Home
                </a>
               
                <a href="\map" className="text-gray-500 hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors">
                  Locate Bins
                </a>
                <a href="\report" className="text-gray-500 hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors">
                  Submit Bins
                </a>
                <a href="\rewards" className="text-gray-500 hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors">
                  Rewards
                </a>
                <a href="\community" className="text-gray-500 hover:text-green-600 px-3 py-2 text-sm font-medium transition-colors">
                  Community
                </a>
              </div>
            </div>
            
            {/* Login/Sign Up Button */}
            <div className="flex-shrink-0">
              <button 
                onClick={handleAuth}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Login/Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image Container */}
        <div className="absolute inset-0 z-0">
          {/* Replace this div with your background image */}
          <div className="w-full h-full bg-gradient-to-br from-blue-50 via-green-50 to-gray-100">
        {/* You can replace this with: */}
        <Image 
            src="/Rectangle 59.png" 
            alt="Background" 
            fill 
            className="object-cover"
            priority
        />
          </div>
          {/* Overlay for text readability */}
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content with white background */}
        <div className="text-left bg-white bg-opacity-100 p-32  shadow-lg">
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-800 leading-tight mb-6">
            Smart Steps<br />
            Towards a<br />
            <span className="text-yellow-400">Cleaner</span> City
          </h1>
          
          <div className="mb-8">
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
          Sign up to track your efforts, earn<br />
          Eco-Coins, and take small steps toward<br />
          a cleaner, smarter city
            </p>
            <p className="text-lg text-gray-600 italic">
          —one task at a time.
            </p>
          </div>

            <button
            onClick={handleAuth}
            className="bg-transparent hover:bg-[#2E7D59] text-green-600 hover:text-white font-semibold py-3 px-8 border-2 border-green-600 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
            >
            Get Started
            </button>
        </div>

        {/* Right side - Image space */}
        <div className="hidden lg:block">
          {/* This space is for the right side of the image which shows the hand picking up plastic */}
          <div className="w-full h-96 bg-transparent">
            {/* The background image will show through here */}
          </div>
        </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">Our Features</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Making our cities cleaner through smart technology and community participation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100">
                <div className="text-center">
                  <span className="text-4xl mb-4 block">{feature.icon}</span>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-gray-50 to-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center mb-4">
                <span className="text-2xl font-bold text-green-600">
                  BIN<span className="font-normal italic text-gray-700">track</span>
                </span>
              </Link>
              <div className="flex space-x-4">
                <a href="#" className="bg-green-600 hover:bg-green-700 transition-colors text-white p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a href="#" className="bg-green-600 hover:bg-green-700 transition-colors text-white p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a href="#" className="bg-green-600 hover:bg-green-700 transition-colors text-white p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a href="#" className="bg-green-600 hover:bg-green-700 transition-colors text-white p-2 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4 text-gray-800">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about-us" className="text-gray-600 hover:text-green-600 transition-colors">About Us</Link></li>
                <li><Link href="/bin-locator" className="text-gray-600 hover:text-green-600 transition-colors">Bin Locator</Link></li>
                <li><Link href="/eco-challenges" className="text-gray-600 hover:text-green-600 transition-colors">Eco Challenges</Link></li>
                <li><Link href="/reviews" className="text-gray-600 hover:text-green-600 transition-colors">BINTrack Reviews</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4 text-gray-800">Get Involved</h4>
              <ul className="space-y-2">
                <li><Link href="/volunteer" className="text-gray-600 hover:text-green-600 transition-colors">Volunteer With Us</Link></li>
                <li><Link href="/report-bin" className="text-gray-600 hover:text-green-600 transition-colors">Report a Bin</Link></li>
                <li><Link href="/cleanup" className="text-gray-600 hover:text-green-600 transition-colors">Join a Cleanup</Link></li>
                <li><Link href="/share-story" className="text-gray-600 hover:text-green-600 transition-colors">Share Your Story</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4 text-gray-800">Support & Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/faqs" className="text-gray-600 hover:text-green-600 transition-colors">FAQs</Link></li>
                <li><Link href="/contact-us" className="text-gray-600 hover:text-green-600 transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="text-gray-600 hover:text-green-600 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-gray-600 hover:text-green-600 transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-gray-200">
          <p className="text-center text-gray-500">Copyright © 2025 BINTrack. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}