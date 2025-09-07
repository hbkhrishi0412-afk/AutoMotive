import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import VehicleList from './components/VehicleList';
import VehicleDetail from './components/VehicleDetail';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import AdminLogin from './components/AdminLogin';
import Comparison from './components/Comparison';
import { MOCK_VEHICLES, MOCK_USERS } from './constants';
import type { Vehicle, User, Conversation, ChatMessage, Toast as ToastType, PlatformSettings, AuditLogEntry, VehicleData } from './types';
import { View, VehicleCategory } from './types';
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


export type Theme = 'light' | 'dark' | 'sunset' | 'oceanic' | 'cyber';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [previousView, setPreviousView] = useState<View>(View.HOME);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const savedVehicles = getVehicles();
    const initialVehicles = savedVehicles || MOCK_VEHICLES;
    
    return initialVehicles.map(v => ({
      ...v,
      category: v.category || VehicleCategory.FOUR_WHEELER,
      status: v.status || 'published',
      isFeatured: v.isFeatured || false,
      views: v.views || 0,
      inquiriesCount: v.inquiriesCount || 0,
      isFlagged: v.isFlagged || false,
    }));
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [comparisonList, setComparisonList] = useState<number[]>([]);
  const [ratings, setRatings] = useState<{ [key: string]: number[] }>({});
  const [sellerRatings, setSellerRatings] = useState<{ [key: string]: number[] }>({});
  const [theme, setTheme] = useState<Theme>('dark');
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [forgotPasswordRole, setForgotPasswordRole] = useState<'customer' | 'seller' | null>(null);
  const [typingStatus, setTypingStatus] = useState<{ conversationId: string; userRole: 'customer' | 'seller' } | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>(VehicleCategory.FOUR_WHEELER);
  const [publicSellerProfile, setPublicSellerProfile] = useState<User | null>(null);
  const prevConversationsRef = useRef<Conversation[] | null>(null);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);

  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = getUsers();
    return (savedUsers || MOCK_USERS).map(u => ({...u, status: u.status || 'active'}));
  });
  
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => getSettings());
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(() => getAuditLog());
  const [vehicleData, setVehicleData] = useState<VehicleData>(() => getVehicleData());

  const addToast = useCallback((message: string, type: ToastType['type']) => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  }, []);

  const addLogEntry = useCallback((action: string, target: string, details?: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const newLog = logAction(currentUser.email, action, target, details);
    setAuditLog(prev => [newLog, ...prev]);
  }, [currentUser]);
  
  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);
  
  const isHomePage = currentView === View.HOME;

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
    })));

    // Check for seller profile view from URL on initial load
    const urlParams = new URLSearchParams(window.location.search);
    const sellerEmail = urlParams.get('seller');
    if (sellerEmail) {
        // We need to use the users from state, which is initialized synchronously
        const savedUsers = getUsers();
        const allUsers = (savedUsers || MOCK_USERS);
        const sellerUser = allUsers.find(u => u.email === sellerEmail && u.role === 'seller');

        if (sellerUser) {
            setPublicSellerProfile(sellerUser);
            setCurrentView(View.SELLER_PROFILE);
        } else {
            addToast('Seller profile not found.', 'error');
            window.history.pushState({}, '', window.location.pathname);
        }
    }
  }, [addToast]);

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
    saveUsers(users);
  }, [users]);
  
  useEffect(() => {
    saveVehicles(vehicles);
  }, [vehicles]);
  
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

  const usersWithRatings = useMemo(() => {
    return users.map(user => {
      if (user.role !== 'seller') return user;
      const sellerRatingsList = sellerRatings[user.email] || [];
      const ratingCount = sellerRatingsList.length;
      const averageRating = ratingCount > 0
        ? sellerRatingsList.reduce((acc, curr) => acc + curr, 0) / ratingCount
        : 0;
      return { ...user, averageRating, ratingCount };
    });
  }, [users, sellerRatings]);

  const vehiclesWithRatings = useMemo(() => {
    return vehicles.map(vehicle => {
      const vehicleRatings = ratings[vehicle.id] || [];
      const ratingCount = vehicleRatings.length;
      const averageRating = ratingCount > 0
        ? vehicleRatings.reduce((acc, curr) => acc + curr, 0) / ratingCount
        : 0;
      const seller = usersWithRatings.find(u => u.email === vehicle.sellerEmail);
      const sellerName = seller?.dealershipName || seller?.name || 'Private Seller';
      const sellerAverageRating = seller?.averageRating;
      const sellerRatingCount = seller?.ratingCount;
      return { ...vehicle, averageRating, ratingCount, sellerName, sellerAverageRating, sellerRatingCount };
    });
  }, [vehicles, ratings, usersWithRatings]);
  
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
    const newUser: User = {...credentials, role: 'seller', status: 'active', createdAt: new Date().toISOString()};
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

  const handleFlagContent = useCallback((type: 'vehicle' | 'conversation', id: number | string) => {
    if (type === 'vehicle') {
        setVehicles(prev => {
            const index = prev.findIndex(v => v.id === id);
            if (index === -1) return prev;
            const newVehicles = [...prev];
            newVehicles[index] = { ...prev[index], isFlagged: true };
            return newVehicles;
        });
    } else {
        setConversations(prev => {
            const index = prev.findIndex(c => c.id === id);
            if (index === -1) return prev;
            const newConversations = [...prev];
            newConversations[index] = { ...prev[index], isFlagged: true };
            return newConversations;
        });
    }
    addToast('Content has been reported for review. Thank you.', 'info');
  }, [addToast]);

  const handleResolveFlag = useCallback((type: 'vehicle' | 'conversation', id: number | string) => {
      if (type === 'vehicle') {
          addLogEntry('Resolved Flag (Vehicle)', String(id));
          setVehicles(prev => {
              const index = prev.findIndex(v => v.id === id);
              if (index === -1) return prev;
              const newVehicles = [...prev];
              newVehicles[index] = { ...prev[index], isFlagged: false };
              return newVehicles;
          });
      } else {
          addLogEntry('Resolved Flag (Conversation)', String(id));
          setConversations(prev => {
              const index = prev.findIndex(c => c.id === id);
              if (index === -1) return prev;
              const newConversations = [...prev];
              newConversations[index] = { ...prev[index], isFlagged: false };
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

  const navigate = useCallback((view: View) => {
    if (currentView === View.SELLER_PROFILE && view !== View.SELLER_PROFILE) {
        window.history.pushState({}, '', window.location.pathname);
        setPublicSellerProfile(null);
    }
    setSelectedVehicle(null);
    if (view === View.USED_CARS) {
        setSelectedCategory(VehicleCategory.FOUR_WHEELER);
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
  
  const handleSelectCategory = useCallback((category: VehicleCategory) => {
    setSelectedCategory(category);
    setCurrentView(View.USED_CARS);
    setSelectedVehicle(null);
  }, []);
  
  const handleViewSellerProfile = useCallback((sellerEmail: string) => {
    const sellerUser = usersWithRatings.find(u => u.email === sellerEmail && u.role === 'seller');
    if (sellerUser) {
        setPreviousView(currentView);
        setPublicSellerProfile(sellerUser);
        setCurrentView(View.SELLER_PROFILE);
        window.history.pushState({}, '', `${window.location.pathname}?seller=${sellerEmail}`);
    } else {
        addToast('Seller profile not found.', 'error');
    }
  }, [currentView, usersWithRatings, addToast]);

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

  const publishedVehicles = useMemo(() => {
    return vehiclesWithRatings.filter(v => v.status === 'published' && v.category === selectedCategory);
  }, [vehiclesWithRatings, selectedCategory]);

  const featuredVehicles = useMemo(() => {
    return vehiclesWithRatings.filter(v => v.isFeatured && v.status === 'published').slice(0, 4);
  }, [vehiclesWithRatings]);

  const inboxUnreadCount = useMemo(() => {
    if (!currentUser || currentUser.role !== 'customer') return 0;
    return conversations.filter(c => c.customerId === currentUser.email && !c.isReadByCustomer).length;
  }, [conversations, currentUser]);

  const renderContent = () => {
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
      case View.SELLER_PROFILE:
        return publicSellerProfile && <SellerProfilePage 
                  seller={usersWithRatings.find(u => u.email === publicSellerProfile.email)!}
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
        return selectedVehicleWithRating && <VehicleDetail vehicle={selectedVehicleWithRating} onBack={handleBackToHome} comparisonList={comparisonList} onToggleCompare={handleToggleCompare} onAddSellerRating={handleAddSellerRating} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} currentUser={currentUser} onFlagContent={handleFlagContent} users={usersWithRatings} onViewSellerProfile={handleViewSellerProfile} onStartChat={handleStartChat} />;
      case View.SELLER_DASHBOARD:
        return currentUser?.role === 'seller' ? <Dashboard 
                  seller={usersWithRatings.find(u => u.email === currentUser.email)!}
                  sellerVehicles={vehiclesWithRatings.filter(v => v.sellerEmail === currentUser.email)} 
                  onAddVehicle={handleAddVehicle} 
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
                /> : <LoginPortal onNavigate={navigate} />;
      case View.ADMIN_PANEL:
        return currentUser?.role === 'admin' ? <AdminPanel 
                  users={usersWithRatings}
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
                  users={usersWithRatings}
                  onUserTyping={handleUserTyping}
                  typingStatus={typingStatus}
                  onMarkMessagesAsRead={handleMarkMessagesAsRead}
                  onFlagContent={handleFlagContent}
                /> : <LoginPortal onNavigate={navigate} />;
      case View.COMPARISON:
        return <Comparison vehicles={vehiclesToCompare} onBack={handleBackToHome} onToggleCompare={handleToggleCompare} />;
      case View.WISHLIST:
        return <VehicleList categoryTitle="Your Wishlist" vehicles={vehiclesInWishlist} onSelectVehicle={handleSelectVehicle} isLoading={isLoading} comparisonList={comparisonList} onToggleCompare={handleToggleCompare} onClearCompare={handleClearCompare} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} isWishlistMode={true} onViewSellerProfile={handleViewSellerProfile} />;
      case View.USED_CARS:
        return <VehicleList categoryTitle={selectedCategory} vehicles={publishedVehicles} onSelectVehicle={handleSelectVehicle} isLoading={isLoading} comparisonList={comparisonList} onToggleCompare={handleToggleCompare} onClearCompare={handleClearCompare} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} onViewSellerProfile={handleViewSellerProfile} />;
      case View.HOME:
      default:
        return <Home onNavigate={navigate} onSelectCategory={handleSelectCategory} featuredVehicles={featuredVehicles} onSelectVehicle={handleSelectVehicle} onToggleCompare={handleToggleCompare} comparisonList={comparisonList} onToggleWishlist={handleToggleWishlist} wishlist={wishlist} onViewSellerProfile={handleViewSellerProfile} />;
    }
  };

  return (
    <div className={`flex flex-col min-h-screen ${isHomePage ? 'bg-black' : 'bg-brand-gray-50 dark:bg-brand-gray-900'} font-sans`}>
      <Header onNavigate={navigate} currentUser={currentUser} onLogout={handleLogout} compareCount={comparisonList.length} wishlistCount={wishlist.length} inboxCount={inboxUnreadCount} theme={theme} onChangeTheme={handleChangeTheme} isHomePage={isHomePage} />
      <main className="flex-grow">
        {renderContent()}
      </main>
      <Footer />
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
    </div>
  );
};

export default App;