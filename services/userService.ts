import type { User } from '../types';

const USER_STORAGE_KEY = 'appUsers';

/**
 * Retrieves all users from localStorage.
 * @returns An array of users or null if not found.
 */
export const getUsers = (): User[] | null => {
  try {
    const usersJson = localStorage.getItem(USER_STORAGE_KEY);
    if (usersJson) {
      return JSON.parse(usersJson);
    }
    return null;
  } catch (error) {
    console.error("Failed to parse users from localStorage", error);
    return null;
  }
};

/**
 * Saves the users array to localStorage.
 * @param users The array of users to save.
 */
export const saveUsers = (users: User[]) => {
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error("Failed to save users to localStorage", error);
  }
};
