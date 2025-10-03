import type { User } from '../types';
import { MOCK_USERS } from '../constants';

const USER_STORAGE_KEY = 'appUsers';

/**
 * Retrieves all users from localStorage, or seeds it with mock data if empty.
 * @returns A promise that resolves to an array of users.
 */
export const getUsers = async (): Promise<User[]> => {
  try {
    const usersJson = localStorage.getItem(USER_STORAGE_KEY);
    if (usersJson) {
      return JSON.parse(usersJson);
    }
  } catch (error) {
    console.error("Failed to parse users from localStorage", error);
  }
  
  saveUsers(MOCK_USERS);
  return MOCK_USERS;
};

/**
 * Saves the users array to localStorage.
 * NOTE: This is a temporary client-side operation. In a full-stack app,
 * this would be replaced with API calls to update the database.
 * @param users The array of users to save.
 */
export const saveUsers = (users: User[]) => {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error("Failed to save users to localStorage", error);
  }
};
