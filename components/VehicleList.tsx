import React, { useState, useMemo } from 'react';
import VehicleCard from './VehicleCard';
import type { Vehicle } from '../types';

interface VehicleListProps {
  vehicles: Vehicle[];
  onSelectVehicle: (vehicle: Vehicle) => void;
  isLoading: boolean;
  comparisonList: number[];
  onToggleCompare: (id: number) => void;
  onClearCompare: () => void;
  wishlist: number[];
  onToggleWishlist: (id: number) => void;
  isWishlistMode?: boolean;
}

const VehicleCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-brand-gray-dark rounded-lg shadow-lg overflow-hidden">
      <div className="w-full h-56 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
      <div className="p-6">
        <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2 animate-pulse"></div>
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 animate-pulse"></div>
        <div className="mt-4 flex flex-wrap gap-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

const sortOptions = {
  YEAR_DESC: 'Newest First',
  RATING_DESC: 'Rating: High to Low',
  PRICE_ASC: 'Price: Low to High',
  PRICE_DESC: 'Price: High to Low',
  MILEAGE_ASC: 'Mileage: Low to High',
};

const VehicleList: React.FC<VehicleListProps> = ({ vehicles, onSelectVehicle, isLoading, comparisonList, onToggleCompare, onClearCompare, wishlist, onToggleWishlist, isWishlistMode = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [makeFilter, setMakeFilter] = useState('');
  const [minPriceFilter, setMinPriceFilter] = useState('0');
  const [maxPriceFilter, setMaxPriceFilter] = useState('999999');
  const [yearFilter, setYearFilter] = useState('0');
  const [sortOrder, setSortOrder] = useState('YEAR_DESC');

  const priceOptions = useMemo(() => [20000, 30000, 40000, 50000, 60000, 75000, 100000], []);
  
  const uniqueYears = useMemo(() => {
      if (vehicles.length === 0) return [];
      return [...new Set(vehicles.map(v => v.year))].sort((a, b) => b - a);
  }, [vehicles]);
  
  const uniqueMakes = useMemo(() => {
      if (vehicles.length === 0) return [];
      return [...new Set(vehicles.map(v => v.make))].sort();
  }, [vehicles]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setMakeFilter('');
    setMinPriceFilter('0');
    setMaxPriceFilter('99999custom_sort_order9');
    setYearFilter('0');
    setSortOrder('YEAR_DESC');
    onClearCompare();
  };

  const processedVehicles = useMemo(() => {
    if (isWishlistMode) return vehicles; // No filtering/sorting on wishlist page

    const filtered = vehicles.filter(vehicle => {
        const searchLower = searchQuery.toLowerCase();
        const vehicleIdentifier = `${vehicle.make} ${vehicle.variant}`.toLowerCase();
        const matchesSearch = searchQuery === '' || vehicleIdentifier.includes(searchLower);
        
        const matchesMake = makeFilter === '' || vehicle.make === makeFilter;
        const matchesPrice = vehicle.price >= Number(minPriceFilter) && vehicle.price <= Number(maxPriceFilter);
        const matchesYear = Number(yearFilter) === 0 || vehicle.year === Number(yearFilter);
        return matchesSearch && matchesMake && matchesPrice && matchesYear;
    });

    const sorted = [...filtered].sort((a, b) => {
        // Prioritize featured vehicles
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;

        // Then apply user-selected sort order
        switch (sortOrder) {
            case 'RATING_DESC':
                return (b.averageRating || 0) - (a.averageRating || 0);
            case 'PRICE_ASC':
                return a.price - b.price;
            case 'PRICE_DESC':
                return b.price - a.price;
            case 'MILEAGE_ASC':
                return a.mileage - b.mileage;
            case 'YEAR_DESC':
            default:
                return b.year - a.year;
        }
    });

    return sorted;
  }, [vehicles, searchQuery, makeFilter, minPriceFilter, maxPriceFilter, yearFilter, sortOrder, isWishlistMode]);

  if (isWishlistMode) {
    return (
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 border-b dark:border-gray-700 pb-4">Your Wishlist</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => <VehicleCardSkeleton key={index} />)
          ) : processedVehicles.length > 0 ? (
            processedVehicles.map(vehicle => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onSelect={onSelectVehicle}
                onToggleCompare={onToggleCompare}
                isSelectedForCompare={comparisonList.includes(vehicle.id)}
                onToggleWishlist={onToggleWishlist}
                isInWishlist={wishlist.includes(vehicle.id)}
              />
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
      {/* Left Column: Filters (sticky) */}
      <aside className="lg:sticky top-24 self-start">
          <div className="bg-white dark:bg-brand-gray-dark p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Find Your Next Car</h2>
            
            <div className="flex flex-col gap-4">
                 <label htmlFor="search-filter" className="sr-only">Search Make & Variant</label>
                 <input
                     type="text"
                     id="search-filter"
                     placeholder="Search by make and variant..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full p-3 border border-brand-gray dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue-light focus:outline-none transition text-base bg-white dark:bg-brand-gray-darker dark:text-gray-200"
                 />
                
                {/* Make Filter */}
                <div>
                    <label htmlFor="make-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Make</label>
                    <select
                        id="make-filter"
                        value={makeFilter}
                        onChange={(e) => setMakeFilter(e.target.value)}
                        className="block w-full p-3 border border-brand-gray dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue-light focus:outline-none transition bg-white dark:bg-brand-gray-darker dark:text-gray-200"
                    >
                        <option value="">Any</option>
                        {uniqueMakes.map(make => <option key={make} value={make}>{make}</option>)}
                    </select>
                </div>
            
                {/* Min Price Filter */}
                <div>
                    <label htmlFor="min-price-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Min Price</label>
                    <select
                        id="min-price-filter"
                        value={minPriceFilter}
                        onChange={(e) => setMinPriceFilter(e.target.value)}
                        className="block w-full p-3 border border-brand-gray dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue-light focus:outline-none transition bg-white dark:bg-brand-gray-darker dark:text-gray-200"
                    >
                        <option value="0">Any</option>
                        {priceOptions.map(price => <option key={price} value={price}>${price.toLocaleString()}</option>)}
                    </select>
                </div>
                
                {/* Max Price Filter */}
                <div>
                    <label htmlFor="max-price-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Price</label>
                    <select
                        id="max-price-filter"
                        value={maxPriceFilter}
                        onChange={(e) => setMaxPriceFilter(e.target.value)}
                        className="block w-full p-3 border border-brand-gray dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue-light focus:outline-none transition bg-white dark:bg-brand-gray-darker dark:text-gray-200"
                    >
                        {priceOptions.map(price => <option key={price} value={price}>${price.toLocaleString()}</option>)}
                        <option value="999999">Any</option>
                    </select>
                </div>

                {/* Year Filter */}
                <div>
                    <label htmlFor="year-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                     <select
                        id="year-filter"
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="block w-full p-3 border border-brand-gray dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue-light focus:outline-none transition bg-white dark:bg-brand-gray-darker dark:text-gray-200"
                    >
                        <option value="0">Any</option>
                        {uniqueYears.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>

                {/* Sort Order */}
                <div>
                    <label htmlFor="sort-order" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort By</label>
                    <select
                        id="sort-order"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="block w-full p-3 border border-brand-gray dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue-light focus:outline-none transition bg-white dark:bg-brand-gray-darker dark:text-gray-200"
                    >
                        {Object.entries(sortOptions).map(([key, value]) => (
                            <option key={key} value={key}>{value}</option>
                        ))}
                    </select>
                </div>

                {/* Reset Button */}
                <div>
                     <button 
                        onClick={handleResetFilters}
                        className="w-full bg-brand-gray dark:bg-gray-600 text-brand-gray-darker dark:text-gray-200 font-bold py-3 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors mt-2"
                    >
                        Reset Filters
                    </button>
                </div>
            </div>
          </div>
      </aside>

      {/* Right Column: Vehicle Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, index) => <VehicleCardSkeleton key={index} />)
        ) : processedVehicles.length > 0 ? (
          processedVehicles.map(vehicle => (
            <VehicleCard 
              key={vehicle.id} 
              vehicle={vehicle} 
              onSelect={onSelectVehicle} 
              onToggleCompare={onToggleCompare}
              isSelectedForCompare={comparisonList.includes(vehicle.id)}
              onToggleWishlist={onToggleWishlist}
              isInWishlist={wishlist.includes(vehicle.id)}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12 bg-white dark:bg-brand-gray-dark rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200">No Vehicles Found</h3>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your filters to find your perfect car.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleList;