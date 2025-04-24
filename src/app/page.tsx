'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import styles from '../styles/Home.module.css';
import Image from "next/image";
import { signIn } from 'next-auth/react';
import Link from 'next/link';


// Dynamically import ThreeScene component with no SSR
const ThreeSceneWithNoSSR = dynamic(
  () => import('../components/ThreeScene'),
  { ssr: false }
);


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
  // Add more features as needed
];

export default function Home() {
  const [coins, setCoins] = useState([]);
  const handleGetStarted = () => {
    signIn('google', { callbackUrl: '/home' });
  };

  // Create floating coins
  useEffect(() => {
    const initialCoins = Array.from({ length: 5 }, (_, i) => ({
      id: `initial-${i}`,
      style: {
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 5}s`
      }
    }));
    
    setCoins(initialCoins);
    
    const interval = setInterval(() => {
      const newCoin = {
        id: `coin-${Date.now()}`,
        style: {
          left: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 2}s`
        }
      };
      
      setCoins(prev => [...prev, newCoin]);
      
      setTimeout(() => {
        setCoins(prev => prev.filter(coin => coin.id !== newCoin.id));
      }, 8000);
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <main className={styles.main}>
      <div className={styles.canvasContainer}>
        <ThreeSceneWithNoSSR />
      </div>

      <Navbar />
      
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1>Smart Waste Management</h1>
          <p>Making our cities cleaner through smart technology and community participation</p>
          <div className={styles.ctaButtons}>
          <button
              onClick={handleGetStarted}
              className={`${styles.secondaryBtn} hover:bg-gray-100 transform hover:scale-105 transition-all duration-300 border-2 border-gray-300 text-gray-700 font-bold py-3 px-6 rounded-lg shadow-md`}

            >
              Get Started
            </button>
          
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <h2>Our Features</h2>
        <div className={styles.featureGrid}>
          {features.map((feature, index) => (
            <div key={index} className={styles.featureCard}>
              <span className={styles.featureIcon}>{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-b from-transparent to-black-10/50 mt-12 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold text-green-700">BIN<span className="font-normal italic text-green-600">track</span></span>
              </Link>
              <div className="flex space-x-4 mt-4">
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
              <h4 className="text-lg font-medium mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/about-us" className="text-white-500 hover:text-green-600">About Us</Link></li>
                <li><Link href="/bin-locator" className="text-white-500 hover:text-green-600">Bin Locator</Link></li>
                <li><Link href="/eco-challenges" className="text-white-500 hover:text-green-600">Eco Challenges</Link></li>
                <li><Link href="/reviews" className="text-white-500 hover:text-green-600">BINTrack Reviews</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4">Get Involved</h4>
              <ul className="space-y-2">
                <li><Link href="/volunteer" className="text-white-500 hover:text-green-600">Volunteer With Us</Link></li>
                <li><Link href="/report-bin" className="text-white-500 hover:text-green-600">Report a Bin</Link></li>
                <li><Link href="/cleanup" className="text-white-500 hover:text-green-600">Join a Cleanup</Link></li>
                <li><Link href="/share-story" className="text-white-500 hover:text-green-600">Share Your Story</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-4">Support & Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/faqs" className="text-white-500 hover:text-green-600">FAQs</Link></li>
                <li><Link href="/contact-us" className="text-white-500 hover:text-green-600">Contact Us</Link></li>
                <li><Link href="/privacy" className="text-white-500 hover:text-green-600">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-white-500 hover:text-green-600">Terms & Conditions</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-white-200/30">
          <p className="text-center text-white-500">Copyright © 2025 BINTrack. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}