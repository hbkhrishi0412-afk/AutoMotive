import type { Conversation } from '../types';

const CONVERSATION_STORAGE_KEY = 'autoVerseConversations';

/**
 * Retrieves all conversations from localStorage.
 * @returns An array of conversations.
 */
export const getConversations = (): Conversation[] => {
  try {
    const conversationsJson = localStorage.getItem(CONVERSATION_STORAGE_KEY);
    return conversationsJson ? JSON.parse(conversationsJson) : [];
  } catch (error) {
    console.error("Failed to parse conversations from localStorage", error);
    return [];
  }
};

/**
 * Saves the entire array of conversations to localStorage.
 * @param conversations The array of conversations to save.
 */
export const saveConversations = (conversations: Conversation[]) => {
  try {
    localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error("Failed to save conversations to localStorage", error);
  }
};