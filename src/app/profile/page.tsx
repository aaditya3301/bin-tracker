'use client';
import React, { useEffect, useState } from 'react';
import { NextPage } from 'next';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  postalCode: string;
  occupation: string;
  binsReported: number;
  binsUtilized: number;
  totalEcoCoins: number;
  totalCoupons: number;
  badge: string;
}

const ProfilePage: NextPage = () => {
  // Remove: const { data: session, status } = useSession();
  
  // Create mock session data instead
  const session = {
    user: {
      name: "John Doe",
      email: "johndoe@example.com",
      image: null
    }
  };
  
  const router = useRouter();
  const [userData, setUserData] = useState<UserData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    postalCode: '',
    occupation: '',
    binsReported: 0,
    binsUtilized: 0,
    totalEcoCoins: 0,
    totalCoupons: 0,
    badge: '',
  });

  useEffect(() => {
    // Remove authentication redirect
    // if (status === 'unauthenticated') {
    //   router.push('/home');
    // }

    // Fetch user data from API or use session data
    // Replace with direct setting of data
    // if (status === 'authenticated' && session?.user) {
    
    // Just use the mock session data we created
    if (session?.user) {
      const nameParts = session.user.name?.split(' ') || ['', ''];
      
      // In a real app, you would fetch the complete user profile from your API
      // This is a mock example using session data and default values
      setUserData({
        firstName: nameParts[0],
        lastName: nameParts[1] || '',
        email: session.user.email || '',
        phone: '(+91) 8888 9876 44',
        location: 'Delhi, India',
        postalCode: '226022',
        occupation: 'Product Designer',
        binsReported: 12,
        binsUtilized: 9,
        totalEcoCoins: 1240,
        totalCoupons: 2,
        badge: 'Community Hero',
      });
    }
  }, [session]); // Changed dependency from [status, session, router] to just [session]

  // Remove loading state check
  // if (status === 'loading') {
  //   return <div className="flex justify-center items-center h-screen">Loading...</div>;
  // }

  return (
    <>
      <Head>
        <title>My Profile | BINtrack</title>
        <meta name="description" content="User profile on BINtrack" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold text-green-700">BIN<span className="font-normal italic text-green-600">track</span></span>
              </Link>
              <nav className="hidden md:flex ml-10 space-x-8">
                <Link href="/home" className="text-gray-500 hover:text-gray-900">Home</Link>
                <Link href="/about" className="text-gray-500 hover:text-gray-900">About</Link>
                <Link href="/locate-bins" className="text-gray-500 hover:text-gray-900">Locate Bins</Link>
                <Link href="/submit-bins" className="text-gray-500 hover:text-gray-900">Submit Bins</Link>
                <Link href="/rewards" className="text-gray-500 hover:text-gray-900">Rewards</Link>
                <Link href="/contact" className="text-gray-500 hover:text-gray-900">Contact</Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-500 hover:text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button className="text-gray-500 hover:text-gray-900">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-green-800 mb-8">My Profile</h1>

          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative h-16 w-16 rounded-full overflow-hidden">
                  {session?.user?.image ? (
                    <Image 
                      src={session.user.image} 
                      alt="Profile" 
                      layout="fill" 
                      objectFit="cover" 
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                      <span className="text-2xl text-gray-400">{userData.firstName.charAt(0)}{userData.lastName.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <h2 className="text-xl font-medium">{userData.firstName} {userData.lastName}</h2>
                  <p className="text-gray-500">{userData.occupation}</p>
                  <p className="text-gray-500 text-sm">{userData.location}</p>
                </div>
              </div>
              <button className="text-green-600 border border-green-600 rounded px-3 py-1 text-sm flex items-center">
                Edit
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Personal Information</h3>
              <button className="text-green-600 border border-green-600 rounded px-3 py-1 text-sm flex items-center">
                Edit
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm text-gray-500 mb-1">First Name</h4>
                <p>{userData.firstName}</p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500 mb-1">Last Name</h4>
                <p>{userData.lastName}</p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500 mb-1">Email Address</h4>
                <p>{userData.email}</p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500 mb-1">Phone Number</h4>
                <p>{userData.phone}</p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500 mb-1">Location</h4>
                <p>{userData.location}</p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500 mb-1">Postal Code</h4>
                <p>{userData.postalCode}</p>
              </div>
            </div>
          </div>

          {/* Statistics and Achievements Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Activity */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-medium">User Activity</h3>
                <button className="text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
              <div className="p-4 grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm text-gray-500 mb-2">Bins Reported</h4>
                  <p className="text-3xl font-medium text-green-600">{userData.binsReported}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 mb-2">Bins Utilized</h4>
                  <p className="text-3xl font-medium text-green-600">{userData.binsUtilized}</p>
                </div>
              </div>
            </div>

            {/* Coins & Rewards */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-medium">Coins & Rewards</h3>
                <button className="text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <h4 className="text-sm text-gray-500 mb-2">Total Eco-Coins Earned</h4>
                  <p className="text-3xl font-medium text-green-600">{userData.totalEcoCoins}</p>
                </div>
                <div className="mb-4">
                  <h4 className="text-sm text-gray-500 mb-2">Total Coupons Earned</h4>
                  <p className="text-3xl font-medium text-green-600">{userData.totalCoupons}</p>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <button className="text-green-600 text-sm">View coin history</button>
                  <button className="bg-green-600 text-white px-4 py-2 rounded text-sm">Redeem Now</button>
                </div>
              </div>
            </div>
          </div>

          {/* Achievements and Wallet Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* Achievements */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-medium">Achievements</h3>
                <button className="text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <h4 className="text-sm text-gray-500 mb-2">Badge Unlocked</h4>
                <p className="text-xl font-medium text-green-600">{userData.badge}</p>
              </div>
            </div>

            {/* Wallet */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 flex justify-between items-center">
                <h3 className="text-lg font-medium">Access Your Wallet</h3>
                <button className="bg-green-600 text-white p-2 rounded-md">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white mt-12 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <Link href="/" className="flex items-center">
                  <span className="text-2xl font-bold text-green-700">BIN<span className="font-normal italic text-green-600">track</span></span>
                </Link>
                <div className="flex space-x-4 mt-4">
                  <a href="#" className="bg-green-600 text-white p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </a>
                  <a href="#" className="bg-green-600 text-white p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                  <a href="#" className="bg-green-600 text-white p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </a>
                  <a href="#" className="bg-green-600 text-white p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </a>
                </div>
              </div>
              <div>
                <h4 className="text-lg font-medium mb-4">Company</h4>
                <ul className="space-y-2">
                  <li><Link href="/about-us" className="text-gray-500 hover:text-green-600">About Us</Link></li>
                  <li><Link href="/bin-locator" className="text-gray-500 hover:text-green-600">Bin Locator</Link></li>
                  <li><Link href="/eco-challenges" className="text-gray-500 hover:text-green-600">Eco Challenges</Link></li>
                  <li><Link href="/reviews" className="text-gray-500 hover:text-green-600">BINTrack Reviews</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-medium mb-4">Get Involved</h4>
                <ul className="space-y-2">
                  <li><Link href="/volunteer" className="text-gray-500 hover:text-green-600">Volunteer With Us</Link></li>
                  <li><Link href="/report-bin" className="text-gray-500 hover:text-green-600">Report a Bin</Link></li>
                  <li><Link href="/cleanup" className="text-gray-500 hover:text-green-600">Join a Cleanup</Link></li>
                  <li><Link href="/share-story" className="text-gray-500 hover:text-green-600">Share Your Story</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-medium mb-4">Support & Legal</h4>
                <ul className="space-y-2">
                  <li><Link href="/faqs" className="text-gray-500 hover:text-green-600">FAQs</Link></li>
                  <li><Link href="/contact-us" className="text-gray-500 hover:text-green-600">Contact Us</Link></li>
                  <li><Link href="/privacy" className="text-gray-500 hover:text-green-600">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-gray-500 hover:text-green-600">Terms & Conditions</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-gray-500">Copyright © 2025 BINTrack. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default ProfilePage;