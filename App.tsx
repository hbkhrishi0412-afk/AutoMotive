
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import VehicleList from './components/VehicleList';
import VehicleDetail from './components/VehicleDetail';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import AdminLogin from './components/AdminLogin';
import Comparison from './components/Comparison';
import { MOCK_VEHICLES, MOCK_USERS } from './constants';
import type { Vehicle, User, Conversation, ChatMessage, Toast as ToastType, PlatformSettings, AuditLogEntry } from './types';
import { View } from './types';
import { getRatings, addRating } from './services/ratingService';
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


type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.USED_CARS);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const savedVehicles = getVehicles();
    const initialVehicles = savedVehicles || MOCK_VEHICLES;
    
    return initialVehicles.map(v => ({
      ...v,
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
  const [theme, setTheme] = useState<Theme>('light');
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [toasts, setToasts] = useState<ToastType[]>([]);
  const [forgotPasswordRole, setForgotPasswordRole] = useState<'customer' | 'seller' | null>(null);
  const [typingStatus, setTypingStatus] = useState<{ conversationId: string; userRole: 'customer' | 'seller' } | null>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = getUsers();
    return (savedUsers || MOCK_USERS).map(u => ({...u, status: u.status || 'active'}));
  });
  
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => getSettings());
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>(() => getAuditLog());

  const addToast = (message: string, type: ToastType['type']) => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  };

  const addLogEntry = (action: string, target: string, details?: string) => {
    if (currentUser?.role !== 'admin') return;
    const newLog = logAction(currentUser.email, action, target, details);
    setAuditLog(prev => [newLog, ...prev]);
  };
  
  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  useEffect(() => {
    const sessionUserJson = sessionStorage.getItem('currentUser');
    if (sessionUserJson) {
        setCurrentUser(JSON.parse(sessionUserJson));
    }

    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    
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
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

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
  }, [users, currentUser]);

  const handleToggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    setRatings(getRatings());
  }, []);
  
  useEffect(() => {
    saveUsers(users);
  }, [users]);
  
  useEffect(() => {
    saveVehicles(vehicles);
  }, [vehicles]);
  
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  useEffect(() => {
    saveSettings(platformSettings);
  }, [platformSettings]);

  useEffect(() => {
    saveAuditLog(auditLog);
  }, [auditLog]);

  const handleAddRating = (vehicleId: number, rating: number) => {
    addRating(vehicleId, rating);
    setRatings(prevRatings => {
        const newRatings = {...prevRatings};
        const vehicleRatings = newRatings[vehicleId] || [];
        newRatings[vehicleId] = [...vehicleRatings, rating];
        return newRatings;
    });
  };
  
  const handleToggleWishlist = (vehicleId: number) => {
    setWishlist(prev => {
      const isAdding = !prev.includes(vehicleId);
      const newWishlist = isAdding
        ? [...prev, vehicleId]
        : prev.filter(id => id !== vehicleId);
      localStorage.setItem('wishlist', JSON.stringify(newWishlist));
      addToast(isAdding ? 'Added to wishlist!' : 'Removed from wishlist.', 'info');
      return newWishlist;
    });
  };

  const handleUserTyping = (conversationId: string, userRole: 'customer' | 'seller') => {
    if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
    }
    setTypingStatus({ conversationId, userRole });
    typingTimeoutRef.current = window.setTimeout(() => {
        setTypingStatus(null);
    }, 2000);
  };

  const handleMarkMessagesAsRead = (conversationId: string, readerRole: 'customer' | 'seller') => {
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
  };

  const handleCustomerSendMessage = (vehicleId: number, messageText: string) => {
    if (!currentUser || currentUser.role !== 'customer') return;

    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) {
        addToast("Could not find vehicle details.", "error");
        return;
    }
    
    setVehicles(prev => prev.map(v => v.id === vehicleId ? {...v, inquiriesCount: (v.inquiriesCount || 0) + 1} : v));

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
                vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                messages: [userMessage],
                lastMessageAt: userMessage.timestamp,
                isReadBySeller: false,
                isReadByCustomer: true,
            };
            return [...prev, newConversation];
        }
    });
  };
  
  const handleSellerSendMessage = (conversationId: string, messageText: string) => {
    if (!currentUser || currentUser.role !== 'seller') return;

    setConversations(prev => {
      return prev.map(conversation => {
        if (conversation.id === conversationId) {
          const sellerMessage: ChatMessage = {
            id: Date.now(),
            sender: 'seller',
            text: messageText,
            timestamp: new Date().toISOString(),
            isRead: false,
          };
          return {
            ...conversation,
            messages: [...conversation.messages, sellerMessage],
            lastMessageAt: new Date().toISOString(),
            isReadByCustomer: false,
          };
        }
        return conversation;
      });
    });
  };
  
  const handleMarkConversationAsReadBySeller = (conversationId: string) => {
    setConversations(prev => {
        return prev.map(conversation => {
          if (conversation.id === conversationId && !conversation.isReadBySeller) {
            return { ...conversation, isReadBySeller: true };
          }
          return conversation;
        });
    });
  }

  const handleMarkConversationAsReadByCustomer = (conversationId: string) => {
    setConversations(prev => {
        return prev.map(conversation => {
          if (conversation.id === conversationId && conversation.isReadByCustomer === false) {
            return { ...conversation, isReadByCustomer: true };
          }
          return conversation;
        });
    });
  };

  const vehiclesWithRatings = useMemo(() => {
    return vehicles.map(vehicle => {
      const vehicleRatings = ratings[vehicle.id] || [];
      const ratingCount = vehicleRatings.length;
      const averageRating = ratingCount > 0 
        ? vehicleRatings.reduce((acc, curr) => acc + curr, 0) / ratingCount 
        : 0;
      return { ...vehicle, averageRating, ratingCount };
    });
  }, [vehicles, ratings]);
  
  const handleAddVehicle = (vehicleData: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount' | 'status' | 'isFeatured'>) => {
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
  };
  
  const handleUpdateVehicle = (updatedVehicle: Vehicle) => {
    setVehicles(prevVehicles =>
      prevVehicles.map(vehicle =>
        vehicle.id === updatedVehicle.id ? updatedVehicle : vehicle
      )
    );
    addLogEntry('Updated Vehicle', String(updatedVehicle.id), `${updatedVehicle.year} ${updatedVehicle.make} ${updatedVehicle.model}`);
    addToast('Vehicle updated successfully!', 'success');
  };

  const handleDeleteVehicle = (vehicleId: number) => {
    if(window.confirm('Are you sure you want to delete this vehicle listing? This action cannot be undone.')){
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle) addLogEntry('Deleted Vehicle', String(vehicleId), `${vehicle.year} ${vehicle.make} ${vehicle.model}`);
        setVehicles(prevVehicles => prevVehicles.filter(v => v.id !== vehicleId));
        addToast('Vehicle listing has been deleted.', 'info');
    }
  };

  const handleMarkAsSold = (vehicleId: number) => {
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, status: 'sold' } : v));
    addToast('Vehicle marked as sold!', 'success');
  };

  const handleToggleVehicleStatus = (vehicleId: number) => {
    let statusChange = '';
    let action = '';
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        const newStatus = v.status === 'published' ? 'unpublished' : 'published';
        action = newStatus === 'published' ? 'Published Vehicle' : 'Unpublished Vehicle';
        statusChange = `Vehicle listing has been ${newStatus}.`;
        return { ...v, status: newStatus };
      }
      return v;
    }));
    addLogEntry(action, String(vehicleId));
    addToast(statusChange, 'info');
  };

  const handleToggleVehicleFeature = (vehicleId: number) => {
    let featureChange = '';
    let action = '';
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        const newIsFeatured = !v.isFeatured;
        action = newIsFeatured ? 'Featured Vehicle' : 'Un-featured Vehicle';
        featureChange = `Vehicle has been ${newIsFeatured ? 'featured' : 'un-featured'}.`;
        return { ...v, isFeatured: newIsFeatured };
      }
      return v;
    }));
    addLogEntry(action, String(vehicleId));
    addToast(featureChange, 'info');
  };

  const handleToggleCompare = (vehicleId: number) => {
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
  };

  const handleClearCompare = () => {
    setComparisonList([]);
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setCurrentView(View.DETAIL);
    setVehicles(prev => prev.map(v => v.id === vehicle.id ? {...v, views: (v.views || 0) + 1} : v));
  };

  const handleBackToUsedCars = () => {
    setSelectedVehicle(null);
    setCurrentView(View.USED_CARS);
  };

  const loginUser = (user: User) => {
      setCurrentUser(user);
      sessionStorage.setItem('currentUser', JSON.stringify(user));
      addToast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
  };

  const handleSellerLogin = (credentials: { email: string; password: string; }) => {
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
  };
  
  const handleCustomerLogin = (credentials: { email: string; password: string; }) => {
    const user = users.find(u => u.email === credentials.email && u.password === credentials.password && u.role === 'customer');
    if (user && user.status === 'active') {
      loginUser(user);
      setCurrentView(View.USED_CARS);
      return { success: true, reason: '' };
    }
    const reason = user && user.status === 'inactive'
        ? 'Your account has been deactivated. Please contact support.'
        : 'Invalid email or password. Please try again or register.';
        
    addToast(reason, 'error');
    return { success: false, reason };
  };

  const handleAdminLogin = (credentials: { email: string; password: string; }) => {
    const user = users.find(u => u.email === credentials.email && u.password === credentials.password && u.role === 'admin');
    if (user) {
      loginUser(user);
      setCurrentView(View.ADMIN_PANEL);
      return true;
    }
    addToast('Invalid admin credentials.', 'error');
    return false;
  };

  const handleSellerRegister = (credentials: Omit<User, 'role' | 'status' | 'createdAt'>): { success: boolean, reason: string } => {
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
  };

  const handleCustomerRegister = (credentials: Omit<User, 'role' | 'status' | 'createdAt'>): { success: boolean, reason: string } => {
    if (users.some(u => u.email === credentials.email)) {
      const reason = 'An account with this email already exists. Please log in.';
      addToast(reason, 'error');
      return { success: false, reason };
    }
    const newUser: User = { ...credentials, role: 'customer', status: 'active', createdAt: new Date().toISOString() };
    setUsers(prev => [...prev, newUser]);
    loginUser(newUser);
    setCurrentView(View.USED_CARS);
    addToast('Registration successful! Welcome to AutoVerse AI.', 'success');
    return { success: true, reason: '' };
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
    setCurrentView(View.USED_CARS);
    addToast('You have been logged out.', 'info');
  };
  
  const handleToggleUserStatus = (userEmail: string) => {
    let statusChange = '';
    let action = '';
    setUsers(prevUsers => prevUsers.map(user => {
      if (user.email === userEmail) {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        action = newStatus === 'active' ? 'Reactivated User' : 'Deactivated User';
        statusChange = `User has been ${newStatus === 'active' ? 'reactivated' : 'deactivated'}.`;
        return { ...user, status: newStatus };
      }
      return user;
    }));
    addLogEntry(action, userEmail);
    addToast(statusChange, 'success');
  };
  
  const handleDeleteUser = (userEmail: string) => {
    if (window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
        addLogEntry('Deleted User', userEmail);
        setUsers(prevUsers => prevUsers.filter(user => user.email !== userEmail));
        setVehicles(prev => prev.filter(v => v.sellerEmail !== userEmail));
        setConversations(prev => prev.filter(c => c.customerId !== userEmail && c.sellerId !== userEmail));
        addToast('User has been permanently deleted.', 'info');
    }
  };

  const handleAdminUpdateUser = (email: string, details: { name: string; mobile: string; role: User['role'] }) => {
    addLogEntry('Updated User Profile', email);
    setUsers(prev => prev.map(u => u.email === email ? { ...u, ...details } : u));
    addToast("User details have been updated successfully.", "success");
  };

  const handleUpdateUserProfile = (updatedDetails: { name: string; mobile: string; }) => {
    if (!currentUser) return;
    setUsers(prev => prev.map(u => 
      u.email === currentUser.email ? { ...u, name: updatedDetails.name, mobile: updatedDetails.mobile } : u
    ));
    addToast('Profile updated successfully!', 'success');
  };
  
  const handleUpdateSellerProfile = (updatedDetails: { dealershipName: string; bio: string; logoUrl: string; }) => {
     if (!currentUser) return;
     setUsers(prev => prev.map(u => 
       u.email === currentUser.email ? { ...u, ...updatedDetails } : u
     ));
     addToast('Seller profile updated successfully!', 'success');
  };

  const handleUpdateUserPassword = (passwords: { current: string; new: string; }): boolean => {
    if (!currentUser) return false;
    const userInDb = users.find(u => u.email === currentUser.email);
    if (userInDb && userInDb.password === passwords.current) {
        setUsers(prev => prev.map(u =>
            u.email === currentUser.email ? { ...u, password: passwords.new } : u
        ));
        addToast('Password changed successfully!', 'success');
        return true;
    }
    addToast('Incorrect current password.', 'error');
    return false;
  };

  const handleForgotPasswordRequest = (email: string) => {
    const userExists = users.some(u => u.email === email && u.role === forgotPasswordRole);
    console.log(`Password reset for ${email} as a ${forgotPasswordRole}. User exists: ${userExists}`);
  };

  const handleFlagContent = (type: 'vehicle' | 'conversation', id: number | string) => {
    if (type === 'vehicle') {
        setVehicles(prev => prev.map(v => v.id === id ? { ...v, isFlagged: true } : v));
    } else {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, isFlagged: true } : c));
    }
    addToast('Content has been reported for review. Thank you.', 'info');
  };

  const handleResolveFlag = (type: 'vehicle' | 'conversation', id: number | string) => {
      if (type === 'vehicle') {
          addLogEntry('Resolved Flag (Vehicle)', String(id));
          setVehicles(prev => prev.map(v => v.id === id ? { ...v, isFlagged: false } : v));
      } else {
          addLogEntry('Resolved Flag (Conversation)', String(id));
          setConversations(prev => prev.map(c => c.id === id ? { ...c, isFlagged: false } : c));
      }
      addToast('Flag has been resolved.', 'success');
  };

  const handleAdminUpdateSettings = (newSettings: PlatformSettings) => {
      setPlatformSettings(newSettings);
      addLogEntry('Updated Platform Settings', 'platform-settings', JSON.stringify(newSettings));
      addToast('Platform settings updated.', 'success');
  };

  const handleAdminSendBroadcast = (message: string) => {
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
  };
  
  const navigate = (view: View) => {
    setSelectedVehicle(null);
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
  }

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
    return vehiclesWithRatings.filter(v => v.status === 'published');
  }, [vehiclesWithRatings]);

  const inboxUnreadCount = useMemo(() => {
    if (!currentUser || currentUser.role !== 'customer') return 0;
    return conversations.filter(c => c.customerId === currentUser.email && !c.isReadByCustomer).length;
  }, [conversations, currentUser]);

  const renderContent = () => {
    switch (currentView) {
      case View.DETAIL:
        return selectedVehicleWithRating && <VehicleDetail vehicle={selectedVehicleWithRating} onBack={handleBackToUsedCars} comparisonList={comparisonList} onToggleCompare={handleToggleCompare} onAddRating={handleAddRating} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} currentUser={currentUser} onSendMessage={handleCustomerSendMessage} conversations={conversations} onUserTyping={handleUserTyping} typingStatus={typingStatus} onMarkMessagesAsRead={handleMarkMessagesAsRead} onFlagContent={handleFlagContent} />;
      case View.SELLER_DASHBOARD:
        return currentUser?.role === 'seller' ? <Dashboard 
                  seller={currentUser}
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
                /> : <LoginPortal onNavigate={navigate} />;
      case View.ADMIN_PANEL:
        return currentUser?.role === 'admin' ? <AdminPanel 
                  users={users}
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
                  users={users}
                  onUserTyping={handleUserTyping}
                  typingStatus={typingStatus}
                  onMarkMessagesAsRead={handleMarkMessagesAsRead}
                  onFlagContent={handleFlagContent}
                /> : <LoginPortal onNavigate={navigate} />;
      case View.LOGIN_PORTAL:
        return <LoginPortal onNavigate={navigate} />;
      case View.CUSTOMER_LOGIN:
        return <CustomerLogin 
                  onLogin={handleCustomerLogin} 
                  onRegister={handleCustomerRegister} 
                  onNavigate={navigate} 
                  onForgotPassword={() => {
                    setForgotPasswordRole('customer');
                    navigate(View.FORGOT_PASSWORD);
                  }}
                />;
      case View.SELLER_LOGIN:
        return <Login 
                  onLogin={handleSellerLogin} 
                  onRegister={handleSellerRegister} 
                  onNavigate={navigate}
                  onForgotPassword={() => {
                    setForgotPasswordRole('seller');
                    navigate(View.FORGOT_PASSWORD);
                  }}
                />;
      case View.ADMIN_LOGIN:
        return <AdminLogin onLogin={handleAdminLogin} onNavigate={navigate} />;
      case View.FORGOT_PASSWORD:
        return <ForgotPassword 
                onResetRequest={handleForgotPasswordRequest}
                onBack={() => navigate(forgotPasswordRole === 'customer' ? View.CUSTOMER_LOGIN : View.SELLER_LOGIN)}
               />;
      case View.COMPARISON:
        return <Comparison vehicles={vehiclesToCompare} onBack={handleBackToUsedCars} onToggleCompare={handleToggleCompare} />;
      case View.WISHLIST:
        return <VehicleList vehicles={vehiclesInWishlist} onSelectVehicle={handleSelectVehicle} isLoading={isLoading} comparisonList={comparisonList} onToggleCompare={handleToggleCompare} onClearCompare={handleClearCompare} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} isWishlistMode={true} />;
      case View.USED_CARS:
      default:
        return <VehicleList vehicles={publishedVehicles} onSelectVehicle={handleSelectVehicle} isLoading={isLoading} comparisonList={comparisonList} onToggleCompare={handleToggleCompare} onClearCompare={handleClearCompare} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-gray-light dark:bg-brand-gray-darker font-sans transition-colors duration-300">
      <Header onNavigate={navigate} currentUser={currentUser} onLogout={handleLogout} compareCount={comparisonList.length} wishlistCount={wishlist.length} inboxCount={inboxUnreadCount} theme={theme} onToggleTheme={handleToggleTheme} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderContent()}
      </main>
      <Footer />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default App;
