import React, { useState, useEffect, memo, useRef, useMemo } from 'react';
import type { User, Notification, VehicleCategory } from '../types';
import { View as ViewEnum } from '../types';
import type { Theme } from '../App';

interface HeaderProps {
    onNavigate: (view: ViewEnum) => void;
    currentUser: User | null;
    onLogout: () => void;
    compareCount: number;
    wishlistCount: number;
    inboxCount: number;
    theme: Theme;
    onChangeTheme: (theme: Theme) => void;
    isHomePage?: boolean;
    notifications: Notification[];
    onNotificationClick: (notification: Notification) => void;
    onMarkNotificationsAsRead: (ids: number[]) => void;
    onSelectCategory: (category: VehicleCategory) => void;
}

const DropdownLink: React.FC<{ children: React.ReactNode; onClick: () => void; className?: string }> = ({ children, onClick, className }) => (
    <button onClick={onClick} className={`block w-full text-left px-4 py-2 text-sm text-brand-gray-700 dark:text-brand-gray-300 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 transition-colors ${className}`}>
        {children}
    </button>
);

const Header: React.FC<HeaderProps> = ({ 
    onNavigate, currentUser, onLogout, compareCount, wishlistCount, inboxCount, theme, 
    onChangeTheme, isHomePage = false, notifications, onNotificationClick, 
    onMarkNotificationsAsRead, onSelectCategory
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileBuyOpen, setIsMobileBuyOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isBuyMenuOpen, setIsBuyMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const themeMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const buyMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const themes: { name: Theme; label: string }[] = [
      { name: 'light', label: 'Light' },
      { name: 'dark', label: 'Dark' },
      { name: 'sunset', label: 'Sunset Glow' },
      { name: 'oceanic', label: 'Oceanic Teal' },
      { name: 'cyber', label: 'Cyber Neon' },
  ];

  const unreadNotifications = useMemo(() => notifications.filter(n => !n.isRead), [notifications]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) setIsThemeMenuOpen(false);
        if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) setIsNotificationsOpen(false);
        if (buyMenuRef.current && !buyMenuRef.current.contains(event.target as Node)) setIsBuyMenuOpen(false);
        if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) setIsUserMenuOpen(false);
        // Special handling for mobile menu to avoid closing when clicking its own content
        const target = event.target as HTMLElement;
        if (mobileMenuRef.current && !mobileMenuRef.current.contains(target) && !target.closest('[data-mobile-menu-button]')) {
            setIsMobileMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const headerClasses = isHomePage
    ? 'fixed top-0 left-0 right-0 z-50 bg-transparent text-white transition-all duration-300'
    : 'sticky top-0 z-50 bg-white dark:bg-brand-gray-800 text-brand-gray-800 dark:text-white shadow-md';

  const navLinkClasses = isHomePage
    ? 'text-white hover:text-brand-gray-200'
    : 'text-brand-gray-700 dark:text-brand-gray-300 hover:text-brand-blue dark:hover:text-brand-blue-light';
  
  const handleNavigate = (view: ViewEnum) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
    setIsBuyMenuOpen(false);
  };
  
  const handleMarkAllRead = () => {
    onMarkNotificationsAsRead(unreadNotifications.map(n => n.id));
  };
  
  return (
    <header className={headerClasses} id="main-header">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-8">
            <button onClick={() => handleNavigate(ViewEnum.HOME)} className="text-2xl font-bold">
              AutoVerse AI
            </button>
            <nav className="hidden md:flex items-center space-x-6">
              <div className="relative" ref={buyMenuRef}>
                  <button onClick={() => setIsBuyMenuOpen(p => !p)} className={`font-semibold flex items-center gap-1 ${navLinkClasses}`}>
                      Buy
                      <svg className={`w-4 h-4 transition-transform ${isBuyMenuOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {isBuyMenuOpen && (
                      <div className="absolute top-full mt-2 w-48 bg-white dark:bg-brand-gray-800 rounded-md shadow-lg border dark:border-brand-gray-700 animate-fade-in z-20">
                          <DropdownLink onClick={() => handleNavigate(ViewEnum.USED_CARS)}>Used Cars</DropdownLink>
                          <DropdownLink onClick={() => handleNavigate(ViewEnum.NEW_CARS)}>New Cars</DropdownLink>
                          <DropdownLink onClick={() => handleNavigate(ViewEnum.DEALER_PROFILES)}>Certified Dealer Profiles</DropdownLink>
                      </div>
                  )}
              </div>
              <button onClick={() => handleNavigate(ViewEnum.SELLER_LOGIN)} className={`font-semibold ${navLinkClasses}`}>Sell</button>
              <button onClick={() => handleNavigate(ViewEnum.PRICING)} className={`font-semibold ${navLinkClasses}`}>Pricing</button>
              <button onClick={() => handleNavigate(ViewEnum.SUPPORT)} className={`font-semibold ${navLinkClasses}`}>Support</button>
            </nav>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            {/* Action buttons */}
            <button onClick={() => handleNavigate(ViewEnum.COMPARISON)} className={`relative p-2 rounded-full ${navLinkClasses}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              {compareCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{compareCount}</span>}
            </button>
            <button onClick={() => handleNavigate(ViewEnum.WISHLIST)} className={`relative p-2 rounded-full ${navLinkClasses}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>
              {wishlistCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{wishlistCount}</span>}
            </button>
            {currentUser && currentUser.role === 'customer' && (
              <button onClick={() => handleNavigate(ViewEnum.INBOX)} className={`relative p-2 rounded-full ${navLinkClasses}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  {inboxCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{inboxCount}</span>}
              </button>
            )}

            {/* User Dropdown or Login Button */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setIsUserMenuOpen(p => !p)} className="flex items-center space-x-2">
                  <span className={`font-semibold ${navLinkClasses}`}>{currentUser.name.split(' ')[0]}</span>
                  <img src={`https://i.pravatar.cc/40?u=${currentUser.email}`} alt="User" className="h-8 w-8 rounded-full" />
                </button>
                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-brand-gray-800 rounded-md shadow-lg border dark:border-brand-gray-700 animate-fade-in z-20">
                    {currentUser.role === 'seller' && <DropdownLink onClick={() => handleNavigate(ViewEnum.SELLER_DASHBOARD)}>Dashboard</DropdownLink>}
                    {currentUser.role === 'admin' && <DropdownLink onClick={() => handleNavigate(ViewEnum.ADMIN_PANEL)}>Admin Panel</DropdownLink>}
                    <DropdownLink onClick={() => handleNavigate(ViewEnum.PROFILE)}>My Profile</DropdownLink>
                    <DropdownLink onClick={onLogout}>Logout</DropdownLink>
                  </div>
                )}
              </div>
            ) : (
              <button onClick={() => handleNavigate(ViewEnum.LOGIN_PORTAL)} className="font-semibold bg-brand-blue text-white py-2 px-4 rounded-lg hover:bg-brand-blue-dark transition-colors">Login</button>
            )}
            
            <div className="relative" ref={themeMenuRef}>
              <button onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)} className="p-2 rounded-full hover:bg-brand-gray-200 dark:hover:bg-brand-gray-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h8" /></svg>
              </button>
               {isThemeMenuOpen && (
                    <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-brand-gray-800 rounded-md shadow-lg border dark:border-brand-gray-700 z-10 animate-fade-in">
                        {themes.map(t => <DropdownLink key={t.name} onClick={() => onChangeTheme(t.name)} className={theme === t.name ? 'font-bold text-brand-blue' : ''}>{t.label}</DropdownLink>)}
                    </div>
                )}
            </div>
          </div>
          
          <div className="md:hidden flex items-center space-x-2">
            <button data-mobile-menu-button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div ref={mobileMenuRef} className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-brand-gray-800 shadow-lg animate-fade-in">
          <nav className="p-4 space-y-2">
             <button onClick={() => setIsMobileBuyOpen(p => !p)} className="flex justify-between items-center w-full font-semibold text-brand-gray-700 dark:text-brand-gray-200 hover:text-brand-blue dark:hover:text-brand-blue-light py-2">
                <span>Buy</span>
                <svg className={`w-4 h-4 transition-transform ${isMobileBuyOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {isMobileBuyOpen && (
                <div className="pl-4 space-y-2 border-l-2 border-brand-gray-200 dark:border-brand-gray-700">
                    <button onClick={() => handleNavigate(ViewEnum.USED_CARS)} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 hover:text-brand-blue dark:hover:text-brand-blue-light py-2">Used Cars</button>
                    <button onClick={() => handleNavigate(ViewEnum.NEW_CARS)} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 hover:text-brand-blue dark:hover:text-brand-blue-light py-2">New Cars</button>
                    <button onClick={() => handleNavigate(ViewEnum.DEALER_PROFILES)} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 hover:text-brand-blue dark:hover:text-brand-blue-light py-2">Certified Dealer Profiles</button>
                </div>
            )}
            <button onClick={() => handleNavigate(ViewEnum.SELLER_LOGIN)} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 hover:text-brand-blue dark:hover:text-brand-blue-light py-2">Sell</button>
            <button onClick={() => handleNavigate(ViewEnum.PRICING)} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 hover:text-brand-blue dark:hover:text-brand-blue-light py-2">Pricing</button>
            <button onClick={() => handleNavigate(ViewEnum.SUPPORT)} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 hover:text-brand-blue dark:hover:text-brand-blue-light py-2">Support</button>
            <hr className="border-brand-gray-200 dark:border-brand-gray-700"/>
            <button onClick={() => handleNavigate(ViewEnum.COMPARISON)} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 hover:text-brand-blue dark:hover:text-brand-blue-light py-2">Compare ({compareCount})</button>
            <button onClick={() => handleNavigate(ViewEnum.WISHLIST)} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 hover:text-brand-blue dark:hover:text-brand-blue-light py-2">Wishlist ({wishlistCount})</button>
            {currentUser && currentUser.role === 'customer' && (
              <button onClick={() => handleNavigate(ViewEnum.INBOX)} className="block w-full text-left font-semibold text-brand-gray-700 dark:text-brand-gray-200 hover:text-brand-blue dark:hover:text-brand-blue-light py-2">Inbox ({inboxCount})</button>
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
  );
};

export default memo(Header);