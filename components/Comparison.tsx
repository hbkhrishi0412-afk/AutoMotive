import React, { useMemo } from 'react';
import type { Vehicle } from '../types';

interface ComparisonProps {
  vehicles: Vehicle[];
  onBack: () => void;
  onToggleCompare: (id: number) => void;
}

// FIX: Added more fields for better comparison.
const specFields: (keyof Vehicle)[] = ['price', 'year', 'mileage', 'engine', 'transmission', 'fuelType', 'fuelEfficiency', 'color', 'sellerName', 'averageRating', 'sellerAverageRating'];
// FIX: Added missing properties `sellerAverageRating` and `sellerRatingCount` to satisfy `Record<keyof Vehicle, string>` type.
const specLabels: Record<keyof Vehicle, string> = {
    price: 'Price',
    year: 'Year',
    mileage: 'Mileage (kms)',
    engine: 'Engine',
    transmission: 'Transmission',
    fuelType: 'Fuel Type',
    fuelEfficiency: 'Fuel Efficiency',
    color: 'Color',
    id: 'ID',
    category: 'Category',
    make: 'Make',
    model: 'Model',
    variant: 'Variant',
    images: 'Images',
    features: 'Features',
    description: 'Description',
    sellerEmail: 'Seller Email',
    sellerName: 'Seller Name',
    averageRating: 'Vehicle Rating',
    ratingCount: 'Rating Count',
    status: 'Status',
    isFeatured: 'Featured',
    views: 'Views',
    inquiriesCount: 'Inquiries',
    isFlagged: 'Flagged',
    sellerAverageRating: 'Seller Rating',
    sellerRatingCount: 'Seller Rating Count',
};

const CheckIcon: React.FC = () => (
    <svg className="w-6 h-6 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
);

const XIcon: React.FC = () => (
    <svg className="w-6 h-6 text-red-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
);


const Comparison: React.FC<ComparisonProps> = ({ vehicles, onBack: onBackToHome, onToggleCompare }) => {
  if (vehicles.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft-lg">
        <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100">Vehicle Comparison</h2>
        <p className="mt-4 text-brand-gray-600 dark:text-brand-gray-300">You haven't selected any vehicles to compare yet.</p>
        <p className="text-brand-gray-500 dark:text-brand-gray-400">Go to the listings to add up to 4 vehicles.</p>
        <button onClick={onBackToHome} className="mt-6 bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-blue-dark transition-colors">
          &larr; Back to Home
        </button>
      </div>
    );
  }

  // Find best values
  const minPrice = Math.min(...vehicles.map(v => v.price));
  const minMileage = Math.min(...vehicles.map(v => v.mileage));
  const maxYear = Math.max(...vehicles.map(v => v.year));
  const maxAverageRating = Math.max(...vehicles.map(v => v.averageRating || 0));
  const maxSellerAverageRating = Math.max(...vehicles.map(v => v.sellerAverageRating || 0));

  const isBestValue = (key: keyof Vehicle, value: number) => {
    if (key === 'price' && value === minPrice) return true;
    if (key === 'mileage' && value === minMileage) return true;
    if (key === 'year' && value === maxYear) return true;
    if (key === 'averageRating' && value > 0 && value === maxAverageRating) return true;
    if (key === 'sellerAverageRating' && value > 0 && value === maxSellerAverageRating) return true;
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
    <div className="bg-white dark:bg-brand-gray-800 p-6 rounded-xl shadow-soft-lg animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-extrabold text-brand-gray-900 dark:text-brand-gray-100">Compare Vehicles</h1>
        <button onClick={onBackToHome} className="bg-brand-gray-100 dark:bg-brand-gray-700 text-brand-gray-800 dark:text-brand-gray-200 font-bold py-2 px-4 rounded-lg hover:bg-brand-gray-200 dark:hover:bg-brand-gray-600 transition-colors">
          &larr; Back to Home
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-brand-gray-300 dark:border-brand-gray-600">
              <th className="text-left font-bold text-lg text-brand-gray-700 p-4 sticky left-0 bg-white dark:bg-brand-gray-800">Feature</th>
              {vehicles.map(vehicle => (
                <th key={vehicle.id} className="p-4 min-w-[220px]">
                  <img src={vehicle.images[0]} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-40 object-cover rounded-lg mb-2" />
                  <h3 className="font-bold text-lg dark:text-brand-gray-100">{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.variant || ''}</h3>
                  <button onClick={() => onToggleCompare(vehicle.id)} className="mt-2 text-sm text-red-500 hover:text-red-700">Remove</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {specFields.map((key) => (
              <tr key={String(key)} className="border-b border-brand-gray-200 dark:border-brand-gray-700">
                <td className="font-semibold text-brand-gray-600 dark:text-brand-gray-300 p-4 sticky left-0 bg-white dark:bg-brand-gray-800">{specLabels[key]}</td>
                {vehicles.map(vehicle => {
                  const value = vehicle[key];
                  const isBest = typeof value === 'number' && isBestValue(key, value);
                  return (
                    <td key={`${vehicle.id}-${String(key)}`} className={`p-4 text-center dark:text-brand-gray-200 ${isBest ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                       <span className={`inline-flex items-center gap-2 ${isBest ? 'font-bold text-green-700 dark:text-green-300' : ''}`}>
                          {(() => {
                              if (value === undefined || value === null) return '-';
    
                              if (key === 'averageRating' || key === 'sellerAverageRating') {
                                  const countKey = key === 'averageRating' ? 'ratingCount' : 'sellerRatingCount';
                                  const count = vehicle[countKey] || 0;
                                  const rating = typeof value === 'number' ? value : 0;
                                  if (rating === 0) return 'N/A';
                                  return `${rating.toFixed(1)} (${count})`;
                              }
    
                              if (typeof value === 'number') {
                                  if (key === 'price') return `₹${value.toLocaleString('en-IN')}`;
                                  return value.toLocaleString('en-IN');
                              }
    
                              return String(value);
                          })()}
                          {isBest && (
                            <span className="text-xs font-semibold bg-green-200 text-green-900 px-2 py-0.5 rounded-full">
                              Best
                            </span>
                          )}
                       </span>
                    </td>
                  )
                })}
              </tr>
            ))}
            <tr className="h-4"></tr>
            <tr>
              <td colSpan={vehicles.length + 1} className="pt-6 pb-2">
                 <h2 className="text-2xl font-bold text-brand-gray-800 dark:text-brand-gray-100 border-b-2 border-brand-gray-300 dark:border-brand-gray-600 pb-2">Features</h2>
              </td>
            </tr>
            {allFeatures.map((feature) => (
               <tr key={feature} className="border-b border-brand-gray-200 dark:border-brand-gray-700">
                   <td className="font-semibold text-brand-gray-600 dark:text-brand-gray-300 p-4 sticky left-0 bg-white dark:bg-brand-gray-800">{feature}</td>
                   {vehicles.map(vehicle => (
                      <td key={`${vehicle.id}-${feature}`} className="p-4">
                          {vehicle.features.includes(feature) ? <CheckIcon /> : <XIcon />}
                      </td>
                   ))}
               </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Comparison;