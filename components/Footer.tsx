import React, { memo } from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-gray-100 dark:bg-brand-gray-900 border-t border-brand-gray-200 dark:border-brand-gray-800">
      <div className="container mx-auto px-4 py-6 text-center">
        <p className="text-brand-gray-800 dark:text-brand-gray-200">&copy; {new Date().getFullYear()} AutoVerse AI. All rights reserved.</p>
        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mt-1">The premier AI-driven marketplace for your next vehicle.</p>
      </div>
    </footer>
  );
};

export default memo(Footer);