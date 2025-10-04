import React from 'react';
import { View } from '../types';

interface LoginPortalProps {
  onNavigate: (view: View) => void;
}

const LoginPortal: React.FC<LoginPortalProps> = ({ onNavigate }) => {
  return (
    <div className="w-full max-w-md space-y-8 bg-white dark:bg-brand-gray-800 p-10 rounded-xl shadow-soft-xl text-center">
      <h2 className="text-3xl font-extrabold text-brand-gray-900 dark:text-brand-gray-100">Welcome to ReRide</h2>
      <p className="mt-2 text-brand-gray-600 dark:text-brand-gray-400">Please select your role to continue.</p>
      <div className="mt-8 space-y-4">
        <button
          onClick={() => onNavigate(View.CUSTOMER_LOGIN)}
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-light transition-transform transform hover:scale-105"
        >
          I am a Customer
        </button>
        <button
          onClick={() => onNavigate(View.SELLER_LOGIN)}
          className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-lg font-medium rounded-md text-brand-blue-dark dark:text-white bg-brand-gray-200 dark:bg-brand-gray-700 hover:bg-brand-gray-300 dark:hover:bg-brand-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gray-500 transition-transform transform hover:scale-105"
        >
          I am a Seller
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
       <div className="mt-6 pt-6 border-t border-brand-gray-200 dark:border-brand-gray-700">
           <div className="text-sm">
              <button
                  onClick={() => onNavigate(View.ADMIN_LOGIN)}
                  className="font-medium text-brand-gray-500 hover:text-brand-blue-dark dark:text-brand-gray-400 dark:hover:text-brand-blue-light"
              >
                  Administrator Login
              </button>
          </div>
      </div>
    </div>
  );
};

export default LoginPortal;