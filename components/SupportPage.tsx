import React, { useState } from 'react';
import type { User, SupportTicket } from '../types';

interface SupportPageProps {
  currentUser: User | null;
  onSubmitTicket: (ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'replies' | 'status'>) => void;
}

const SupportPage: React.FC<SupportPageProps> = ({ currentUser, onSubmitTicket }) => {
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    subject: '',
    message: '',
  });
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('All fields are required.');
      return;
    }
    setError('');
    onSubmitTicket({
      userName: formData.name,
      userEmail: formData.email,
      subject: formData.subject,
      message: formData.message,
    });
  };
  
  const formInputClass = "block w-full p-3 border border-brand-gray-300 dark:border-brand-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue focus:outline-none transition bg-white dark:bg-brand-gray-800 dark:text-gray-200 disabled:bg-brand-gray-100 dark:disabled:bg-brand-gray-700";

  return (
    <div className="animate-fade-in container mx-auto px-4 py-8 max-w-2xl">
      <div className="bg-white dark:bg-brand-gray-800 p-8 rounded-xl shadow-soft-lg">
        <h1 className="text-3xl font-extrabold text-brand-gray-900 dark:text-brand-gray-100 mb-2">Contact Support</h1>
        <p className="text-brand-gray-600 dark:text-brand-gray-400 mb-6">
          Have a question or facing an issue? Fill out the form below, and our team will get back to you as soon as possible.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Your Name</label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required disabled={!!currentUser} className={formInputClass} />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Your Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required disabled={!!currentUser} className={formInputClass} />
            </div>
          </div>
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Subject</label>
            <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} required className={formInputClass} />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Message</label>
            <textarea id="message" name="message" value={formData.message} onChange={handleChange} required rows={6} className={formInputClass}></textarea>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div>
            <button
              type="submit"
              className="w-full bg-brand-blue text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-brand-blue-dark transition-colors"
            >
              Submit Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupportPage;