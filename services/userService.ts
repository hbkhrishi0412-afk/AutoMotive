import type { User } from '../types';

const USER_STORAGE_KEY = 'appUsers';

/**
 * Retrieves all users from the API endpoint.
 * @returns A promise that resolves to an array of users.
 */
export const getUsers = async (): Promise<User[]> => {
  const response = await fetch('/api/users');
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: `Failed to fetch users. Status: ${response.status}` }));
    const errorMessage = errorBody.error || `Failed to fetch users from API`;
    console.error(errorMessage, { status: response.status, details: errorBody });
    throw new Error(errorMessage);
  }
  const data = await response.json();
   // Vercel Postgres returns numeric types as strings, so we need to parse them.
  return data.map((u: any) => ({
    ...u,
    featuredCredits: u.featuredCredits ? Number(u.featuredCredits) : 0,
  }));
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