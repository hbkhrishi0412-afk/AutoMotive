import React, { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import { PLAN_DETAILS, MOCK_SUPPORT_TICKETS, MOCK_FAQS } from './constants';
import type { Vehicle, User, Conversation, ChatMessage, Toast as ToastType, PlatformSettings, AuditLogEntry, VehicleData, Notification, VehicleCategory, Badge, Command, SubscriptionPlan, CertifiedInspection, SupportTicket, FAQItem } from './types';
import { View, VehicleCategory as CategoryEnum } from './types';
import { getRatings, addRating, getSellerRatings, addSellerRating } from './services/ratingService';
import { getConversations, saveConversations } from './services/chatService';
import * as vehicleService from './services/vehicleService';
import { getVehiclesLocal } from './services/vehicleService';
import * as userService from './services/userService';
import { getUsersLocal } from './services/userService';
import LoginPortal from './components/LoginPortal';
import CustomerLogin from './CustomerLogin';
import AdminLogin from './AdminLogin';
import Login from './Login';
import ToastContainer from './components/ToastContainer';
import ForgotPassword from './components/ForgotPassword';
import { getSettings, saveSettings } from './services/settingsService';
import { getAuditLog, logAction, saveAuditLog } from './services/auditLogService';
import { exportToCsv } from './services/exportService';
import { showNotification } from './services/notificationService';
import { getVehicleData, saveVehicleData } from './services/vehicleDataService';
import { ChatWidget } from './components/ChatWidget';
import { getVehicleRecommendations } from './services/geminiService';
import { getSellerBadges } from './services/badgeService';
import CommandPalette from './components/CommandPalette';
import { getFaqs, saveFaqs } from './services/faqService';
import { getSupportTickets, saveSupportTickets } from './services/supportTicketService';
import { getPlaceholderImage } from './components/vehicleData';


// Lazy-loaded components
const Home = lazy(() => import('./components/Home'));
const VehicleList = lazy(() => import('./components/VehicleList'));
const VehicleDetail = lazy(() => import('./components/VehicleDetail').then(module => ({ default: module.VehicleDetail })));
const Dashboard = lazy(() => import('./Dashboard'));
const AdminPanel = lazy(() => import('./components/AdminPanel'));
const Comparison = lazy(() => import('./components/Comparison'));
const Profile = lazy(() => import('./components/Profile'));
const CustomerInbox = lazy(() => import('./components/CustomerInbox'));
const SellerProfilePage = lazy(() => import('./components/SellerProfilePage'));
const NewCars = lazy(() => import('./components/NewCars'));
const DealerProfiles = lazy(() => import('./components/DealerProfiles'));
const PricingPage = lazy(() => import('./components/PricingPage'));
const SupportPage = lazy(() => import('./components/SupportPage'));
const FAQPage = lazy(() => import('./components/FAQPage'));



const LoadingSpinner: React.FC = () => (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-brand-blue"></div>
            <span className="text-xl font-semibold text-brand-gray-600 dark:text-brand-gray-300">Loading...</span>
        </div>
    </div>
);


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [previousView, setPreviousView] = useState<View>(View.HOME);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [comparisonList, setComparisonList] = useState<number[]>([]);
  const [ratings, setRatings] = useState<{ [key: string]: number[] }>({});
  const [sellerRatings, setSellerRatings] = useState<{ [key: string]: number[] }>({});
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [forgotPasswordRole, setForgotPasswordRole] = useState<'customer' | 'seller' | null>(null);
  const [typingStatus, setTypingStatus] = useState<{ conversationId: string; userRole: 'customer' | 'seller' } | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory | 'ALL'>(CategoryEnum.FOUR_WHEELER);
  const [publicSellerProfile, setPublicSellerProfile] = useState<User | null>(null);
  const prevConversationsRef = useRef<Conversation[] | null>(null);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [isAnnouncementVisible, setIsAnnouncementVisible] = useState(true);
  const [recommendations, setRecommendations] = useState<Vehicle[]>([]);
  const [initialSearchQuery, setInitialSearchQuery] = useState<string>('');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<string>('Mumbai'); // Default location

  const [users, setUsers] = useState<User[]>([]);
  
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => getSettings());
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(() => getAuditLog());
  const [vehicleData, setVehicleData] = useState<VehicleData>(() => getVehicleData());
  const [faqItems, setFaqItems] = useState<FAQItem[]>(() => getFaqs() || MOCK_FAQS);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => getSupportTickets() || MOCK_SUPPORT_TICKETS);

  const addToast = useCallback((message: string, type: ToastType['type']) => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  }, []);

  // Load location from localStorage on initial load
  useEffect(() => {
    try {
      const savedLocation = localStorage.getItem('reRideUserLocation');
      if (savedLocation) {
        setUserLocation(savedLocation);
      }
    } catch (error) {
      console.error("Failed to load user location from localStorage", error);
    }
  }, []);
  
  useEffect(() => {
    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            const [vehiclesData, usersData] = await Promise.all([
                vehicleService.getVehicles(),
                userService.getUsers()
            ]);
            setVehicles(vehiclesData);
            setUsers(usersData);
        } catch (error) {
            console.error("Failed to load initial data from API, falling back to local data.", error);
            addToast("Could not connect to the server. Displaying local data.", "info");
            // Fallback to local data
            try {
                const [vehiclesData, usersData] = await Promise.all([
                    getVehiclesLocal(),
                    getUsersLocal(),
                ]);
                setVehicles(vehiclesData);
                setUsers(usersData);
            } catch (localError) {
                console.error("Failed to load local mock data.", localError);
                addToast("Fatal: Could not load any application data.", "error");
            }
        } finally {
            setIsLoading(false);
        }
    };

    loadInitialData();
  }, [addToast]);

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
        const notificationsJson = localStorage.getItem('reRideNotifications');
        return notificationsJson ? JSON.parse(notificationsJson) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try {
        localStorage.setItem('reRideNotifications', JSON.stringify(notifications));
    } catch (error) { console.error("Failed to save notifications", error); }
  }, [notifications]);

  useEffect(() => {
    saveFaqs(faqItems);
  }, [faqItems]);

  useEffect(() => {
    saveSupportTickets(supportTickets);
  }, [supportTickets]);

  const addLogEntry = useCallback((action: string, target: string, details?: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const newLog = logAction(currentUser.email, action, target, details);
    setAuditLog(prev => [newLog, ...prev]);
  }, [currentUser]);
  
  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  const isHomePage = currentView === View.HOME;

  const logViewedVehicle = (vehicleId: number) => {
      try {
          const viewedJson = localStorage.getItem('viewedVehicleIds');
          let viewedIds: number[] = viewedJson ? JSON.parse(viewedJson) : [];
          viewedIds = viewedIds.filter(id => id !== vehicleId);
          viewedIds.unshift(vehicleId);
          localStorage.setItem('viewedVehicleIds', JSON.stringify(viewedIds.slice(0, 20)));
      } catch (error) { console.error("Failed to log viewed vehicle:", error); }
  };
  
  const getViewedVehicles = (): number[] => {
      try {
          const viewedJson = localStorage.getItem('viewedVehicleIds');
          return viewedJson ? JSON.parse(viewedJson) : [];
      } catch (error) {
          console.error("Failed to get viewed vehicles:", error);
          return [];
      }
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
        if (!currentUser) { setRecommendations([]); return; }
        const viewed = getViewedVehicles();
        if (viewed.length === 0 && wishlist.length === 0 && comparisonList.length === 0) { setRecommendations([]); return; }
        const cachedRecs = sessionStorage.getItem('vehicleRecommendations');
        if (cachedRecs) {
            const { ids, timestamp } = JSON.parse(cachedRecs);
            if (Date.now() - timestamp < 1000 * 60 * 30) { // 30 min cache
                setRecommendations(vehicles.filter(v => ids.includes(v.id)));
                return;
            }
        }
        const vehicleContext = vehicles.filter(v => v.status === 'published').map(v => ({ id: v.id, make: v.make, model: v.model, year: v.year, price: v.price, features: v.features.slice(0, 5), fuelType: v.fuelType }));
        const recommendedIds = await getVehicleRecommendations({ viewed, wishlisted: wishlist, compared: comparisonList }, vehicleContext);
        if (recommendedIds.length > 0) {
            setRecommendations(vehicles.filter(v => recommendedIds.includes(v.id)));
            sessionStorage.setItem('vehicleRecommendations', JSON.stringify({ ids: recommendedIds, timestamp: Date.now() }));
        }
    };
    const debounceTimer = setTimeout(fetchRecommendations, 1000);
    return () => clearTimeout(debounceTimer);
  }, [currentUser, wishlist, comparisonList, vehicles]);


  useEffect(() => {
    if (isHomePage) document.body.classList.add('homepage-active');
    else document.body.classList.remove('homepage-active');
    return () => { document.body.classList.remove('homepage-active'); };
  }, [isHomePage]);

  useEffect(() => {
    if (platformSettings.siteAnnouncement) setIsAnnouncementVisible(true);
  }, [platformSettings.siteAnnouncement]);

  useEffect(() => {
    const sessionUserJson = sessionStorage.getItem('currentUser');
    if (sessionUserJson) setCurrentUser(JSON.parse(sessionUserJson));
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist));
    const loadedConversations = getConversations();
    setConversations(loadedConversations.map(c => ({ ...c, isReadByCustomer: c.isReadByCustomer ?? true, messages: c.messages.map(m => ({ ...m, isRead: m.isRead ?? true })), isFlagged: c.isFlagged || false, flagReason: c.flagReason || undefined, flaggedAt: c.flaggedAt || undefined })));
    const urlParams = new URLSearchParams(window.location.search);
    const sellerEmail = urlParams.get('seller');
    if (sellerEmail && users.length > 0) {
        const sellerUser = users.find(u => u.email === sellerEmail && u.role === 'seller');
        if (sellerUser) {
            setPublicSellerProfile(sellerUser);
            setCurrentView(View.SELLER_PROFILE);
        } else {
            addToast('Seller profile not found.', 'error');
            window.history.pushState({}, '', window.location.pathname);
        }
    }
  }, [addToast, users]);
  
   useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key === 'k') { event.preventDefault(); setIsCommandPaletteOpen(prev => !prev); }};
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
    setCurrentView(View.HOME);
    setActiveChat(null);
    addToast('You have been logged out.', 'info');
  }, [addToast]);

  useEffect(() => {
    if (currentUser) {
        const updatedUserInState = users.find(u => u.email === currentUser.email);
        if (updatedUserInState && JSON.stringify(updatedUserInState) !== JSON.stringify(currentUser)) {
            setCurrentUser(updatedUserInState);
            sessionStorage.setItem('currentUser', JSON.stringify(updatedUserInState));
        }
        if (!updatedUserInState || updatedUserInState.status === 'inactive') {
            handleLogout();
            if (updatedUserInState?.status === 'inactive') addToast("Your account has been deactivated by an administrator.", "error");
        }
    }
  }, [users, currentUser, handleLogout, addToast]);

  useEffect(() => {
    if (!prevConversationsRef.current || !currentUser) { prevConversationsRef.current = conversations; return; }
    conversations.forEach(currentConv => {
      const prevConv = prevConversationsRef.current!.find(p => p.id === currentConv.id);
      if (prevConv && currentConv.messages.length > prevConv.messages.length) {
        const lastMessage = currentConv.messages[currentConv.messages.length - 1];
        const isRecipient = (currentUser.role === 'customer' && lastMessage.sender === 'seller') || (currentUser.role === 'seller' && lastMessage.sender === 'user');
        if (isRecipient && activeChat?.id !== currentConv.id) {
          const senderName = currentUser.role === 'customer' ? users.find(u => u.email === currentConv.sellerId)?.name || 'The Seller' : currentConv.customerName;
          showNotification(`New message from ${senderName}`, { body: lastMessage.text.length > 100 ? `${lastMessage.text.substring(0, 97)}...` : lastMessage.text, icon: `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚗</text></svg>` });
        }
      }
    });
    prevConversationsRef.current = conversations;
  }, [conversations, currentUser, users, activeChat]);

  useEffect(() => {
    setRatings(getRatings());
    setSellerRatings(getSellerRatings());
  }, []);
  
  useEffect(() => {
    saveConversations(conversations);
    if(activeChat){
      const updatedChat = conversations.find(c => c.id === activeChat.id);
      if(updatedChat) setActiveChat(updatedChat);
    }
  }, [conversations, activeChat]);

  useEffect(() => { saveSettings(platformSettings); }, [platformSettings]);
  useEffect(() => { saveAuditLog(auditLog); }, [auditLog]);

  const handleAddSellerRating = useCallback((sellerEmail: string, rating: number) => {
    addSellerRating(sellerEmail, rating);
    setSellerRatings(prevRatings => {
        const newRatings = { ...prevRatings };
        const sellerRatingsList = newRatings[sellerEmail] || [];
        newRatings[sellerEmail] = [...sellerRatingsList, rating];
        return newRatings;
    });
    addToast('Thank you for rating the seller!', 'success');
  }, [addToast]);

  const handleToggleWishlist = useCallback((vehicleId: number) => {
    setWishlist(prev => {
      const isAdding = !prev.includes(vehicleId);
      const newWishlist = isAdding ? [...prev, vehicleId] : prev.filter(id => id !== vehicleId);
      localStorage.setItem('wishlist', JSON.stringify(newWishlist));
      addToast(isAdding ? 'Added to wishlist!' : 'Removed from wishlist.', 'info');
      return newWishlist;
    });
  }, [addToast]);

  const handleUserTyping = useCallback((conversationId: string, userRole: 'customer' | 'seller') => {
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTypingStatus({ conversationId, userRole });
    typingTimeoutRef.current = window.setTimeout(() => { setTypingStatus(null); }, 2000);
  }, []);

  const handleMarkMessagesAsRead = useCallback((conversationId: string, readerRole: 'customer' | 'seller') => {
    setConversations(prev => prev.map(conv => {
            if (conv.id === conversationId) {
                const updatedMessages = conv.messages.map(msg => {
                    const readerSenderType = readerRole === 'customer' ? 'user' : 'seller';
                    if (msg.sender !== readerSenderType && msg.sender !== 'system' && !msg.isRead) return { ...msg, isRead: true };
                    return msg;
                });
                return { ...conv, messages: updatedMessages };
            }
            return conv;
        })
    );
  }, []);

  const handleStartChat = useCallback((vehicle: Vehicle) => {
    if (!currentUser || currentUser.role !== 'customer') { addToast('Please log in as a customer to start a chat.', 'info'); navigate(View.CUSTOMER_LOGIN); return; }
    const conversationId = `${currentUser.email}-${vehicle.id}`;
    const existingConversation = conversations.find(c => c.id === conversationId);
    if (existingConversation) setActiveChat(existingConversation);
    else {
        const placeholder: Conversation = { id: conversationId, customerId: currentUser.email, customerName: currentUser.name, sellerId: vehicle.sellerEmail, vehicleId: vehicle.id, vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.variant || ''}`.trim(), vehiclePrice: vehicle.price, messages: [], lastMessageAt: new Date().toISOString(), isReadBySeller: false, isReadByCustomer: true };
        setActiveChat(placeholder);
    }
  }, [currentUser, conversations, addToast]);

  const handleCustomerSendMessage = useCallback((vehicleId: number, messageText: string, type: ChatMessage['type'] = 'text', payload?: ChatMessage['payload']) => {
    if (!currentUser || currentUser.role !== 'customer') return;
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) { addToast("Could not find vehicle details.", "error"); return; }
    
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, inquiriesCount: (v.inquiriesCount || 0) + 1 } : v));
    const conversationId = `${currentUser.email}-${vehicle.id}`;
    const userMessage: ChatMessage = { id: Date.now(), sender: 'user', text: messageText, timestamp: new Date().toISOString(), isRead: false, type, payload };
    setConversations(prev => {
        const existingConversationIndex = prev.findIndex(c => c.id === conversationId);
        if (existingConversationIndex > -1) {
            const updatedConversations = [...prev];
            updatedConversations[existingConversationIndex] = { ...updatedConversations[existingConversationIndex], messages: [...updatedConversations[existingConversationIndex].messages, userMessage], lastMessageAt: userMessage.timestamp, isReadBySeller: false, isReadByCustomer: true };
            return updatedConversations;
        } else {
            const newConversation: Conversation = { id: conversationId, customerId: currentUser.email, customerName: currentUser.name, sellerId: vehicle.sellerEmail, vehicleId: vehicle.id, vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.variant || ''}`.trim(), vehiclePrice: vehicle.price, messages: [userMessage], lastMessageAt: userMessage.timestamp, isReadBySeller: false, isReadByCustomer: true };
            return [...prev, newConversation];
        }
    });
  }, [currentUser, vehicles, addToast]);
  
  const handleSellerSendMessage = useCallback((conversationId: string, messageText: string, type: ChatMessage['type'] = 'text', payload?: ChatMessage['payload']) => {
    if (!currentUser || currentUser.role !== 'seller') return;
    setConversations(prev => prev.map(conv => {
        if (conv.id === conversationId) {
            const sellerMessage: ChatMessage = { id: Date.now(), sender: 'seller', text: messageText, timestamp: new Date().toISOString(), isRead: false, type, payload };
            return { ...conv, messages: [...conv.messages, sellerMessage], lastMessageAt: sellerMessage.timestamp, isReadByCustomer: false };
        }
        return conv;
    }));
  }, [currentUser]);

  const handleOfferResponse = useCallback((conversationId: string, messageId: number, response: 'accepted' | 'rejected' | 'countered', counterPrice?: number) => {
    setConversations(prevConvs => prevConvs.map(conv => {
        if (conv.id !== conversationId) return conv;
        const msgIndex = conv.messages.findIndex(m => m.id === messageId);
        if (msgIndex === -1) return conv;
        
        const updatedMessages = [...conv.messages];
        const originalMessage = { ...updatedMessages[msgIndex] };
        if (!originalMessage.payload) return conv;
        originalMessage.payload.status = response;
        updatedMessages[msgIndex] = originalMessage;

        const now = new Date().toISOString();
        if (response === 'countered' && counterPrice && currentUser) {
            updatedMessages.push({ id: Date.now(), sender: currentUser.role === 'customer' ? 'user' : 'seller', text: `Counter-offer: ${counterPrice}`, timestamp: now, isRead: false, type: 'offer', payload: { offerPrice: counterPrice, counterPrice: originalMessage.payload.offerPrice, status: 'pending' } });
        } else {
            updatedMessages.push({ id: Date.now(), sender: 'system', text: `Offer ${response}.`, timestamp: now, isRead: false });
        }

        return { ...conv, messages: updatedMessages, lastMessageAt: now, isReadBySeller: currentUser?.role === 'customer' ? false : conv.isReadBySeller, isReadByCustomer: currentUser?.role === 'seller' ? false : conv.isReadByCustomer };
    }));
  }, [currentUser]);
  
  const handleMarkConversationAsReadBySeller = useCallback((conversationId: string) => { setConversations(prev => prev.map(c => c.id === conversationId && !c.isReadBySeller ? { ...c, isReadBySeller: true } : c)); }, []);
  const handleMarkConversationAsReadByCustomer = useCallback((conversationId: string) => { setConversations(prev => prev.map(c => c.id === conversationId && !c.isReadByCustomer ? { ...c, isReadByCustomer: true } : c)); }, []);

  const usersWithRatingsAndBadges = useMemo(() => users.map(user => {
      if (user.role !== 'seller') return user;
      const sellerRatingsList = sellerRatings[user.email] || [];
      const ratingCount = sellerRatingsList.length;
      const averageRating = ratingCount > 0 ? sellerRatingsList.reduce((acc, curr) => acc + curr, 0) / ratingCount : 0;
      const allSellerVehicles = vehicles.filter(v => v.sellerEmail === user.email);
      const badges: Badge[] = getSellerBadges({ ...user, averageRating, ratingCount }, allSellerVehicles);
      return { ...user, averageRating, ratingCount, badges };
  }), [users, sellerRatings, vehicles]);

  const vehiclesWithRatings = useMemo(() => vehicles.map(vehicle => {
      const vehicleRatings = ratings[vehicle.id] || [];
      const ratingCount = vehicleRatings.length;
      const averageRating = ratingCount > 0 ? vehicleRatings.reduce((acc, curr) => acc + curr, 0) / ratingCount : 0;
      const seller = usersWithRatingsAndBadges.find(u => u.email === vehicle.sellerEmail);
      return { ...vehicle, averageRating, ratingCount, sellerName: seller?.dealershipName || seller?.name || 'Private Seller', sellerAverageRating: seller?.averageRating, sellerRatingCount: seller?.ratingCount, sellerBadges: seller?.badges };
  }), [vehicles, ratings, usersWithRatingsAndBadges]);
  
  const handleAddVehicle = useCallback(async (vehicleData: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>, isFeaturing: boolean) => {
    if (!currentUser || currentUser.role !== 'seller') { addToast('You must be logged in as a seller.', 'error'); return; }
    if (isFeaturing && (currentUser.featuredCredits || 0) <= 0) { addToast('You have no featured credits left.', 'error'); isFeaturing = false; }
    
    // FIX: Changed type from Omit<Vehicle, 'id'> to Vehicle to allow adding an ID.
    // FIX: Changed `isFeaturing` property shorthand to `isFeatured: isFeaturing` to match the Vehicle type definition.
    const newVehicle: Vehicle = { ...vehicleData, id: Date.now(), images: vehicleData.images && vehicleData.images.length > 0 ? vehicleData.images : [getPlaceholderImage(vehicleData.make, vehicleData.model), getPlaceholderImage(vehicleData.make, `${vehicleData.model}-2`)], sellerEmail: currentUser.email, status: 'published', isFeatured: isFeaturing, views: 0, inquiriesCount: 0, certificationStatus: 'none' };

    try {
        const addedVehicle = await vehicleService.addVehicle(newVehicle);
        setVehicles(prev => [addedVehicle, ...prev]);
        if (isFeaturing) {
            const updatedUser = { ...currentUser, featuredCredits: (currentUser.featuredCredits || 0) - 1 };
            await userService.updateUser(updatedUser);
            setUsers(prev => prev.map(u => u.email === currentUser.email ? updatedUser : u));
        }
        addToast(`Vehicle listed successfully!${isFeaturing ? ' It has been featured.' : ''}`, 'success');
    } catch (error) {
        console.error("Failed to add vehicle:", error);
        addToast(`Error: ${error instanceof Error ? error.message : 'Could not add vehicle.'}`, 'error');
    }
  }, [currentUser, addToast]);

  const handleAddMultipleVehicles = useCallback(async (newVehiclesData: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>[]) => {
    if (!currentUser || currentUser.role !== 'seller') { addToast('You must be logged in as a seller.', 'error'); return; }
    
    try {
        const addedVehicles: Vehicle[] = [];
        for (const vehicleData of newVehiclesData) {
            // FIX: Changed type from Omit<Vehicle, 'id'> to Vehicle to allow adding an ID.
            const newVehicle: Vehicle = { ...vehicleData, id: Date.now() + Math.random(), status: 'published', isFeatured: false, views: 0, inquiriesCount: 0, certificationStatus: 'none' };
            const added = await vehicleService.addVehicle(newVehicle);
            addedVehicles.push(added);
        }
        setVehicles(prev => [...addedVehicles, ...prev]);
        addToast(`${addedVehicles.length} vehicles listed successfully via bulk upload!`, 'success');
    } catch (error) {
        console.error("Failed to add multiple vehicles:", error);
        addToast(`Error: ${error instanceof Error ? error.message : 'Could not add vehicles.'}`, 'error');
    }
  }, [addToast, currentUser]);
  
  const handleUpdateVehicle = useCallback(async (updatedVehicle: Vehicle) => {
    try {
        const result = await vehicleService.updateVehicle(updatedVehicle);
        setVehicles(prev => prev.map(v => v.id === result.id ? result : v));
        addLogEntry('Updated Vehicle', String(result.id), `${result.year} ${result.make} ${result.model}`);
        addToast('Vehicle updated successfully!', 'success');
    } catch (error) {
        console.error("Failed to update vehicle:", error);
        addToast(`Error: ${error instanceof Error ? error.message : 'Could not update vehicle.'}`, 'error');
    }
  }, [addLogEntry, addToast]);

  const handleDeleteVehicle = useCallback(async (vehicleId: number) => {
    if(window.confirm('Are you sure you want to delete this vehicle listing? This action cannot be undone.')){
        try {
            await vehicleService.deleteVehicle(vehicleId);
            const vehicle = vehicles.find(v => v.id === vehicleId);
            if (vehicle) addLogEntry('Deleted Vehicle', String(vehicleId), `${vehicle.year} ${vehicle.make} ${vehicle.model}`);
            setVehicles(prev => prev.filter(v => v.id !== vehicleId));
            addToast('Vehicle listing has been deleted.', 'info');
        } catch(error) {
            console.error("Failed to delete vehicle:", error);
            addToast(`Error: ${error instanceof Error ? error.message : 'Could not delete vehicle.'}`, 'error');
        }
    }
  }, [vehicles, addLogEntry, addToast]);

  const handleMarkAsSold = useCallback(async (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    await handleUpdateVehicle({ ...vehicle, status: 'sold' });
    addToast('Vehicle marked as sold!', 'success');
  }, [vehicles, handleUpdateVehicle, addToast]);

  const handleToggleVehicleStatus = useCallback(async (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    const newStatus = vehicle.status === 'published' ? 'unpublished' : 'published';
    await handleUpdateVehicle({ ...vehicle, status: newStatus });
  }, [vehicles, handleUpdateVehicle]);

  const handleToggleVehicleFeature = useCallback(async (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    const newIsFeatured = !vehicle.isFeatured;
    await handleUpdateVehicle({ ...vehicle, isFeatured: newIsFeatured });
  }, [vehicles, handleUpdateVehicle]);
  
  const handleFeatureListing = useCallback(async (vehicleId: number) => {
    if (!currentUser || currentUser.role !== 'seller' || (currentUser.featuredCredits || 0) <= 0) {
        addToast('You have no featured credits left.', 'error');
        return;
    }
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    try {
        const updatedUser = { ...currentUser, featuredCredits: (currentUser.featuredCredits || 0) - 1 };
        await userService.updateUser(updatedUser);
        await handleUpdateVehicle({ ...vehicle, isFeatured: true });
        setUsers(prev => prev.map(u => u.email === currentUser.email ? updatedUser : u));
        addToast('Listing successfully featured!', 'success');
    } catch(error) {
        addToast('Failed to feature listing.', 'error');
    }
  }, [currentUser, vehicles, handleUpdateVehicle, addToast]);

  const handleRequestCertification = useCallback(async (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    await handleUpdateVehicle({ ...vehicle, certificationStatus: 'requested' });
    addToast('Certification requested. An admin will review it shortly.', 'info');
    // Notification logic remains client-side for now as there's no backend for it
  }, [vehicles, handleUpdateVehicle, addToast]);

  const handleCertificationApproval = useCallback(async (vehicleId: number, decision: 'approved' | 'rejected') => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    // This function will likely need more backend logic for billing/credit deduction
    let updatedVehicle = { ...vehicle, certificationStatus: decision };
    if (decision === 'approved') {
        updatedVehicle.certifiedInspection = { reportId: `RR-CERT-${Date.now()}-${vehicleId}`, summary: 'Passed comprehensive inspection.', date: new Date().toISOString(), inspector: 'ReRide Admin', scores: {}, details: {} };
    } else {
        updatedVehicle.certifiedInspection = null;
    }
    await handleUpdateVehicle(updatedVehicle);
  }, [vehicles, handleUpdateVehicle]);

  const handleToggleCompare = useCallback((vehicleId: number) => {
    setComparisonList(prev => {
      if (!prev.includes(vehicleId) && prev.length >= 4) { addToast("You can only compare up to 4 vehicles.", 'error'); return prev; }
      return prev.includes(vehicleId) ? prev.filter(id => id !== vehicleId) : [...prev, vehicleId];
    });
  }, [addToast]);

  const handleClearCompare = useCallback(() => setComparisonList([]), []);
  const handleSelectVehicle = useCallback((vehicle: Vehicle) => {
    logViewedVehicle(vehicle.id);
    setSelectedVehicle(vehicle);
    setCurrentView(View.DETAIL);
    handleUpdateVehicle({ ...vehicle, views: (vehicle.views || 0) + 1 });
  }, [handleUpdateVehicle]);
  const handleBackToHome = useCallback(() => { setSelectedVehicle(null); setCurrentView(View.HOME); }, []);

  const loginUser = useCallback((user: User) => {
      setCurrentUser(user);
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      const firstName = user.name ? user.name.split(' ')[0] : 'there';
      addToast(`Welcome back, ${firstName}!`, 'success');
  }, [addToast]);

  const handleSellerLogin = useCallback((user: User) => { loginUser(user); setCurrentView(View.SELLER_DASHBOARD); }, [loginUser]);
  const handleCustomerLogin = useCallback((user: User) => { loginUser(user); setCurrentView(View.HOME); }, [loginUser]);
  const handleAdminLogin = useCallback((user: User) => { loginUser(user); setCurrentView(View.ADMIN_PANEL); }, [loginUser]);
  
  const handleSellerRegister = useCallback((user: User) => {
    setUsers(prev => [...prev, user]);
    loginUser(user);
    setCurrentView(View.SELLER_DASHBOARD);
    addToast('Registration successful!', 'success');
  }, [loginUser, addToast]);

  const handleCustomerRegister = useCallback((user: User) => {
    setUsers(prev => [...prev, user]);
    loginUser(user);
    setCurrentView(View.HOME);
    addToast('Registration successful!', 'success');
  }, [loginUser, addToast]);
  
  const handleToggleUserStatus = useCallback(async (userEmail: string) => {
    const user = users.find(u => u.email === userEmail);
    if (!user) return;
    try {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        await userService.updateUser({ email: userEmail, status: newStatus });
        setUsers(prev => prev.map(u => u.email === userEmail ? { ...u, status: newStatus } : u));
        addToast(`User has been ${newStatus}.`, 'success');
    } catch (error) {
        addToast('Failed to update user status.', 'error');
    }
  }, [users, addToast]);
  
  const handleDeleteUser = useCallback(async (userEmail: string) => {
    if (window.confirm('Are you sure you want to permanently delete this user?')) {
        try {
            await userService.deleteUser(userEmail);
            setUsers(prev => prev.filter(user => user.email !== userEmail));
            setVehicles(prev => prev.filter(v => v.sellerEmail !== userEmail));
            addToast('User deleted.', 'info');
        } catch(error) {
            addToast('Failed to delete user.', 'error');
        }
    }
  }, [addToast]);

  const handleAdminUpdateUser = useCallback(async (email: string, details: Partial<User>) => {
    try {
        await userService.updateUser({ email, ...details });
        setUsers(prev => prev.map(u => u.email === email ? { ...u, ...details } : u));
        addToast("User updated.", "success");
    } catch(error) {
        addToast('Failed to update user.', 'error');
    }
  }, [addToast]);

  const handleUpdateUserProfile = useCallback(async (updatedDetails: { name: string; mobile: string; avatarUrl?: string }) => {
    if (!currentUser) return;
    try {
        const updatedUser = await userService.updateUser({ email: currentUser.email, ...updatedDetails });
        if (updatedUser) {
            setUsers(prev => prev.map(u => u.email === currentUser.email ? updatedUser : u));
            addToast('Profile updated!', 'success');
        } else {
            throw new Error('Failed to retrieve updated user profile from server.');
        }
    } catch(error) {
        addToast(error instanceof Error ? error.message : 'Failed to update profile.', 'error');
    }
  }, [currentUser, addToast]);
  
  const handleUpdateSellerProfile = useCallback(async (updatedDetails: { dealershipName: string; bio: string; logoUrl: string; }) => {
     if (!currentUser) return;
     try {
        const updatedUser = await userService.updateUser({ email: currentUser.email, ...updatedDetails });
        if (updatedUser) {
            setUsers(prev => prev.map(u => u.email === currentUser.email ? updatedUser : u));
            addToast('Seller profile updated!', 'success');
        } else {
             throw new Error('Failed to retrieve updated seller profile from server.');
        }
     } catch(error) {
        addToast(error instanceof Error ? error.message : 'Failed to update profile.', 'error');
     }
  }, [currentUser, addToast]);

  const handleUpdateUserPassword = useCallback(async (passwords: { current: string; new: string; }): Promise<boolean> => {
    if (!currentUser) return false;
    // Password change requires special handling on the backend, not implemented in this simplified API
    addToast('Password change functionality not fully implemented.', 'info');
    return false;
  }, [currentUser, addToast]);

  const handleForgotPasswordRequest = useCallback((email: string) => { console.log(`Password reset for ${email} as a ${forgotPasswordRole}.`); }, [forgotPasswordRole]);

  const handleFlagContent = useCallback((type: 'vehicle' | 'conversation', id: number | string, reason: string) => {
    addToast('Content has been reported for review. Thank you.', 'info');
    // This would ideally be a backend call
  }, [addToast]);

  const handleResolveFlag = useCallback(async (type: 'vehicle' | 'conversation', id: number | string) => {
      addToast('Flag has been resolved.', 'success');
      // This would ideally be a backend call
  }, [addToast]);

  const handleAdminUpdateSettings = useCallback((newSettings: PlatformSettings) => { setPlatformSettings(newSettings); addToast('Platform settings updated.', 'success'); }, []);
  const handleAdminSendBroadcast = useCallback((message: string) => { addToast('Broadcast message sent.', 'success'); }, []);
  const getFormattedDate = useCallback(() => new Date().toISOString().split('T')[0], []);

  const handleExportUsers = useCallback(() => exportToCsv(`users_${getFormattedDate()}.csv`, users.map(({ password, ...rest }) => rest)), [users, getFormattedDate]);
  const handleExportVehicles = useCallback(() => exportToCsv(`vehicles_${getFormattedDate()}.csv`, vehicles), [vehicles, getFormattedDate]);
  const handleExportSales = useCallback(() => {
    const salesData = vehicles.filter(v => v.status === 'sold');
    if (salesData.length > 0) exportToCsv(`sales_${getFormattedDate()}.csv`, salesData);
    else addToast("No sales data to export.", 'info');
  }, [vehicles, addToast, getFormattedDate]);

  const handleUpdateVehicleData = useCallback((newData: VehicleData) => { setVehicleData(newData); saveVehicleData(newData); addToast('Vehicle data updated.', 'success'); }, [addToast]);
  
  const handleToggleVerifiedStatus = useCallback(async (userEmail: string) => {
    const user = users.find(u => u.email === userEmail);
    if (!user) return;
    try {
        const newIsVerified = !user.isVerified;
        await userService.updateUser({ email: userEmail, isVerified: newIsVerified });
        setUsers(prev => prev.map(u => u.email === userEmail ? { ...u, isVerified: newIsVerified } : u));
        addToast(`Seller has been ${newIsVerified ? 'verified' : 'un-verified'}.`, 'info');
    } catch (error) {
        addToast('Failed to update verification status.', 'error');
    }
  }, [users, addToast]);
  
  const handlePlanChange = useCallback(async (planId: SubscriptionPlan) => {
      if (!currentUser || currentUser.role !== 'seller') return;
      const planDetails = PLAN_DETAILS[planId];
      try {
        const updatedUser = { ...currentUser, subscriptionPlan: planId, featuredCredits: (currentUser.featuredCredits || 0) + planDetails.featuredCredits };
        await userService.updateUser(updatedUser);
        setUsers(prev => prev.map(u => u.email === currentUser.email ? updatedUser : u));
        addToast(`Successfully upgraded to the ${planDetails.name} plan!`, 'success');
        navigate(View.SELLER_DASHBOARD);
      } catch(error) {
          addToast('Failed to upgrade plan.', 'error');
      }
  }, [currentUser, addToast]);

  const navigate = useCallback((view: View) => {
    const isNavigatingAwayFromSellerProfile = currentView === View.SELLER_PROFILE && view !== View.SELLER_PROFILE;
    if (isNavigatingAwayFromSellerProfile) { window.history.pushState({}, '', window.location.pathname); setPublicSellerProfile(null); }
    setInitialSearchQuery('');
    const preserveSelectedVehicle = (view === View.SELLER_PROFILE && currentView === View.DETAIL) || (view === View.DETAIL && currentView === View.SELLER_PROFILE);
    if (!preserveSelectedVehicle) setSelectedVehicle(null);
    if (view === View.USED_CARS) setSelectedCategory('ALL');
    if (view === View.SELLER_DASHBOARD && currentUser?.role !== 'seller') setCurrentView(View.LOGIN_PORTAL);
    else if (view === View.ADMIN_PANEL && currentUser?.role !== 'admin') setCurrentView(View.ADMIN_LOGIN);
    else if ((view === View.PROFILE || view === View.INBOX) && !currentUser) setCurrentView(View.LOGIN_PORTAL);
    else setCurrentView(view);
  }, [currentView, currentUser]);
  
  const handleHomeSearch = useCallback((query: string) => { setInitialSearchQuery(query); setCurrentView(View.USED_CARS); }, []);

  // FIX: Added handler for onSelectCategory prop for Home component.
  const handleSelectCategoryFromHome = useCallback((category: VehicleCategory) => {
    setSelectedCategory(category);
    navigate(View.USED_CARS);
  }, [navigate]);

  const handleMarkNotificationsAsRead = useCallback((ids: number[]) => { setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, isRead: true } : n)); }, []);
  const handleNotificationClick = useCallback((notification: Notification) => {
    handleMarkNotificationsAsRead([notification.id]);
    if (currentUser?.role === 'admin') navigate(View.ADMIN_PANEL);
    else if (currentUser?.role === 'seller') navigate(View.SELLER_DASHBOARD);
  }, [currentUser, navigate, handleMarkNotificationsAsRead]);

  const handleAddSupportTicket = useCallback((ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'replies' | 'status'>) => {
    const newTicket: SupportTicket = { ...ticketData, id: Date.now(), status: 'Open', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), replies: [] };
    setSupportTickets(prev => [newTicket, ...prev]);
    addToast('Support ticket submitted!', 'success');
    navigate(View.HOME);
  }, [addToast, navigate]);

  const handleUpdateSupportTicket = useCallback((updatedTicket: SupportTicket) => {
    setSupportTickets(prev => prev.map(t => t.id === updatedTicket.id ? { ...updatedTicket, updatedAt: new Date().toISOString() } : t));
    addToast('Support ticket updated!', 'info');
  }, [addToast]);

  const handleAddFaq = useCallback((faqData: Omit<FAQItem, 'id'>) => {
    const newFaq: FAQItem = { ...faqData, id: Date.now() };
    setFaqItems(prev => [...prev, newFaq]);
    addToast('FAQ item added!', 'success');
  }, [addToast]);

  const handleUpdateFaq = useCallback((updatedFaq: FAQItem) => {
    setFaqItems(prev => prev.map(f => f.id === updatedFaq.id ? updatedFaq : f));
    addToast('FAQ item updated!', 'success');
  }, [addToast]);

  const handleDeleteFaq = useCallback((faqId: number) => { setFaqItems(prev => prev.filter(f => f.id !== faqId)); addToast('FAQ item deleted!', 'info'); }, [addToast]);
  const handleLocationChange = useCallback((newLocation: string) => {
    if (newLocation && newLocation !== userLocation) { setUserLocation(newLocation); try { localStorage.setItem('reRideUserLocation', newLocation); addToast(`Location set to ${newLocation}`, 'info'); } catch (error) { console.error("Failed to save location", error); addToast("Could not save location.", "error"); } }
  }, [addToast, userLocation]);
  
  const handleViewSellerProfile = useCallback((sellerEmail: string) => {
    const sellerUser = usersWithRatingsAndBadges.find(u => u.email === sellerEmail && u.role === 'seller');
    if (sellerUser) { setPreviousView(currentView); setPublicSellerProfile(sellerUser); navigate(View.SELLER_PROFILE); window.history.pushState({}, '', `${window.location.pathname}?seller=${sellerEmail}`); }
    else { addToast('Seller profile not found.', 'error'); }
  }, [currentView, usersWithRatingsAndBadges, addToast, navigate]);

  const vehiclesToCompare = useMemo(() => vehiclesWithRatings.filter(v => comparisonList.includes(v.id)), [vehiclesWithRatings, comparisonList]);
  const vehiclesInWishlist = useMemo(() => vehiclesWithRatings.filter(v => wishlist.includes(v.id)), [vehiclesWithRatings, wishlist]);
  const selectedVehicleWithRating = useMemo(() => { if (!selectedVehicle) return null; return vehiclesWithRatings.find(v => v.id === selectedVehicle.id) || selectedVehicle; }, [selectedVehicle, vehiclesWithRatings])
  const allPublishedVehicles = useMemo(() => vehiclesWithRatings.filter(v => v.status === 'published'), [vehiclesWithRatings]);
  const featuredVehicles = useMemo(() => vehiclesWithRatings.filter(v => v.isFeatured && v.status === 'published').slice(0, 4), [vehiclesWithRatings]);
  const inboxUnreadCount = useMemo(() => { if (!currentUser || currentUser.role !== 'customer') return 0; return conversations.filter(c => c.customerId === currentUser.email && !c.isReadByCustomer).length; }, [conversations, currentUser]);

  const renderContent = () => {
    if (isLoading && currentView === View.HOME) return <LoadingSpinner />;
    
    const authViews = [View.LOGIN_PORTAL, View.CUSTOMER_LOGIN, View.SELLER_LOGIN, View.ADMIN_LOGIN, View.FORGOT_PASSWORD];
    if (authViews.includes(currentView)) {
      const AuthWrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (<div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-gradient-main p-4">{children}</div>);
      switch (currentView) {
        case View.LOGIN_PORTAL: return <AuthWrapper><LoginPortal onNavigate={navigate} /></AuthWrapper>;
        case View.CUSTOMER_LOGIN: return <AuthWrapper><CustomerLogin onLogin={handleCustomerLogin} onRegister={handleCustomerRegister} onNavigate={navigate} onForgotPassword={() => { setForgotPasswordRole('customer'); navigate(View.FORGOT_PASSWORD); }} /></AuthWrapper>;
        case View.SELLER_LOGIN: return <AuthWrapper><Login onLogin={handleSellerLogin} onRegister={handleSellerRegister} onNavigate={navigate} onForgotPassword={() => { setForgotPasswordRole('seller'); navigate(View.FORGOT_PASSWORD); }}/></AuthWrapper>;
        case View.ADMIN_LOGIN: return <AuthWrapper><AdminLogin onLogin={handleAdminLogin} onNavigate={navigate} /></AuthWrapper>;
        case View.FORGOT_PASSWORD: return <AuthWrapper><ForgotPassword onResetRequest={handleForgotPasswordRequest} onBack={() => navigate(forgotPasswordRole === 'customer' ? View.CUSTOMER_LOGIN : View.SELLER_LOGIN)}/></AuthWrapper>;
      }
    }
    
    switch (currentView) {
      case View.SUPPORT: return <SupportPage currentUser={currentUser} onSubmitTicket={handleAddSupportTicket} />;
      case View.FAQ: return <FAQPage faqItems={faqItems} />;
      case View.PRICING: return <PricingPage currentUser={currentUser} onSelectPlan={handlePlanChange} />;
      case View.SELLER_PROFILE: return publicSellerProfile && <SellerProfilePage seller={usersWithRatingsAndBadges.find(u => u.email === publicSellerProfile.email)!} vehicles={vehiclesWithRatings.filter(v => v.sellerEmail === publicSellerProfile.email && v.status === 'published')} onSelectVehicle={handleSelectVehicle} comparisonList={comparisonList} onToggleCompare={handleToggleCompare} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onBack={() => navigate(previousView || View.HOME)} onViewSellerProfile={() => {}} />;
      case View.DETAIL: return selectedVehicleWithRating && <VehicleDetail vehicle={selectedVehicleWithRating} onBack={() => navigate(View.USED_CARS)} comparisonList={comparisonList} onToggleCompare={handleToggleCompare} onAddSellerRating={handleAddSellerRating} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} currentUser={currentUser} onFlagContent={handleFlagContent} users={usersWithRatingsAndBadges} onViewSellerProfile={handleViewSellerProfile} onStartChat={handleStartChat} recommendations={recommendations} onSelectVehicle={handleSelectVehicle} />;
      case View.SELLER_DASHBOARD: return currentUser?.role === 'seller' ? <Dashboard seller={usersWithRatingsAndBadges.find(u => u.email === currentUser.email)!} sellerVehicles={vehiclesWithRatings.filter(v => v.sellerEmail === currentUser.email)} reportedVehicles={vehicles.filter(v => v.sellerEmail === currentUser.email && v.isFlagged)} onAddVehicle={handleAddVehicle} onAddMultipleVehicles={handleAddMultipleVehicles} onUpdateVehicle={handleUpdateVehicle} onDeleteVehicle={handleDeleteVehicle} onMarkAsSold={handleMarkAsSold} conversations={conversations.filter(c => c.sellerId === currentUser.email)} onSellerSendMessage={handleSellerSendMessage} onMarkConversationAsReadBySeller={handleMarkConversationAsReadBySeller} typingStatus={typingStatus} onUserTyping={handleUserTyping} onMarkMessagesAsRead={handleMarkMessagesAsRead} onUpdateSellerProfile={handleUpdateSellerProfile} vehicleData={vehicleData} onFeatureListing={handleFeatureListing} onRequestCertification={handleRequestCertification} onNavigate={navigate} allVehicles={allPublishedVehicles} onOfferResponse={handleOfferResponse} /> : <LoadingSpinner />;
      case View.ADMIN_PANEL: return currentUser?.role === 'admin' ? <AdminPanel users={users} currentUser={currentUser} vehicles={vehicles} conversations={conversations} onToggleUserStatus={handleToggleUserStatus} onDeleteUser={handleDeleteUser} onAdminUpdateUser={handleAdminUpdateUser} onUpdateVehicle={handleUpdateVehicle} onDeleteVehicle={handleDeleteVehicle} onToggleVehicleStatus={handleToggleVehicleStatus} onToggleVehicleFeature={handleToggleVehicleFeature} onResolveFlag={handleResolveFlag} platformSettings={platformSettings} onUpdateSettings={handleAdminUpdateSettings} onSendBroadcast={handleAdminSendBroadcast} auditLog={auditLog} onExportUsers={handleExportUsers} onExportVehicles={handleExportVehicles} onExportSales={handleExportSales} vehicleData={vehicleData} onUpdateVehicleData={handleUpdateVehicleData} onToggleVerifiedStatus={handleToggleVerifiedStatus} supportTickets={supportTickets} onUpdateSupportTicket={handleUpdateSupportTicket} faqItems={faqItems} onAddFaq={handleAddFaq} onUpdateFaq={handleUpdateFaq} onDeleteFaq={handleDeleteFaq} onCertificationApproval={handleCertificationApproval} /> : <LoadingSpinner />;
      case View.COMPARISON: return <Comparison vehicles={vehiclesToCompare} onBack={() => navigate(View.USED_CARS)} onToggleCompare={handleToggleCompare} />;
      case View.PROFILE: return currentUser && <Profile currentUser={currentUser} onUpdateProfile={handleUpdateUserProfile} onUpdatePassword={handleUpdateUserPassword} />;
      case View.INBOX: return currentUser && <CustomerInbox conversations={conversations.filter(c => c.customerId === currentUser.email)} onSendMessage={handleCustomerSendMessage} onMarkAsRead={handleMarkConversationAsReadByCustomer} users={users} typingStatus={typingStatus} onUserTyping={handleUserTyping} onMarkMessagesAsRead={handleMarkMessagesAsRead} onFlagContent={handleFlagContent} onOfferResponse={handleOfferResponse} />;
      case View.USED_CARS: return <VehicleList vehicles={allPublishedVehicles} isLoading={isLoading} onSelectVehicle={handleSelectVehicle} comparisonList={comparisonList} onToggleCompare={handleToggleCompare} onClearCompare={handleClearCompare} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} categoryTitle="All Used Cars" initialCategory={selectedCategory} initialSearchQuery={initialSearchQuery} onViewSellerProfile={handleViewSellerProfile} />;
      case View.NEW_CARS: return <NewCars />;
      case View.DEALER_PROFILES: return <DealerProfiles sellers={usersWithRatingsAndBadges.filter(u => u.role === 'seller')} onViewProfile={handleViewSellerProfile} />;
      case View.WISHLIST: return <VehicleList vehicles={vehiclesInWishlist} isLoading={isLoading} onSelectVehicle={handleSelectVehicle} comparisonList={comparisonList} onToggleCompare={handleToggleCompare} onClearCompare={handleClearCompare} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} categoryTitle="My Wishlist" isWishlistMode={true} onViewSellerProfile={handleViewSellerProfile} />;
      case View.HOME:
      default:
        return <Home onSearch={handleHomeSearch} onSelectCategory={handleSelectCategoryFromHome} featuredVehicles={featuredVehicles} onSelectVehicle={handleSelectVehicle} onToggleCompare={handleToggleCompare} comparisonList={comparisonList} onToggleWishlist={handleToggleWishlist} wishlist={wishlist} onViewSellerProfile={handleViewSellerProfile} recommendations={recommendations} allVehicles={allPublishedVehicles} onNavigate={navigate} />;
    }
  };
  
  const inboxCount = useMemo(() => { if(!currentUser || currentUser.role !== 'customer') return 0; return conversations.filter(c => c.customerId === currentUser.email && !c.isReadByCustomer).length; }, [conversations, currentUser]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header onNavigate={navigate} currentUser={currentUser} onLogout={handleLogout} compareCount={comparisonList.length} wishlistCount={wishlist.length} inboxCount={inboxCount} isHomePage={isHomePage} notifications={notifications.filter(n => n.recipientEmail === currentUser?.email)} onNotificationClick={handleNotificationClick} onMarkNotificationsAsRead={handleMarkNotificationsAsRead} onMarkAllNotificationsAsRead={() => handleMarkNotificationsAsRead(notifications.filter(n => !n.isRead && n.recipientEmail === currentUser?.email).map(n => n.id))} onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} userLocation={userLocation} onLocationChange={handleLocationChange} addToast={addToast} />
      <main className="flex-grow pt-16">
        <Suspense fallback={<LoadingSpinner />}>{renderContent()}</Suspense>
      </main>
      {activeChat && currentUser && <ChatWidget conversation={activeChat} currentUserRole={currentUser.role as 'customer' | 'seller'} otherUserName={currentUser.role === 'customer' ? (users.find(u => u.email === activeChat.sellerId)?.name || 'Seller') : activeChat.customerName} onClose={() => setActiveChat(null)} onSendMessage={(msg, type, payload) => { if (currentUser.role === 'customer') { handleCustomerSendMessage(activeChat.vehicleId, msg, type, payload); } }} typingStatus={typingStatus} onUserTyping={handleUserTyping} onMarkMessagesAsRead={handleMarkMessagesAsRead} onFlagContent={handleFlagContent} onOfferResponse={handleOfferResponse} />}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Footer onNavigate={navigate} />
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} onNavigate={(view) => { navigate(view); setIsCommandPaletteOpen(false); }} currentUser={currentUser} onLogout={() => { handleLogout(); setIsCommandPaletteOpen(false); }} />
    </div>
  );
};
export default App;