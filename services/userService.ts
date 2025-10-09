import type { User } from '../types';
import { MOCK_USERS } from '../constants';

const USER_STORAGE_KEY = 'reRideUsers';
// FIX: Replace import.meta.env.PROD with process.env.NODE_ENV to avoid TypeScript errors when Vite types are not configured.
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Retrieves all users. In production, it fetches from the backend API.
 * In development, it uses localStorage as a persistent store, falling back to mock data.
 * @returns A promise that resolves to an array of users.
 */
export const getUsers = async (): Promise<User[]> => {
  if (isProduction) {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      const users = await response.json();
      return users;
    } catch (error) {
      console.error("Error fetching users from API:", error);
      return [];
    }
  } else {
    // Development mode: use localStorage, fallback to mocks
    try {
      const storedUsers = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUsers) {
        return JSON.parse(storedUsers);
      }
    } catch (e) {
      console.error("Couldn't load users from local storage", e);
    }
    // Seed localStorage with mock data
    console.log("DEV MODE: Seeding localStorage with mock users. For live data from Postgres, run `vercel dev`.");
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(MOCK_USERS));
    return MOCK_USERS;
  }
};

/**
 * Saves users. In production, this would make API calls to update data.
 * In development, it saves the entire array of users to localStorage.
 * @param users The array of users to save.
 */
export const saveUsers = (users: User[]) => {
  if (!isProduction) {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
      console.error("Failed to save users to localStorage", error);
    }
  }
  // In production, individual mutations (add, update, delete) would be separate API calls.
};