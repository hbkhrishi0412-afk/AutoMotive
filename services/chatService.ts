import type { Conversation } from '../types';
import { DatabaseServiceClient } from './databaseServiceClient';

/**
 * Retrieves all conversations from the database.
 * @returns A promise that resolves to an array of conversations.
 */
export const getConversations = async (): Promise<Conversation[]> => {
  try {
    return await DatabaseServiceClient.getConversations();
  } catch (error) {
    console.error("Failed to fetch conversations from database", error);
    return [];
  }
};

/**
 * Saves the entire array of conversations to the database.
 * @param conversations The array of conversations to save.
 */
export const saveConversations = async (conversations: Conversation[]): Promise<void> => {
  try {
    await DatabaseServiceClient.saveConversations(conversations);
  } catch (error) {
    console.error("Failed to save conversations to database", error);
  }
};