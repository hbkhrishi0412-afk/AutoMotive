

import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import VehicleList from './components/VehicleList';
import VehicleDetail from './components/VehicleDetail';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import AdminLogin from './components/AdminLogin';
import Comparison from './components/Comparison';
import { MOCK_VEHICLES, MOCK_USERS } from './constants';
import type { Vehicle, User, Conversation, ChatMessage, Toast as ToastType } from './types';
import { View } from './types';
import { getRatings, addRating } from './services/ratingService';
import { getConversations, saveConversations } from './services/chatService';
import { getVehicles, saveVehicles } from './services/vehicleService';
import { getUsers, saveUsers } from './services/userService';
import { getAIResponse } from './services/geminiService';
import LoginPortal from './components/LoginPortal';
import CustomerLogin from './components/CustomerLogin';
import AdminPanel from './components/AdminPanel';
import ToastContainer from './components/ToastContainer';
import Profile from './components/Profile';

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.USED_CARS);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const savedVehicles = getVehicles();
    const initialVehicles = savedVehicles || MOCK_VEHICLES;
    
    // Data migration for vehicles from older versions without new properties
    return initialVehicles.map(v => ({
      ...v,
      status: v.status || 'published',
      isFeatured: v.isFeatured || false,
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
  
  const [users, setUsers] = useState<User[]>(() => {
    const savedUsers = getUsers();
    // migration for users who dont have a status
    return (savedUsers || MOCK_USERS).map(u => ({...u, status: u.status || 'active'}));
  });

  const addToast = (message: string, type: ToastType['type']) => {
    setToasts(prev => [...prev, { id: Date.now(), message, type }]);
  };
  
  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  useEffect(() => {
    // Restore session
    const sessionUserJson = sessionStorage.getItem('currentUser');
    if (sessionUserJson) {
        setCurrentUser(JSON.parse(sessionUserJson));
    }

    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
    
    // Load wishlist & conversations from localStorage on initial load
    const savedWishlist = localStorage.getItem('wishlist');
    if (savedWishlist) {
      setWishlist(JSON.parse(savedWishlist));
    }
    setConversations(getConversations());
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Sync currentUser with the main users state, useful for profile updates or admin actions
  useEffect(() => {
    if (currentUser) {
        const updatedUserInState = users.find(u => u.email === currentUser.email);
        if (updatedUserInState && JSON.stringify(updatedUserInState) !== JSON.stringify(currentUser)) {
            setCurrentUser(updatedUserInState);
            sessionStorage.setItem('currentUser', JSON.stringify(updatedUserInState));
        }
        // If user was deactivated or deleted, log them out
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

  const handleCustomerSendMessage = async (vehicle: Vehicle, messageText: string) => {
    if (!currentUser || currentUser.role !== 'customer') return;

    const conversationId = `${currentUser.email}-${vehicle.id}`;
    let updatedConversations = [...conversations];
    let targetConversation = updatedConversations.find(c => c.id === conversationId);
    const currentTime = new Date().toISOString();

    const userMessage: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      text: messageText,
      timestamp: currentTime,
    };

    if (targetConversation) {
      targetConversation.messages.push(userMessage);
      targetConversation.lastMessageAt = currentTime;
      targetConversation.isReadByDealer = false;
    } else {
      targetConversation = {
        id: conversationId,
        customerId: currentUser.email,
        customerName: currentUser.name,
        dealerId: vehicle.dealerEmail,
        vehicleId: vehicle.id,
        vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.variant}`,
        messages: [
          { id: Date.now() -1, sender: 'ai', text: `Hi! I'm an AI assistant. How can I help you with the ${vehicle.year} ${vehicle.make} ${vehicle.variant}?`, timestamp: new Date(Date.now() - 1000).toISOString() },
          userMessage
        ],
        lastMessageAt: currentTime,
        isReadByDealer: false,
      };
      updatedConversations.push(targetConversation);
    }
    
    setConversations(updatedConversations);

    // AI follows up
    const chatHistoryForAI = targetConversation.messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));
    const aiResponseText = await getAIResponse(vehicle, chatHistoryForAI);
    const aiMessage: ChatMessage = { id: Date.now() + 1, sender: 'ai', text: aiResponseText, timestamp: new Date().toISOString() };
    
    // Add AI message to the same conversation
    setConversations(prev => {
        const convs = [...prev];
        const conv = convs.find(c => c.id === conversationId);
        if (conv) {
            conv.messages.push(aiMessage);
            conv.lastMessageAt = new Date().toISOString();
        }
        return convs;
    });
  };
  
  const handleDealerSendMessage = (conversationId: string, messageText: string) => {
    if (!currentUser || currentUser.role !== 'dealer') return;

    setConversations(prev => {
      const updatedConversations = [...prev];
      const conversation = updatedConversations.find(c => c.id === conversationId);
      if (conversation) {
        const dealerMessage: ChatMessage = {
          id: Date.now(),
          sender: 'dealer',
          text: messageText,
          timestamp: new Date().toISOString(),
        };
        conversation.messages.push(dealerMessage);
        conversation.lastMessageAt = new Date().toISOString();
      }
      return updatedConversations;
    });
  };
  
  const handleMarkConversationAsRead = (conversationId: string) => {
    setConversations(prev => {
        const updatedConversations = [...prev];
        const conversation = updatedConversations.find(c => c.id === conversationId);
        if (conversation && conversation.isReadByDealer === false) {
          conversation.isReadByDealer = true;
        }
        return updatedConversations;
    });
  }

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
      dealerEmail: currentUser?.email || 'dealer@test.com',
      status: 'published',
      isFeatured: false,
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
    addToast('Vehicle updated successfully!', 'success');
  };

  const handleDeleteVehicle = (vehicleId: number) => {
    if(window.confirm('Are you sure you want to delete this vehicle listing? This action cannot be undone.')){
        setVehicles(prevVehicles => prevVehicles.filter(v => v.id !== vehicleId));
        addToast('Vehicle listing has been deleted.', 'info');
    }
  };

  const handleToggleVehicleStatus = (vehicleId: number) => {
    let statusChange = '';
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        const newStatus = v.status === 'published' ? 'unpublished' : 'published';
        statusChange = `Vehicle listing has been ${newStatus}.`;
        return { ...v, status: newStatus };
      }
      return v;
    }));
    addToast(statusChange, 'info');
  };

  const handleToggleVehicleFeature = (vehicleId: number) => {
    let featureChange = '';
    setVehicles(prev => prev.map(v => {
      if (v.id === vehicleId) {
        const newIsFeatured = !v.isFeatured;
        featureChange = `Vehicle has been ${newIsFeatured ? 'featured' : 'un-featured'}.`;
        return { ...v, isFeatured: newIsFeatured };
      }
      return v;
    }));
    addToast(featureChange, 'info');
  };
  
  const handleCheckAvailability = (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
        addToast(`Good news! The ${vehicle.year} ${vehicle.make} ${vehicle.variant} is available. The dealer has been notified of your interest.`, 'success');
    }
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

  const handleDealerLogin = (credentials: { email: string; password: string; }) => {
    const user = users.find(u => u.email === credentials.email && u.password === credentials.password && u.role === 'dealer');
    if (user && user.status === 'active') {
      loginUser(user);
      setCurrentView(View.DEALER_DASHBOARD);
      return { success: true, reason: ''};
    }
    const reason = user && user.status === 'inactive'
        ? 'Your account has been deactivated. Please contact support.'
        : 'Invalid dealer credentials. Please try again or register.';

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
    if (user) { // Admins can log in even if inactive, for recovery purposes
      loginUser(user);
      setCurrentView(View.ADMIN_PANEL);
      return true;
    }
    addToast('Invalid admin credentials.', 'error');
    return false;
  };

  const handleDealerRegister = (credentials: Omit<User, 'role' | 'status'>): { success: boolean, reason: string } => {
    if (users.some(u => u.email === credentials.email)) {
      const reason = 'A dealer account with this email already exists.';
      addToast(reason, 'error');
      return { success: false, reason };
    }
    const newUser: User = {...credentials, role: 'dealer', status: 'active'};
    setUsers(prev => [...prev, newUser]);
    loginUser(newUser);
    setCurrentView(View.DEALER_DASHBOARD);
    addToast('Registration successful! Welcome to AutoVerse AI.', 'success');
    return { success: true, reason: ''};
  };

  const handleCustomerRegister = (credentials: Omit<User, 'role' | 'status'>): { success: boolean, reason: string } => {
    if (users.some(u => u.email === credentials.email)) {
      const reason = 'An account with this email already exists. Please log in.';
      addToast(reason, 'error');
      return { success: false, reason };
    }
    const newUser: User = { ...credentials, role: 'customer', status: 'active' };
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
    setUsers(prevUsers => prevUsers.map(user => {
      if (user.email === userEmail) {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        statusChange = `User has been ${newStatus === 'active' ? 'reactivated' : 'deactivated'}.`;
        return { ...user, status: newStatus };
      }
      return user;
    }));
    addToast(statusChange, 'success');
  };
  
  const handleDeleteUser = (userEmail: string) => {
    if (window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) {
        setUsers(prevUsers => prevUsers.filter(user => user.email !== userEmail));
        // Also consider deleting their listings and conversations
        setVehicles(prev => prev.filter(v => v.dealerEmail !== userEmail));
        setConversations(prev => prev.filter(c => c.customerId !== userEmail && c.dealerId !== userEmail));
        addToast('User has been permanently deleted.', 'info');
    }
  };

  const handleAdminUpdateUser = (email: string, details: { name: string; mobile: string; role: User['role'] }) => {
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
  
  const navigate = (view: View) => {
    setSelectedVehicle(null);
    if (view === View.DEALER_DASHBOARD && currentUser?.role !== 'dealer') {
        setCurrentView(View.LOGIN_PORTAL);
    } else if (view === View.ADMIN_PANEL && currentUser?.role !== 'admin') {
        setCurrentView(View.ADMIN_LOGIN);
    } else if (view === View.PROFILE && !currentUser) {
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

  const renderContent = () => {
    switch (currentView) {
      case View.DETAIL:
// FIX: Changed onToggleCompare to handleToggleCompare
        return selectedVehicleWithRating && <VehicleDetail vehicle={selectedVehicleWithRating} onBack={handleBackToUsedCars} comparisonList={comparisonList} onToggleCompare={handleToggleCompare} onAddRating={handleAddRating} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} currentUser={currentUser} onSendMessage={handleCustomerSendMessage} conversations={conversations} onCheckAvailability={handleCheckAvailability} />;
      case View.DEALER_DASHBOARD:
        return currentUser?.role === 'dealer' ? <Dashboard 
                  dealerVehicles={vehiclesWithRatings.filter(v => v.dealerEmail === currentUser.email)} 
                  onAddVehicle={handleAddVehicle} 
                  onUpdateVehicle={handleUpdateVehicle} 
                  onDeleteVehicle={handleDeleteVehicle}
                  conversations={conversations.filter(c => c.dealerId === currentUser.email)}
                  onDealerSendMessage={handleDealerSendMessage}
                  onMarkConversationAsRead={handleMarkConversationAsRead}
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
                /> : <AdminLogin onLogin={handleAdminLogin} onNavigate={navigate} />;
      case View.PROFILE:
        return currentUser ? <Profile 
                  currentUser={currentUser}
                  onUpdateProfile={handleUpdateUserProfile}
                  onUpdatePassword={handleUpdateUserPassword}
                /> : <LoginPortal onNavigate={navigate} />;
      case View.LOGIN_PORTAL:
        return <LoginPortal onNavigate={navigate} />;
      case View.CUSTOMER_LOGIN:
        return <CustomerLogin onLogin={handleCustomerLogin} onRegister={handleCustomerRegister} onNavigate={navigate} />;
      case View.DEALER_LOGIN:
        return <Login onLogin={handleDealerLogin} onRegister={handleDealerRegister} onNavigate={navigate} />;
      case View.ADMIN_LOGIN:
        return <AdminLogin onLogin={handleAdminLogin} onNavigate={navigate} />;
      case View.COMPARISON:
// FIX: Changed onToggleCompare to handleToggleCompare
        return <Comparison vehicles={vehiclesToCompare} onBack={handleBackToUsedCars} onToggleCompare={handleToggleCompare} />;
      case View.WISHLIST:
// FIX: Changed onToggleCompare to handleToggleCompare
        return <VehicleList vehicles={vehiclesInWishlist} onSelectVehicle={handleSelectVehicle} isLoading={isLoading} comparisonList={comparisonList} onToggleCompare={handleToggleCompare} onClearCompare={handleClearCompare} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} isWishlistMode={true} />;
      case View.USED_CARS:
      default:
// FIX: Changed onToggleCompare to handleToggleCompare
        return <VehicleList vehicles={publishedVehicles} onSelectVehicle={handleSelectVehicle} isLoading={isLoading} comparisonList={comparisonList} onToggleCompare={handleToggleCompare} onClearCompare={handleClearCompare} wishlist={wishlist} onToggleWishlist={handleToggleWishlist} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-brand-gray-light dark:bg-brand-gray-darker font-sans transition-colors duration-300">
      <Header onNavigate={navigate} currentUser={currentUser} onLogout={handleLogout} compareCount={comparisonList.length} wishlistCount={wishlist.length} theme={theme} onToggleTheme={handleToggleTheme} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {renderContent()}
      </main>
      <Footer />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default App;
