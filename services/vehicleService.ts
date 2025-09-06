import type { Vehicle } from '../types';

const VEHICLE_STORAGE_KEY = 'autoVerseVehicles';

/**
 * Retrieves all vehicles from localStorage.
 * @returns An array of vehicles or null if not found.
 */
export const getVehicles = (): Vehicle[] | null => {
  try {
    const vehiclesJson = localStorage.getItem(VEHICLE_STORAGE_KEY);
    if (vehiclesJson) {
      return JSON.parse(vehiclesJson);
    }
    return null;
  } catch (error) {
    console.error("Failed to parse vehicles from localStorage", error);
    return null;
  }
};

/**
 * Saves the vehicles array to localStorage.
 * @param vehicles The array of vehicles to save.
 */
export const saveVehicles = (vehicles: Vehicle[]) => {
  try {
    localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(vehicles));
  } catch (error) {
    console.error("Failed to save vehicles to localStorage", error);
  }
};
