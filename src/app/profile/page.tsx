'use client';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { useAuth } from '@/lib/auth';
import EditProfileModal from '@/components/profile/EditProfileModal';
import EditPersonalInfoModal from '@/components/profile/EditPersonalInfoModal';
import ProtectedRoute from '@/components/ProtectedRoute';

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

const ProfilePage = () => {
  const { session, isAuthenticated, isLoading } = useAuth();
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
  
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isPersonalInfoModalOpen, setIsPersonalInfoModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      // Extract first and last name from the full name
      const nameParts = session.user.name?.split(' ') || ['', ''];
      
      // Fetch user profile from API
      const fetchUserProfile = async () => {
        try {
          // Try to get user data from your API first
          const response = await fetch(`/api/users/${session.user.id}`);
          
          if (response.ok) {
            // If user exists in your database, use that data
            const userData = await response.json();
            setUserData(userData);
          } else {
            // If user doesn't exist yet, use session data with defaults
            setUserData({
              firstName: nameParts[0],
              lastName: nameParts.slice(1).join(' '),
              email: session.user.email || '',
              phone: '',
              location: '',
              postalCode: '',
              occupation: '',
              binsReported: 0,
              binsUtilized: 0,
              totalEcoCoins: 0,
              totalCoupons: 0,
              badge: 'Eco Newbie', // Default badge for new users
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Fallback to session data
          setUserData({
            firstName: nameParts[0],
            lastName: nameParts.slice(1).join(' '),
            email: session.user.email || '',
            phone: '',
            location: '',
            postalCode: '',
            occupation: '',
            binsReported: 0,
            binsUtilized: 0,
            totalEcoCoins: 0,
            totalCoupons: 0,
            badge: 'Eco Newbie',
          });
        } finally {
          setIsLoaded(true);
        }
      };
      
      fetchUserProfile();
    }
  }, [session, isAuthenticated]);

  const handleProfileUpdate = async (updatedData) => {
    try {
      // Update user data in your API
      const response = await fetch(`/api/users/${session?.user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      if (response.ok) {
        // Update local state with new data
        setUserData({
          ...userData,
          ...updatedData,
        });
        setIsProfileModalOpen(false);
        setIsPersonalInfoModalOpen(false);
      } else {
        console.error('Failed to update profile');
        // You could add error handling UI here
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      // You could add error handling UI here
    }
  };

  if (isLoading || !isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <>
        <Header/>
        <Head>
          <title>My Profile | BINtrack</title>
          <meta name="description" content="User profile on BINtrack" />
        </Head>

        <div className="min-h-screen bg-gray-50">
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
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                        <span className="text-2xl text-gray-400">{userData.firstName.charAt(0)}{userData.lastName.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h2 className="text-xl font-medium">{userData.firstName} {userData.lastName}</h2>
                    <p className="text-gray-500">{userData.occupation || 'Update your occupation'}</p>
                    <p className="text-gray-500 text-sm">{userData.location || 'Update your location'}</p>
                  </div>
                </div>
                <button 
                  className="text-green-600 border border-green-600 rounded px-3 py-1 text-sm flex items-center"
                  onClick={() => setIsProfileModalOpen(true)}
                >
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
                <button 
                  className="text-green-600 border border-green-600 rounded px-3 py-1 text-sm flex items-center"
                  onClick={() => setIsPersonalInfoModalOpen(true)}
                >
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
                  <p>{userData.phone || 'Not provided'}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 mb-1">Location</h4>
                  <p>{userData.location || 'Not provided'}</p>
                </div>
                <div>
                  <h4 className="text-sm text-gray-500 mb-1">Postal Code</h4>
                  <p>{userData.postalCode || 'Not provided'}</p>
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
                    <Link href="/rewards">
                      <button className="bg-green-600 text-white px-4 py-2 rounded text-sm">Redeem Now</button>
                    </Link>
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
            {/* Keep your existing footer code */}
          </footer>
        </div>

        {/* Edit Profile Modal */}
        {isProfileModalOpen && (
          <EditProfileModal 
            userData={userData}
            onClose={() => setIsProfileModalOpen(false)}
            onSave={handleProfileUpdate}
          />
        )}

        {/* Edit Personal Info Modal */}
        {isPersonalInfoModalOpen && (
          <EditPersonalInfoModal 
            userData={userData}
            onClose={() => setIsPersonalInfoModalOpen(false)}
            onSave={handleProfileUpdate}
          />
        )}
      </>
    </ProtectedRoute>
  );
};

export default ProfilePage;