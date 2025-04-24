'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import styles from '../styles/Home.module.css';
import Image from "next/image";
import { signIn } from 'next-auth/react';


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
    signIn('google');
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

  
    </main>
  );
}
// In your page.tsx file, update the hero and feature sections to use more vibrant colors:

