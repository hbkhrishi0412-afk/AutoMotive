import React, { useState, useMemo } from 'react';
import { INDIAN_STATES, CITIES_BY_STATE } from '../constants';

interface LocationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLocationChange: (location: string) => void;
    addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const LocationModal: React.FC<LocationModalProps> = ({ isOpen, onClose, onLocationChange, addToast }) => {
    const [selectedState, setSelectedState] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [isDetecting, setIsDetecting] = useState(false);

    const availableCities = useMemo(() => {
        if (!selectedState) return [];
        return CITIES_BY_STATE[selectedState] || [];
    }, [selectedState]);

    const handleDetectLocation = () => {
        if (!navigator.geolocation) {
            addToast('Geolocation is not supported by your browser.', 'error');
            return;
        }
        setIsDetecting(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // In a real app, you'd use position.coords.latitude and position.coords.longitude
                // to call a reverse geocoding API. Here, we'll simulate it by picking a random city.
                const allCities = Object.values(CITIES_BY_STATE).flat();
                const randomCity = allCities[Math.floor(Math.random() * allCities.length)];
                onLocationChange(randomCity);
                addToast('Location detected successfully!', 'success');
                setIsDetecting(false);
                onClose();
            },
            () => {
                addToast('Unable to retrieve your location. Please grant permission or select manually.', 'error');
                setIsDetecting(false);
            }
        );
    };
    
    const handleManualSelect = () => {
        if (selectedCity) {
            onLocationChange(selectedCity);
            onClose();
        } else {
            addToast('Please select a city.', 'info');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[101] flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Select Your Location</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Prices and availability may vary based on your location.</p>
                </div>
                <div className="p-6 space-y-4">
                    <button
                        onClick={handleDetectLocation}
                        disabled={isDetecting}
                        className="w-full flex items-center justify-center gap-2 bg-brand-blue-lightest text-brand-blue-dark font-bold py-3 px-4 rounded-lg hover:bg-brand-blue-light transition-colors disabled:opacity-70 disabled:cursor-wait"
                    >
                        {isDetecting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-current"></div>
                                <span>Detecting...</span>
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                                <span>Detect My Location</span>
                            </>
                        )}
                    </button>

                    <div className="flex items-center text-xs text-gray-400">
                        <span className="flex-grow border-t dark:border-gray-600"></span>
                        <span className="px-4">OR</span>
                        <span className="flex-grow border-t dark:border-gray-600"></span>
                    </div>

                    <p className="text-sm font-semibold text-center text-gray-700 dark:text-gray-300">Select your location manually</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="state-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                            <select id="state-select" value={selectedState} onChange={e => { setSelectedState(e.target.value); setSelectedCity(''); }} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-brand-gray-700">
                                <option value="" disabled>Select a state</option>
                                {INDIAN_STATES.map(state => <option key={state.code} value={state.code}>{state.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="city-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                            <select id="city-select" value={selectedCity} onChange={e => setSelectedCity(e.target.value)} disabled={!selectedState || availableCities.length === 0} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-brand-gray-700 disabled:bg-gray-100 dark:disabled:bg-gray-600">
                                <option value="" disabled>Select a city</option>
                                {availableCities.map(city => <option key={city} value={city}>{city}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-brand-gray-darker px-6 py-4 flex justify-end gap-4 rounded-b-xl">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
                    <button onClick={handleManualSelect} disabled={!selectedCity} className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark disabled:opacity-50">Set Location</button>
                </div>
            </div>
        </div>
    );
};

export default LocationModal;
