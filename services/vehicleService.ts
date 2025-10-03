import type { Vehicle } from '../types';

const VEHICLE_STORAGE_KEY = 'autoVerseVehicles';

/**
 * Retrieves all vehicles from the API endpoint.
 * @returns A promise that resolves to an array of vehicles.
 */
export const getVehicles = async (): Promise<Vehicle[]> => {
  try {
    const response = await fetch('/api/vehicles');
    if (!response.ok) {
      throw new Error('Failed to fetch vehicles');
    }
    const data = await response.json();
    // Vercel Postgres returns numeric types as strings, so we need to parse them.
    return data.map((v: any) => ({
      ...v,
      id: Number(v.id),
      year: Number(v.year),
      price: Number(v.price),
      mileage: Number(v.mileage),
      views: Number(v.views),
      inquiriesCount: Number(v.inquiriesCount),
      noOfOwners: Number(v.noOfOwners),
      registrationYear: Number(v.registrationYear),
    }));
  } catch (error) {
    console.error("Failed to fetch vehicles from API", error);
    return []; // Return empty array on error
  }
};

/**
 * Saves the vehicles array to localStorage.
 * NOTE: This is a temporary client-side operation. In a full-stack app,
 * this would be replaced with API calls to update the database.
 * @param vehicles The array of vehicles to save.
 */
export const saveVehicles = (vehicles: Vehicle[]) => {
  try {
    localStorage.setItem(VEHICLE_STORAGE_KEY, JSON.stringify(vehicles));
  } catch (error) {
    console.error("Failed to save vehicles to localStorage", error);
  }
};
