// FIX: Added useMemo to the import statement from 'react'
import React, { useState, useEffect, memo, useRef, useMemo } from 'react';
import type { User, Notification } from '../types';
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
}

const NavLink: React.FC<{ children: React.ReactNode; onClick: () => void; isMobile?: boolean; isButton?: boolean; className?: string; }> = ({ children, onClick, isMobile = false, isButton = false, className = '' }) => {
    const hoverClasses = isButton
        ? 'bg-brand-blue hover:bg-brand-blue-dark text-white font-bold'
        : 'hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700';

    return (
        <button onClick={onClick} className={`transition-colors relative ${isMobile ? 'block text-left w-full px-4 py-2 rounded-lg text-base font-medium' : 'px-3 py-2 rounded-md text-sm font-medium'} ${hoverClasses} ${className}`}>
            {children}
        </button>
    );
};

const Header: React.FC<HeaderProps> = ({ onNavigate, currentUser, onLogout, compareCount, wishlistCount, inboxCount, theme, onChangeTheme, isHomePage = false, notifications, onNotificationClick, onMarkNotificationsAsRead }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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
        if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
            setIsThemeMenuOpen(false);
        }
        if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
            setIsNotificationsOpen(false);
        }
        if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
            setIsMobileMenuOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationBellClick = () => {
      setIsNotificationsOpen(prev => !prev);
      if (!isNotificationsOpen && unreadNotifications.length > 0) {
          onMarkNotificationsAsRead(unreadNotifications.map(n => n.id));
      }
  };

  const handleNotificationItemClick = (notification: Notification) => {
      setIsNotificationsOpen(false);
      onNotificationClick(notification);
  };

  const handleNavClick = (view: ViewEnum) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  }

  const handleLogoutClick = () => {
    onLogout();
    setIsMobileMenuOpen(false);
  }

  const headerClasses = 'bg-brand-gray-50/80 dark:bg-brand-gray-900/80 backdrop-blur-sm shadow-soft border-b border-brand-gray-200 dark:border-brand-gray-800';
  const textClasses = 'text-brand-gray-600 dark:text-brand-gray-300';
  const iconClasses = 'text-brand-gray-500 dark:text-brand-gray-400';
  
  const renderNavLinks = (isMobile: boolean) => {
    const role = currentUser?.role;

    if (role === 'admin') {
      return (
        <NavLink onClick={() => handleNavClick(ViewEnum.ADMIN_PANEL)} isMobile={isMobile} className={textClasses}>Admin Panel</NavLink>
      );
    }
    
    if (role === 'seller') {
        return (
          <NavLink onClick={() => handleNavClick(ViewEnum.SELLER_DASHBOARD)} isMobile={isMobile} className={textClasses}>My Dashboard</NavLink>
        );
    }

    const showInboxBadge = inboxCount > 0;

    return (
        <>
          <NavLink onClick={() => handleNavClick(ViewEnum.USED_CARS)} isMobile={isMobile} className={textClasses}>All Vehicles</NavLink>
          {currentUser?.role === 'customer' && (
            <NavLink onClick={() => handleNavClick(ViewEnum.INBOX)} isMobile={isMobile} className={textClasses}>
                Inbox
                {showInboxBadge && (
                    <span className={`absolute inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full ${isMobile ? 'static ml-2' : '-top-2 -right-2'}`}>
                        {inboxCount}
                    </span>
                )}
            </NavLink>
          )}
          <NavLink onClick={() => handleNavClick(ViewEnum.WISHLIST)} isMobile={isMobile} className={textClasses}>
            Wishlist
            {wishlistCount > 0 && (
                <span className={`absolute inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full ${isMobile ? 'static ml-2' : '-top-2 -right-2'}`}>
                    {wishlistCount}
                </span>
            )}
          </NavLink>
          <NavLink onClick={() => handleNavClick(ViewEnum.COMPARISON)} isMobile={isMobile} className={textClasses}>
            Compare
            {compareCount > 0 && (
                <span className={`absolute inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full ${isMobile ? 'static ml-2' : '-top-2 -right-2'}`}>
                    {compareCount}
                </span>
            )}
          </NavLink>
        </>
    );
  }

  const renderAuthSection = (isMobile: boolean) => {
      const currentTextClasses = isMobile ? 'text-brand-gray-600 dark:text-brand-gray-200' : textClasses;
      if (currentUser) {
          return (
            <div className={`flex items-center ${isMobile ? 'flex-col items-start w-full space-y-2' : 'space-x-4'}`}>
              <button onClick={() => handleNavClick(ViewEnum.PROFILE)} className={`${currentTextClasses} text-sm font-medium hover:text-brand-blue dark:hover:text-brand-blue-light transition-colors`}>Hello, {currentUser.name.split(' ')[0]}</button>
              <button 
                  onClick={handleLogoutClick}
                  className={`transition-colors rounded-lg ${isMobile ? 'w-full text-left px-4 py-2 text-brand-gray-600 dark:text-brand-gray-300 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-800' : 'bg-red-500 hover:bg-red-600 py-2 px-4 text-white font-bold'}`}
              >
                  Logout
              </button>
            </div>
          )
      }
      return (
          <NavLink onClick={() => handleNavClick(ViewEnum.LOGIN_PORTAL)} isMobile={isMobile} isButton={!isMobile} className={currentTextClasses}>
            Login / Register
          </NavLink>
      )
  }

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${headerClasses}`}>
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button onClick={() => handleNavClick(ViewEnum.HOME)} className="flex-shrink-0 text-2xl font-bold tracking-tighter">
               <span className="bg-gradient-to-r from-brand-blue to-brand-blue-dark bg-clip-text text-transparent">AutoVerse AI</span>
            </button>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              {renderNavLinks(false)}
            </div>
          </div>
          <div className="flex items-center">
             <div ref={themeMenuRef} className="relative">
                <button onClick={() => setIsThemeMenuOpen(prev => !prev)} className={`p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none ${iconClasses}`} aria-label="Choose theme">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                </button>
                {isThemeMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 origin-top-right bg-white dark:bg-brand-gray-800 rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5 focus:outline-none">
                        {themes.map((themeOption) => (
                            <button
                                key={themeOption.name}
                                onClick={() => {
                                    onChangeTheme(themeOption.name);
                                    setIsThemeMenuOpen(false);
                                }}
                                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${theme === themeOption.name ? 'bg-brand-blue text-white' : 'text-brand-gray-700 dark:text-brand-gray-300 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700'}`}
                            >
                                {themeOption.label}
                            </button>
                        ))}
                    </div>
                )}
             </div>

             {currentUser && (currentUser.role === 'seller' || currentUser.role === 'admin') && (
                <div ref={notificationsRef} className="relative">
                    <button onClick={handleNotificationBellClick} className={`relative p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none ${iconClasses} mx-2`} aria-label="Notifications">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        {unreadNotifications.length > 0 && (
                             <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">{unreadNotifications.length}</span>
                        )}
                    </button>
                    {isNotificationsOpen && (
                        <div className="absolute right-0 mt-2 w-80 origin-top-right bg-white dark:bg-brand-gray-800 rounded-md shadow-lg z-50 ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <div className="p-3 border-b dark:border-gray-700 font-bold text-gray-800 dark:text-gray-100">Notifications</div>
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    [...notifications].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(n => (
                                        <button key={n.id} onClick={() => handleNotificationItemClick(n)} className={`block w-full text-left px-4 py-3 text-sm transition-colors border-l-4 ${n.isRead ? 'border-transparent' : 'border-brand-blue bg-blue-50 dark:bg-blue-900/20'} hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700`}>
                                            <p className="font-semibold text-gray-800 dark:text-gray-100">{n.message.split(':')[0]}</p>
                                            <p className="text-gray-600 dark:text-gray-300">{n.message.split(':')[1]}</p>
                                            <p className="text-xs text-gray-400 mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                                        </button>
                                    ))
                                ) : (
                                    <p className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">You have no notifications.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
             )}

             <div className="hidden md:block">
                {renderAuthSection(false)}
             </div>
             <div className="md:hidden ml-2">
                 <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className={`inline-flex items-center justify-center p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none ${iconClasses}`}>
                     <span className="sr-only">Open main menu</span>
                     <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                         {isMobileMenuOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                         ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                         )}
                     </svg>
                 </button>
             </div>
          </div>
        </div>
      </nav>
        {isMobileMenuOpen && (
            <div ref={mobileMenuRef} className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-brand-gray-900 shadow-lg rounded-b-lg animate-fade-in z-40">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                    {renderNavLinks(true)}
                </div>
                <div className="px-2 pt-3 pb-3 border-t border-brand-gray-200 dark:border-brand-gray-700 sm:px-3">
                    {renderAuthSection(true)}
                </div>
            </div>
        )}
    </header>
  );
};

export default memo(Header);