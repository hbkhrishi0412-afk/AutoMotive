import type { Vehicle } from '../types';
import { MOCK_VEHICLES } from '../constants';

const VEHICLE_STORAGE_KEY = 'reRideVehicles';
// FIX: Replace import.meta.env.PROD with process.env.NODE_ENV to avoid TypeScript errors when Vite types are not configured.
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Retrieves all vehicles. In production, it fetches from the backend API.
 * In development, it uses localStorage as a persistent store, falling back to mock data.
 * @returns A promise that resolves to an array of vehicles.
 */
export const getVehicles = async (): Promise<Vehicle[]> => {
  if (isProduction) {
    try {
      const response = await fetch('/api/vehicles');
      if (!response.ok) {
        throw new Error(`Failed to fetch vehicles: ${response.statusText}`);
      }
      const vehicles = await response.json();
      return vehicles;
    } catch (error) {
      console.error("Error fetching vehicles from API:", error);
      return []; // Return empty array on error
    }
  } else {
    // Development mode: use localStorage, fallback to mocks
    try {
      const storedVehicles = localStorage.getItem(VEHICLE_STORAGE_KEY);
      if (storedVehicles) {
        return JSON.parse(storedVehicles);
      }
    } catch (e) {
      console.error("Couldn't load vehicles from local storage", e);
    }
    // Seed localStorage with mock data if it's empty or fails
    console.log("DEV MODE: Seeding localStorage with mock vehicles. For live data from Postgres, run `vercel dev`.");
    localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(MOCK_VEHICLES));
    return MOCK_VEHICLES;
  }
};

/**
 * Saves vehicles. In production, this would make API calls to update data.
 * In development, it saves the entire array of vehicles to localStorage.
 * @param vehicles The array of vehicles to save.
 */
export const saveVehicles = (vehicles: Vehicle[]) => {
  if (!isProduction) {
    try {
      localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(vehicles));
    } catch (error) {
      console.error("Failed to save vehicles to localStorage", error);
    }
  }
  // In production, individual mutations (add, update, delete) would be separate API calls.
  // A full save of the entire state is not performed against the API.
};