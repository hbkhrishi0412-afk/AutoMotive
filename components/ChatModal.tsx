
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
  onFlagContent: (type: 'vehicle' | 'conversation', id: number | string) => void;
  sellerName: string;
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

const TypingIndicator: React.FC<{ name: string }> = ({ name }) => (
    <div className="flex items-start">
        <div className="rounded-xl px-4 py-3 max-w-xs lg:max-w-md bg-brand-gray dark:bg-brand-gray-dark text-gray-800 dark:text-gray-200 flex items-center space-x-2">
            <span className="text-sm font-medium">{name} is typing</span>
            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
        </div>
    </div>
);


const ChatModal: React.FC<ChatModalProps> = ({ conversation, vehicleName, onClose, onSendMessage, typingStatus, onUserTyping, onMarkMessagesAsRead, onFlagContent, sellerName }) => {
  const [userInput, setUserInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const messages = conversation?.messages || [];
  const isFlagged = conversation?.isFlagged || false;

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
    const convId = conversation?.id || `temp-${Date.now()}`;
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

  const handleFlagClick = () => {
    if (conversation && !isFlagged) {
        if(window.confirm('Are you sure you want to report this conversation for review?')) {
            onFlagContent('conversation', conversation.id);
        }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-brand-gray-dark rounded-lg shadow-2xl w-full max-w-lg h-[80vh] flex flex-col">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-brand-gray-darker text-white rounded-t-lg">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">Chat about {vehicleName}</h2>
            <button onClick={handleFlagClick} disabled={isFlagged} className="disabled:opacity-50" title={isFlagged ? "This conversation has been reported" : "Report conversation"}>
                {isFlagged ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 01-1-1V6z" clipRule="evenodd" /></svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 01-1-1V6z" clipRule="evenodd" /></svg>
                )}
            </button>
          </div>
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
          {typingStatus?.conversationId === conversation?.id && typingStatus?.userRole === 'seller' && <TypingIndicator name={sellerName} />}
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
