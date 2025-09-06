import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, Conversation } from '../types';

interface ChatModalProps {
  conversation: Conversation | undefined;
  vehicleName: string;
  onClose: () => void;
  onSendMessage: (messageText: string) => void;
}

const ChatModal: React.FC<ChatModalProps> = ({ conversation, vehicleName, onClose, onSendMessage }) => {
  const [userInput, setUserInput] = useState('');
  const [isAwaitingAI, setIsAwaitingAI] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const messages = conversation?.messages || [];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAwaitingAI]);
  
  // When AI message is added, stop waiting
  useEffect(() => {
    if (messages.length > 0 && messages[messages.length-1].sender === 'ai') {
        setIsAwaitingAI(false);
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const messageToSend = userInput;
    setUserInput('');
    setIsAwaitingAI(true);
    
    onSendMessage(messageToSend);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white dark:bg-brand-gray-dark rounded-lg shadow-2xl w-full max-w-lg h-[80vh] flex flex-col">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center bg-brand-gray-darker text-white rounded-t-lg">
          <h2 className="text-lg font-bold">Chat about {vehicleName}</h2>
          <button onClick={onClose} className="text-white text-2xl hover:text-gray-300">&times;</button>
        </div>

        <div className="flex-grow p-4 overflow-y-auto bg-brand-gray-light dark:bg-brand-gray-darker space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`rounded-xl px-4 py-2 max-w-xs lg:max-w-md ${
                msg.sender === 'user' 
                  ? 'bg-brand-blue text-white' 
                  : 'bg-brand-gray dark:bg-brand-gray-dark text-gray-800 dark:text-gray-200'
              }`}>
                {msg.text}
              </div>
               <span className="text-xs text-gray-400 mt-1 px-1">
                 {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
               </span>
            </div>
          ))}
          {isAwaitingAI && (
             <div className="flex mb-4 justify-start">
               <div className="rounded-xl px-4 py-2 bg-brand-gray dark:bg-brand-gray-dark text-gray-800 dark:text-gray-200">
                  <span className="animate-pulse">●</span>
                  <span className="animate-pulse [animation-delay:0.2s]">●</span>
                  <span className="animate-pulse [animation-delay:0.4s]">●</span>
               </div>
             </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 border-t dark:border-gray-700">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ask the AI assistant..."
              className="flex-grow p-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-light focus:outline-none bg-white dark:bg-brand-gray-darker dark:text-gray-200 border-brand-gray dark:border-gray-600"
              disabled={isAwaitingAI}
            />
            <button type="submit" className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-blue-dark disabled:bg-gray-400 disabled:cursor-wait" disabled={isAwaitingAI || !userInput.trim()}>
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;