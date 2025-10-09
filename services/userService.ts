import type { User } from '../types';

/**
 * Retrieves all users from the backend API.
 * @returns A promise that resolves to an array of users.
 */
export const getUsers = async (): Promise<User[]> => {
  try {
    const response = await fetch('/api/users');
    if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
    }
    const users = await response.json();
    return users;
  } catch (error) {
    console.error("Error fetching users from API:", error);
    return []; // Return empty array on error to prevent crashes
  }
};

/**
 * Saves the users array. In a real app, this would make API calls.
 * This is currently a no-op to prevent localStorage overwrites.
 * @param users The array of users to save.
 */
export const saveUsers = (users: User[]) => {
  // This function is intentionally left empty.
  // Data persistence should be handled by API calls to a backend.
};
