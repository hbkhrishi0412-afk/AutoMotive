import React, { memo } from 'react';
import { View } from '../types';

interface FooterProps {
    onNavigate: (view: View) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleNav = (e: React.MouseEvent, view: View) => {
    e.preventDefault();
    onNavigate(view);
  };
  
  return (
    <footer className="bg-brand-gray-100 dark:bg-brand-gray-900 border-t border-brand-gray-200 dark:border-brand-gray-800">
      <div className="container mx-auto px-4 py-6 text-center">
        <p className="text-brand-gray-800 dark:text-brand-gray-200">&copy; {new Date().getFullYear()} AutoVerse AI. All rights reserved.</p>
        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mt-1">The premier AI-driven marketplace for your next vehicle.</p>
        <div className="mt-4 flex flex-wrap justify-center items-center gap-x-4 gap-y-2 text-sm text-brand-gray-600 dark:text-brand-gray-400">
          <a href="#" className="hover:text-brand-blue dark:hover:text-brand-blue-light transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-brand-blue dark:hover:text-brand-blue-light transition-colors">Terms of Service</a>
          <a href="#" onClick={(e) => handleNav(e, View.SUPPORT)} className="hover:text-brand-blue dark:hover:text-brand-blue-light transition-colors">Contact Support</a>
          <a href="#" onClick={(e) => handleNav(e, View.FAQ)} className="hover:text-brand-blue dark:hover:text-brand-blue-light transition-colors">FAQ</a>
        </div>
      </div>
    </footer>
  );
};

export default memo(Footer);