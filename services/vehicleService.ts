import type { Vehicle } from '../types';
import { DatabaseServiceClient } from './databaseServiceClient';

/**
 * Retrieves all vehicles from the database.
 * @returns A promise that resolves to an array of vehicles.
 */
export const getVehicles = async (): Promise<Vehicle[]> => {
  try {
    return await DatabaseServiceClient.getVehicles();
  } catch (error) {
    console.error("Failed to fetch vehicles from database", error);
    // Fallback to mock data if database fails
    const { MOCK_VEHICLES } = await import('../constants');
    return MOCK_VEHICLES;
  }
};

/**
 * Saves the vehicles array to the database.
 * @param vehicles The array of vehicles to save.
 */
export const saveVehicles = async (vehicles: Vehicle[]): Promise<void> => {
  try {
    // For now, we'll update each vehicle individually
    // In a real app, you might want to implement batch operations
    for (const vehicle of vehicles) {
      if (vehicle.id) {
        const existingVehicle = await DatabaseServiceClient.getVehicleById(vehicle.id);
        if (existingVehicle) {
          await DatabaseServiceClient.updateVehicle(vehicle.id, vehicle);
        } else {
          await DatabaseServiceClient.createVehicle(vehicle);
        }
      } else {
        await DatabaseServiceClient.createVehicle(vehicle);
      }
    }
  } catch (error) {
    console.error("Failed to save vehicles to database", error);
  }
};

/**
 * Get a vehicle by ID from the database.
 * @param id The ID of the vehicle to retrieve.
 * @returns A promise that resolves to the vehicle or null if not found.
 */
export const getVehicleById = async (id: number): Promise<Vehicle | null> => {
  try {
    return await DatabaseServiceClient.getVehicleById(id);
  } catch (error) {
    console.error("Failed to fetch vehicle from database", error);
    return null;
  }
};

/**
 * Create a new vehicle in the database.
 * @param vehicle The vehicle data to create.
 * @returns A promise that resolves to the created vehicle.
 */
export const createVehicle = async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
  try {
    return await DatabaseServiceClient.createVehicle(vehicle);
  } catch (error) {
    console.error("Failed to create vehicle in database", error);
    throw error;
  }
};

/**
 * Update a vehicle in the database.
 * @param id The ID of the vehicle to update.
 * @param updates The updates to apply.
 */
export const updateVehicle = async (id: number, updates: Partial<Vehicle>): Promise<void> => {
  try {
    await DatabaseServiceClient.updateVehicle(id, updates);
  } catch (error) {
    console.error("Failed to update vehicle in database", error);
    throw error;
  }
};

/**
 * Delete a vehicle from the database.
 * @param id The ID of the vehicle to delete.
 */
export const deleteVehicle = async (id: number): Promise<void> => {
  try {
    await DatabaseServiceClient.deleteVehicle(id);
  } catch (error) {
    console.error("Failed to delete vehicle from database", error);
    throw error;
  }
};
