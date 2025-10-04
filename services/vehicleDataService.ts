import type { VehicleData } from '../types';
import { VEHICLE_DATA } from '../components/vehicleData';

const VEHICLE_DATA_STORAGE_KEY = 'reRideVehicleData';

/**
 * Retrieves vehicle data (categories, makes, models, variants) from localStorage.
 * If no data is found, it initializes the storage with default data.
 * @returns The structured vehicle data object.
 */
export const getVehicleData = (): VehicleData => {
  try {
    const dataJson = localStorage.getItem(VEHICLE_DATA_STORAGE_KEY);
    if (dataJson) {
      return JSON.parse(dataJson);
    } else {
      // If no data in localStorage, seed it with the default data and return it.
      const defaultData = VEHICLE_DATA;
      localStorage.setItem(VEHICLE_DATA_STORAGE_KEY, JSON.stringify(defaultData));
      return defaultData;
    }
  } catch (error) {
    console.error("Failed to parse vehicle data from localStorage", error);
    // Fallback to default data in case of parsing error
    return VEHICLE_DATA;
  }
};

/**
 * Saves the provided vehicle data object to localStorage.
 * @param data The vehicle data object to save.
 */
export const saveVehicleData = (data: VehicleData) => {
  try {
    localStorage.setItem(VEHICLE_DATA_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save vehicle data to localStorage", error);
  }
};