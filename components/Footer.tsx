
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-gray-darker text-white">
      <div className="container mx-auto px-4 py-6 text-center">
        <p>&copy; {new Date().getFullYear()} AutoVerse AI. All rights reserved.</p>
        <p className="text-sm text-gray-400 mt-1">The premier AI-driven marketplace for your next vehicle.</p>
      </div>
    </footer>
  );
};

export default Footer;