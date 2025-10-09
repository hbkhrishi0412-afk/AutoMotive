import React, { useState } from 'react';
import { View, User } from '../types';
import { login } from '../services/userService';

interface AdminLoginProps {
  onLogin: (user: User) => void;
  onNavigate: (view: View) => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setIsLoading(false);
      return;
    }

    try {
        const result = await login({ email, password, role: 'admin' });

        if (result.success && result.user) {
            onLogin(result.user);
        } else {
            throw new Error(result.reason || 'Invalid admin credentials.');
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to authenticate.');
    } finally {
        setIsLoading(false);
    }
  };

  const formInputClass = "appearance-none relative block w-full px-4 py-3 border border-brand-gray-300 dark:border-brand-gray-600 placeholder-brand-gray-500 text-brand-gray-900 dark:text-brand-gray-200 bg-white dark:bg-brand-gray-800 focus:outline-none focus:ring-brand-blue focus:border-brand-blue focus:z-10 sm:text-sm";

  return (
    <div className="w-full max-w-md space-y-8 bg-white dark:bg-brand-gray-800 p-10 rounded-xl shadow-soft-xl">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-gray-900 dark:text-brand-gray-100">
          Admin Panel Login
        </h2>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md shadow-sm space-y-4">
          <div>
            <label htmlFor="email-address" className="sr-only">Email address</label>
            <input id="email-address" name="email" type="email" autoComplete="email" required className={`${formInputClass} rounded-md`} placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required className={`${formInputClass} rounded-md`} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div>
          <button type="submit" disabled={isLoading} className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue-dark hover:bg-brand-blue-darkest focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-colors disabled:opacity-50">
            {isLoading ? 'Signing in...' : 'Sign in as Admin'}
          </button>
        </div>
      </form>
       <div className="text-center">
          <button onClick={() => onNavigate(View.USED_CARS)} className="font-medium text-brand-blue hover:text-brand-blue-dark">
              &larr; Or go back to Listings
          </button>
      </div>
    </div>
  );
};

export default AdminLogin;
