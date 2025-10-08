
import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import type { User } from '../types';
import { View } from '../types';
import type { Command } from '../types';
import type { Theme } from '../App';


interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
  currentUser: User | null;
  onChangeTheme: (theme: Theme) => void;
  onLogout: () => void;
}

// Icons for commands (using heroicons-style SVG paths)
const ICONS = {
  HOME: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  SEARCH: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  HEART: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z" /></svg>,
  COMPARE: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
  USER: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  DASHBOARD: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  LOGOUT: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  THEME: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h8" /></svg>,
  SELL: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  PRICE: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>,
};

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate, currentUser, onChangeTheme, onLogout }) => {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allCommands = useMemo<Command[]>(() => {
    const commands: Command[] = [
      // Navigation
      { id: 'home', title: 'Go to Home', icon: ICONS.HOME, action: () => onNavigate(View.HOME), section: 'Navigation' },
      { id: 'used_cars', title: 'Browse Used Cars', icon: ICONS.SEARCH, action: () => onNavigate(View.USED_CARS), section: 'Navigation' },
      { id: 'pricing', title: 'View Pricing', icon: ICONS.PRICE, action: () => onNavigate(View.PRICING), section: 'Navigation' },
      { id: 'sell_car', title: 'Sell a Car', icon: ICONS.SELL, action: () => onNavigate(View.SELLER_LOGIN), section: 'Navigation' },
      // Conditional Navigation
      ...(currentUser ? [
        { id: 'profile', title: 'My Profile', icon: ICONS.USER, action: () => onNavigate(View.PROFILE), section: 'Navigation' as const },
        { id: 'wishlist', title: 'My Wishlist', icon: ICONS.HEART, action: () => onNavigate(View.WISHLIST), section: 'Navigation' as const },
        { id: 'compare', title: 'Compare Vehicles', icon: ICONS.COMPARE, action: () => onNavigate(View.COMPARISON), section: 'Navigation' as const },
      ] : []),
      ...(currentUser?.role === 'seller' ? [{ id: 'dashboard', title: 'Seller Dashboard', icon: ICONS.DASHBOARD, action: () => onNavigate(View.SELLER_DASHBOARD), section: 'Navigation' as const }] : []),
      // Actions
      ...(currentUser ? [{ id: 'logout', title: 'Logout', icon: ICONS.LOGOUT, action: onLogout, section: 'Actions' as const }] : []),
      // Theme
      { id: 'theme_light', title: 'Change Theme to Light', icon: ICONS.THEME, action: () => onChangeTheme('light'), section: 'Theme' as const },
      { id: 'theme_dark', title: 'Change Theme to Dark', icon: ICONS.THEME, action: () => onChangeTheme('dark'), section: 'Theme' as const },
      { id: 'theme_sunset', title: 'Change Theme to Sunset', icon: ICONS.THEME, action: () => onChangeTheme('sunset'), section: 'Theme' as const },
      { id: 'theme_oceanic', title: 'Change Theme to Oceanic', icon: ICONS.THEME, action: () => onChangeTheme('oceanic'), section: 'Theme' as const },
      { id: 'theme_cyber', title: 'Change Theme to Cyber', icon: ICONS.THEME, action: () => onChangeTheme('cyber'), section: 'Theme' as const },
    ];
    return commands;
  }, [currentUser, onNavigate, onChangeTheme, onLogout]);

  const filteredCommands = useMemo(() => {
    if (!query) return allCommands;
    return allCommands.filter(command => command.title.toLowerCase().includes(query.toLowerCase()));
  }, [allCommands, query]);
  
  const groupedCommands = useMemo(() => {
    // FIX: The initial value for reduce must be explicitly typed to prevent it from being inferred as `unknown` when using Object.entries.
    return filteredCommands.reduce((acc, command) => {
        const section = command.section;
        if (!acc[section]) {
            acc[section] = [];
        }
        acc[section].push(command);
        return acc;
    }, {} as Record<string, Command[]>);
  }, [filteredCommands]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (filteredCommands.length === 0) return;
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[activeIndex]) {
          filteredCommands[activeIndex].action();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, activeIndex, filteredCommands, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-start justify-center pt-20" onClick={onClose}>
      <div className="bg-white dark:bg-brand-gray-800 rounded-lg shadow-2xl w-full max-w-xl animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
          {/* FIX: ICONS.SEARCH is a JSX element, not a component. It should be rendered directly. */}
          {ICONS.SEARCH}
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent focus:outline-none text-lg text-gray-800 dark:text-gray-200"
          />
        </div>
        <div className="max-h-96 overflow-y-auto">
          {Object.entries(groupedCommands).map(([section, commands]) => (
            <div key={section} className="p-2">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 mb-1">{section}</h3>
              <ul>
                {commands.map((command) => {
                  const globalIndex = filteredCommands.findIndex(c => c.id === command.id);
                  return (
                    <li key={command.id}>
                      <button
                        onClick={command.action}
                        onMouseEnter={() => setActiveIndex(globalIndex)}
                        className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-md ${activeIndex === globalIndex ? 'bg-brand-blue text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                      >
                        <span className={activeIndex === globalIndex ? 'text-white' : 'text-gray-500 dark:text-gray-400'}>{command.icon}</span>
                        <span>{command.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          {filteredCommands.length === 0 && (
            <p className="p-4 text-center text-gray-500">No commands found.</p>
          )}
        </div>
      </div>
    </div>
  );
};


export default memo(CommandPalette);
