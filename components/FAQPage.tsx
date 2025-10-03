import React, { useState, useMemo } from 'react';
import type { FAQItem } from '../types';

interface FAQPageProps {
  faqItems: FAQItem[];
}

const FAQPage: React.FC<FAQPageProps> = ({ faqItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openItem, setOpenItem] = useState<number | null>(null);

  const filteredAndGroupedFAQs = useMemo(() => {
    // FIX: Removed unnecessary type guard. The prop 'faqItems' is already typed as an array.
    // The guard was confusing TypeScript's type inference, causing a compilation error.
    const filtered = faqItems.filter(
      (item) =>
        item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.reduce((acc, item) => {
      (acc[item.category] = acc[item.category] || []).push(item);
      return acc;
    }, {} as Record<string, FAQItem[]>);
  }, [faqItems, searchTerm]);

  const toggleItem = (id: number) => {
    setOpenItem(openItem === id ? null : id);
  };

  return (
    <div className="animate-fade-in container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-brand-gray-900 dark:text-brand-gray-100">
          Frequently Asked Questions
        </h1>
        <p className="mt-4 text-lg text-brand-gray-600 dark:text-brand-gray-400">
          Find answers to common questions about buying and selling on AutoVerse AI.
        </p>
      </div>

      <div className="mb-8">
        <input
          type="search"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-4 border border-brand-gray-300 dark:border-brand-gray-600 rounded-xl focus:ring-2 focus:ring-brand-blue focus:outline-none bg-white dark:bg-brand-gray-700 text-lg"
        />
      </div>

      <div className="space-y-8">
        {Object.entries(filteredAndGroupedFAQs).map(([category, items]) => (
          <div key={category}>
            <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100 mb-4 border-b border-brand-gray-200 dark:border-brand-gray-700 pb-2">
              {category}
            </h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="border-b border-brand-gray-200 dark:border-brand-gray-700 last:border-b-0">
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="w-full flex justify-between items-center text-left py-4 focus:outline-none"
                    aria-expanded={openItem === item.id}
                  >
                    <span className="text-lg font-semibold text-brand-gray-800 dark:text-brand-gray-100">
                      {item.question}
                    </span>
                    <svg
                      className={`w-6 h-6 text-brand-gray-500 transition-transform ${
                        openItem === item.id ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openItem === item.id && (
                    <div className="pb-4 text-brand-gray-600 dark:text-brand-gray-300 animate-fade-in">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(filteredAndGroupedFAQs).length === 0 && (
            <p className="text-center text-lg text-brand-gray-500 py-10">No questions found matching your search.</p>
        )}
      </div>
    </div>
  );
};

export default FAQPage;