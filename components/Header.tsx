import React, { useState } from 'react';
import type { View, User } from '../types';
import { View as ViewEnum } from '../types';

interface HeaderProps {
    onNavigate: (view: View) => void;
    currentUser: User | null;
    onLogout: () => void;
    compareCount: number;
    wishlistCount: number;
    inboxCount: number;
    theme: 'light' | 'dark';
    onToggleTheme: () => void;
}

const NavLink: React.FC<{ children: React.ReactNode; onClick: () => void; isMobile?: boolean; isButton?: boolean }> = ({ children, onClick, isMobile = false, isButton = false }) => (
    <button onClick={onClick} className={`transition-colors relative ${isMobile ? 'block text-left w-full px-3 py-2 rounded-md text-base font-medium' : 'px-3 py-2 rounded-md text-sm font-medium'} ${isButton ? 'bg-brand-blue hover:bg-brand-blue-light text-white font-bold' : 'text-white hover:bg-brand-blue-dark'}`}>
        {children}
    </button>
);

const Header: React.FC<HeaderProps> = ({ onNavigate, currentUser, onLogout, compareCount, wishlistCount, inboxCount, theme, onToggleTheme }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleNavClick = (view: View) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  }

  const handleLogoutClick = () => {
    onLogout();
    setIsMobileMenuOpen(false);
  }
  
  const renderNavLinks = (isMobile: boolean) => {
    const role = currentUser?.role;

    if (role === 'admin') {
      return (
        <>
          <NavLink onClick={() => handleNavClick(ViewEnum.ADMIN_PANEL)} isMobile={isMobile}>Admin Panel</NavLink>
        </>
      );
    }
    
    if (role === 'seller') {
        return (
          <>
            <NavLink onClick={() => handleNavClick(ViewEnum.SELLER_DASHBOARD)} isMobile={isMobile}>My Dashboard</NavLink>
          </>
        );
    }

    const showInboxBadge = inboxCount > 0;

    // Default for customers and guests
    return (
        <>
          <NavLink onClick={() => handleNavClick(ViewEnum.USED_CARS)} isMobile={isMobile}>Used Cars</NavLink>
          {currentUser?.role === 'customer' && (
            <NavLink onClick={() => handleNavClick(ViewEnum.INBOX)} isMobile={isMobile}>
                Inbox
                {showInboxBadge && (
                    <span className={`absolute inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full ${isMobile ? 'static ml-2' : '-top-2 -right-2'}`}>
                        {inboxCount}
                    </span>
                )}
            </NavLink>
          )}
          <NavLink onClick={() => handleNavClick(ViewEnum.WISHLIST)} isMobile={isMobile}>
            Wishlist
            {wishlistCount > 0 && (
                <span className={`absolute inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full ${isMobile ? 'static ml-2' : '-top-2 -right-2'}`}>
                    {wishlistCount}
                </span>
            )}
          </NavLink>
          <NavLink onClick={() => handleNavClick(ViewEnum.COMPARISON)} isMobile={isMobile}>
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
      if (currentUser) {
          return (
            <div className={`flex items-center ${isMobile ? 'flex-col items-start w-full space-y-2' : 'space-x-4'}`}>
              <button onClick={() => handleNavClick(ViewEnum.PROFILE)} className="text-white text-sm font-medium hover:underline">Hello, {currentUser.name.split(' ')[0]}</button>
              <button 
                  onClick={handleLogoutClick}
                  className={`transition-colors text-white font-bold rounded-lg ${isMobile ? 'w-full text-left px-3 py-2 hover:bg-brand-blue-dark' : 'bg-red-500 hover:bg-red-600 py-2 px-4'}`}
              >
                  Logout
              </button>
            </div>
          )
      }
      return (
          <NavLink onClick={() => handleNavClick(ViewEnum.LOGIN_PORTAL)} isMobile={isMobile} isButton={!isMobile}>
            Login
          </NavLink>
      )
  }

  return (
    <header className="bg-brand-blue-dark shadow-lg sticky top-0 z-50">
      <nav className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button onClick={() => handleNavClick(ViewEnum.USED_CARS)} className="flex-shrink-0 text-white text-xl font-bold">
              AutoVerse AI
            </button>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {renderNavLinks(false)}
            </div>
          </div>
          <div className="flex items-center">
             <button onClick={onToggleTheme} className="mr-4 text-white p-2 rounded-full hover:bg-brand-blue-dark focus:outline-none" aria-label="Toggle theme">
                {theme === 'light' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                )}
             </button>
             <div className="hidden md:block">
                {renderAuthSection(false)}
             </div>
             <div className="md:hidden ml-2">
                 <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-brand-blue-dark focus:outline-none">
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
        {isMobileMenuOpen && (
            <div className="md:hidden px-2 pt-2 pb-3 space-y-1 sm:px-3">
                {renderNavLinks(true)}
                <div className="border-t border-blue-500 pt-4 mt-4">
                 {renderAuthSection(true)}
                </div>
            </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
