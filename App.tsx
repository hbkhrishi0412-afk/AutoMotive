

import React, { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import { PLAN_DETAILS, MOCK_SUPPORT_TICKETS, MOCK_FAQS } from './constants';
import type { Vehicle, User, Conversation, ChatMessage, Toast as ToastType, PlatformSettings, AuditLogEntry, VehicleData, Notification, VehicleCategory, Badge, Command, SubscriptionPlan, CertifiedInspection, SupportTicket, FAQItem } from './types';
import { View, VehicleCategory as CategoryEnum } from './types';
import { getRatings, addRating, getSellerRatings, addSellerRating } from './services/ratingService';
import { getConversations, saveConversations } from './services/chatService';
import { getVehicles, saveVehicles } from './services/vehicleService';
import { getUsers, saveUsers } from './services/userService';
import LoginPortal from './components/LoginPortal';
import CustomerLogin from './components/CustomerLogin';
import AdminLogin from './components/AdminLogin';
import Login from './components/Login';
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
const Dashboard = lazy(() => import('./components/Dashboard'));
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
  
  const processAndSetData = useCallback((vehiclesData: Vehicle[], usersData: User[]) => {
      const processedVehicles = vehiclesData.map(v => ({
          ...v,
          category: v.category || CategoryEnum.FOUR_WHEELER,
          status: v.status || 'published',
          isFeatured: v.isFeatured || false,
          views: v.views || 0,
          inquiriesCount: v.inquiriesCount || 0,
          isFlagged: v.isFlagged || false,
          flagReason: v.flagReason || undefined,
          flaggedAt: v.flaggedAt || undefined,
          certifiedInspection: v.certifiedInspection || null,
          certificationStatus: v.certificationStatus || 'none',
      }));

      const processedUsers = usersData.map(u => ({
          ...u, 
          status: u.status || 'active',
          subscriptionPlan: u.subscriptionPlan || 'free',
          featuredCredits: u.featuredCredits ?? PLAN_DETAILS[u.subscriptionPlan || 'free'].featuredCredits,
          usedCertifications: u.usedCertifications || 0,
      }));
      
      setVehicles(processedVehicles);
      setUsers(processedUsers);
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            // These services now get from localStorage or fall back to mock data
            const [vehiclesData, usersData] = await Promise.all([
                getVehicles(),
                getUsers()
            ]);
            processAndSetData(vehiclesData, usersData);
        } catch (error) {
            console.error("Failed to load initial data", error);
            addToast("Error loading application data.", "error");
        } finally {
            setIsLoading(false);
        }
    };

    loadInitialData();
  }, [addToast, processAndSetData]);

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

  /**
   * Saves the viewed vehicle ID to localStorage under the key `viewedVehicleIds`.
   * If the ID already exists, it's moved to the front of the list.
   * The list is limited to the last 20 viewed vehicle IDs.
   * @param vehicleId The ID of the vehicle that was viewed.
   */
  const logViewedVehicle = (vehicleId: number) => {
      try {
          const viewedJson = localStorage.getItem('viewedVehicleIds');
          let viewedIds: number[] = viewedJson ? JSON.parse(viewedJson) : [];
          // Remove if already exists to move it to the front
          viewedIds = viewedIds.filter(id => id !== vehicleId);
          // Add to the front and keep only the last 20
          viewedIds.unshift(vehicleId);
          localStorage.setItem('viewedVehicleIds', JSON.stringify(viewedIds.slice(0, 20)));
      } catch (error) {
          console.error("Failed to log viewed vehicle:", error);
      }
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
    // Fetch recommendations when user activity changes
    const fetchRecommendations = async () => {
        if (!currentUser) {
            setRecommendations([]); // Clear recommendations if logged out
            return;
        }

        const viewed = getViewedVehicles();
        if (viewed.length === 0 && wishlist.length === 0 && comparisonList.length === 0) {
            setRecommendations([]); // No activity, no recommendations
            return;
        }

        const cachedRecs = sessionStorage.getItem('vehicleRecommendations');
        if (cachedRecs) {
            const { ids, timestamp } = JSON.parse(cachedRecs);
            if (Date.now() - timestamp < 1000 * 60 * 30) { // 30 min cache
                setRecommendations(vehicles.filter(v => ids.includes(v.id)));
                return;
            }
        }
        
        const vehicleContext = vehicles
          .filter(v => v.status === 'published')
          .map(v => ({ id: v.id, make: v.make, model: v.model, year: v.year, price: v.price, features: v.features.slice(0, 5), fuelType: v.fuelType }));

        const recommendedIds = await getVehicleRecommendations(
            { viewed, wishlisted: wishlist, compared: comparisonList },
            vehicleContext
        );
        
        if (recommendedIds.length > 0) {
            setRecommendations(vehicles.filter(v => recommendedIds.includes(v.id)));
            sessionStorage.setItem('vehicleRecommendations', JSON.stringify({ ids: recommendedIds, timestamp: Date.now() }));
        }
    };

    const debounceTimer = setTimeout(fetchRecommendations, 1000); // Debounce to avoid rapid calls
    return () => clearTimeout(debounceTimer);

  }, [currentUser, wishlist, comparisonList, vehicles]);


  useEffect(() => {
    if (isHomePage) {
      document.body.classList.add('homepage-active');
    } else {
      document.body.classList.remove('homepage-active');
    }
    // Cleanup on component unmount
    return () => {
      document.body.classList.remove('homepage-active');
    };
  }, [isHomePage]);

  useEffect(() => {
    // Show the banner whenever a new announcement is set by the admin
    if (platformSettings.siteAnnouncement) {
        setIsAnnouncementVisible(true);
    }
  }, [platformSettings.siteAnnouncement]);

  useEffect(() => {
    const sessionUserJson = sessionStorage.getItem('currentUser');
    if (sessionUserJson) {
        setCurrentUser(JSON.parse(sessionUserJson));
    }
    
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }
    const loadedConversations = getConversations();
    setConversations(loadedConversations.map(c => ({
      ...c,
      isReadByCustomer: c.isReadByCustomer ?? true,
      messages: c.messages.map(m => ({ ...m, isRead: m.isRead ?? true })),
      isFlagged: c.isFlagged || false,
      flagReason: c.flagReason || undefined,
      flaggedAt: c.flaggedAt || undefined,
    })));

    // Check for seller profile view from URL on initial load
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
  }, [addToast, users]); // Depend on users to run after they are loaded
  
   useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
            event.preventDefault();
            setIsCommandPaletteOpen(prev => !prev);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
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
            if (updatedUserInState?.status === 'inactive') {
                addToast("Your account has been deactivated by an administrator.", "error");
            }
        }
    }
  }, [users, currentUser, handleLogout, addToast]);

  useEffect(() => {
    // Handle new message notifications
    if (!prevConversationsRef.current || !currentUser) {
      // First run or no user, just populate the ref and do nothing else.
      prevConversationsRef.current = conversations;
      return;
    }
  
    // Find new messages by comparing current and previous conversations state
    conversations.forEach(currentConv => {
      const prevConv = prevConversationsRef.current!.find(p => p.id === currentConv.id);
  
      if (prevConv && currentConv.messages.length > prevConv.messages.length) {
        const lastMessage = currentConv.messages[currentConv.messages.length - 1];
  
        // Determine if the current user is the recipient of this new message.
        const isRecipient =
          (currentUser.role === 'customer' && lastMessage.sender === 'seller') ||
          (currentUser.role === 'seller' && lastMessage.sender === 'user');
  
        if (isRecipient && activeChat?.id !== currentConv.id) {
          const senderName =
            currentUser.role === 'customer'
              ? users.find(u => u.email === currentConv.sellerId)?.name || 'The Seller'
              : currentConv.customerName;
  
          showNotification(`New message from ${senderName}`, {
            body: lastMessage.text.length > 100 ? `${lastMessage.text.substring(0, 97)}...` : lastMessage.text,
            icon: `data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🚗</text></svg>`
          });
        }
      }
    });
  
    // After checking, update the ref for the next render.
    prevConversationsRef.current = conversations;
  }, [conversations, currentUser, users, activeChat]);

  useEffect(() => {
    setRatings(getRatings());
    setSellerRatings(getSellerRatings());
  }, []);
  
  useEffect(() => {
    if (!isLoading) { // Only save to localStorage after initial load from DB
      saveUsers(users);
    }
  }, [users, isLoading]);
  
  useEffect(() => {
     if (!isLoading) { // Only save to localStorage after initial load from DB
      saveVehicles(vehicles);
     }
  }, [vehicles, isLoading]);
  
  useEffect(() => {
    saveConversations(conversations);
    // update active chat if it exists
    if(activeChat){
      const updatedChat = conversations.find(c => c.id === activeChat.id);
      if(updatedChat) {
        setActiveChat(updatedChat);
      }
    }
  }, [conversations, activeChat]);

  useEffect(() => {
    saveSettings(platformSettings);
  }, [platformSettings]);

  useEffect(() => {
    saveAuditLog(auditLog);
  }, [auditLog]);

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
      const newWishlist = isAdding
        ? [...prev, vehicleId]
        : prev.filter(id => id !== vehicleId);
      localStorage.setItem('wishlist', JSON.stringify(newWishlist));
      addToast(isAdding ? 'Added to wishlist!' : 'Removed from wishlist.', 'info');
      return newWishlist;
    });
  }, [addToast]);

  const handleUserTyping = useCallback((conversationId: string, userRole: 'customer' | 'seller') => {
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }
    setTypingStatus({ conversationId, userRole });
    typingTimeoutRef.current = window.setTimeout(() => {
        setTypingStatus(null);
    }, 2000);
  }, []);

  const handleMarkMessagesAsRead = useCallback((conversationId: string, readerRole: 'customer' | 'seller') => {
    setConversations(prev =>
        prev.map(conv => {
            if (conv.id === conversationId) {
                const updatedMessages = conv.messages.map(msg => {
                    const readerSenderType = readerRole === 'customer' ? 'user' : 'seller';
                    if (msg.sender !== readerSenderType && msg.sender !== 'system' && !msg.isRead) {
                        return { ...msg, isRead: true };
                    }
                    return msg;
                });
                return { ...conv, messages: updatedMessages };
            }
            return conv;
        })
    );
  }, []);

  const handleStartChat = useCallback((vehicle: Vehicle) => {
    if (!currentUser || currentUser.role !== 'customer') {
        addToast('Please log in as a customer to start a chat.', 'info');
        navigate(View.CUSTOMER_LOGIN);
        return;
    }
    const conversationId = `${currentUser.email}-${vehicle.id}`;
    const existingConversation = conversations.find(c => c.id === conversationId);

    if (existingConversation) {
        setActiveChat(existingConversation);
    } else {
        const placeholder: Conversation = {
            id: conversationId,
            customerId: currentUser.email,
            customerName: currentUser.name,
            sellerId: vehicle.sellerEmail,
            vehicleId: vehicle.id,
            vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.variant || ''}`.trim(),
            vehiclePrice: vehicle.price,
            messages: [],
            lastMessageAt: new Date().toISOString(),
            isReadBySeller: false,
            isReadByCustomer: true,
        };
        setActiveChat(placeholder);
    }
  }, [currentUser, conversations, addToast]);

  const handleCustomerSendMessage = useCallback((vehicleId: number, messageText: string, type: ChatMessage['type'] = 'text', payload?: ChatMessage['payload']) => {
    if (!currentUser || currentUser.role !== 'customer') return;

    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) {
        addToast("Could not find vehicle details.", "error");
        return;
    }
    
    setVehicles(prev => {
        const vehicleIndex = prev.findIndex(v => v.id === vehicleId);
        if (vehicleIndex === -1) return prev;

        const updatedVehicle = { 
            ...prev[vehicleIndex], 
            inquiriesCount: (prev[vehicleIndex].inquiriesCount || 0) + 1 
        };
        
        const newVehicles = [...prev];
        newVehicles[vehicleIndex] = updatedVehicle;
        return newVehicles;
    });

    const conversationId = `${currentUser.email}-${vehicle.id}`;
    
    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      text: messageText,
      timestamp: new Date().toISOString(),
      isRead: false,
      type,
      payload
    };

    setConversations(prev => {
        const existingConversationIndex = prev.findIndex(c => c.id === conversationId);

        if (existingConversationIndex > -1) {
            const updatedConversations = [...prev];
            const updatedConversation = {
                ...updatedConversations[existingConversationIndex],
                messages: [...updatedConversations[existingConversationIndex].messages, userMessage],
                lastMessageAt: userMessage.timestamp,
                isReadBySeller: false,
                isReadByCustomer: true,
            };
            updatedConversations[existingConversationIndex] = updatedConversation;
            return updatedConversations;
        } else {
            const newConversation: Conversation = {
                id: conversationId,
                customerId: currentUser.email,
                customerName: currentUser.name,
                sellerId: vehicle.sellerEmail,
                vehicleId: vehicle.id,
                vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.variant || ''}`.trim(),
                vehiclePrice: vehicle.price,
                messages: [userMessage],
                lastMessageAt: userMessage.timestamp,
                isReadBySeller: false,
                isReadByCustomer: true,
            };
            return [...prev, newConversation];
        }
    });
  }, [currentUser, vehicles, addToast]);
  
  const handleSellerSendMessage = useCallback((conversationId: string, messageText: string, type: ChatMessage['type'] = 'text', payload?: ChatMessage['payload']) => {
    if (!currentUser || currentUser.role !== 'seller') return;

    setConversations(prev => {
        const convIndex = prev.findIndex(c => c.id === conversationId);
        if (convIndex === -1) return prev;

        const sellerMessage: ChatMessage = {
            id: Date.now(),
            sender: 'seller',
            text: messageText,
            timestamp: new Date().toISOString(),
            isRead: false,
            type,
            payload
        };

        const updatedConv = {
            ...prev[convIndex],
            messages: [...prev[convIndex].messages, sellerMessage],
            lastMessageAt: sellerMessage.timestamp,
            isReadByCustomer: false,
        };

        const newConversations = [...prev];
        newConversations[convIndex] = updatedConv;
        return newConversations;
    });
  }, [currentUser]);

  const handleOfferResponse = useCallback((conversationId: string, messageId: number, response: 'accepted' | 'rejected' | 'countered', counterPrice?: number) => {
    setConversations(prevConvs => {
        const convIndex = prevConvs.findIndex(c => c.id === conversationId);
        if (convIndex === -1) return prevConvs;

        const newConvs = [...prevConvs];
        const conv = { ...newConvs[convIndex] };
        const msgIndex = conv.messages.findIndex(m => m.id === messageId);
        if (msgIndex === -1) return prevConvs;

        const originalMessage = { ...conv.messages[msgIndex] };
        if (!originalMessage.payload) return prevConvs;

        // 1. Update the original offer message's status
        originalMessage.payload.status = response;
        conv.messages[msgIndex] = originalMessage;

        const now = new Date().toISOString();

        // 2. Add a new message based on the response
        if (response === 'countered' && counterPrice && currentUser) {
            const counterOfferMessage: ChatMessage = {
                id: Date.now(),
                sender: currentUser.role === 'customer' ? 'user' : 'seller',
                text: `Counter-offer: ${counterPrice}`,
                timestamp: now,
                isRead: false,
                type: 'offer',
                payload: {
                    offerPrice: counterPrice,
                    counterPrice: originalMessage.payload.offerPrice, // The price being countered
                    status: 'pending'
                }
            };
            conv.messages.push(counterOfferMessage);
        } else {
            // Add a system message for accept/reject
            const systemMessage: ChatMessage = {
                id: Date.now(),
                sender: 'system',
                text: `Offer ${response}.`,
                timestamp: now,
                isRead: false
            };
            conv.messages.push(systemMessage);
        }

        // 3. Update conversation metadata
        conv.lastMessageAt = now;
        if (currentUser?.role === 'customer') {
            conv.isReadBySeller = false;
        } else {
            conv.isReadByCustomer = false;
        }

        newConvs[convIndex] = conv;
        return newConvs;
    });
  }, [currentUser]);
  
  const handleMarkConversationAsReadBySeller = useCallback((conversationId: string) => {
    setConversations(prev => {
        const convIndex = prev.findIndex(c => c.id === conversationId && !c.isReadBySeller);
        if (convIndex === -1) return prev;
        
        const updatedConv = { ...prev[convIndex], isReadBySeller: true };
        const newConversations = [...prev];
        newConversations[convIndex] = updatedConv;
        return newConversations;
    });
  }, []);

  const handleMarkConversationAsReadByCustomer = useCallback((conversationId: string) => {
    setConversations(prev => {
        const convIndex = prev.findIndex(c => c.id === conversationId && c.isReadByCustomer === false);
        if (convIndex === -1) return prev;

        const updatedConv = { ...prev[convIndex], isReadByCustomer: true };
        const newConversations = [...prev];
        newConversations[convIndex] = updatedConv;
        return newConversations;
    });
  }, []);

  const usersWithRatingsAndBadges = useMemo(() => {
    return users.map(user => {
      if (user.role !== 'seller') return user;
      const sellerRatingsList = sellerRatings[user.email] || [];
      const ratingCount = sellerRatingsList.length;
      const averageRating = ratingCount > 0
        ? sellerRatingsList.reduce((acc, curr) => acc + curr, 0) / ratingCount
        : 0;
      
      const allSellerVehicles = vehicles.filter(v => v.sellerEmail === user.email);
      const badges: Badge[] = getSellerBadges({ ...user, averageRating, ratingCount }, allSellerVehicles);

      return { ...user, averageRating, ratingCount, badges };
    });
  }, [users, sellerRatings, vehicles]);

  const vehiclesWithRatings = useMemo(() => {
    return vehicles.map(vehicle => {
      const vehicleRatings = ratings[vehicle.id] || [];
      const ratingCount = vehicleRatings.length;
      const averageRating = ratingCount > 0
        ? vehicleRatings.reduce((acc, curr) => acc + curr, 0) / ratingCount
        : 0;
      const seller = usersWithRatingsAndBadges.find(u => u.email === vehicle.sellerEmail);
      const sellerName = seller?.dealershipName || seller?.name || 'Private Seller';
      const sellerAverageRating = seller?.averageRating;
      const sellerRatingCount = seller?.ratingCount;
      const sellerBadges = seller?.badges;
      return { ...vehicle, averageRating, ratingCount, sellerName, sellerAverageRating, sellerRatingCount, sellerBadges };
    });
  }, [vehicles, ratings, usersWithRatingsAndBadges]);
  
  const handleAddVehicle = useCallback((vehicleData: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>, isFeaturing: boolean) => {
    if (isFeaturing) {
        if (!currentUser || currentUser.role !== 'seller' || (currentUser.featuredCredits || 0) <= 0) {
            addToast('You have no featured credits left. Please upgrade your plan.', 'error');
            isFeaturing = false; // Failsafe
        } else {
            // Decrement credit
            setUsers(prevUsers => {
              const userIndex = prevUsers.findIndex(u => u.email === currentUser.email);
              if (userIndex === -1) return prevUsers;

              const user = prevUsers[userIndex];
              const newUsers = [...prevUsers];
              newUsers[userIndex] = { ...user, featuredCredits: (user.featuredCredits || 0) - 1 };
              return newUsers;
            });
        }
    }

    const newVehicle: Vehicle = {
      ...vehicleData,
      id: Date.now(),
      images: vehicleData.images && vehicleData.images.length > 0 ? vehicleData.images : [
        getPlaceholderImage(vehicleData.make, vehicleData.model),
        getPlaceholderImage(vehicleData.make, `${vehicleData.model}-2`),
      ],
      sellerEmail: currentUser?.email || 'seller@test.com',
      status: 'published',
      isFeatured: isFeaturing,
      views: 0,
      inquiriesCount: 0,
      certificationStatus: 'none',
    };
    setVehicles(prevVehicles => [newVehicle, ...prevVehicles]);
    addToast(`Vehicle listed successfully!${isFeaturing ? ' It has been featured.' : ''}`, 'success');
  }, [currentUser, addToast]);

  const handleAddMultipleVehicles = useCallback((newVehiclesData: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>[]) => {
    const newVehicles: Vehicle[] = newVehiclesData.map((vehicleData, index) => ({
        ...vehicleData,
        id: Date.now() + index, // Ensure unique IDs
        status: 'published',
        isFeatured: false,
        views: 0,
        inquiriesCount: 0,
        certificationStatus: 'none',
    }));

    setVehicles(prevVehicles => [...newVehicles, ...prevVehicles]);
    addToast(`${newVehicles.length} vehicles listed successfully via bulk upload!`, 'success');
}, [addToast]);
  
  const handleUpdateVehicle = useCallback((updatedVehicle: Vehicle) => {
    setVehicles(prev => {
        const index = prev.findIndex(v => v.id === updatedVehicle.id);
        if (index === -1) return prev;
        const newVehicles = [...prev];
        newVehicles[index] = updatedVehicle;
        return newVehicles;
    });
    addLogEntry('Updated Vehicle', String(updatedVehicle.id), `${updatedVehicle.year} ${updatedVehicle.make} ${updatedVehicle.model}`);
    addToast('Vehicle updated successfully!', 'success');
  }, [addLogEntry, addToast]);

  const handleDeleteVehicle = useCallback((vehicleId: number) => {
    if(window.confirm('Are you sure you want to delete this vehicle listing? This action cannot be undone.')){
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle) addLogEntry('Deleted Vehicle', String(vehicleId), `${vehicle.year} ${vehicle.make} ${vehicle.model}`);
        setVehicles(prevVehicles => prevVehicles.filter(v => v.id !== vehicleId));
        addToast('Vehicle listing has been deleted.', 'info');
    }
  }, [vehicles, addLogEntry, addToast]);

  const handleMarkAsSold = useCallback((vehicleId: number) => {
    setVehicles(prev => {
        const index = prev.findIndex(v => v.id === vehicleId);
        if (index === -1) return prev;
        const newVehicles = [...prev];
        newVehicles[index] = { ...prev[index], status: 'sold' };
        return newVehicles;
    });
    addToast('Vehicle marked as sold!', 'success');
  }, [addToast]);

  const handleToggleVehicleStatus = useCallback((vehicleId: number) => {
    let statusChange = '';
    let action = '';
    setVehicles(prev => {
        const index = prev.findIndex(v => v.id === vehicleId);
        if (index === -1) return prev;

        const newStatus = prev[index].status === 'published' ? 'unpublished' : 'published';
        action = newStatus === 'published' ? 'Published Vehicle' : 'Unpublished Vehicle';
        statusChange = `Vehicle listing has been ${newStatus}.`;
        
        const newVehicles = [...prev];
        newVehicles[index] = { ...prev[index], status: newStatus };
        return newVehicles;
    });
    addLogEntry(action, String(vehicleId));
    addToast(statusChange, 'info');
  }, [addLogEntry, addToast]);

  const handleToggleVehicleFeature = useCallback((vehicleId: number) => {
    let featureChange = '';
    let action = '';
    setVehicles(prev => {
        const index = prev.findIndex(v => v.id === vehicleId);
        if (index === -1) return prev;

        const newIsFeatured = !prev[index].isFeatured;
        action = newIsFeatured ? 'Featured Vehicle' : 'Un-featured Vehicle';
        featureChange = `Vehicle has been ${newIsFeatured ? 'featured' : 'un-featured'}.`;
        
        const newVehicles = [...prev];
        newVehicles[index] = { ...prev[index], isFeatured: newIsFeatured };
        return newVehicles;
    });
    addLogEntry(action, String(vehicleId));
    addToast(featureChange, 'info');
  }, [addLogEntry, addToast]);
  
  const handleFeatureListing = useCallback((vehicleId: number) => {
    if (!currentUser || currentUser.role !== 'seller') return;
    
    setUsers(prevUsers => {
      const userIndex = prevUsers.findIndex(u => u.email === currentUser.email);
      if (userIndex === -1) return prevUsers;

      const user = prevUsers[userIndex];
      if ((user.featuredCredits || 0) <= 0) {
        addToast('You have no featured credits left. Please upgrade your plan.', 'error');
        return prevUsers;
      }

      const newUsers = [...prevUsers];
      newUsers[userIndex] = { ...user, featuredCredits: (user.featuredCredits || 0) - 1 };

      setVehicles(prevVehicles => {
          const vIndex = prevVehicles.findIndex(v => v.id === vehicleId);
          if (vIndex === -1) return prevVehicles;
          const newVehicles = [...prevVehicles];
          newVehicles[vIndex] = { ...prevVehicles[vIndex], isFeatured: true };
          return newVehicles;
      });

      addToast('Listing successfully featured!', 'success');
      return newUsers;
    });
  }, [currentUser, addToast]);

  const handleRequestCertification = useCallback((vehicleId: number) => {
    if (!currentUser || currentUser.role !== 'seller') return;

    const vehicleIndex = vehicles.findIndex(v => v.id === vehicleId);
    if (vehicleIndex === -1) return;
    
    const vehicle = vehicles[vehicleIndex];
    if (vehicle.certificationStatus === 'requested') return; // Avoid duplicate requests

    const updatedVehicles = [...vehicles];
    updatedVehicles[vehicleIndex] = { ...updatedVehicles[vehicleIndex], certificationStatus: 'requested' };
    setVehicles(updatedVehicles);
    
    addToast('Certification requested. An admin will review it shortly.', 'info');

    const admins = users.filter(u => u.role === 'admin');
    const newAdminNotifications: Notification[] = admins.map(admin => ({
        id: Date.now() + Math.random(),
        recipientEmail: admin.email,
        message: `New certification request from ${currentUser.dealershipName || currentUser.name} for ${vehicle.make} ${vehicle.model}.`,
        targetId: vehicleId,
        targetType: 'vehicle', 
        isRead: false,
        timestamp: new Date().toISOString(),
    }));
    setNotifications(prev => [...prev, ...newAdminNotifications]);
  }, [vehicles, currentUser, users, addToast]);

  const handleCertificationApproval = useCallback((vehicleId: number, decision: 'approved' | 'rejected') => {
    const vehicleIndex = vehicles.findIndex(v => v.id === vehicleId);
    if (vehicleIndex === -1) return;

    const vehicle = vehicles[vehicleIndex];
    const sellerIndex = users.findIndex(u => u.email === vehicle.sellerEmail);
    if (sellerIndex === -1) return;

    const seller = users[sellerIndex];
    const plan = PLAN_DETAILS[seller.subscriptionPlan || 'free'];
    
    let updatedVehicle = { ...vehicle };
    let notificationMessage = '';
    
    if (decision === 'approved') {
        updatedVehicle.certificationStatus = 'approved';
        updatedVehicle.certifiedInspection = {
            reportId: `RR-CERT-${Date.now()}-${vehicleId}`,
            summary: 'This vehicle has passed our comprehensive 200-point inspection. Key areas are in excellent condition.',
            date: new Date().toISOString(),
            inspector: 'ReRide Admin Certified',
            scores: { 'Engine': 95, 'Transmission': 92, 'Suspension': 89, 'Brakes': 94, 'Exterior': 88, 'Interior': 91 },
            details: { 'Engine': 'Excellent condition, no issues found.', 'Exterior': 'Minor wear consistent with age.', 'Interior': 'Clean with all electronics functional.' }
        };

        const usedCerts = seller.usedCertifications || 0;
        if (usedCerts < plan.freeCertifications) {
            const updatedUsers = [...users];
            updatedUsers[sellerIndex] = { ...seller, usedCertifications: usedCerts + 1 };
            setUsers(updatedUsers);
            notificationMessage = `Your certification request for ${vehicle.make} ${vehicle.model} has been APPROVED. 1 free credit was used.`;
            addToast('Certification approved. Seller\'s free credit has been used.', 'success');
        } else {
             notificationMessage = `Your certification request for ${vehicle.make} ${vehicle.model} has been APPROVED.`;
             addToast('Certification approved. Seller had no free credits left.', 'info');
        }
        addLogEntry('Approved Certification', String(vehicleId));

    } else { // Rejected
        updatedVehicle.certificationStatus = 'rejected';
        updatedVehicle.certifiedInspection = null;
        notificationMessage = `We're sorry, your certification request for ${vehicle.make} ${vehicle.model} has been rejected.`;
        addLogEntry('Rejected Certification', String(vehicleId));
        addToast('Certification request rejected.', 'info');
    }

    const updatedVehicles = [...vehicles];
    updatedVehicles[vehicleIndex] = updatedVehicle;
    setVehicles(updatedVehicles);

    const sellerNotification: Notification = {
        id: Date.now(),
        recipientEmail: seller.email,
        message: notificationMessage,
        targetId: vehicleId,
        targetType: 'vehicle',
        isRead: false,
        timestamp: new Date().toISOString(),
    };
    setNotifications(prev => [...prev, sellerNotification]);
  }, [vehicles, users, addToast, addLogEntry]);

  const handleToggleCompare = useCallback((vehicleId: number) => {
    setComparisonList(prev => {
      const isAdding = !prev.includes(vehicleId);
      if (isAdding && prev.length >= 4) {
        addToast("You can only compare up to 4 vehicles at a time.", 'error');
        return prev;
      }
      
      const newList = isAdding
        ? [...prev, vehicleId]
        : prev.filter(id => id !== vehicleId);

      addToast(isAdding ? 'Added to comparison.' : 'Removed from comparison.', 'info');
      return newList;
    });
  }, [addToast]);

  const handleClearCompare = useCallback(() => {
    setComparisonList([]);
  }, []);

  const handleSelectVehicle = useCallback((vehicle: Vehicle) => {
    logViewedVehicle(vehicle.id);
    setSelectedVehicle(vehicle);
    setCurrentView(View.DETAIL);
    setVehicles(prev => {
        const index = prev.findIndex(v => v.id === vehicle.id);
        if (index === -1) return prev;
        const newVehicles = [...prev];
        newVehicles[index] = { ...prev[index], views: (prev[index].views || 0) + 1 };
        return newVehicles;
    });
  }, []);

  const handleBackToHome = useCallback(() => {
    setSelectedVehicle(null);
    setCurrentView(View.HOME);
  }, []);

  const loginUser = useCallback((user: User) => {
      setCurrentUser(user);
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      addToast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
  }, [addToast]);

  const handleSellerLogin = useCallback((credentials: { email: string; password: string; }) => {
    const user = users.find(u => u.email.toLowerCase() === credentials.email.trim().toLowerCase() && u.password === credentials.password && u.role === 'seller');
    if (user && user.status === 'active') {
      loginUser(user);
      setCurrentView(View.SELLER_DASHBOARD);
      return { success: true, reason: ''};
    }
    const reason = user && user.status === 'inactive'
        ? 'Your account has been deactivated. Please contact support.'
        : 'Invalid seller credentials. Please try again or register.';

    addToast(reason, 'error');
    return { success: false, reason };
  }, [users, loginUser, addToast]);
  
  const handleCustomerLogin = useCallback((credentials: { email: string; password: string; }) => {
    const user = users.find(u => u.email.toLowerCase() === credentials.email.trim().toLowerCase() && u.password === credentials.password && u.role === 'customer');
    if (user && user.status === 'active') {
      loginUser(user);
      setCurrentView(View.HOME);
      return { success: true, reason: '' };
    }
    const reason = user && user.status === 'inactive'
        ? 'Your account has been deactivated. Please contact support.'
        : 'Invalid email or password. Please try again or register.';
        
    addToast(reason, 'error');
    return { success: false, reason };
  }, [users, loginUser, addToast]);

  const handleAdminLogin = useCallback((credentials: { email: string; password: string; }) => {
    const user = users.find(u => u.email.toLowerCase() === credentials.email.trim().toLowerCase() && u.password === credentials.password && u.role === 'admin');
    if (user) {
      loginUser(user);
      setCurrentView(View.ADMIN_PANEL);
      return true;
    }
    addToast('Invalid admin credentials.', 'error');
    return false;
  }, [users, loginUser, addToast]);

  const handleSellerRegister = useCallback((credentials: Omit<User, 'role' | 'status' | 'createdAt'>): { success: boolean, reason: string } => {
    if (users.some(u => u.email === credentials.email)) {
      const reason = 'A seller account with this email already exists.';
      addToast(reason, 'error');
      return { success: false, reason };
    }
    const newUser: User = {
        ...credentials, 
        role: 'seller', 
        status: 'active', 
        createdAt: new Date().toISOString(),
        subscriptionPlan: 'free',
        featuredCredits: PLAN_DETAILS.free.featuredCredits,
        usedCertifications: 0,
    };
    setUsers(prev => [...prev, newUser]);
    loginUser(newUser);
    setCurrentView(View.SELLER_DASHBOARD);
    addToast('Registration successful! Welcome to ReRide.', 'success');
    return { success: true, reason: ''};
  }, [users, loginUser, addToast]);

  const handleCustomerRegister = useCallback((credentials: Omit<User, 'role' | 'status' | 'createdAt'>): { success: boolean, reason: string } => {
    if (users.some(u => u.email === credentials.email)) {
      const reason = 'An account with this email already exists. Please log in.';
      addToast(reason, 'error');
      return { success: false, reason };
    }
    const newUser: User = { ...credentials, role: 'customer', status: 'active', createdAt: new Date().toISOString() };
    setUsers(prev => [...prev, newUser]);
    loginUser(newUser);
    setCurrentView(View.HOME);
    addToast('Registration successful! Welcome to ReRide.', 'success');
    return { success: true, reason: '' };
  }, [users, loginUser, addToast]);
  
  const handleToggleUserStatus = useCallback((userEmail: string) => {
    let statusChange = '';
    let action = '';
    setUsers(prev => {
        const index = prev.findIndex(u => u.email === userEmail);
        if (index === -1) return prev;
        
        const newStatus = prev[index].status === 'active' ? 'inactive' : 'active';
        action = newStatus === 'active' ? 'Reactivated User' : 'Deactivated User';
        statusChange = `User has been ${newStatus === 'active' ? 'reactivated' : 'deactivated'}.`;
        
        const newUsers = [...prev];
        newUsers[index] = { ...prev[index], status: newStatus };
        return newUsers;
    });
    addLogEntry(action, userEmail);
    addToast(statusChange, 'success');
  }, [addLogEntry, addToast]);
  
  const handleDeleteUser = useCallback((userEmail: string) => {
    if (window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
        addLogEntry('Deleted User', userEmail);
        setUsers(prevUsers => prevUsers.filter(user => user.email !== userEmail));
        setVehicles(prev => prev.filter(v => v.sellerEmail !== userEmail));
        setConversations(prev => prev.filter(c => c.customerId !== userEmail && c.sellerId !== userEmail));
        addToast('User has been permanently deleted.', 'info');
    }
  }, [addLogEntry, addToast]);

  const handleAdminUpdateUser = useCallback((email: string, details: Partial<User>) => {
    addLogEntry('Updated User Profile', email);
    setUsers(prev => {
        const index = prev.findIndex(u => u.email === email);
        if (index === -1) return prev;
        const newUsers = [...prev];
        newUsers[index] = { ...prev[index], ...details };
        return newUsers;
    });
    addToast("User details have been updated successfully.", "success");
  }, [addLogEntry, addToast]);

  const handleUpdateUserProfile = useCallback((updatedDetails: { name: string; mobile: string; }) => {
    if (!currentUser) return;
    setUsers(prev => {
        const index = prev.findIndex(u => u.email === currentUser.email);
        if (index === -1) return prev;
        const newUsers = [...prev];
        newUsers[index] = { ...prev[index], ...updatedDetails };
        return newUsers;
    });
    addToast('Profile updated successfully!', 'success');
  }, [currentUser, addToast]);
  
  const handleUpdateSellerProfile = useCallback((updatedDetails: { dealershipName: string; bio: string; logoUrl: string; }) => {
     if (!currentUser) return;
     setUsers(prev => {
        const index = prev.findIndex(u => u.email === currentUser.email);
        if (index === -1) return prev;
        const newUsers = [...prev];
        newUsers[index] = { ...prev[index], ...updatedDetails };
        return newUsers;
     });
     addToast('Seller profile updated successfully!', 'success');
  }, [currentUser, addToast]);

  const handleUpdateUserPassword = useCallback((passwords: { current: string; new: string; }): boolean => {
    if (!currentUser) return false;
    const userInDb = users.find(u => u.email === currentUser.email);
    if (userInDb && userInDb.password === passwords.current) {
        setUsers(prev => {
            const index = prev.findIndex(u => u.email === currentUser.email);
            if (index === -1) return prev;
            const newUsers = [...prev];
            newUsers[index] = { ...prev[index], password: passwords.new };
            return newUsers;
        });
        addToast('Password changed successfully!', 'success');
        return true;
    }
    addToast('Incorrect current password.', 'error');
    return false;
  }, [currentUser, users, addToast]);

  const handleForgotPasswordRequest = useCallback((email: string) => {
    const userExists = users.some(u => u.email === email && u.role === forgotPasswordRole);
    console.log(`Password reset for ${email} as a ${forgotPasswordRole}. User exists: ${userExists}`);
  }, [users, forgotPasswordRole]);

  const handleFlagContent = useCallback((type: 'vehicle' | 'conversation', id: number | string, reason: string) => {
    const flaggedAt = new Date().toISOString();
    let newNotifications: Notification[] = [];
    let sellerEmail: string | undefined;
    let contentIdentifier: string = '';

    if (type === 'vehicle') {
        setVehicles(prev => {
            const index = prev.findIndex(v => v.id === id);
            if (index === -1) return prev;
            const newVehicles = [...prev];
            const vehicle = newVehicles[index];
            newVehicles[index] = { ...vehicle, isFlagged: true, flagReason: reason, flaggedAt };
            sellerEmail = vehicle.sellerEmail;
            contentIdentifier = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
            return newVehicles;
        });
    } else {
        setConversations(prev => {
            const index = prev.findIndex(c => c.id === id);
            if (index === -1) return prev;
            const newConversations = [...prev];
            const conversation = newConversations[index];
            newConversations[index] = { ...conversation, isFlagged: true, flagReason: reason, flaggedAt };
            sellerEmail = conversation.sellerId;
            contentIdentifier = `Conversation about ${conversation.vehicleName}`;
            return newConversations;
        });
    }

    addToast('Content has been reported for review. Thank you.', 'info');

    // Create notifications for admins
    const admins = users.filter(u => u.role === 'admin');
    admins.forEach(admin => {
        newNotifications.push({
            id: Date.now() + Math.random(),
            recipientEmail: admin.email,
            message: `A ${type} has been reported: "${contentIdentifier}"`,
            targetId: id,
            targetType: type,
            isRead: false,
            timestamp: flaggedAt,
        });
    });

    // Create notification for the seller (if applicable)
    if (sellerEmail) {
        newNotifications.push({
            id: Date.now() + Math.random(),
            recipientEmail: sellerEmail,
            message: `Your ${type} has been reported: "${contentIdentifier}"`,
            targetId: id,
            targetType: type,
            isRead: false,
            timestamp: flaggedAt,
        });
    }

    setNotifications(prev => [...prev, ...newNotifications]);
  }, [addToast, users]);

  const handleResolveFlag = useCallback((type: 'vehicle' | 'conversation', id: number | string) => {
      if (type === 'vehicle') {
          addLogEntry('Resolved Flag (Vehicle)', String(id));
          setVehicles(prev => {
              const index = prev.findIndex(v => v.id === id);
              if (index === -1) return prev;
              const newVehicles = [...prev];
              newVehicles[index] = { ...prev[index], isFlagged: false, flagReason: undefined, flaggedAt: undefined };
              return newVehicles;
          });
      } else {
          addLogEntry('Resolved Flag (Conversation)', String(id));
          setConversations(prev => {
              const index = prev.findIndex(c => c.id === id);
              if (index === -1) return prev;
              const newConversations = [...prev];
              newConversations[index] = { ...prev[index], isFlagged: false, flagReason: undefined, flaggedAt: undefined };
              return newConversations;
          });
      }
      addToast('Flag has been resolved.', 'success');
  }, [addLogEntry, addToast]);

  const handleAdminUpdateSettings = useCallback((newSettings: PlatformSettings) => {
      setPlatformSettings(newSettings);
      addLogEntry('Updated Platform Settings', 'platform-settings', JSON.stringify(newSettings));
      addToast('Platform settings updated.', 'success');
  }, [addLogEntry, addToast]);

  const handleAdminSendBroadcast = useCallback((message: string) => {
    if (!message.trim()) return;
    const broadcastMessage: ChatMessage = {
        id: Date.now(),
        sender: 'system',
        text: `Announcement: ${message}`,
        timestamp: new Date().toISOString(),
        isRead: false,
    };

    setConversations(prev => prev.map(c => ({
        ...c,
        messages: [...c.messages, broadcastMessage],
        lastMessageAt: broadcastMessage.timestamp,
        isReadByCustomer: false,
        isReadBySeller: false,
    })));

    addLogEntry('Sent Broadcast Message', 'all_users', `Message: "${message}"`);
    addToast('Broadcast message sent to all users.', 'success');
  }, [addLogEntry, addToast]);
  
  const getFormattedDate = useCallback(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const handleExportUsers = useCallback(() => {
    const dataToExport = users.map(({ password, ...rest }) => rest);
    exportToCsv(`users_export_${getFormattedDate()}.csv`, dataToExport);
    addLogEntry('Exported Data', 'Users CSV', `${dataToExport.length} records`);
  }, [users, getFormattedDate, addLogEntry]);

  const handleExportVehicles = useCallback(() => {
    const dataToExport = vehicles.map(v => ({
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      price: v.price,
      mileage: v.mileage,
      sellerEmail: v.sellerEmail,
      status: v.status,
      isFeatured: v.isFeatured,
      views: v.views,
      inquiriesCount: v.inquiriesCount,
      features: v.features.join(' | '),
    }));
    exportToCsv(`vehicles_export_${getFormattedDate()}.csv`, dataToExport);
    addLogEntry('Exported Data', 'Vehicles CSV', `${dataToExport.length} records`);
  }, [vehicles, getFormattedDate, addLogEntry]);

  const handleExportSales = useCallback(() => {
    const salesData = vehicles
      .filter(v => v.status === 'sold')
      .map(v => ({
        id: v.id,
        make: v.make,
        model: v.model,
        year: v.year,
        price: v.price,
        mileage: v.mileage,
        sellerEmail: v.sellerEmail,
      }));

    if (salesData.length === 0) {
      addToast("There are no sold vehicles to export.", 'info');
      return;
    }

    exportToCsv(`sales_report_${getFormattedDate()}.csv`, salesData);
    addLogEntry('Exported Data', 'Sales Report CSV', `${salesData.length} records`);
  }, [vehicles, addToast, getFormattedDate, addLogEntry]);

  const handleUpdateVehicleData = useCallback((newData: VehicleData) => {
    setVehicleData(newData);
    saveVehicleData(newData);
    addToast('Vehicle dropdown data has been updated.', 'success');
  }, [addToast]);
  
  const handleToggleVerifiedStatus = useCallback((userEmail: string) => {
    setUsers(prev => {
        const index = prev.findIndex(u => u.email === userEmail);
        if (index === -1) return prev;
        
        const newUsers = [...prev];
        const user = newUsers[index];
        const newIsVerified = !user.isVerified;
        newUsers[index] = { ...user, isVerified: newIsVerified };
        
        addToast(`Seller has been ${newIsVerified ? 'verified' : 'un-verified'}.`, 'info');
        addLogEntry(newIsVerified ? 'Verified Seller' : 'Un-verified Seller', userEmail);
        
        return newUsers;
    });
  }, [addLogEntry, addToast]);
  
  const handlePlanChange = useCallback((planId: SubscriptionPlan) => {
      if (!currentUser || currentUser.role !== 'seller') return;

      setUsers(prev => {
          const index = prev.findIndex(u => u.email === currentUser.email);
          if (index === -1) return prev;

          const planDetails = PLAN_DETAILS[planId];
          const newUsers = [...prev];
          newUsers[index] = {
              ...prev[index],
              subscriptionPlan: planId,
              featuredCredits: (prev[index].featuredCredits || 0) + planDetails.featuredCredits, // Top up credits
          };
          
          addToast(`Successfully upgraded to the ${planDetails.name} plan!`, 'success');
          navigate(View.SELLER_DASHBOARD);
          return newUsers;
      });

  }, [currentUser, addToast]);

  const navigate = useCallback((view: View) => {
    const isNavigatingAwayFromSellerProfile = currentView === View.SELLER_PROFILE && view !== View.SELLER_PROFILE;

    if (isNavigatingAwayFromSellerProfile) {
        window.history.pushState({}, '', window.location.pathname);
        setPublicSellerProfile(null);
    }
    setInitialSearchQuery(''); // Reset search query on navigation
    
    // This condition preserves the selected vehicle state when navigating between
    // the vehicle detail page and the seller profile page in EITHER direction.
    const preserveSelectedVehicle =
      (view === View.SELLER_PROFILE && currentView === View.DETAIL) ||
      (view === View.DETAIL && currentView === View.SELLER_PROFILE);

    if (!preserveSelectedVehicle) {
        setSelectedVehicle(null);
    }
    
    if (view === View.USED_CARS) {
        setSelectedCategory('ALL');
    }
    if (view === View.SELLER_DASHBOARD && currentUser?.role !== 'seller') {
        setCurrentView(View.LOGIN_PORTAL);
    } else if (view === View.ADMIN_PANEL && currentUser?.role !== 'admin') {
        setCurrentView(View.ADMIN_LOGIN);
    } else if ((view === View.PROFILE || view === View.INBOX) && !currentUser) {
        setCurrentView(View.LOGIN_PORTAL);
    }
    else {
        setCurrentView(view);
    }
  }, [currentView, currentUser]);
  
  const handleHomeSearch = useCallback((query: string) => {
      setInitialSearchQuery(query);
      setCurrentView(View.USED_CARS);
  }, []);

  const handleMarkNotificationsAsRead = useCallback((ids: number[]) => {
    setNotifications(prev => prev.map(n => ids.includes(n.id) ? { ...n, isRead: true } : n));
  }, []);

  const handleNotificationClick = useCallback((notification: Notification) => {
    handleMarkNotificationsAsRead([notification.id]);
    if (currentUser?.role === 'admin') {
        navigate(View.ADMIN_PANEL);
        // Future enhancement: navigate to specific sub-view
    } else if (currentUser?.role === 'seller') {
        navigate(View.SELLER_DASHBOARD);
        // Future enhancement: navigate to specific sub-view
    }
  }, [currentUser, navigate, handleMarkNotificationsAsRead]);

  const handleAddSupportTicket = useCallback((ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'replies' | 'status'>) => {
    const newTicket: SupportTicket = {
      ...ticketData,
      id: Date.now(),
      status: 'Open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replies: [],
    };
    setSupportTickets(prev => [newTicket, ...prev]);
    addToast('Support ticket submitted successfully!', 'success');
    navigate(View.HOME);
  }, [addToast, navigate]);

  const handleUpdateSupportTicket = useCallback((updatedTicket: SupportTicket) => {
    setSupportTickets(prev => {
      const index = prev.findIndex(t => t.id === updatedTicket.id);
      if (index === -1) return prev;
      const newTickets = [...prev];
      newTickets[index] = { ...updatedTicket, updatedAt: new Date().toISOString() };
      return newTickets;
    });
    addLogEntry('Updated Support Ticket', String(updatedTicket.id));
    addToast('Support ticket updated!', 'info');
  }, [addLogEntry, addToast]);

  const handleAddFaq = useCallback((faqData: Omit<FAQItem, 'id'>) => {
    const newFaq: FAQItem = { ...faqData, id: Date.now() };
    setFaqItems(prev => [...prev, newFaq]);
    addLogEntry('Added FAQ', newFaq.question);
    addToast('FAQ item added successfully!', 'success');
  }, [addLogEntry, addToast]);

  const handleUpdateFaq = useCallback((updatedFaq: FAQItem) => {
    setFaqItems(prev => {
      const index = prev.findIndex(f => f.id === updatedFaq.id);
      if (index === -1) return prev;
      const newFaqs = [...prev];
      newFaqs[index] = updatedFaq;
      return newFaqs;
    });
    addLogEntry('Updated FAQ', updatedFaq.question);
    addToast('FAQ item updated successfully!', 'success');
  }, [addLogEntry, addToast]);

  const handleDeleteFaq = useCallback((faqId: number) => {
    const faq = faqItems.find(f => f.id === faqId);
    if (faq) addLogEntry('Deleted FAQ', faq.question);
    setFaqItems(prev => prev.filter(f => f.id !== faqId));
    addToast('FAQ item deleted!', 'info');
  }, [faqItems, addLogEntry, addToast]);

  const handleLocationChange = useCallback((newLocation: string) => {
    if (newLocation && newLocation !== userLocation) {
      setUserLocation(newLocation);
      try {
        localStorage.setItem('reRideUserLocation', newLocation);
        addToast(`Location set to ${newLocation}`, 'info');
      } catch (error) {
        console.error("Failed to save user location to localStorage", error);
        addToast("Could not save your location preference.", "error");
      }
    }
  }, [addToast, userLocation]);
  
  const handleViewSellerProfile = useCallback((sellerEmail: string) => {
    const sellerUser = usersWithRatingsAndBadges.find(u => u.email === sellerEmail && u.role === 'seller');
    if (sellerUser) {
        setPreviousView(currentView);
        setPublicSellerProfile(sellerUser);
        // Use navigate function to ensure state preservation logic is triggered
        navigate(View.SELLER_PROFILE);
        window.history.pushState({}, '', `${window.location.pathname}?seller=${sellerEmail}`);
    } else {
        addToast('Seller profile not found.', 'error');
    }
  }, [currentView, usersWithRatingsAndBadges, addToast, navigate]);

  const vehiclesToCompare = useMemo(() => {
    return vehiclesWithRatings.filter(v => comparisonList.includes(v.id));
  }, [vehiclesWithRatings, comparisonList]);
  
  const vehiclesInWishlist = useMemo(() => {
    return vehiclesWithRatings.filter(v => wishlist.includes(v.id));
  }, [vehiclesWithRatings, wishlist]);
  
  const selectedVehicleWithRating = useMemo(() => {
      if (!selectedVehicle) return null;
      return vehiclesWithRatings.find(v => v.id === selectedVehicle.id) || selectedVehicle;
  }, [selectedVehicle, vehiclesWithRatings])

  const allPublishedVehicles = useMemo(() => {
    return vehiclesWithRatings.filter(v => v.status === 'published');
  }, [vehiclesWithRatings]);

  const featuredVehicles = useMemo(() => {
    return vehiclesWithRatings.filter(v => v.isFeatured && v.status === 'published').slice(0, 4);
  }, [vehiclesWithRatings]);

  const inboxUnreadCount = useMemo(() => {
    if (!currentUser || currentUser.role !== 'customer') return 0;
    return conversations.filter(c => c.customerId === currentUser.email && !c.isReadByCustomer).length;
  }, [conversations, currentUser]);

  const renderContent = () => {
    if (isLoading && currentView === View.HOME) {
        return <LoadingSpinner />;
    }
    
    const authViews = [View.LOGIN_PORTAL, View.CUSTOMER_LOGIN, View.SELLER_LOGIN, View.ADMIN_LOGIN, View.FORGOT_PASSWORD];
    if (authViews.includes(currentView)) {
      const AuthWrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
        <div className="min-h-[calc(100vh-140px)] flex items-center justify-center bg-gradient-main dark:bg-gradient-main-dark p-4">
          {children}
        </div>
      );

      switch (currentView) {
        case View.LOGIN_PORTAL: return <AuthWrapper><LoginPortal onNavigate={navigate} /></AuthWrapper>;
        case View.CUSTOMER_LOGIN: return <AuthWrapper><CustomerLogin onLogin={handleCustomerLogin} onRegister={handleCustomerRegister} onNavigate={navigate} onForgotPassword={() => { setForgotPasswordRole('customer'); navigate(View.FORGOT_PASSWORD); }} /></AuthWrapper>;
        case View.SELLER_LOGIN: return <AuthWrapper><Login onLogin={handleSellerLogin} onRegister={handleSellerRegister} onNavigate={navigate} onForgotPassword={() => { setForgotPasswordRole('seller'); navigate(View.FORGOT_PASSWORD); }}/></AuthWrapper>;
        case View.ADMIN_LOGIN: return <AuthWrapper><AdminLogin onLogin={handleAdminLogin} onNavigate={navigate} /></AuthWrapper>;
        case View.FORGOT_PASSWORD: return <AuthWrapper><ForgotPassword onResetRequest={handleForgotPasswordRequest} onBack={() => navigate(forgotPasswordRole === 'customer' ? View.CUSTOMER_LOGIN : View.SELLER_LOGIN)}/></AuthWrapper>;
      }
    }
    
    switch (currentView) {
      case View.SUPPORT:
        return <SupportPage currentUser={currentUser} onSubmitTicket={handleAddSupportTicket} />;
      case View.FAQ:
        return <FAQPage faqItems={faqItems} />;
      case View.PRICING:
        return <PricingPage currentUser={currentUser} onSelectPlan={handlePlanChange} />;
      case View.SELLER_PROFILE:
        return publicSellerProfile && <SellerProfilePage 
                  seller={usersWithRatingsAndBadges.find(u => u.email === publicSellerProfile.email)!}
                  vehicles={vehiclesWithRatings.filter(v => v.sellerEmail === publicSellerProfile.email && v.status === 'published')}
                  onSelectVehicle={handleSelectVehicle}
                  comparisonList={comparisonList}
                  onToggleCompare={handleToggleCompare}
                  wishlist={wishlist}
                  onToggleWishlist={handleToggleWishlist}
                  onBack={() => navigate(previousView || View.HOME)}
                  onViewSellerProfile={() => {}}
              />;
      case View.DETAIL:
        return selectedVehicleWithRating && <VehicleDetail vehicle={selectedVehicleWithRating} onBack={() => navigate(View.USED_CARS)} comparisonList={comparisonList} onToggleCompare={handleToggleCompare} onAddSellerRating={handleAddSellerRating} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} currentUser={currentUser} onFlagContent={handleFlagContent} users={usersWithRatingsAndBadges} onViewSellerProfile={handleViewSellerProfile} onStartChat={handleStartChat} recommendations={recommendations} onSelectVehicle={handleSelectVehicle} />;
      case View.SELLER_DASHBOARD:
        return currentUser?.role === 'seller' ? <Dashboard 
                  seller={usersWithRatingsAndBadges.find(u => u.email === currentUser.email)!}
                  sellerVehicles={vehiclesWithRatings.filter(v => v.sellerEmail === currentUser.email)}
                  reportedVehicles={vehicles.filter(v => v.sellerEmail === currentUser.email && v.isFlagged)}
                  onAddVehicle={handleAddVehicle}
                  onAddMultipleVehicles={handleAddMultipleVehicles}
                  onUpdateVehicle={handleUpdateVehicle}
                  onDeleteVehicle={handleDeleteVehicle}
                  onMarkAsSold={handleMarkAsSold}
                  conversations={conversations.filter(c => c.sellerId === currentUser.email)}
                  onSellerSendMessage={handleSellerSendMessage}
                  onMarkConversationAsReadBySeller={handleMarkConversationAsReadBySeller}
                  typingStatus={typingStatus}
                  onUserTyping={handleUserTyping}
                  onMarkMessagesAsRead={handleMarkMessagesAsRead}
                  onUpdateSellerProfile={handleUpdateSellerProfile}
                  vehicleData={vehicleData}
                  onFeatureListing={handleFeatureListing}
                  onRequestCertification={handleRequestCertification}
                  onNavigate={navigate}
                  allVehicles={allPublishedVehicles}
                  onOfferResponse={handleOfferResponse}
              /> : <LoadingSpinner />;
      case View.ADMIN_PANEL:
        return currentUser?.role === 'admin' ? <AdminPanel 
                  users={users}
                  currentUser={currentUser}
                  vehicles={vehicles}
                  conversations={conversations}
                  onToggleUserStatus={handleToggleUserStatus}
                  onDeleteUser={handleDeleteUser}
                  onAdminUpdateUser={handleAdminUpdateUser}
                  onUpdateVehicle={handleUpdateVehicle}
                  onDeleteVehicle={handleDeleteVehicle}
                  onToggleVehicleStatus={handleToggleVehicleStatus}
                  onToggleVehicleFeature={handleToggleVehicleFeature}
                  onResolveFlag={handleResolveFlag}
                  platformSettings={platformSettings}
                  onUpdateSettings={handleAdminUpdateSettings}
                  onSendBroadcast={handleAdminSendBroadcast}
                  auditLog={auditLog}
                  onExportUsers={handleExportUsers}
                  onExportVehicles={handleExportVehicles}
                  onExportSales={handleExportSales}
                  vehicleData={vehicleData}
                  onUpdateVehicleData={handleUpdateVehicleData}
                  onToggleVerifiedStatus={handleToggleVerifiedStatus}
                  supportTickets={supportTickets}
                  onUpdateSupportTicket={handleUpdateSupportTicket}
                  faqItems={faqItems}
                  onAddFaq={handleAddFaq}
                  onUpdateFaq={handleUpdateFaq}
                  onDeleteFaq={handleDeleteFaq}
                  onCertificationApproval={handleCertificationApproval}
              /> : <LoadingSpinner />;
      case View.COMPARISON:
        return <Comparison vehicles={vehiclesToCompare} onBack={() => navigate(View.USED_CARS)} onToggleCompare={handleToggleCompare} />;
      case View.PROFILE:
        return currentUser && <Profile currentUser={currentUser} onUpdateProfile={handleUpdateUserProfile} onUpdatePassword={handleUpdateUserPassword} />;
      case View.INBOX:
        return currentUser && <CustomerInbox conversations={conversations.filter(c => c.customerId === currentUser.email)} onSendMessage={handleCustomerSendMessage} onMarkAsRead={handleMarkConversationAsReadByCustomer} users={users} typingStatus={typingStatus} onUserTyping={handleUserTyping} onMarkMessagesAsRead={handleMarkMessagesAsRead} onFlagContent={handleFlagContent} onOfferResponse={handleOfferResponse} />;
      case View.USED_CARS:
        return <VehicleList vehicles={allPublishedVehicles} isLoading={isLoading} onSelectVehicle={handleSelectVehicle} comparisonList={comparisonList} onToggleCompare={handleToggleCompare} onClearCompare={handleClearCompare} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} categoryTitle="All Used Cars" initialCategory={selectedCategory} initialSearchQuery={initialSearchQuery} onViewSellerProfile={handleViewSellerProfile} />;
      case View.NEW_CARS:
        return <NewCars />;
      case View.DEALER_PROFILES:
        return <DealerProfiles sellers={usersWithRatingsAndBadges.filter(u => u.role === 'seller')} onViewProfile={handleViewSellerProfile} />;
      case View.WISHLIST:
        return <VehicleList vehicles={vehiclesInWishlist} isLoading={isLoading} onSelectVehicle={handleSelectVehicle} comparisonList={comparisonList} onToggleCompare={handleToggleCompare} onClearCompare={handleClearCompare} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} categoryTitle="My Wishlist" isWishlistMode={true} onViewSellerProfile={handleViewSellerProfile} />;
      case View.HOME:
      default:
        return <Home onSearch={handleHomeSearch} featuredVehicles={featuredVehicles} onSelectVehicle={handleSelectVehicle} onToggleCompare={handleToggleCompare} comparisonList={comparisonList} onToggleWishlist={handleToggleWishlist} wishlist={wishlist} onViewSellerProfile={handleViewSellerProfile} recommendations={recommendations} allVehicles={allPublishedVehicles} onNavigate={navigate} />;
    }
  };
  
  const inboxCount = useMemo(() => {
    if(!currentUser) return 0;
    if(currentUser.role === 'customer') {
      return conversations.filter(c => c.customerId === currentUser.email && !c.isReadByCustomer).length;
    }
    return 0; // Sellers see their inbox in the dashboard
  }, [conversations, currentUser]);
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header
        onNavigate={navigate}
        currentUser={currentUser}
        onLogout={handleLogout}
        compareCount={comparisonList.length}
        wishlistCount={wishlist.length}
        inboxCount={inboxCount}
        isHomePage={isHomePage}
        notifications={notifications.filter(n => n.recipientEmail === currentUser?.email)}
        onNotificationClick={handleNotificationClick}
        onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
        onMarkAllNotificationsAsRead={() => {
            const unreadIds = notifications.filter(n => !n.isRead && n.recipientEmail === currentUser?.email).map(n => n.id);
            handleMarkNotificationsAsRead(unreadIds);
        }}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        userLocation={userLocation}
        onLocationChange={handleLocationChange}
        addToast={addToast}
      />
      <main className="flex-grow pt-16">
        <Suspense fallback={<LoadingSpinner />}>
          {renderContent()}
        </Suspense>
      </main>
      {activeChat && currentUser && (
        <ChatWidget
            conversation={activeChat}
            currentUserRole={currentUser.role as 'customer' | 'seller'}
            otherUserName={currentUser.role === 'customer' ? (users.find(u => u.email === activeChat.sellerId)?.name || 'Seller') : activeChat.customerName}
            onClose={() => setActiveChat(null)}
            onSendMessage={(msg, type, payload) => {
                if (currentUser.role === 'customer') {
                    handleCustomerSendMessage(activeChat.vehicleId, msg, type, payload);
                }
            }}
            typingStatus={typingStatus}
            onUserTyping={handleUserTyping}
            onMarkMessagesAsRead={handleMarkMessagesAsRead}
            onFlagContent={handleFlagContent}
            onOfferResponse={handleOfferResponse}
        />
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Footer onNavigate={navigate} />
      <CommandPalette 
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(view) => {
            navigate(view);
            setIsCommandPaletteOpen(false);
        }}
        currentUser={currentUser}
        onLogout={() => {
            handleLogout();
            setIsCommandPaletteOpen(false);
        }}
      />
    </div>
  );
};
export default App;