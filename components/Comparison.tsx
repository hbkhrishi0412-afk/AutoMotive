

import React, { useMemo } from 'react';
import type { Vehicle } from '../types';

interface ComparisonProps {
  vehicles: Vehicle[];
  onBack: () => void;
  onToggleCompare: (id: number) => void;
}

const specFields: (keyof Vehicle)[] = ['price', 'year', 'mileage', 'engine', 'transmission', 'fuelType', 'fuelEfficiency', 'exteriorColor', 'interiorColor'];
const specLabels: Record<keyof Vehicle, string> = {
    price: 'Price',
    year: 'Year',
    mileage: 'Mileage (kms)',
    engine: 'Engine',
    transmission: 'Transmission',
    fuelType: 'Fuel Type',
    fuelEfficiency: 'Fuel Efficiency',
    exteriorColor: 'Exterior Color',
    interiorColor: 'Interior Color',
    id: 'ID',
    category: 'Category',
    make: 'Make',
    model: 'Model',
    images: 'Images',
    features: 'Features',
    description: 'Description',
    sellerEmail: 'Seller Email',
    averageRating: 'Average Rating',
    ratingCount: 'Rating Count',
    status: 'Status',
    isFeatured: 'Featured',
    views: 'Views',
    inquiriesCount: 'Inquiries',
    isFlagged: 'Flagged',
};

const CheckIcon: React.FC = () => (
    <svg className="w-6 h-6 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
);

const XIcon: React.FC = () => (
    <svg className="w-6 h-6 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
);


const Comparison: React.FC<ComparisonProps> = ({ vehicles, onBack, onToggleCompare }) => {
  if (vehicles.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-brand-gray-dark rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Vehicle Comparison</h2>
        <p className="mt-4 text-gray-600 dark:text-gray-300">You haven't selected any vehicles to compare yet.</p>
        <p className="text-gray-500 dark:text-gray-400">Go to the listings to add up to 4 vehicles.</p>
        <button onClick={onBack} className="mt-6 bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-blue-dark transition-colors">
          &larr; Back to Listings
        </button>
      </div>
    );
  }

  // Find best values
  const minPrice = Math.min(...vehicles.map(v => v.price));
  const minMileage = Math.min(...vehicles.map(v => v.mileage));
  const maxYear = Math.max(...vehicles.map(v => v.year));

  const isBestValue = (key: keyof Vehicle, value: number) => {
    if (key === 'price' && value === minPrice) return true;
    if (key === 'mileage' && value === minMileage) return true;
    if (key === 'year' && value === maxYear) return true;
    return false;
  }
  
  const allFeatures = useMemo(() => {
    const featureSet = new Set<string>();
    vehicles.forEach(v => {
        v.features.forEach(feature => featureSet.add(feature));
    });
    return Array.from(featureSet).sort();
  }, [vehicles]);

  return (
    <div className="bg-white dark:bg-brand-gray-dark p-6 rounded-lg shadow-md animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Compare Vehicles</h1>
        <button onClick={onBack} className="bg-brand-gray dark:bg-gray-700 text-brand-gray-darker dark:text-gray-200 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
          &larr; Back to Listings
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <div className={`grid gap-x-4 items-start`} style={{ gridTemplateColumns: `150px repeat(${vehicles.length}, minmax(220px, 1fr))` }}>
          {/* Header Row: Images and Titles */}
          <div className="font-bold text-lg text-gray-700 sticky top-16 bg-white dark:bg-brand-gray-dark py-2 z-10"></div>
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className="text-center sticky top-16 bg-white dark:bg-brand-gray-dark py-2 z-10">
              <img src={vehicle.images[0]} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-40 object-cover rounded-lg mb-2" />
              <h3 className="font-bold text-lg dark:text-gray-100">{vehicle.year} {vehicle.make}</h3>
              <p className="text-md text-gray-600 dark:text-gray-300">{vehicle.model}</p>
              <button onClick={() => onToggleCompare(vehicle.id)} className="mt-2 text-sm text-red-500 hover:text-red-700">Remove</button>
            </div>
          ))}

          {/* Spacer row */}
          <div className="col-span-full h-4"></div>

          {/* Specifications Section */}
          {specFields.map((key, index) => (
            <React.Fragment key={String(key)}>
              <div className={`font-semibold text-gray-600 dark:text-gray-300 py-3 px-2 ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}`}>{specLabels[key]}</div>
              {vehicles.map(vehicle => {
                const value = vehicle[key];
                const isBest = typeof value === 'number' && isBestValue(key, value);
                return (
                  <div key={`${vehicle.id}-${String(key)}`} className={`py-3 px-2 flex items-center gap-2 dark:text-gray-200 ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''} ${isBest ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 font-bold' : ''}`}>
                     <span>
                        {typeof value === 'number' ? (key === 'price' ? `₹${value.toLocaleString('en-IN')}`: value.toLocaleString('en-IN')) : String(value)}
                     </span>
                     {isBest && (
                        <span className="text-xs font-semibold bg-green-200 text-green-900 px-2 py-0.5 rounded-full">
                           ⭐ Best
                        </span>
                     )}
                  </div>
                )
              })}
            </React.Fragment>
          ))}
          
          {/* Spacer & Title for Features */}
           <div className="col-span-full h-8"></div>
           <div className="col-span-full">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4 border-b dark:border-gray-700 pb-2">Feature Comparison</h2>
           </div>

          {/* Features Section */}
          {allFeatures.map((feature, index) => (
             <React.Fragment key={feature}>
                 <div className={`font-semibold text-gray-600 dark:text-gray-300 py-3 px-2 flex items-center ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}`}>{feature}</div>
                 {vehicles.map(vehicle => (
                    <div key={`${vehicle.id}-${feature}`} className={`py-3 flex items-center justify-center ${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : ''}`}>
                        {vehicle.features.includes(feature) ? <CheckIcon /> : <XIcon />}
                    </div>
                 ))}
             </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Comparison;