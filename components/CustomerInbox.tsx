import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Conversation, User } from '../types';

interface CustomerInboxProps {
  conversations: Conversation[];
  onSendMessage: (vehicleId: number, messageText: string) => void;
  onMarkAsRead: (conversationId: string) => void;
  users: User[];
  typingStatus: { conversationId: string; userRole: 'customer' | 'seller' } | null;
  onUserTyping: (conversationId: string, userRole: 'customer' | 'seller') => void;
  onMarkMessagesAsRead: (conversationId: string, readerRole: 'customer' | 'seller') => void;
  onFlagContent: (type: 'vehicle' | 'conversation', id: number | string) => void;
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
        <div className="rounded-xl px-4 py-3 max-w-lg bg-brand-gray dark:bg-brand-gray-dark text-gray-800 dark:text-gray-200 flex items-center space-x-2">
            <span className="text-sm font-medium">{name} is typing</span>
            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
        </div>
    </div>
);


const CustomerInbox: React.FC<CustomerInboxProps> = ({ conversations, onSendMessage, onMarkAsRead, users, typingStatus, onUserTyping, onMarkMessagesAsRead, onFlagContent }) => {
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const sortedConversations = useMemo(() => {
    return [...conversations].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }, [conversations]);

  useEffect(() => {
    if (!selectedConv && sortedConversations.length > 0) {
      const firstConv = sortedConversations[0];
      handleSelectConversation(firstConv);
    }
    if (selectedConv && !conversations.find(c => c.id === selectedConv.id)) {
        setSelectedConv(null);
    }
  }, [conversations, sortedConversations]);


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConv?.messages, typingStatus]);

  useEffect(() => {
      if (selectedConv) {
          const updatedConversation = conversations.find(c => c.id === selectedConv.id);
          if (updatedConversation && updatedConversation.messages.length !== selectedConv.messages.length) {
              setSelectedConv(updatedConversation);
          }
      }
  }, [conversations, selectedConv]);

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    if (conv.isReadByCustomer === false) {
      onMarkAsRead(conv.id);
      onMarkMessagesAsRead(conv.id, 'customer');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReplyText(e.target.value);
    if (selectedConv) {
        onUserTyping(selectedConv.id, 'customer');
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (replyText.trim() && selectedConv) {
      onSendMessage(selectedConv.vehicleId, replyText);
      setReplyText("");
    }
  };
  
  const handleFlagClick = () => {
    if (selectedConv && !selectedConv.isFlagged) {
        if(window.confirm('Are you sure you want to report this conversation for review?')) {
            onFlagContent('conversation', selectedConv.id);
            // Optimistically update UI
            setSelectedConv(prev => prev ? {...prev, isFlagged: true} : null);
        }
    }
  };

  const getSellerName = (sellerId: string) => {
    return users.find(u => u.email === sellerId)?.name || 'Seller';
  }

  return (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-6 border-b dark:border-gray-700 pb-4">My Inbox</h1>
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 bg-white dark:bg-brand-gray-dark rounded-lg shadow-md h-[75vh]">
        {/* Conversation List */}
        <aside className="border-r dark:border-gray-700 flex flex-col">
           <div className="p-4 border-b dark:border-gray-700">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Conversations</h2>
           </div>
           <div className="overflow-y-auto">
                {sortedConversations.length > 0 ? (
                    <ul>
                        {sortedConversations.map(conv => {
                            const lastMessage = conv.messages[conv.messages.length - 1];
                            return (
                                <li key={conv.id}>
                                    <button
                                        onClick={() => handleSelectConversation(conv)}
                                        className={`w-full text-left p-4 border-l-4 ${selectedConv?.id === conv.id ? 'border-brand-blue bg-brand-gray-light dark:bg-brand-gray-darker' : 'border-transparent hover:bg-brand-gray-light dark:hover:bg-brand-gray-darker'}`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-bold text-gray-800 dark:text-gray-100 truncate">{conv.vehicleName}</p>
                                            {!conv.isReadByCustomer && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">With {getSellerName(conv.sellerId)}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                            {lastMessage && (
                                                lastMessage.sender === 'user' ? (
                                                    <span><span className="font-semibold">You: </span>{lastMessage.text}</span>
                                                ) : lastMessage.sender === 'seller' ? (
                                                    <span><span className="font-semibold">{getSellerName(conv.sellerId)}: </span>{lastMessage.text}</span>
                                                ) : (
                                                    <em>{lastMessage.text}</em>
                                                )
                                            )}
                                        </p>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="p-4 text-center text-gray-500 dark:text-gray-400">You have no messages yet. Inquire about a vehicle to start a conversation.</p>
                )}
           </div>
        </aside>

        {/* Chat View */}
        <main className="flex flex-col">
            {selectedConv ? (
                 <>
                    <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100">{selectedConv.vehicleName}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Conversation with {getSellerName(selectedConv.sellerId)}</p>
                        </div>
                         <button onClick={handleFlagClick} disabled={selectedConv.isFlagged} className="disabled:opacity-50 flex items-center gap-1 text-xs text-gray-500 hover:text-red-500" title={selectedConv.isFlagged ? "This conversation has been reported" : "Report conversation"}>
                            {selectedConv.isFlagged ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 01-1-1V6z" clipRule="evenodd" /></svg>
                                    Reported
                                </>
                            ) : (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 01-1-1V6z" clipRule="evenodd" /></svg>
                                    Report
                                </>
                            )}
                        </button>
                    </div>
                    <div className="flex-grow p-4 overflow-y-auto bg-brand-gray-light dark:bg-brand-gray-darker space-y-4">
                        {selectedConv.messages.map(msg => (
                           <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                {msg.sender === 'seller' && <span className="text-xs font-bold text-green-600 dark:text-green-400 mb-1 ml-2">{getSellerName(selectedConv.sellerId)}</span>}
                                {msg.sender === 'system' && <div className="text-center text-xs text-gray-500 dark:text-gray-400 italic py-2 w-full">{msg.text}</div>}
                                {msg.sender !== 'system' && (
                                    <>
                                        <div className={`rounded-xl px-4 py-2 max-w-lg ${ msg.sender === 'user' ? 'bg-brand-blue text-white' : 'bg-brand-gray dark:bg-brand-gray-dark text-gray-800 dark:text-gray-200'}`}>
                                            {msg.text}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1 px-1 flex items-center">
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            {msg.sender === 'user' && <ReadReceiptIcon isRead={msg.isRead} />}
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                        {typingStatus?.conversationId === selectedConv?.id && typingStatus?.userRole === 'seller' && <TypingIndicator name={getSellerName(selectedConv.sellerId)} />}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="p-4 border-t dark:border-gray-700 bg-white dark:bg-brand-gray-dark">
                        <form onSubmit={handleSendReply} className="flex gap-2">
                        <input type="text" value={replyText} onChange={handleInputChange} placeholder="Type your message..." className="flex-grow p-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-light focus:outline-none bg-white dark:bg-brand-gray-darker dark:text-gray-200 border-brand-gray dark:border-gray-600" />
                        <button type="submit" className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-blue-dark">Send</button>
                        </form>
                    </div>
                 </>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                     <h3 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-200">Select a Conversation</h3>
                     <p className="text-gray-500 dark:text-gray-400 mt-1">Choose a conversation from the left to view messages.</p>
                </div>
            )}
        </main>
      </div>
    </div>
  );
};

export default CustomerInbox;
