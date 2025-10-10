import type { User } from '../types';
import { DatabaseServiceClient } from './databaseServiceClient';

/**
 * Retrieves all users from the database.
 * @returns A promise that resolves to an array of users.
 */
export const getUsers = async (): Promise<User[]> => {
  try {
    return await DatabaseServiceClient.getUsers();
  } catch (error) {
    console.error("Failed to fetch users from database", error);
    // Fallback to mock data if database fails
    const { MOCK_USERS } = await import('../constants');
    return MOCK_USERS;
  }
};

/**
 * Saves the users array to the database.
 * @param users The array of users to save.
 */
export const saveUsers = async (users: User[]): Promise<void> => {
  try {
    // For now, we'll update each user individually
    // In a real app, you might want to implement batch operations
    for (const user of users) {
      const existingUser = await DatabaseServiceClient.getUserByEmail(user.email);
      if (existingUser) {
        await DatabaseServiceClient.updateUser(user.email, user);
      } else {
        await DatabaseServiceClient.createUser(user);
      }
    }
  } catch (error) {
    console.error("Failed to save users to database", error);
  }
};

/**
 * Get a user by email from the database.
 * @param email The email of the user to retrieve.
 * @returns A promise that resolves to the user or null if not found.
 */
export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    return await DatabaseServiceClient.getUserByEmail(email);
  } catch (error) {
    console.error("Failed to fetch user from database", error);
    return null;
  }
};

/**
 * Create a new user in the database.
 * @param user The user data to create.
 * @returns A promise that resolves to the created user.
 */
export const createUser = async (user: Omit<User, 'createdAt'>): Promise<User> => {
  try {
    return await DatabaseServiceClient.createUser(user);
  } catch (error) {
    console.error("Failed to create user in database", error);
    throw error;
  }
};

/**
 * Update a user in the database.
 * @param email The email of the user to update.
 * @param updates The updates to apply.
 */
export const updateUser = async (email: string, updates: Partial<User>): Promise<void> => {
  try {
    await DatabaseServiceClient.updateUser(email, updates);
  } catch (error) {
    console.error("Failed to update user in database", error);
    throw error;
  }
};

/**
 * Delete a user from the database.
 * @param email The email of the user to delete.
 */
export const deleteUser = async (email: string): Promise<void> => {
  try {
    await DatabaseServiceClient.deleteUser(email);
  } catch (error) {
    console.error("Failed to delete user from database", error);
    throw error;
  }
};
