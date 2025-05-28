'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile, X, Users } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useAuth } from '@/lib/auth';
import { pusherService } from '@/lib/pusher';
import Image from 'next/image';
import { MessageCircle } from 'lucide-react';

interface Message {
  id: string;
  userId: string;
  userName: string;
  userImage: string;
  content: string;
  timestamp: string;
}

interface OnlineUser {
  id: string;
  name: string;
  image: string;
  lastSeen: Date;
}

interface GlobalChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalChat({ isOpen, onClose }: GlobalChatProps) {
  const { session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && session?.user) {
      // Connect to Pusher
      const pusher = pusherService.connect();
      const channel = pusherService.subscribeToChannel('global-chat');

      setIsConnected(true);

      // Listen for new messages
      channel.bind('new-message', (data: Message) => {
        setMessages(prev => [...prev, data]);
      });

      // Listen for user joining
      channel.bind('user-joined', (user: OnlineUser) => {
        setOnlineUsers(prev => {
          const exists = prev.find(u => u.id === user.id);
          if (!exists) {
            return [...prev, user];
          }
          return prev;
        });
      });

      // Listen for user leaving
      channel.bind('user-left', (userId: string) => {
        setOnlineUsers(prev => prev.filter(u => u.id !== userId));
      });

      // Announce user joined
      const currentUser = {
        id: session.user.id,
        name: session.user.name || 'Anonymous',
        image: session.user.image || '/avatars/default.jpg',
        lastSeen: new Date()
      };

      // Add current user to online list
      setOnlineUsers(prev => {
        const exists = prev.find(u => u.id === currentUser.id);
        if (!exists) {
          return [...prev, currentUser];
        }
        return prev;
      });

      // Notify others that user joined
      fetch('/api/pusher/user-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'joined', user: currentUser })
      });

      return () => {
        // Notify others that user left
        fetch('/api/pusher/user-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'left', user: session.user.id })
        });

        pusherService.unsubscribeFromChannel('global-chat');
        setIsConnected(false);
      };
    }
  }, [isOpen, session]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showEmojiPicker]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !session?.user || !isConnected) return;

    try {
      await fetch('/api/pusher/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: newMessage.trim(),
          userId: session.user.id,
          userName: session.user.name || 'Anonymous',
          userImage: session.user.image || '/avatars/default.jpg'
        })
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = newMessage.substring(0, start) + emojiData.emoji + newMessage.substring(end);
      setNewMessage(newText);
      
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emojiData.emoji.length;
        textarea.focus();
      }, 0);
    } else {
      setNewMessage(prev => prev + emojiData.emoji);
    }
    
    // Optionally close picker after selection
    // setShowEmojiPicker(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isConnected ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <MessageCircle className={`h-5 w-5 ${
                isConnected ? 'text-green-600' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Global Chat</h2>
              <p className="text-sm text-gray-500">
                {isConnected ? `${onlineUsers.length} users online` : 'Connecting...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Online Users Sidebar */}
          <div className="w-64 border-r border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Online ({onlineUsers.length})</span>
            </div>
            <div className="space-y-2">
              {onlineUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full overflow-hidden">
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-green-500 flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.id === session?.user?.id ? 'You' : user.name}
                    </p>
                    <p className="text-xs text-gray-500">Online</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwnMessage = message.userId === session?.user?.id;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                        {message.userImage ? (
                          <Image
                            src={message.userImage}
                            alt={message.userName}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-green-500 flex items-center justify-center">
                            <span className="text-xs font-bold text-white">
                              {message.userName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className={`flex-1 max-w-xs ${isOwnMessage ? 'text-right' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium text-gray-700 ${isOwnMessage ? 'order-2' : ''}`}>
                            {isOwnMessage ? 'You' : message.userName}
                          </span>
                          <span className={`text-xs text-gray-500 ${isOwnMessage ? 'order-1' : ''}`}>
                            {formatTime(message.timestamp)}
                          </span>
                        </div>
                        <div
                          className={`inline-block p-3 rounded-2xl ${
                            isOwnMessage
                              ? 'bg-green-500 text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-900 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input with Emoji Picker */}
            <div className="p-4 border-t border-gray-200 relative">
              {/* Advanced Emoji Picker */}
              {showEmojiPicker && (
                <div 
                  ref={emojiPickerRef}
                  className="absolute bottom-20 right-4 z-10"
                >
                  <EmojiPicker
                    onEmojiClick={handleEmojiClick}
                    theme={Theme.LIGHT}
                    width={350}
                    height={400}
                    previewConfig={{
                      showPreview: false
                    }}
                    searchPlaceHolder="Search emojis..."
                    emojiStyle="native"
                  />
                </div>
              )}

              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={isConnected ? "Type your message... 😊" : "Connecting..."}
                    disabled={!isConnected}
                    className="w-full resize-none border border-gray-300 text-black rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                    rows={1}
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                  />
                  
                  {/* Emoji Button */}
                  <button
                    onClick={toggleEmojiPicker}
                    className={`absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                      showEmojiPicker 
                        ? 'text-green-500' 
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                    type="button"
                  >
                    <Smile className="h-5 w-5" />
                  </button>
                </div>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !isConnected}
                  className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white p-3 rounded-xl transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}