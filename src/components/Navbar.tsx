'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Leaf } from 'lucide-react'
import UserMenu from './UserMenu';

interface NavbarProps {
  onLoginClick?: () => void;
  onSignupClick?: () => void;
}

const Navbar = ({ onLoginClick, onSignupClick }: NavbarProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  // Handle scroll event to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-sm shadow-md py-2' 
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Leaf className="h-7 w-7 text-[#4CAF50] mr-2" />
          <span className={`text-xl font-bold ${isScrolled ? 'text-green-700' : 'text-green-50'}`}>
            BIN<span className="font-normal italic text-green-500">track</span>
          </span>
        </Link>

        {/* Desktop Navigation - Only Login and Signup buttons */}
        <div className="hidden md:flex items-center space-x-3">
          <button
            onClick={onLoginClick}
            className={`px-4 py-2 rounded-md ${
              isScrolled 
                ? 'hover:bg-gray-100' 
                : 'hover:bg-white/10'
            } transition-all`}
          >
            <span className={isScrolled ? 'text-gray-800' : 'text-white'}>Login</span>
          </button>
          <button
            onClick={onSignupClick}
            className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Sign Up
          </button>
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden p-2 rounded-md focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            className={`w-6 h-6 ${isScrolled ? 'stroke-gray-800' : 'stroke-white'}`}
          >
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation - Only Login and Signup buttons */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white shadow-lg absolute w-full">
          <div className="px-4 py-3 space-y-3">
            <div className="pt-2 pb-3">
              <button
                onClick={() => {
                  onLoginClick?.();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2 px-4 mb-2 text-gray-800 hover:bg-gray-50 rounded-md text-left"
              >
                Login
              </button>
              <button
                onClick={() => {
                  onSignupClick?.();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replace your Login/Sign Up button with the UserMenu */}
      <div className="flex-shrink-0">
        <UserMenu />
      </div>
    </nav>
  );
};

export default Navbar;