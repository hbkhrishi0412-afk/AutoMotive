import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Conversation } from '../types';

interface ChatModalProps {
  conversation: Conversation | undefined;
  vehicleName: string;
  onClose: () => void;
  onSendMessage: (messageText: string) => void;
  typingStatus: { conversationId: string; userRole: 'customer' | 'seller' } | null;
  onUserTyping: (conversationId: string, userRole: 'customer' | 'seller') => void;
  onMarkMessagesAsRead: (conversationId: string, readerRole: 'customer' | 'seller') => void;
}

const ReadReceiptIcon: React.FC<{ isRead: boolean }> = ({ isRead }) => (
    isRead ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block ml-1 text-blue-400" viewBox="0 0 24 24" fill="none">
            <path d="M1.5 12.5L5.5 16.5L11.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.5 12.5L12.5 16.5L22.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
    )
);

const TypingIndicator: React.FC = () => (
    <div className="flex items-start">
        <div className="rounded-xl px-4 py-3 max-w-xs lg:max-w-md bg-brand-gray dark:bg-brand-gray-dark text-gray-800 dark:text-gray-200 flex items-center space-x-1.5">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
        </div>
    </div>
);


const ChatModal: React.FC<ChatModalProps> = ({ conversation, vehicleName, onClose, onSendMessage, typingStatus, onUserTyping, onMarkMessagesAsRead }) => {
  const [userInput, setUserInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const messages = conversation?.messages || [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingStatus]);
  
  useEffect(() => {
    if (conversation) {
        onMarkMessagesAsRead(conversation.id, 'customer');
    }
  }, [conversation, onMarkMessagesAsRead]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value);
    // Even if conversation doesn't exist yet, we need an ID to signal typing.
    // The App component will create one for the first message. We can simulate that.
    const convId = conversation?.id || `temp-${Date.now()}`; // This won't work perfectly for first message but is a safe fallback
    if(conversation){
      onUserTyping(conversation.id, 'customer');
    }
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    onSendMessage(userInput);
    setUserInput('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-brand-gray-dark rounded-lg shadow-2xl w-full max-w-lg h-[80vh] flex flex-col">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-brand-gray-darker text-white rounded-t-lg">
          <h2 className="text-lg font-bold">Chat about {vehicleName}</h2>
          <button onClick={onClose} className="text-white text-2xl hover:text-gray-300">&times;</button>
        </div>

        <div className="flex-grow p-4 overflow-y-auto bg-brand-gray-light dark:bg-brand-gray-darker space-y-4">
          {messages.map((msg) => {
            if (msg.sender === 'system') {
                return (
                    <div key={msg.id} className="text-center text-xs text-gray-500 dark:text-gray-400 italic py-2">
                        {msg.text}
                    </div>
                );
            }
            return (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-xl px-4 py-2 max-w-xs lg:max-w-md ${
                    msg.sender === 'user' 
                      ? 'bg-brand-blue text-white' 
                      : 'bg-brand-gray dark:bg-brand-gray-dark text-gray-800 dark:text-gray-200'
                  }`}>
                    {msg.text}
                  </div>
                   <div className="text-xs text-gray-400 mt-1 px-1 flex items-center">
                     {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     {msg.sender === 'user' && <ReadReceiptIcon isRead={msg.isRead} />}
                   </div>
                </div>
            )
          })}
          {typingStatus?.conversationId === conversation?.id && typingStatus?.userRole === 'seller' && <TypingIndicator />}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t dark:border-gray-700">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-grow p-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-light focus:outline-none bg-white dark:bg-brand-gray-darker dark:text-gray-200 border-brand-gray dark:border-gray-600"
            />
            <button type="submit" className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-blue-dark disabled:bg-gray-400" disabled={!userInput.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;