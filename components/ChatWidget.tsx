import React, { useState, useRef, useEffect, memo } from 'react';
import type { Conversation } from '../types';

interface ChatWidgetProps {
  conversation: Conversation;
  currentUserRole: 'customer' | 'seller';
  otherUserName: string;
  onClose: () => void;
  onSendMessage: (messageText: string) => void;
  typingStatus: { conversationId: string; userRole: 'customer' | 'seller' } | null;
  onUserTyping: (conversationId: string, userRole: 'customer' | 'seller') => void;
  onMarkMessagesAsRead: (conversationId: string, readerRole: 'customer' | 'seller') => void;
  onFlagContent: (type: 'vehicle' | 'conversation', id: number | string) => void;
}

const EMOJIS = ['😀', '😂', '👍', '❤️', '🙏', '😊', '🔥', '🎉', '🚗', '🤔', '👋', '👀'];

const ReadReceiptIcon: React.FC<{ isRead: boolean }> = ({ isRead }) => (
    isRead ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block ml-1 text-blue-400" viewBox="0 0 24 24" fill="none">
            <path d="M1.5 12.5L5.5 16.5L11.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.5 12.5L12.5 16.5L22.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block ml-1 text-brand-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
    )
);

const TypingIndicator: React.FC<{ name: string }> = ({ name }) => (
    <div className="flex items-start">
        <div className="rounded-xl px-4 py-3 max-w-lg bg-brand-gray-200 dark:bg-brand-gray-700 text-brand-gray-800 dark:text-brand-gray-200 flex items-center space-x-2">
            <span className="text-sm font-medium">{name} is typing</span>
            <div className="w-1.5 h-1.5 bg-brand-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-brand-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-brand-gray-500 rounded-full animate-bounce"></div>
        </div>
    </div>
);

const ChatWidget: React.FC<ChatWidgetProps> = ({ conversation, currentUserRole, otherUserName, onClose, onSendMessage, typingStatus, onUserTyping, onMarkMessagesAsRead, onFlagContent }) => {
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation.messages, typingStatus]);
  
  useEffect(() => {
    onMarkMessagesAsRead(conversation.id, currentUserRole);
  }, [conversation, onMarkMessagesAsRead, currentUserRole]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
            setShowEmojiPicker(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    onUserTyping(conversation.id, currentUserRole);
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleEmojiClick = (emoji: string) => {
    setInputText(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 400); // Wait for animation
  };

  const senderType = currentUserRole === 'customer' ? 'user' : 'seller';
  const otherUserRole = currentUserRole === 'customer' ? 'seller' : 'customer';

  if (isMinimized) {
    return (
        <div className="fixed bottom-0 right-4 md:right-8 z-50">
            <button
                onClick={() => setIsMinimized(false)}
                className="w-80 h-12 bg-brand-blue text-white rounded-t-lg shadow-2xl flex items-center justify-between px-4 font-bold animate-slide-in-up"
            >
                <span>{conversation.vehicleName}</span>
                <div className="flex items-center gap-2">
                    <button onClick={handleClose} className="p-1 hover:bg-white/20 rounded-full">&times;</button>
                </div>
            </button>
        </div>
    );
  }

  return (
    <div className={`fixed bottom-0 right-4 md:right-8 z-50 w-full max-w-sm h-[60vh] flex flex-col bg-white dark:bg-brand-gray-800 rounded-t-lg shadow-2xl ${isExiting ? 'animate-slide-out-down' : 'animate-slide-in-up'}`}>
        {/* Header */}
        <div className="p-3 border-b border-brand-gray-200 dark:border-brand-gray-700 flex justify-between items-center bg-brand-gray-50 dark:bg-brand-gray-800 rounded-t-lg cursor-pointer" onClick={() => setIsMinimized(true)}>
            <div>
                <h3 className="text-sm font-bold text-brand-gray-800 dark:text-brand-gray-100 truncate">{conversation.vehicleName}</h3>
                <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Chat with {otherUserName}</p>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }} className="p-1 text-brand-gray-500 hover:bg-black/10 dark:hover:bg-white/10 rounded-full" aria-label="Minimize chat">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleClose(); }} className="p-1 text-brand-gray-500 hover:bg-black/10 dark:hover:bg-white/10 rounded-full" aria-label="Close chat">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>

        {/* Messages */}
        <div className="flex-grow p-4 overflow-y-auto bg-brand-gray-100 dark:bg-brand-gray-900 space-y-4">
            {conversation.messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === senderType ? 'items-end' : 'items-start'}`}>
                    {msg.sender === 'system' && <div className="text-center text-xs text-brand-gray-500 dark:text-brand-gray-400 italic py-2 w-full">{msg.text}</div>}
                    {msg.sender !== 'system' && (
                        <>
                            <div className={`px-4 py-3 max-w-xs ${ msg.sender === senderType ? 'bg-brand-blue text-white rounded-l-xl rounded-t-xl' : 'bg-white dark:bg-brand-gray-700 text-brand-gray-800 dark:text-brand-gray-200 rounded-r-xl rounded-t-xl'}`}>
                                <p className="text-sm break-words">{msg.text}</p>
                            </div>
                            <div className="text-xs text-brand-gray-400 mt-1 px-1 flex items-center">
                                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                {msg.sender === senderType && <ReadReceiptIcon isRead={msg.isRead} />}
                            </div>
                        </>
                    )}
                </div>
            ))}
            {typingStatus?.conversationId === conversation.id && typingStatus?.userRole === otherUserRole && <TypingIndicator name={otherUserName} />}
            <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-brand-gray-200 dark:border-brand-gray-700 bg-white dark:bg-brand-gray-800 relative">
            {showEmojiPicker && (
                <div ref={emojiPickerRef} className="absolute bottom-full mb-2 w-full bg-white dark:bg-brand-gray-700 rounded-lg shadow-lg p-2 grid grid-cols-6 gap-2">
                    {EMOJIS.map(emoji => (
                        <button key={emoji} onClick={() => handleEmojiClick(emoji)} className="text-2xl hover:bg-brand-gray-200 dark:hover:bg-brand-gray-600 rounded-md p-1">
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
            <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                <button type="button" onClick={() => setShowEmojiPicker(p => !p)} className="p-2 text-brand-gray-500 hover:text-brand-gray-800 dark:hover:text-brand-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="flex-grow p-2 border border-brand-gray-300 dark:border-brand-gray-600 rounded-lg bg-white dark:bg-brand-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
                <button type="submit" className="bg-brand-blue text-white p-2 rounded-full hover:bg-brand-blue-dark disabled:bg-brand-gray-400" disabled={!inputText.trim()}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
            </form>
        </div>
    </div>
  );
};

export default memo(ChatWidget);