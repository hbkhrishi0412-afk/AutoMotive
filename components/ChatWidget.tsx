
import React, { useState, useRef, useEffect, memo } from 'react';
import type { Conversation, ChatMessage } from '../types';
import ReadReceiptIcon, { OfferMessage, OfferModal } from './ReadReceiptIcon';

interface ChatWidgetProps {
  conversation: Conversation;
  currentUserRole: 'customer' | 'seller';
  otherUserName: string;
  onClose: () => void;
  onSendMessage: (messageText: string, type?: ChatMessage['type'], payload?: any) => void;
  typingStatus: { conversationId: string; userRole: 'customer' | 'seller' } | null;
  onUserTyping: (conversationId: string, userRole: 'customer' | 'seller') => void;
  onMarkMessagesAsRead: (conversationId: string, readerRole: 'customer' | 'seller') => void;
  onFlagContent: (type: 'vehicle' | 'conversation', id: number | string, reason: string) => void;
  onOfferResponse: (conversationId: string, messageId: number, response: 'accepted' | 'rejected' | 'countered', counterPrice?: number) => void;
  onMakeOffer?: () => void; // For seller dashboard
}

const EMOJIS = ['😀', '😂', '👍', '❤️', '🙏', '😊', '🔥', '🎉', '🚗', '🤔', '👋', '👀'];

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

export const ChatWidget: React.FC<ChatWidgetProps> = memo(({ conversation, currentUserRole, otherUserName, onClose, onSendMessage, typingStatus, onUserTyping, onMarkMessagesAsRead, onFlagContent, onOfferResponse, onMakeOffer }) => {
  const [inputText, setInputText] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  
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

  const handleFlagClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (conversation && !conversation.isFlagged) {
        if(window.confirm('Are you sure you want to report this conversation for review?')) {
            const reason = window.prompt("Please provide a reason for reporting this conversation (optional):");
            if (reason !== null) {
                onFlagContent('conversation', conversation.id, reason || "No reason provided");
            }
        }
    }
  };

  const handleSendOffer = (price: number) => {
    onSendMessage(`Offer: ${price}`, 'offer', {
      offerPrice: price,
      status: 'pending'
    });
    setIsOfferModalOpen(false);
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
    <>
    <div className={`fixed bottom-0 right-4 md:right-8 z-50 w-full max-w-sm h-[60vh] flex flex-col bg-white dark:bg-brand-gray-dark rounded-t-lg shadow-2xl ${isExiting ? 'animate-slide-out-down' : 'animate-slide-in-up'}`}>
        {/* Header */}
        <div className="p-3 border-b border-brand-gray-200 dark:border-brand-gray-700 flex justify-between items-center bg-brand-gray-50 dark:bg-brand-gray-darker rounded-t-lg">
            <div onClick={() => setIsMinimized(true)} className="cursor-pointer flex-grow">
                <h3 className="text-sm font-bold text-brand-gray-800 dark:text-brand-gray-100 truncate">{conversation.vehicleName}</h3>
                <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400">Chat with {otherUserName}</p>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={handleFlagClick} disabled={conversation.isFlagged} className="disabled:opacity-50 p-1 text-brand-gray-500 hover:bg-black/10 dark:hover:bg-white/10 rounded-full" aria-label="Report conversation" title={conversation.isFlagged ? "This conversation has been reported" : "Report conversation"}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${conversation.isFlagged ? 'text-yellow-500' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 01-1-1V6z" clipRule="evenodd" /></svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }} className="p-1 text-brand-gray-500 hover:bg-black/10 dark:hover:bg-white/10 rounded-full" aria-label="Minimize chat">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleClose(); }} className="p-1 text-brand-gray-500 hover:bg-black/10 dark:hover:bg-white/10 rounded-full" aria-label="Close chat">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        </div>

        {/* Messages */}
        <div className="flex-grow p-4 overflow-y-auto bg-brand-gray-100 dark:bg-brand-gray-darker space-y-4">
            {conversation.messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === senderType ? 'items-end' : 'items-start'}`}>
                    {msg.sender === 'system' && <div className="text-center text-xs text-brand-gray-500 dark:text-brand-gray-400 italic py-2 w-full">{msg.text}</div>}
                    {msg.sender !== 'system' && (
                        <>
                            <div className={`px-4 py-3 max-w-xs ${ msg.sender === senderType ? 'bg-brand-blue text-white rounded-l-xl rounded-t-xl' : 'bg-white dark:bg-brand-gray-700 text-brand-gray-800 dark:text-brand-gray-200 rounded-r-xl rounded-t-xl'}`}>
                                {msg.type === 'offer' ? <OfferMessage msg={msg} currentUserRole={currentUserRole} listingPrice={conversation.vehiclePrice} onRespond={(messageId, response, counterPrice) => onOfferResponse(conversation.id, messageId, response, counterPrice)} /> : <p className="text-sm break-words">{msg.text}</p>}
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
                <button type="button" onClick={() => setShowEmojiPicker(prev => !prev)} className="p-2 text-brand-gray-500 hover:text-brand-blue" aria-label="Add emoji">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </button>
                {currentUserRole === 'customer' ? (
                     <button type="button" onClick={() => setIsOfferModalOpen(true)} className="p-2 text-brand-gray-500 hover:text-green-500" aria-label="Make an offer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-1.134 0V7.151c.22.07.412.164.567.267zM11.567 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 01-1.134 0V7.151c.22.07.412.164.567.267z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.5 4.5 0 00-1.876.662C6.168 6.23 5.5 7.085 5.5 8.003v.486c0 .918.668 1.773 1.624 2.214.509.232.957.488 1.376.786V12.5a.5.5 0 01.5.5h1a.5.5 0 01.5-.5v-1.214c.419-.298.867-.554 1.376-.786C14.332 10.26 15 9.405 15 8.489v-.486c0-.918-.668-1.773-1.624-2.214A4.5 4.5 0 0011 5.092V5z" clipRule="evenodd" /></svg>
                    </button>
                ) : ( onMakeOffer && 
                     <button type="button" onClick={onMakeOffer} className="p-2 text-brand-gray-500 hover:text-green-500" aria-label="Make an offer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 00-1.134 0V7.151c.22.07.412.164.567.267zM11.567 7.418c.155-.103.346-.196.567-.267v1.698a2.5 2.5 0 01-1.134 0V7.151c.22.07.412.164.567.267z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.5 4.5 0 00-1.876.662C6.168 6.23 5.5 7.085 5.5 8.003v.486c0 .918.668 1.773 1.624 2.214.509.232.957.488 1.376.786V12.5a.5.5 0 01.5.5h1a.5.5 0 01.5-.5v-1.214c.419-.298.867-.554 1.376-.786C14.332 10.26 15 9.405 15 8.489v-.486c0-.918-.668-1.773-1.624-2.214A4.5 4.5 0 0011 5.092V5z" clipRule="evenodd" /></svg>
                    </button>
                )}
                <input
                    type="text"
                    value={inputText}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    className="flex-grow bg-brand-gray-100 dark:bg-brand-gray-700 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue"
                />
                <button type="submit" className="p-2 text-brand-blue" aria-label="Send message">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
            </form>
        </div>
    </div>
     {isOfferModalOpen && (
        <OfferModal
            title="Make an Offer"
            listingPrice={conversation.vehiclePrice}
            onSubmit={handleSendOffer}
            onClose={() => setIsOfferModalOpen(false)}
        />
      )}
    </>
  );
});
