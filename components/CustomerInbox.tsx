
import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Conversation, User, ChatMessage } from '../types';
import ReadReceiptIcon, { OfferMessage, OfferModal } from './ReadReceiptIcon';

interface CustomerInboxProps {
  conversations: Conversation[];
  onSendMessage: (vehicleId: number, messageText: string, type?: ChatMessage['type'], payload?: any) => void;
  onMarkAsRead: (conversationId: string) => void;
  users: User[];
  typingStatus: { conversationId: string; userRole: 'customer' | 'seller' } | null;
  onUserTyping: (conversationId: string, userRole: 'customer' | 'seller') => void;
  onMarkMessagesAsRead: (conversationId: string, readerRole: 'customer' | 'seller') => void;
  onFlagContent: (type: 'vehicle' | 'conversation', id: number | string, reason: string) => void;
  onOfferResponse: (conversationId: string, messageId: number, response: 'accepted' | 'rejected' | 'countered', counterPrice?: number) => void;
}

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

const TestDriveRequestMessage: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
    const { date, time, status } = msg.payload || {};
    const statusInfo = {
        pending: { text: "Pending", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300" },
        confirmed: { text: "Confirmed", color: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" },
        rejected: { text: "Declined", color: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300" },
        countered: { text: "Countered", color: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300" },
        accepted: { text: "Accepted", color: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300" },
    };
    return (
        <div className={`p-3 border-l-4 rounded-lg bg-brand-gray-100 dark:bg-brand-gray-700/50 ${status === 'pending' ? 'border-yellow-500' : status === 'confirmed' ? 'border-green-500' : 'border-red-500'}`}>
            <p className="font-semibold text-brand-gray-800 dark:text-brand-gray-100">Test Drive Request</p>
            <p className="text-sm text-brand-gray-600 dark:text-brand-gray-300">Date: {date}</p>
            <p className="text-sm text-brand-gray-600 dark:text-brand-gray-300">Time: {time}</p>
            <div className="mt-2 flex items-center justify-between">
                <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${statusInfo[status || 'pending'].color}`}>
                    Status: {statusInfo[status || 'pending'].text}
                </span>
            </div>
        </div>
    );
};

const CustomerInbox: React.FC<CustomerInboxProps> = ({ conversations, onSendMessage, onMarkAsRead, users, typingStatus, onUserTyping, onMarkMessagesAsRead, onFlagContent, onOfferResponse }) => {
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [replyText, setReplyText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

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
          if (updatedConversation && (updatedConversation.messages.length !== selectedConv.messages.length || updatedConversation.isFlagged !== selectedConv.isFlagged)) {
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
            const reason = window.prompt("Please provide a reason for reporting this conversation (optional):");
            if (reason !== null) {
                onFlagContent('conversation', selectedConv.id, reason || "No reason provided");
                // Optimistically update UI
                setSelectedConv(prev => prev ? {...prev, isFlagged: true, flagReason: reason || "No reason provided"} : null);
            }
        }
    }
  };

  const handleSendOffer = (price: number) => {
    if (selectedConv) {
        onSendMessage(selectedConv.vehicleId, `Offer: ${price}`, 'offer', {
            offerPrice: price,
            status: 'pending'
        });
        setIsOfferModalOpen(false);
    }
  };

  const getSellerName = (sellerId: string) => {
    return users.find(u => u.email === sellerId)?.name || 'Seller';
  }
  const formInputClass = "flex-grow p-3 border border-brand-gray-300 dark:border-brand-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue focus:outline-none transition bg-white dark:bg-brand-gray-800 dark:text-gray-200";

  return (
    <>
      <div className="animate-fade-in container mx-auto py-8">
        <h1 className="text-3xl font-extrabold text-brand-gray-900 dark:text-brand-gray-100 mb-6 border-b border-brand-gray-200 dark:border-brand-gray-700 pb-4">My Inbox</h1>
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft-lg h-[75vh]">
          {/* Conversation List */}
          <aside className="border-r border-brand-gray-200 dark:border-brand-gray-700 flex flex-col">
            <div className="p-4 border-b border-brand-gray-200 dark:border-brand-gray-700">
                  <h2 className="text-lg font-bold text-brand-gray-800 dark:text-brand-gray-100">Conversations</h2>
            </div>
            <div className="overflow-y-auto">
                  {sortedConversations.length > 0 ? (
                      <ul>
                          {sortedConversations.map(conv => {
                              const lastMessage = conv.messages[conv.messages.length - 1];
                              const messageText = lastMessage?.type === 'offer'
                                  ? `Offer: ${lastMessage.payload?.offerPrice}`
                                  : lastMessage?.text || 'No messages yet.';
                              return (
                                  <li key={conv.id}>
                                      <button
                                          onClick={() => handleSelectConversation(conv)}
                                          className={`w-full text-left p-4 border-l-4 transition-colors ${selectedConv?.id === conv.id ? 'border-brand-blue bg-brand-gray-100 dark:bg-brand-gray-900' : 'border-transparent hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700'}`}
                                      >
                                          <div className="flex justify-between items-center mb-1">
                                              <p className="font-bold text-brand-gray-800 dark:text-brand-gray-100 truncate">{conv.vehicleName}</p>
                                              {!conv.isReadByCustomer && <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>}
                                          </div>
                                          <p className="text-sm text-brand-gray-600 dark:text-brand-gray-300">With {getSellerName(conv.sellerId)}</p>
                                          <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 truncate mt-1">
                                              {lastMessage && (
                                                  lastMessage.sender === 'user' ? (
                                                      <span><span className="font-semibold">You: </span>{lastMessage.type === 'test_drive_request' ? 'Test Drive Request' : messageText}</span>
                                                  ) : lastMessage.sender === 'seller' ? (
                                                      <span><span className="font-semibold">{getSellerName(conv.sellerId)}: </span>{messageText}</span>
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
                      <p className="p-4 text-center text-brand-gray-500 dark:text-brand-gray-400">You have no messages yet. Inquire about a vehicle to start a conversation.</p>
                  )}
            </div>
          </aside>

          {/* Chat View */}
          <main className="flex flex-col">
              {selectedConv ? (
                  <>
                      <div className="p-4 border-b border-brand-gray-200 dark:border-brand-gray-700 flex justify-between items-center">
                          <div>
                              <h3 className="font-bold text-lg text-brand-gray-800 dark:text-brand-gray-100">{selectedConv.vehicleName}</h3>
                              <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">Conversation with {getSellerName(selectedConv.sellerId)}</p>
                          </div>
                          <button onClick={handleFlagClick} disabled={selectedConv.isFlagged} className="disabled:opacity-50 flex items-center gap-1 text-xs text-brand-gray-500 hover:text-red-500" title={selectedConv.isFlagged ? "This conversation has been reported" : "Report conversation"}>
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
                      <div className="flex-grow p-4 overflow-y-auto bg-brand-gray-50 dark:bg-brand-gray-darker space-y-4">
                          {selectedConv.messages.map(msg => (
                            <div key={msg.id} className={`flex flex-col animate-fade-in ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                  {msg.sender === 'seller' && <span className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 ml-2">{getSellerName(selectedConv.sellerId)}</span>}
                                  {msg.sender === 'system' && <div className="text-center text-xs text-brand-gray-500 dark:text-brand-gray-400 italic py-2 w-full">{msg.text}</div>}
                                  {msg.sender !== 'system' && (
                                      <>
                                          <div className={`px-4 py-3 max-w-lg ${ msg.sender === 'user' ? 'bg-brand-blue text-white rounded-l-xl rounded-t-xl' : 'bg-brand-gray-200 dark:bg-brand-gray-700 text-brand-gray-800 dark:text-brand-gray-200 rounded-r-xl rounded-t-xl'}`}>
                                              {/* FIX: Wrap onOfferResponse to pass the conversationId to match the expected signature. */}
                                              {msg.type === 'test_drive_request' ? <TestDriveRequestMessage msg={msg} /> : msg.type === 'offer' ? <OfferMessage msg={msg} currentUserRole="customer" listingPrice={selectedConv.vehiclePrice} onRespond={(messageId, response, counterPrice) => onOfferResponse(selectedConv!.id, messageId, response, counterPrice)} /> : <p className="text-sm">{msg.text}</p>}
                                          </div>
                                          <div className="text-xs text-brand-gray-400 mt-1 px-1 flex items-center">
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
                      <div className="p-4 border-t border-brand-gray-200 dark:border-brand-gray-700 bg-white dark:bg-brand-gray-800">
                          <form onSubmit={handleSendReply} className="flex gap-2">
                          <button type="button" onClick={() => setIsOfferModalOpen(true)} className="bg-green-600 text-white font-bold p-3 rounded-lg hover:bg-green-700 transition-colors" aria-label="Make an offer">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-1.134 0V7.151c.22.07.412.164.567.267zM11.567 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 01-1.134 0V7.151c.22.07.412.164.567.267z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.5 4.5 0 00-1.876.662C6.168 6.23 5.5 7.085 5.5 8.003v.486c0 .918.668 1.773 1.624 2.214.509.232.957.488 1.376.786V12.5a.5.5 0 01.5.5h1a.5.5 0 01.5-.5v-1.214c.419-.298.867-.554 1.376-.786C14.332 10.26 15 9.405 15 8.489v-.486c0-.918-.668-1.773-1.624-2.214A4.5 4.5 0 0011 5.092V5z" clipRule="evenodd" /></svg>
                           </button>
                          <input type="text" value={replyText} onChange={handleInputChange} placeholder="Type your message..." className={formInputClass} />
                          <button type="submit" className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-blue-dark">Send</button>
                          </form>
                      </div>
                  </>
              ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-brand-gray-300 dark:text-brand-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                      <h3 className="mt-4 text-xl font-semibold text-brand-gray-700 dark:text-brand-gray-200">Select a Conversation</h3>
                      <p className="text-brand-gray-500 dark:text-brand-gray-400 mt-1">Choose a conversation from the left to view messages.</p>
                  </div>
              )}
          </main>
        </div>
      </div>
      {isOfferModalOpen && selectedConv && (
        <OfferModal
            title="Make an Offer"
            listingPrice={selectedConv.vehiclePrice}
            onClose={() => setIsOfferModalOpen(false)}
            onSubmit={handleSendOffer}
        />
      )}
    </>
  );
};

export default CustomerInbox;
