import React from 'react';
import { View } from '../types';

interface LoginPortalProps {
  onNavigate: (view: View) => void;
}

const LoginPortal: React.FC<LoginPortalProps> = ({ onNavigate }) => {
  return (
    <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-brand-gray-dark p-10 rounded-xl shadow-lg text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Welcome to AutoVerse AI</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Please select your role to continue.</p>
        <div className="mt-8 space-y-4">
          <button
            onClick={() => onNavigate(View.CUSTOMER_LOGIN)}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-light transition-transform transform hover:scale-105"
          >
            I am a Customer
          </button>
          <button
            onClick={() => onNavigate(View.DEALER_LOGIN)}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-brand-blue-dark dark:text-white bg-brand-gray dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-transform transform hover:scale-105"
          >
            I am a Dealer
          </button>
        </div>
        <div className="text-sm mt-6">
            <button
                onClick={() => onNavigate(View.USED_CARS)}
                className="font-medium text-brand-blue hover:text-brand-blue-dark"
            >
                Or continue as a guest &rarr;
            </button>
        </div>
         <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
             <div className="text-sm">
                <button
                    onClick={() => onNavigate(View.ADMIN_LOGIN)}
                    className="font-medium text-gray-500 hover:text-brand-blue-dark dark:text-gray-400 dark:hover:text-brand-blue-light"
                >
                    Administrator Login
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPortal;