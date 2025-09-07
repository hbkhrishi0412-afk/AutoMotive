import React, { useState, useEffect } from 'react';
import { View, User } from '../types';

interface CustomerLoginProps {
  onLogin: (credentials: { email: string; password: string; }) => { success: boolean, reason: string };
  onRegister: (credentials: Omit<User, 'role' | 'status' | 'createdAt'>) => { success: boolean, reason: string };
  onNavigate: (view: View) => void;
  onForgotPassword: () => void;
}

const CustomerLogin: React.FC<CustomerLoginProps> = ({ onLogin, onRegister, onNavigate, onForgotPassword }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedCustomerEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'login') {
      if (!email || !password) {
        setError('Please enter both email and password.');
        return;
      }
      const result = onLogin({ email, password });
      if (!result.success) {
        setError(result.reason);
      } else {
        if (rememberMe) {
          localStorage.setItem('rememberedCustomerEmail', email);
        } else {
          localStorage.removeItem('rememberedCustomerEmail');
        }
      }
    } else { // register
      if (!name || !mobile || !email || !password) {
        setError('Please fill in all registration fields.');
        return;
      }
      const result = onRegister({ name, email, password, mobile });
      if (!result.success) {
        setError(result.reason);
      }
    }
  };

  const toggleMode = () => {
    setError('');
    setName('');
    setMobile('');
    if (!localStorage.getItem('rememberedCustomerEmail')) {
      setEmail('');
    }
    setPassword('');
    setMode(prev => prev === 'login' ? 'register' : 'login');
  };

  const isLogin = mode === 'login';
  const formInputClass = "appearance-none relative block w-full px-4 py-3 border border-brand-gray-300 dark:border-brand-gray-600 placeholder-brand-gray-500 text-brand-gray-900 dark:text-brand-gray-200 bg-white dark:bg-brand-gray-800 focus:outline-none focus:ring-brand-blue focus:border-brand-blue focus:z-10 sm:text-sm";


  return (
    <div className="w-full max-w-md space-y-8 bg-white dark:bg-brand-gray-800 p-10 rounded-xl shadow-soft-xl">
      <div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-brand-gray-900 dark:text-brand-gray-100">
          {isLogin ? 'Welcome Back!' : 'Create an Account'}
        </h2>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        <div className="rounded-md shadow-sm space-y-4">
          {!isLogin && (
            <>
              <div>
                <label htmlFor="full-name" className="sr-only">Full name</label>
                <input
                  id="full-name" name="name" type="text" autoComplete="name" required
                  className={`${formInputClass} rounded-md`}
                  placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="mobile-number" className="sr-only">Mobile number</label>
                <input
                  id="mobile-number" name="mobile" type="tel" autoComplete="tel" required
                  className={`${formInputClass} rounded-md`}
                  placeholder="Mobile number" value={mobile} onChange={(e) => setMobile(e.target.value)}
                />
              </div>
            </>
          )}
          <div>
            <label htmlFor="email-address" className="sr-only">Email address</label>
            <input
              id="email-address" name="email" type="email" autoComplete="email" required
              className={`${formInputClass} rounded-md`}
              placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <div className="relative">
              <input
                id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required
                className={`${formInputClass} rounded-md`}
                placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
              />
              <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-brand-gray-500 hover:text-brand-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
              >
                  {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 .847 0 1.67.111 2.458.324M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 2l20 20" /></svg>
                  ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274-4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  )}
              </button>
            </div>
          </div>
        </div>
        {isLogin && (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-brand-blue focus:ring-brand-blue-light border-brand-gray-300 rounded" />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-brand-gray-900 dark:text-brand-gray-300">Remember me</label>
            </div>
            <div className="text-sm">
              <button
                type="button"
                onClick={onForgotPassword}
                className="font-medium text-brand-blue hover:text-brand-blue-dark"
              >
                Forgot your password?
              </button>
            </div>
          </div>
        )}
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <div>
          <button type="submit" className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-light transition-colors">
            {isLogin ? 'Sign in' : 'Create Account'}
          </button>
        </div>
      </form>
      <div className="text-sm text-center">
        <button onClick={toggleMode} className="font-medium text-brand-blue hover:text-brand-blue-dark">
          {isLogin ? "Don't have an account? Register" : "Already have an account? Sign in"}
        </button>
      </div>
      <div className="text-center">
          <button onClick={() => onNavigate(View.LOGIN_PORTAL)} className="font-medium text-brand-blue hover:text-brand-blue-dark">&larr; Back to Role Selection</button>
      </div>
    </div>
  );
};
export default CustomerLogin;