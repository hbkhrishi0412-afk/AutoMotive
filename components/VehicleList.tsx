import React, { useState, useMemo } from 'react';
import VehicleCard from './VehicleCard';
import type { Vehicle } from '../types';
import { parseSearchQuery } from '../services/geminiService';

interface VehicleListProps {
  vehicles: Vehicle[];
  onSelectVehicle: (vehicle: Vehicle) => void;
  isLoading: boolean;
  comparisonList: number[];
  onToggleCompare: (id: number) => void;
  onClearCompare: () => void;
  wishlist: number[];
  onToggleWishlist: (id: number) => void;
  categoryTitle: string;
  isWishlistMode?: boolean;
}

const VehicleCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-brand-gray-dark rounded-lg shadow-lg overflow-hidden">
      <div className="w-full h-56 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
      <div className="p-6">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2 animate-pulse"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
      </div>
    </div>
);

const sortOptions = {
  YEAR_DESC: 'Newest First',
  RATING_DESC: 'Sort By Rating',
  PRICE_ASC: 'Price: Low to High',
  PRICE_DESC: 'Price: High to Low',
  MILEAGE_ASC: 'Mileage: Low to High',
};

const MIN_PRICE = 50000;
const MAX_PRICE = 5000000;

const VehicleList: React.FC<VehicleListProps> = ({ vehicles, onSelectVehicle, isLoading, comparisonList, onToggleCompare, onClearCompare, wishlist, onToggleWishlist, categoryTitle, isWishlistMode = false }) => {
  // AI Search State
  const [aiSearchQuery, setAiSearchQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  
  // Manual Filter State
  const [makeFilter, setMakeFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [priceRange, setPriceRange] = useState({ min: MIN_PRICE, max: MAX_PRICE });
  const [yearFilter, setYearFilter] = useState('0');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState('YEAR_DESC');

  const uniqueMakes = useMemo(() => [...new Set(vehicles.map(v => v.make))].sort(), [vehicles]);
  const availableModels = useMemo(() => {
    if (!makeFilter) return [];
    return [...new Set(vehicles.filter(v => v.make === makeFilter).map(v => v.model))].sort();
  }, [makeFilter, vehicles]);
  const uniqueYears = useMemo(() => [...new Set(vehicles.map(v => v.year))].sort((a, b) => b - a), [vehicles]);
  const allFeatures = useMemo(() => [...new Set(vehicles.flatMap(v => v.features))].sort(), [vehicles]);

  const handleAiSearch = async () => {
    if (!aiSearchQuery.trim()) return;
    setIsAiSearching(true);
    const parsedFilters = await parseSearchQuery(aiSearchQuery);
    
    // Apply parsed filters to the state
    if (parsedFilters.make && uniqueMakes.includes(parsedFilters.make)) {
      const newMake = parsedFilters.make;
      setMakeFilter(newMake);

      const modelsForMake = [...new Set(vehicles.filter(v => v.make === newMake).map(v => v.model))];
      if (parsedFilters.model && modelsForMake.includes(parsedFilters.model)) {
          setModelFilter(parsedFilters.model);
      } else {
          setModelFilter('');
      }
    } else if (parsedFilters.model && makeFilter) {
        const currentModels = [...new Set(vehicles.filter(v => v.make === makeFilter).map(v => v.model))];
        if (currentModels.includes(parsedFilters.model)) {
            setModelFilter(parsedFilters.model);
        }
    }
    
    if (parsedFilters.minPrice || parsedFilters.maxPrice) {
      setPriceRange({
        min: parsedFilters.minPrice || MIN_PRICE,
        max: parsedFilters.maxPrice || MAX_PRICE
      });
    }
    if (parsedFilters.features) {
        const validFeatures = parsedFilters.features.filter(f => allFeatures.includes(f));
        setSelectedFeatures(validFeatures);
    }
    
    setIsAiSearching(false);
  };
  
  const handleMakeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMakeFilter(e.target.value);
    setModelFilter(''); // Reset model when make changes
  };
  
  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev =>
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const val = parseInt(value, 10);
      setPriceRange(prev => {
          const newRange = { ...prev, [name]: val };
          // Ensure min is not greater than max
          if (newRange.min > newRange.max) {
            return name === 'min' ? { ...newRange, max: newRange.min } : { ...newRange, min: newRange.max };
          }
          return newRange;
      });
  };

  const handleResetFilters = () => {
    setAiSearchQuery('');
    setMakeFilter('');
    setModelFilter('');
    setPriceRange({ min: MIN_PRICE, max: MAX_PRICE });
    setYearFilter('0');
    setSelectedFeatures([]);
    setSortOrder('YEAR_DESC');
    onClearCompare();
  };

  const processedVehicles = useMemo(() => {
    const sourceVehicles = isWishlistMode 
      ? vehicles.filter(v => wishlist.includes(v.id)) 
      : vehicles;

    const filtered = sourceVehicles.filter(vehicle => {
        const matchesMake = !makeFilter || vehicle.make === makeFilter;
        const matchesModel = !modelFilter || vehicle.model === modelFilter;
        const matchesPrice = vehicle.price >= priceRange.min && vehicle.price <= priceRange.max;
        const matchesYear = Number(yearFilter) === 0 || vehicle.year === Number(yearFilter);
        const matchesFeatures = selectedFeatures.every(feature => vehicle.features.includes(feature));
        
        return matchesMake && matchesModel && matchesPrice && matchesYear && matchesFeatures;
    });

    return [...filtered].sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        switch (sortOrder) {
            case 'RATING_DESC': return (b.averageRating || 0) - (a.averageRating || 0);
            case 'PRICE_ASC': return a.price - b.price;
            case 'PRICE_DESC': return b.price - a.price;
            case 'MILEAGE_ASC': return a.mileage - b.mileage;
            default: return b.year - a.year;
        }
    });
  }, [vehicles, makeFilter, modelFilter, priceRange, yearFilter, selectedFeatures, sortOrder, isWishlistMode, wishlist]);
  
  if (isWishlistMode) {
     return (
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 border-b dark:border-gray-700 pb-4">{categoryTitle}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => <VehicleCardSkeleton key={index} />)
          ) : processedVehicles.length > 0 ? (
            processedVehicles.map(vehicle => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} onSelect={onSelectVehicle} onToggleCompare={onToggleCompare} isSelectedForCompare={comparisonList.includes(vehicle.id)} onToggleWishlist={onToggleWishlist} isInWishlist={wishlist.includes(vehicle.id)} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-white dark:bg-brand-gray-dark rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">Your Wishlist is Empty</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Click the heart icon on any vehicle to save it here.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8">
      <aside className="lg:sticky top-24 self-start space-y-6">
          <div className="bg-white dark:bg-brand-gray-dark p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Find Your Next Car</h2>
            <div className="flex flex-col gap-4">
                 <label htmlFor="make-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Make</label>
                 <select id="make-filter" value={makeFilter} onChange={handleMakeChange} className="block w-full p-3 border border-brand-gray dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue-light focus:outline-none transition bg-white dark:bg-brand-gray-darker dark:text-gray-200">
                     <option value="">Any</option>
                     {uniqueMakes.map(make => <option key={make} value={make}>{make}</option>)}
                 </select>
                
                 <label htmlFor="model-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Model</label>
                 <select 
                    id="model-filter" 
                    value={modelFilter} 
                    onChange={(e) => setModelFilter(e.target.value)} 
                    disabled={!makeFilter || availableModels.length === 0}
                    className="block w-full p-3 border border-brand-gray dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue-light focus:outline-none transition bg-white dark:bg-brand-gray-darker dark:text-gray-200 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                 >
                     <option value="">Any</option>
                     {availableModels.map(model => <option key={model} value={model}>{model}</option>)}
                 </select>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price Range</label>
                  <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400">
                    <span>₹{priceRange.min.toLocaleString('en-IN')}</span>
                    <span>₹{priceRange.max.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="relative h-8 flex items-center">
                    <input name="min" type="range" min={MIN_PRICE} max={MAX_PRICE} step="10000" value={priceRange.min} onChange={handlePriceChange} className="absolute w-full h-1 bg-transparent appearance-none pointer-events-none z-10 slider-thumb" />
                    <input name="max" type="range" min={MIN_PRICE} max={MAX_PRICE} step="10000" value={priceRange.max} onChange={handlePriceChange} className="absolute w-full h-1 bg-transparent appearance-none pointer-events-none z-10 slider-thumb" />
                    <div className="relative w-full h-1 bg-gray-200 dark:bg-gray-600 rounded-full">
                        <div className="absolute h-1 bg-brand-blue rounded-full" style={{ left: `${((priceRange.min - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100}%`, right: `${100 - ((priceRange.max - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100}%` }}></div>
                    </div>
                  </div>
                  <style>{`.slider-thumb::-webkit-slider-thumb { @apply bg-brand-blue h-4 w-4 rounded-full border-2 border-white dark:border-gray-800 shadow cursor-pointer pointer-events-auto; -webkit-appearance: none; }`}</style>
                </div>

                 <label htmlFor="year-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Year</label>
                 <select id="year-filter" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="block w-full p-3 border border-brand-gray dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue-light focus:outline-none transition bg-white dark:bg-brand-gray-darker dark:text-gray-200">
                     <option value="0">Any</option>
                     {uniqueYears.map(year => <option key={year} value={year}>{year}</option>)}
                 </select>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Features</label>
                  <div className="max-h-40 overflow-y-auto space-y-2 p-2 border dark:border-gray-600 rounded-md">
                    {allFeatures.map(feature => (
                      <label key={feature} className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" checked={selectedFeatures.includes(feature)} onChange={() => handleFeatureToggle(feature)} className="h-4 w-4 text-brand-blue rounded border-gray-300 focus:ring-brand-blue-light"/>
                        <span className="text-sm text-gray-800 dark:text-gray-200">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>

                 <button onClick={handleResetFilters} className="w-full bg-brand-gray dark:bg-gray-600 text-brand-gray-darker dark:text-gray-200 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors mt-2">Reset Filters</button>
            </div>
          </div>
      </aside>

      <main className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{categoryTitle}</h1>
        <div className="bg-white dark:bg-brand-gray-dark p-4 rounded-lg shadow-md">
            <label htmlFor="ai-search" className="text-lg font-bold text-gray-800 dark:text-gray-100">✨ Intelligent Search</label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Describe what you're looking for, e.g., "a white Tata Nexon under ₹15 lakhs with a sunroof"</p>
            <div className="flex gap-2 relative">
                <input
                    type="text"
                    id="ai-search"
                    placeholder="Let our AI find your perfect car..."
                    value={aiSearchQuery}
                    onChange={(e) => setAiSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                    className="w-full p-3 border border-brand-gray dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue-light focus:outline-none transition text-base bg-white dark:bg-brand-gray-darker dark:text-gray-200"
                />
                <button onClick={handleAiSearch} disabled={isAiSearching} className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-blue-dark transition-colors disabled:bg-gray-400 disabled:cursor-wait">
                    {isAiSearching ? '...' : 'Search'}
                </button>
            </div>
        </div>

        <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">Showing <span className="font-bold">{processedVehicles.length}</span> of <span className="font-bold">{vehicles.length}</span> vehicles</p>
            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="p-2 border border-brand-gray dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue-light focus:outline-none transition bg-white dark:bg-brand-gray-darker dark:text-gray-200">
                {Object.entries(sortOptions).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
            </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {isLoading || isAiSearching ? (
            Array.from({ length: 6 }).map((_, index) => <VehicleCardSkeleton key={index} />)
          ) : processedVehicles.length > 0 ? (
            processedVehicles.map(vehicle => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} onSelect={onSelectVehicle} onToggleCompare={onToggleCompare} isSelectedForCompare={comparisonList.includes(vehicle.id)} onToggleWishlist={onToggleWishlist} isInWishlist={wishlist.includes(vehicle.id)} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-white dark:bg-brand-gray-dark rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">No Vehicles Found</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your filters or using the AI search to find your perfect car.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default VehicleList;