import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import VehicleList from './components/VehicleList';
import { VehicleDetail } from './components/VehicleDetail';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import AdminLogin from './components/AdminLogin';
import Comparison from './components/Comparison';
import { PLAN_DETAILS, MOCK_SUPPORT_TICKETS, MOCK_FAQS } from './constants';
import type { Vehicle, User, Conversation, ChatMessage, Toast as ToastType, PlatformSettings, AuditLogEntry, VehicleData, Notification, VehicleCategory, Badge, Command, SubscriptionPlan, CertifiedInspection, SupportTicket, FAQItem } from './types';
import { View, VehicleCategory as CategoryEnum } from './types';
import { getRatings, addRating, getSellerRatings, addSellerRating } from './services/ratingService';
import { getConversations, saveConversations } from './services/chatService';
import { getVehicles, saveVehicles } from './services/vehicleService';
import { getUsers, saveUsers } from './services/userService';
import LoginPortal from './components/LoginPortal';
import CustomerLogin from './components/CustomerLogin';
import AdminPanel from './components/AdminPanel';
import ToastContainer from './components/ToastContainer';
import Profile from './components/Profile';
import ForgotPassword from './components/ForgotPassword';
import CustomerInbox from './components/CustomerInbox';
import { getSettings, saveSettings } from './services/settingsService';
import { getAuditLog, logAction, saveAuditLog } from './services/auditLogService';
import { exportToCsv } from './services/exportService';
import { showNotification } from './services/notificationService';
import SellerProfilePage from './components/SellerProfilePage';
import Home from './components/Home';
import { getVehicleData, saveVehicleData } from './services/vehicleDataService';
import ChatWidget from './components/ChatWidget';
import { getVehicleRecommendations } from './services/geminiService';
import { getSellerBadges } from './services/badgeService';
import NewCars from './components/NewCars';
import DealerProfiles from './components/DealerProfiles';
import CommandPalette from './components/CommandPalette';
import PricingPage from './components/PricingPage';
import SupportPage from './components/SupportPage';
import { getFaqs, saveFaqs } from './services/faqService';
import { getSupportTickets, saveSupportTickets } from './services/supportTicketService';
import FAQPage from './components/FAQPage';


export type Theme = 'light' | 'dark' | 'sunset' | 'oceanic' | 'cyber';

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
  const [theme, setTheme] = useState<Theme>('light');
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

  const [users, setUsers] = useState<User[]>([]);
  
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => getSettings());
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(() => getAuditLog());
  const [vehicleData, setVehicleData] = useState<VehicleData>(() => getVehicleData());
  const [faqItems, setFaqItems] = useState<FAQItem[]>(() => getFaqs() || MOCK_FAQS);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => getSupportTickets() || MOCK_SUPPORT_TICKETS);

  const addToast = useCallback((message: string, type: ToastType['type']) => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
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
      }));

      const processedUsers = usersData.map(u => ({
          ...u, 
          status: u.status || 'active',
          subscriptionPlan: u.subscriptionPlan || 'free',
          featuredCredits: u.featuredCredits ?? PLAN_DETAILS[u.subscriptionPlan || 'free'].featuredCredits,
      }));
      
      setVehicles(processedVehicles);
      setUsers(processedUsers);
  }, []);

  useEffect(() => {
    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            const [vehiclesData, usersData] = await Promise.all([
                getVehicles(),
                getUsers()
            ]);
            processAndSetData(vehiclesData, usersData);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn(`Initial data load failed (${errorMessage}), attempting to seed database...`);
            addToast("First-time setup: Initializing database...", "info");

            try {
                const seedResponse = await fetch('/api/seed');
                if (!seedResponse.ok) {
                    const errorText = await seedResponse.text();
                    let seedErrorDetail = errorText;
                    try {
                        const errorJson = JSON.parse(errorText);
                        seedErrorDetail = errorJson.error || errorJson.message || errorText;
                    } catch {
                        // It's not JSON, so we just use the raw text.
                    }
                    throw new Error(`Database seeding failed: ${seedErrorDetail}`);
                }
                await seedResponse.json();
                addToast("Database initialized! Loading data...", "success");

                // Retry fetching data after successful seeding
                const [vehiclesData, usersData] = await Promise.all([
                    getVehicles(),
                    getUsers()
                ]);
                processAndSetData(vehiclesData, usersData);

            } catch (seedError) {
                const seedErrorMessage = seedError instanceof Error ? seedError.message : String(seedError);
                console.error("Fatal error: Failed to seed database and fetch data.", seedError);
                addToast(`Server setup failed: ${seedErrorMessage}`, "error");
            }
        } finally {
            setIsLoading(false);
        }
    };

    loadInitialData();
  }, [addToast, processAndSetData]);

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
        const notificationsJson = localStorage.getItem('autoVerseNotifications');
        return notificationsJson ? JSON.parse(notificationsJson) : [];
    } catch { return []; }
  });

  useEffect(() => {
    try {
        localStorage.setItem('autoVerseNotifications', JSON.stringify(notifications));
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

    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme) {
        setTheme(savedTheme);
    } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(prefersDark ? 'dark' : 'light');
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
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    if (theme === 'dark' || theme === 'cyber') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);
  
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

  const handleChangeTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, []);

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
            messages: [],
            lastMessageAt: new Date().toISOString(),
            isReadBySeller: false,
            isReadByCustomer: true,
        };
        setActiveChat(placeholder);
    }
  }, [currentUser, conversations, addToast]);

  const handleCustomerSendMessage = useCallback((vehicleId: number, messageText: string) => {
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
                messages: [userMessage],
                lastMessageAt: userMessage.timestamp,
                isReadBySeller: false,
                isReadByCustomer: true,
            };
            return [...prev, newConversation];
        }
    });
  }, [currentUser, vehicles, addToast]);
  
  const handleSellerSendMessage = useCallback((conversationId: string, messageText: string) => {
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
  
  const handleAddVehicle = useCallback((vehicleData: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount' | 'status' | 'isFeatured'>) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: Date.now(),
      images: vehicleData.images && vehicleData.images.length > 0 ? vehicleData.images : [
        `https://picsum.photos/seed/${Date.now()}/800/600`,
        `https://picsum.photos/seed/${Date.now() + 1}/800/600`,
      ],
      sellerEmail: currentUser?.email || 'seller@test.com',
      status: 'published',
      isFeatured: false,
      views: 0,
      inquiriesCount: 0,
    };
    setVehicles(prevVehicles => [newVehicle, ...prevVehicles]);
    addToast('Vehicle listed successfully!', 'success');
  }, [currentUser, addToast]);

  const handleAddMultipleVehicles = useCallback((newVehiclesData: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>[]) => {
    const newVehicles: Vehicle[] = newVehiclesData.map((vehicleData, index) => ({
        ...vehicleData,
        id: Date.now() + index, // Ensure unique IDs
        status: 'published',
        isFeatured: false,
        views: 0,
        inquiriesCount: 0,
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

  const handlePurchaseInspection = useCallback((vehicleId: number) => {
    // In a real app, this would involve a payment flow. Here we simulate it.
    const inspectionReport: CertifiedInspection = {
        reportId: `AV-${Date.now()}-${vehicleId}`,
        summary: 'This vehicle has passed our comprehensive 200-point inspection. Key areas are in excellent condition. A great choice for a reliable vehicle.',
        date: new Date().toISOString(),
        inspector: 'AutoVerse Certified',
        scores: { 'Engine': 92, 'Transmission': 95, 'Suspension': 88, 'Brakes': 91, 'Exterior': 85, 'Interior': 90 },
        details: { 'Engine': 'No leaks or abnormal noises found.', 'Exterior': 'Minor cosmetic wear consistent with age.', 'Interior': 'Clean with all electronics functional.' }
    };

    setVehicles(prev => {
        const index = prev.findIndex(v => v.id === vehicleId);
        if (index === -1) return prev;
        const newVehicles = [...prev];
        newVehicles[index] = { ...prev[index], certifiedInspection: inspectionReport };
        return newVehicles;
    });

    addToast('Certified Inspection purchased successfully!', 'success');
  }, [addToast]);

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
    const user = users.find(u => u.email === credentials.email && u.password === credentials.password && u.role === 'seller');
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
    const user = users.find(u => u.email === credentials.email && u.password === credentials.password && u.role === 'customer');
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
    const user = users.find(u => u.email === credentials.email && u.password === credentials.password && u.role === 'admin');
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
        featuredCredits: PLAN_DETAILS.free.featuredCredits
    };
    setUsers(prev => [...prev, newUser]);
    loginUser(newUser);
    setCurrentView(View.SELLER_DASHBOARD);
    addToast('Registration successful! Welcome to AutoVerse AI.', 'success');
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
    addToast('Registration successful! Welcome to AutoVerse AI.', 'success');
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

  const handleAdminUpdateUser = useCallback((email: string, details: { name: string; mobile: string; role: User['role'] }) => {
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
  
  const handleSelectCategory = useCallback((category: VehicleCategory) => {
    setSelectedCategory(category);
    setCurrentView(View.USED_CARS);
    setSelectedVehicle(null);
  }, []);
  
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
    if (isLoading) {
        return (
            <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-brand-blue"></div>
                    <span className="text-xl font-semibold text-brand-gray-600 dark:text-brand-gray-300">Loading Data...</span>
                </div>
            </div>
        );
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
        return selectedVehicleWithRating && <VehicleDetail vehicle={selectedVehicleWithRating} allVehicles={allPublishedVehicles} onBack={() => navigate(View.USED_CARS)} comparisonList={comparisonList} onToggleCompare={handleToggleCompare} onAddSellerRating={handleAddSellerRating} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} currentUser={currentUser} onFlagContent={handleFlagContent} users={usersWithRatingsAndBadges} onViewSellerProfile={handleViewSellerProfile} onStartChat={handleStartChat} recommendations={recommendations} onSelectVehicle={handleSelectVehicle} />;
      case View.SELLER_DASHBOARD:
        return currentUser?.role === 'seller' ? <Dashboard 
                  seller={usersWithRatingsAndBadges.find(u => u.email === currentUser.email)!}
                  allVehicles={vehiclesWithRatings}
                  sellerVehicles={vehiclesWithRatings.filter(v => v.sellerEmail === currentUser.email)} 
                  reportedVehicles={vehiclesWithRatings.filter(v => v.sellerEmail === currentUser.email && v.isFlagged)}
                  onAddVehicle={handleAddVehicle} 
                  onAddMultipleVehicles={handleAddMultipleVehicles}
                  onUpdateVehicle={handleUpdateVehicle} 
                  onDeleteVehicle={handleDeleteVehicle}
                  onMarkAsSold={handleMarkAsSold}
                  conversations={conversations.filter(c => c.sellerId === currentUser.email)}
                  onSellerSendMessage={handleSellerSendMessage}
                  onMarkConversationAsReadBySeller={handleMarkConversationAsReadBySeller}
                  onUserTyping={handleUserTyping}
                  typingStatus={typingStatus}
                  onMarkMessagesAsRead={handleMarkMessagesAsRead}
                  onUpdateSellerProfile={handleUpdateSellerProfile}
                  vehicleData={vehicleData}
                  onNavigate={navigate}
                  onFeatureListing={handleFeatureListing}
                  onPurchaseInspection={handlePurchaseInspection}
                /> : <LoginPortal onNavigate={navigate} />;
      case View.ADMIN_PANEL:
        return currentUser?.role === 'admin' ? <AdminPanel 
                  users={usersWithRatingsAndBadges}
                  currentUser={currentUser}
                  vehicles={vehiclesWithRatings}
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
                /> : <AdminLogin onLogin={handleAdminLogin} onNavigate={navigate} />;
      case View.PROFILE:
        return currentUser ? <Profile 
                  currentUser={currentUser}
                  onUpdateProfile={handleUpdateUserProfile}
                  onUpdatePassword={handleUpdateUserPassword}
                /> : <LoginPortal onNavigate={navigate} />;
      case View.INBOX:
        return currentUser?.role === 'customer' ? <CustomerInbox
                  conversations={conversations.filter(c => c.customerId === currentUser.email)}
                  onSendMessage={handleCustomerSendMessage}
                  onMarkAsRead={handleMarkConversationAsReadByCustomer}
                  users={usersWithRatingsAndBadges}
                  onUserTyping={handleUserTyping}
                  typingStatus={typingStatus}
                  onMarkMessagesAsRead={handleMarkMessagesAsRead}
                  onFlagContent={handleFlagContent}
                /> : <LoginPortal onNavigate={navigate} />;
      case View.COMPARISON:
        return <Comparison vehicles={vehiclesToCompare} onBack={() => navigate(View.USED_CARS)} onToggleCompare={handleToggleCompare} />;
      case View.WISHLIST:
        return <VehicleList categoryTitle="Your Wishlist" vehicles={vehiclesInWishlist} onSelectVehicle={handleSelectVehicle} isLoading={isLoading} comparisonList={comparisonList} onToggleCompare={handleToggleCompare} onClearCompare={handleClearCompare} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} isWishlistMode={true} onViewSellerProfile={handleViewSellerProfile} />;
      case View.NEW_CARS:
        return <NewCars />;
      case View.DEALER_PROFILES:
        return <DealerProfiles sellers={usersWithRatingsAndBadges.filter(u => u.role === 'seller' && u.status === 'active')} onViewProfile={handleViewSellerProfile} />;
      case View.USED_CARS:
        return <VehicleList vehicles={allPublishedVehicles} initialCategory={selectedCategory} initialSearchQuery={initialSearchQuery} onSelectVehicle={handleSelectVehicle} isLoading={isLoading} comparisonList={comparisonList} onToggleCompare={handleToggleCompare} onClearCompare={handleClearCompare} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onViewSellerProfile={handleViewSellerProfile} />;
      case View.HOME:
      default:
        return <Home onSearch={handleHomeSearch} onSelectCategory={handleSelectCategory} featuredVehicles={featuredVehicles} onSelectVehicle={handleSelectVehicle} onToggleCompare={handleToggleCompare} comparisonList={comparisonList} onToggleWishlist={handleToggleWishlist} wishlist={wishlist} onViewSellerProfile={handleViewSellerProfile} recommendations={recommendations} allVehicles={vehiclesWithRatings} onNavigate={navigate} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-gray-50 dark:bg-brand-gray-900 font-sans">
      <Header 
        onNavigate={navigate} 
        currentUser={currentUser} 
        onLogout={handleLogout} 
        compareCount={comparisonList.length} 
        wishlistCount={wishlist.length} 
        inboxCount={inboxUnreadCount} 
        theme={theme} 
        onChangeTheme={handleChangeTheme} 
        isHomePage={isHomePage}
        notifications={notifications.filter(n => n.recipientEmail === currentUser?.email)}
        onNotificationClick={handleNotificationClick}
        onMarkNotificationsAsRead={handleMarkNotificationsAsRead}
        onSelectCategory={handleSelectCategory}
      />
      {platformSettings.siteAnnouncement && isAnnouncementVisible && (
          <div className="bg-brand-blue text-white py-2 px-4 text-center text-sm relative animate-fade-in z-40">
              <span>{platformSettings.siteAnnouncement}</span>
              <button 
                  onClick={() => setIsAnnouncementVisible(false)}
                  className="absolute top-1/2 right-4 -translate-y-1/2 p-1 rounded-full hover:bg-white/20 transition-colors"
                  aria-label="Dismiss announcement"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
              </button>
          </div>
      )}
      <main className="flex-grow">
        {renderContent()}
      </main>
      <Footer onNavigate={navigate} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
       {activeChat && currentUser?.role === 'customer' && (
          <ChatWidget
              conversation={conversations.find(c => c.id === activeChat.id) || activeChat}
              currentUserRole={currentUser.role}
              otherUserName={users.find(u => u.email === activeChat.sellerId)?.name || 'Seller'}
              onSendMessage={(messageText) => handleCustomerSendMessage(activeChat.vehicleId, messageText)}
              onClose={() => setActiveChat(null)}
              onUserTyping={handleUserTyping}
              onMarkMessagesAsRead={handleMarkMessagesAsRead}
              onFlagContent={handleFlagContent}
              typingStatus={typingStatus}
          />
      )}
       <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(view) => {
          navigate(view);
          setIsCommandPaletteOpen(false);
        }}
        currentUser={currentUser}
        onChangeTheme={(theme) => {
          handleChangeTheme(theme);
          setIsCommandPaletteOpen(false);
        }}
        onLogout={() => {
          handleLogout();
          setIsCommandPaletteOpen(false);
        }}
      />
    </div>
  );
};

export default App;