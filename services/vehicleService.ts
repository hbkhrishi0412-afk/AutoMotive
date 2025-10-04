import type { Vehicle } from '../types';
import { MOCK_VEHICLES } from '../constants';

const VEHICLE_STORAGE_KEY = 'reRideVehicles';

/**
 * Retrieves all vehicles from localStorage, or seeds it with mock data if empty.
 * @returns A promise that resolves to an array of vehicles.
 */
export const getVehicles = async (): Promise<Vehicle[]> => {
  try {
    const vehiclesJson = localStorage.getItem(VEHICLE_STORAGE_KEY);
    if (vehiclesJson) {
      return JSON.parse(vehiclesJson);
    }
  } catch (error) {
    console.error("Failed to parse vehicles from localStorage", error);
  }
  
  // If localStorage is empty or fails, use mock data and save it.
  saveVehicles(MOCK_VEHICLES);
  return MOCK_VEHICLES;
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