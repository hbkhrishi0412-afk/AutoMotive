
import { MOCK_VEHICLES } from '../constants';
import type { Vehicle, User } from '../types';

const IS_PROD = process.env.NODE_ENV === 'production';

// --- API Helpers ---
const getAuthHeader = () => {
  try {
    const userJson = sessionStorage.getItem('currentUser');
    if (!userJson) return {};
    const user: User = JSON.parse(userJson);
    return { 'Authorization': user.email };
  } catch {
    return {};
  }
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: `API Error: ${response.statusText}` }));
        throw new Error(error.error || `Failed to fetch: ${response.statusText}`);
    }
    return response.json();
}

// --- Local Development (localStorage) Functions ---

export const getVehiclesLocal = async (): Promise<Vehicle[]> => {
    let vehiclesJson = localStorage.getItem('reRideVehicles');
    if (!vehiclesJson) {
        localStorage.setItem('reRideVehicles', JSON.stringify(MOCK_VEHICLES));
        vehiclesJson = JSON.stringify(MOCK_VEHICLES);
    }
    return JSON.parse(vehiclesJson);
};

const addVehicleLocal = async (vehicleData: Vehicle): Promise<Vehicle> => {
    const vehicles = await getVehiclesLocal();
    vehicles.unshift(vehicleData);
    localStorage.setItem('reRideVehicles', JSON.stringify(vehicles));
    return vehicleData;
};

const updateVehicleLocal = async (vehicleData: Vehicle): Promise<Vehicle> => {
    let vehicles = await getVehiclesLocal();
    vehicles = vehicles.map(v => v.id === vehicleData.id ? vehicleData : v);
    localStorage.setItem('reRideVehicles', JSON.stringify(vehicles));
    return vehicleData;
};

const deleteVehicleLocal = async (vehicleId: number): Promise<{ success: boolean, id: number }> => {
    let vehicles = await getVehiclesLocal();
    vehicles = vehicles.filter(v => v.id !== vehicleId);
    localStorage.setItem('reRideVehicles', JSON.stringify(vehicles));
    return { success: true, id: vehicleId };
};


// --- Production (API) Functions ---

const getVehiclesApi = async (): Promise<Vehicle[]> => {
  const response = await fetch('/api/vehicles');
  return handleResponse(response);
};

const addVehicleApi = async (vehicleData: Vehicle): Promise<Vehicle> => {
    const response = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(vehicleData),
    });
    return handleResponse(response);
};

const updateVehicleApi = async (vehicleData: Vehicle): Promise<Vehicle> => {
    const response = await fetch('/api/vehicles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify(vehicleData),
    });
    return handleResponse(response);
};

const deleteVehicleApi = async (vehicleId: number): Promise<{ success: boolean, id: number }> => {
    const response = await fetch('/api/vehicles', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ id: vehicleId }),
    });
    return handleResponse(response);
};


// --- Exported Environment-Aware Service Functions ---

export const getVehicles = (): Promise<Vehicle[]> => {
    return IS_PROD ? getVehiclesApi() : getVehiclesLocal();
};

export const addVehicle = (vehicleData: Vehicle): Promise<Vehicle> => {
    return IS_PROD ? addVehicleApi(vehicleData) : addVehicleLocal(vehicleData);
};

export const updateVehicle = (vehicleData: Vehicle): Promise<Vehicle> => {
    return IS_PROD ? updateVehicleApi(vehicleData) : updateVehicleLocal(vehicleData);
};

export const deleteVehicle = (vehicleId: number): Promise<{ success: boolean, id: number }> => {
    return IS_PROD ? deleteVehicleApi(vehicleId) : deleteVehicleLocal(vehicleId);
};
