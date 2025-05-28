'use client';

import { useState } from 'react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

interface Author {
  id: string;
  name: string;
  image: string;
}

interface Comment {
  id: string;
  author: Author;
  content: string;
  createdAt: string;
}

interface Post {
  id: string;
  author: Author;
  content: string;
  imageUrl: string;
  createdAt: string;
  likes: number;
  comments: Comment[];
}

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onAddComment: (postId: string, comment: string) => void;
}

export default function PostCard({ post, onLike, onAddComment }: PostCardProps) {
  const [showAllComments, setShowAllComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    if (!isLiked) {
      onLike(post.id);
      setIsLiked(true);
    }
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(post.id, newComment);
      setNewComment('');
    }
  };

  const visibleComments = showAllComments ? post.comments : post.comments.slice(0, 2);
  const hasMoreComments = post.comments.length > 2 && !showAllComments;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Post header */}
      <div className="px-4 py-3 flex items-center">
        <div className="relative h-10 w-10 rounded-full overflow-hidden mr-3">
          <Image 
            src={post.author.image || '/avatars/default.jpg'} 
            alt={post.author.name}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
      
      {/* Post content */}
      <div className="px-4 py-2">
        <p className="text-gray-800">{post.content}</p>
      </div>
      
      {/* Post image */}
      {post.imageUrl && (
        <div className="relative h-96 w-full">
          <Image 
            src={post.imageUrl} 
            alt="Post image" 
            fill
            className="object-cover"
          />
        </div>
      )}
      
      {/* Post actions */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <button 
          onClick={handleLike}
          className={`flex items-center ${isLiked ? 'text-green-600' : 'text-gray-500'} hover:text-green-600`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-1" fill={isLiked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{post.likes} {post.likes === 1 ? 'like' : 'likes'}</span>
        </button>
        <div className="text-gray-500">
          <span>{post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}</span>
        </div>
      </div>
      
      {/* Comments section */}
      {post.comments.length > 0 && (
        <div className="px-4 py-2 bg-gray-50">
          {visibleComments.map(comment => (
            <div key={comment.id} className="mb-2 pb-2 border-b border-gray-100 last:border-0">
              <div className="flex items-start">
                <div className="relative h-8 w-8 rounded-full overflow-hidden mr-2">
                  <Image 
                  src={comment.author.image || '/avatars/default.jpg'} 
                  alt={comment.author.name}
                  fill
                  className="object-cover"
                  priority
                  />
                </div>
                <div>
                  <div className="bg-gray-100 rounded-lg px-3 py-2">
                    <h4 className="font-semibold text-sm text-gray-900">{comment.author.name}</h4>
                    <p className="text-sm text-gray-800">{comment.content}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {hasMoreComments && (
            <button 
              className="text-sm text-green-600 hover:text-green-700 mb-2"
              onClick={() => setShowAllComments(true)}
            >
              View all {post.comments.length} comments
            </button>
          )}
        </div>
      )}
      
      {/* Add comment form */}
      <form onSubmit={handleSubmitComment} className="px-4 py-3 border-t border-gray-100 flex">
        <input
          type="text"
          placeholder="Add a comment..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-green-500"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <button 
          type="submit"
          className="ml-2 text-green-600 font-medium text-sm"
          disabled={!newComment.trim()}
        >
          Post
        </button>
      </form>
    </div>
  );
}