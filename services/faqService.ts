import type { FAQItem } from '../types';

const FAQ_STORAGE_KEY = 'autoVerseFaqs';

export const getFaqs = (): FAQItem[] | null => {
  try {
    const faqsJson = localStorage.getItem(FAQ_STORAGE_KEY);
    return faqsJson ? JSON.parse(faqsJson) : null;
  } catch (error) {
    console.error("Failed to parse FAQs from localStorage", error);
    return null;
  }
};

export const saveFaqs = (faqs: FAQItem[]) => {
  try {
    localStorage.setItem(FAQ_STORAGE_KEY, JSON.stringify(faqs));
  } catch (error) {
    console.error("Failed to save FAQs to localStorage", error);
  }
};
