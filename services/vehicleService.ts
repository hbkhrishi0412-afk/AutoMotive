import type { Vehicle } from '../types';

/**
 * Retrieves all vehicles from the backend API.
 * @returns A promise that resolves to an array of vehicles.
 */
export const getVehicles = async (): Promise<Vehicle[]> => {
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
};

/**
 * Saves the vehicles array. In a real app, this would make API calls.
 * This is currently a no-op to prevent localStorage overwrites.
 * @param vehicles The array of vehicles to save.
 */
export const saveVehicles = (vehicles: Vehicle[]) => {
  // This function is intentionally left empty.
  // Data persistence should be handled by API calls to a backend.
};
