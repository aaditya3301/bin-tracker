'use client';

import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import PostCard from '../../components/community/PostCard';
import CreatePostModal from '../../components/community/CreatePostModal';
import GlobalChat from '../../components/community/GlobalChat';
import styles from '../../styles/Community.module.css';
import { Header } from '../../components/Header';
import ProtectedRoute from '@/components/ProtectedRoute';
import { MessageCircle, Users } from 'lucide-react';

// Temporary mock data
const MOCK_POSTS = [
  {
    id: '1',
    author: {
      id: 'user1',
      name: 'Eco Warrior',
      image: '/profile photo 1.webp',
    },
    content: 'Just cleaned up this area and found a hidden bin! #CleanupCrew',
    imageUrl: '/cleaning 1.jpg',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    likes: 24,
    comments: [
      {
        id: 'c1',
        author: { id: 'user2', name: 'Green Thumb', image: '/profile photo 2.jpg' },
        content: 'Amazing work! This area looks much better now.',
        createdAt: new Date(Date.now() - 1800000).toISOString(),
      }
    ]
  },
  {
    id: '2',
    author: {
      id: 'user3',
      name: 'Recycling Hero',
      image: '/profile photo 3.jpg',
    },
    content: 'Our community came together for a weekend bin installation project! #TeamWork',
    imageUrl: '/cleaning 2.png',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    likes: 42,
    comments: [
      {
        id: 'c2',
        author: { id: 'user4', name: 'Earth Friend', image: '/profile photo 4.jpg' },
        content: 'This is inspiring! Would love to join next time.',
        createdAt: new Date(Date.now() - 43200000).toISOString(),
      }
    ]
  }
];

export default function CommunityPage() {
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const router = useRouter();

  const handleCreatePost = (newPost: { content: string; imageUrl?: string }) => {
    // In a real app, you would send this to your API
    const post = {
      id: `post-${Date.now()}`,
      author: {
        id: 'currentUser',
        name: 'You',
        image: '/avatars/default.jpg',
      },
      createdAt: new Date().toISOString(),
      likes: 0,
      comments: [],
      content: newPost.content,
      imageUrl: newPost.imageUrl || ''
    };
    
    setPosts([post, ...posts]);
    setIsModalOpen(false);
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, likes: post.likes + 1 } : post
    ));
  };

  const handleAddComment = (postId: string, comment: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const newComment = {
          id: `comment-${Date.now()}`,
          author: { id: 'currentUser', name: 'You', image: '/avatars/default.jpg' },
          content: comment,
          createdAt: new Date().toISOString(),
        };
        return {
          ...post,
          comments: [...post.comments, newComment]
        };
      }
      return post;
    }));
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-gray-100">
        <Header/>
        
        <div className="max-w-4xl mx-auto pt-20 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Community</h1>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsChatOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                Global Chat
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Post
              </button>
            </div>
          </div>
          
          {/* Chat Notification Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium text-blue-900">Connect with the Community</h3>
                  <p className="text-sm text-blue-700">Chat with fellow eco-warriors in real-time!</p>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
              >
                Join Chat
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            {posts.map(post => (
              <PostCard 
                key={post.id} 
                post={post} 
                onLike={handleLike}
                onAddComment={handleAddComment}
              />
            ))}
          </div>
        </div>

        {/* Floating Chat Button */}
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-40"
          title="Open Global Chat"
        >
          <MessageCircle className="h-6 w-6" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        </button>

        {isModalOpen && (
          <CreatePostModal 
            onClose={() => setIsModalOpen(false)} 
            onCreatePost={handleCreatePost}
          />
        )}

        <GlobalChat 
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
        />
      </main>
    </ProtectedRoute>
    
  );
}