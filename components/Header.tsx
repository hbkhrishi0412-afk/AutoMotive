import React, { useState, useEffect, memo, useRef, useMemo } from 'react';
import type { User, Notification, Toast as ToastType } from '../types';
import { View as ViewEnum } from '../types';
import NotificationCenter from './NotificationCenter';
import LocationModal from './LocationModal';

interface HeaderProps {
    onNavigate: (view: ViewEnum) => void;
    currentUser: User | null;
    onLogout: () => void;
    compareCount: number;
    wishlistCount: number;
    inboxCount: number;
    isHomePage?: boolean;
    notifications: Notification[];
    onNotificationClick: (notification: Notification) => void;
    onMarkNotificationsAsRead: (ids: number[]) => void;
    onMarkAllNotificationsAsRead: () => void;
    onOpenCommandPalette: () => void;
    userLocation: string;
    onLocationChange: (location: string) => void;
    addToast: (message: string, type: ToastType['type']) => void;
}

const bodyTypeIcons: Record<string, React.ReactNode> = {
    Hatchback: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 64 64"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M53,42H11a2,2,0,0,1-2-2.22L13.57,17.1A3,3,0,0,1,16.5,15H47.6a3,3,0,0,1,2.93,2.1L55,39.78A2,2,0,0,1,53,42Z"></path><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13,42l-2,5h6m34-5,2,5h-6"></path><circle cx="18" cy="49" r="4" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2"></circle><circle cx="46" cy="49" r="4" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2"></circle></svg>,
    SUV: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 64 64"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M53,42H11a2,2,0,0,1-2-2.22L13.57,17.1A3,3,0,0,1,16.5,15h31.1a3,3,0,0,1,2.93,2.1L55,39.78A2,2,0,0,1,53,42Z"></path><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M53,28H40a2,2,0,0,0-2,2v0a2,2,0,0,0,2,2H53Zm-44,9H22a2,2,0,0,0,2-2v0a2,2,0,0,0-2-2H9Z"></path><circle cx="18" cy="49" r="4" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2"></circle><circle cx="46" cy="49" r="4" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2"></circle></svg>,
    Sedan: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 64 64"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M57,39H7a3,3,0,0,1-3-3V26a3,3,0,0,1,3-3H20L31.45,15.9a3,3,0,0,1,3.1,0L46,23h11a3,3,0,0,1,3,3v10A3,3,0,0,1,57,39Z"></path><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12,49a5,5,0,1,0-5-5,5,5,0,0,0,5,5Zm40,0a5,5,0,1,0-5-5,5,5,0,0,0,5,5Z"></path><line x1="7" x2="57" y1="31" y2="31" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></line></svg>,
    MUV: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 64 64"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M53,42H11a2,2,0,0,1-2-2.22L13.57,17.1A3,3,0,0,1,16.5,15H50a3,3,0,0,1,3,3V39.78A2,2,0,0,1,53,42Z"></path><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M53,28H24a2,2,0,0,0-2,2v0a2,2,0,0,0,2,2H53Z"></path><circle cx="18" cy="49" r="4" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2"></circle><circle cx="46" cy="49" r="4" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2"></circle></svg>,
    Convertible: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 64 64"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M55.1,38H8.9A2.9,2.9,0,0,1,6,35.1V28.9A2.9,2.9,0,0,1,8.9,26h2.53L22,16H42l10.57,10H55.1A2.9,2.9,0,0,1,58,28.9v6.2A2.9,2.9,0,0,1,55.1,38Z"></path><circle cx="15" cy="45" r="5" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2"></circle><circle cx="49" cy="45" r="5" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2"></circle><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6,29,1,20.72"></path></svg>,
    Coupe: <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 64 64"><path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M53,42H11a2,2,0,0,1-2-2.22L13.57,17.1A3,3,0,0,1,16.5,15H32c10,0,15,10,18,15l5,8.78A2,2,0,0,1,53,42Z"></path><circle cx="18" cy="49" r="4" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2"></circle><circle cx="46" cy="49" r="4" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2"></circle></svg>,
};


const DropdownLink: React.FC<{ children: React.ReactNode; onClick: () => void; className?: string }> = ({ children, onClick, className }) => (
    <button onClick={onClick} className={`block w-full text-left px-4 py-2 text-sm text-brand-gray-700 dark:text-brand-gray-300 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 transition-colors rounded-md ${className}`}>
        {children}
    </button>
);

const Header: React.FC<HeaderProps> = ({ 
    onNavigate, currentUser, onLogout, compareCount, wishlistCount, inboxCount, 
    isHomePage = false, notifications, onNotificationClick, 
    onMarkNotificationsAsRead, onMarkAllNotificationsAsRead,
    onOpenCommandPalette, userLocation, onLocationChange, addToast
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isNewCarsMenuOpen, setIsNewCarsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const newCarsMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const unreadNotifications = useMemo(() => notifications.filter(n => !n.isRead), [notifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
        if (newCarsMenuRef.current && !newCarsMenuRef.current.contains(event.target as Node)) setIsNewCarsMenuOpen(false);
        if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false);
        const target = event.target as HTMLElement;
        if (mobileMenuRef.current && !mobileMenuRef.current.contains(target) && !target.closest('[data-mobile-menu-button]')) {
            setIsMobileMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const headerClasses = 'sticky top-0 z-50 shadow-md';
  const mainNavLinkClasses = 'text-brand-gray-200 hover:text-white';
  
  const handleNavigate = (view: ViewEnum) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
    setIsNewCarsMenuOpen(false);
    setIsUserMenuOpen(false);
  };
  
  const handleNotificationItemClick = (notification: Notification) => {
    onNotificationClick(notification);
    setIsNotificationsOpen(false);
  };
  
  return (
    <>
    <header className={headerClasses} id="main-header">
      {/* Top Bar */}
      <div className={`bg-brand-gray-darker text-brand-gray-400 text-xs transition-colors duration-300`}>
          <div className="container mx-auto px-4 flex justify-between items-center h-8">
              <div className="flex items-center gap-x-4">
                  <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate(ViewEnum.SUPPORT) }} className="hover:text-white">Support</a>
                  <a href="#" onClick={(e) => { e.preventDefault(); handleNavigate(ViewEnum.FAQ) }} className="hover:text-white">FAQ</a>
              </div>
              <div className="flex items-center gap-x-4">
                  <button onClick={() => setIsLocationModalOpen(true)} className="flex items-center gap-1 hover:text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg> 
                    {userLocation}
                  </button>
              </div>
          </div>
      </div>
      {/* Main Bar */}
      <div className={`transition-colors duration-300 bg-brand-gray-900`}>
        <div className="container mx-auto px-4">
            <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
                <button onClick={() => handleNavigate(ViewEnum.HOME)} className={`text-2xl font-bold text-white`}>
                ReRide
                </button>
                <nav className="hidden md:flex items-center space-x-6">
                <div className="relative" ref={newCarsMenuRef} onMouseLeave={() => setIsNewCarsMenuOpen(false)}>
                    <button onMouseEnter={() => setIsNewCarsMenuOpen(true)} className={`font-semibold flex items-center gap-1 py-5 ${mainNavLinkClasses}`}>
                        New Cars
                        <svg className={`w-4 h-4 transition-transform ${isNewCarsMenuOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {isNewCarsMenuOpen && (
                        <div onMouseEnter={() => setIsNewCarsMenuOpen(true)} className="absolute top-full -left-8 w-[700px] bg-white dark:bg-brand-gray-800 rounded-b-lg shadow-lg border-t-2 border-brand-blue animate-fade-in z-20">
                            <div className="flex">
                                <div className="w-1/3 p-6 border-r dark:border-brand-gray-700">
                                    <ul className="space-y-1">
                                        <li><button className="w-full text-left p-3 rounded-md font-semibold bg-brand-gray-100 dark:bg-brand-gray-700 text-brand-blue dark:text-brand-blue-light flex justify-between items-center">By Body Type <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button></li>
                                        {['Popular Brands', 'Popular Models', 'Recently Launched', 'Upcoming Cars', 'By Budget'].map(item => (
                                            <li key={item}><button className="w-full text-left p-3 rounded-md text-brand-gray-700 dark:text-brand-gray-300 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">{item}</button></li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="w-2/3 p-6">
                                    <div className="grid grid-cols-3 gap-4">
                                        {Object.entries(bodyTypeIcons).map(([name, icon]) => (
                                            <button key={name} onClick={() => handleNavigate(ViewEnum.NEW_CARS)} className="p-3 text-center rounded-lg hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700">
                                                <div className="text-brand-gray-700 dark:text-brand-gray-300">{icon}</div>
                                                <span className="text-sm font-semibold text-brand-gray-800 dark:text-brand-gray-200 mt-2 block">{name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <button onClick={() => handleNavigate(ViewEnum.USED_CARS)} className={`font-semibold py-5 ${mainNavLinkClasses}`}>Used Cars</button>
                <button onClick={() => handleNavigate(ViewEnum.DEALER_PROFILES)} className={`font-semibold py-5 ${mainNavLinkClasses}`}>Dealers</button>
                <button onClick={() => handleNavigate(ViewEnum.PRICING)} className={`font-semibold py-5 ${mainNavLinkClasses}`}>Pricing</button>
                </nav>
            </div>

            <div className="hidden md:flex items-center space-x-2">
                <button onClick={() => handleNavigate(ViewEnum.SELLER_LOGIN)} className={`font-semibold border-2 rounded-full py-2 px-5 transition-colors duration-300 border-white text-white hover:bg-white hover:text-brand-blue`}>Sell Your Car</button>
                
                <button onClick={onOpenCommandPalette} className={`p-2 rounded-full ${mainNavLinkClasses}`} aria-label="Search"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
                
                <button onClick={() => handleNavigate(ViewEnum.WISHLIST)} className={`relative p-2 rounded-full ${mainNavLinkClasses}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>
                {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-brand-blue text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{wishlistCount}</span>}
                </button>
                <button onClick={() => handleNavigate(ViewEnum.COMPARISON)} className={`relative p-2 rounded-full ${mainNavLinkClasses}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                {compareCount > 0 && <span className="absolute -top-1 -right-1 bg-brand-blue text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{compareCount}</span>}
                </button>
                
                {currentUser && (
                <div className="relative" ref={notificationsRef}>
                    <button onClick={() => setIsNotificationsOpen(p => !p)} className={`relative p-2 rounded-full ${mainNavLinkClasses}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {unreadNotifications.length > 0 && <span className="absolute -top-1 -right-1 bg-brand-blue text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{unreadNotifications.length}</span>}
                    </button>
                    {isNotificationsOpen && (
                    <NotificationCenter 
                        notifications={notifications}
                        onNotificationClick={handleNotificationItemClick}
                        onMarkAllAsRead={onMarkAllNotificationsAsRead}
                    />
                    )}
                </div>
                )}
                
                {currentUser ? (
                <div className="relative" ref={userMenuRef}>
                    <button onClick={() => setIsUserMenuOpen(p => !p)} className={`flex items-center space-x-2 p-2 rounded-full ${mainNavLinkClasses}`}>
                    <img src={`https://i.pravatar.cc/40?u=${currentUser.email}`} alt="User" className="h-7 w-7 rounded-full" />
                    </button>
                    {isUserMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-brand-gray-800 rounded-md shadow-lg border dark:border-brand-gray-700 animate-fade-in z-20">
                        <div className="p-4 border-b dark:border-brand-gray-700">
                        <p className="font-semibold text-sm text-brand-gray-900 dark:text-white">Hi, {currentUser.name.split(' ')[0]}</p>
                        </div>
                        {currentUser.role === 'customer' && <DropdownLink onClick={() => handleNavigate(ViewEnum.INBOX)}>Inbox {inboxCount > 0 && `(${inboxCount})`}</DropdownLink>}
                        {currentUser.role === 'seller' && <DropdownLink onClick={() => handleNavigate(ViewEnum.SELLER_DASHBOARD)}>Dashboard</DropdownLink>}
                        {currentUser.role === 'admin' && <DropdownLink onClick={() => handleNavigate(ViewEnum.ADMIN_PANEL)}>Admin Panel</DropdownLink>}
                        <DropdownLink onClick={() => handleNavigate(ViewEnum.PROFILE)}>My Profile</DropdownLink>
                        <div className="border-t dark:border-brand-gray-700"><DropdownLink onClick={onLogout}>Logout</DropdownLink></div>
                    </div>
                    )}
                </div>
                ) : (
                <button onClick={() => handleNavigate(ViewEnum.LOGIN_PORTAL)} className={`font-semibold ${mainNavLinkClasses}`}>Login</button>
                )}
            </div>
            
            <div className="md:hidden flex items-center space-x-2">
                {currentUser && (
                <div className="relative">
                    <button onClick={() => setIsNotificationsOpen(p => !p)} className={`relative p-2 rounded-full text-white hover:text-brand-gray-200`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {unreadNotifications.length > 0 && <span className="absolute -top-1 -right-1 bg-brand-blue text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{unreadNotifications.length}</span>}
                    </button>
                    {isNotificationsOpen && (
                    <NotificationCenter 
                        notifications={notifications}
                        onNotificationClick={handleNotificationItemClick}
                        onMarkAllAsRead={onMarkAllNotificationsAsRead}
                    />
                    )}
                </div>
                )}
                <button data-mobile-menu-button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`p-2 text-white hover:text-brand-gray-200`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
                </button>
            </div>
            </div>
        </div>
      </div>
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div ref={mobileMenuRef} className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-brand-gray-800 shadow-lg animate-fade-in z-40">
          <nav className="p-4 space-y-2">
             <button onClick={() => handleNavigate(ViewEnum.NEW_CARS)} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 py-2">New Cars</button>
             <button onClick={() => handleNavigate(ViewEnum.USED_CARS)} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 py-2">Used Cars</button>
             <button onClick={() => handleNavigate(ViewEnum.DEALER_PROFILES)} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 py-2">Dealers</button>
             <button onClick={() => handleNavigate(ViewEnum.SELLER_LOGIN)} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 py-2">Sell</button>
            <hr className="border-brand-gray-200 dark:border-brand-gray-700"/>
            <button onClick={() => handleNavigate(ViewEnum.COMPARISON)} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 py-2">Compare ({compareCount})</button>
            <button onClick={() => handleNavigate(ViewEnum.WISHLIST)} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 py-2">Wishlist ({wishlistCount})</button>
            {currentUser && currentUser.role === 'customer' && (
              <button onClick={() => handleNavigate(ViewEnum.INBOX)} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 py-2">Inbox ({inboxCount})</button>
            )}
            <hr className="border-brand-gray-200 dark:border-brand-gray-700"/>
            {currentUser ? (
              <>
                {currentUser.role === 'seller' && <button onClick={() => handleNavigate(ViewEnum.SELLER_DASHBOARD)} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 py-2">Dashboard</button>}
                {currentUser.role === 'admin' && <button onClick={() => handleNavigate(ViewEnum.ADMIN_PANEL)} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 py-2">Admin Panel</button>}
                <button onClick={() => handleNavigate(ViewEnum.PROFILE)} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 py-2">My Profile</button>
                <button onClick={onLogout} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 py-2">Logout</button>
              </>
            ) : (
              <button onClick={() => handleNavigate(ViewEnum.LOGIN_PORTAL)} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 py-2">Login / Register</button>
            )}
          </nav>
        </div>
      )}
    </header>
    <LocationModal 
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onLocationChange={onLocationChange}
        addToast={addToast}
    />
    </>
  );
};

export default memo(Header);