import React, { useState, useMemo, useRef, useEffect } from 'react';
import VehicleCard from './VehicleCard';
import type { Vehicle, VehicleCategory } from '../types';
import { VehicleCategory as CategoryEnum } from '../types';
import { parseSearchQuery, getSearchSuggestions } from '../services/geminiService';
import QuickViewModal from './QuickViewModal';

interface VehicleListProps {
  vehicles: Vehicle[];
  onSelectVehicle: (vehicle: Vehicle) => void;
  isLoading: boolean;
  comparisonList: number[];
  onToggleCompare: (id: number) => void;
  onClearCompare: () => void;
  wishlist: number[];
  onToggleWishlist: (id: number) => void;
  categoryTitle?: string;
  initialCategory?: VehicleCategory | 'ALL';
  initialSearchQuery?: string;
  isWishlistMode?: boolean;
  onViewSellerProfile: (sellerEmail: string) => void;
}

const ITEMS_PER_PAGE = 9;

const VehicleCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft-lg overflow-hidden">
      <div className="w-full h-56 bg-brand-gray-200 dark:bg-brand-gray-700 animate-pulse"></div>
      <div className="p-5">
        <div className="flex justify-between items-start">
          <div className="h-6 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-3/5 mb-2 animate-pulse"></div>
          <div className="h-6 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-1/5 mb-2 animate-pulse"></div>
        </div>
        <div className="h-4 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-px bg-brand-gray-200 dark:bg-brand-gray-700 my-4"></div>
        <div className="grid grid-cols-3 gap-2">
           <div className="h-5 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-full animate-pulse"></div>
           <div className="h-5 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-full animate-pulse"></div>
           <div className="h-5 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-full animate-pulse"></div>
        </div>
        <div className="flex justify-between items-center mt-6">
           <div className="h-8 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-2/5 animate-pulse"></div>
           <div className="h-8 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-1/4 animate-pulse"></div>
        </div>
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

const Pagination: React.FC<{ currentPage: number; totalPages: number; onPageChange: (page: number) => void; }> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="flex justify-center items-center space-x-2 mt-8">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 rounded-md bg-white dark:bg-brand-gray-700 disabled:opacity-50">Prev</button>
      {pageNumbers.map(number => (
        <button key={number} onClick={() => onPageChange(number)} className={`px-4 py-2 rounded-md ${currentPage === number ? 'bg-brand-blue text-white' : 'bg-white dark:bg-brand-gray-700'}`}>{number}</button>
      ))}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 rounded-md bg-white dark:bg-brand-gray-700 disabled:opacity-50">Next</button>
    </nav>
  );
};

const VehicleList: React.FC<VehicleListProps> = ({ vehicles, onSelectVehicle, isLoading, comparisonList, onToggleCompare, onClearCompare, wishlist, onToggleWishlist, categoryTitle, initialCategory = 'ALL', initialSearchQuery = '', isWishlistMode = false, onViewSellerProfile }) => {
  const [aiSearchQuery, setAiSearchQuery] = useState(initialSearchQuery);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [makeFilter, setMakeFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [priceRange, setPriceRange] = useState({ min: MIN_PRICE, max: MAX_PRICE });
  const [yearFilter, setYearFilter] = useState('0');
  const [colorFilter, setColorFilter] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [featureSearch, setFeatureSearch] = useState('');
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('YEAR_DESC');
  const [quickViewVehicle, setQuickViewVehicle] = useState<Vehicle | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<VehicleCategory | 'ALL'>(initialCategory);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterVisible, setIsFilterVisible] = useState(true);

  const aiSearchRef = useRef<HTMLDivElement>(null);
  const featuresFilterRef = useRef<HTMLDivElement>(null);
  const featuresSearchInputRef = useRef<HTMLInputElement>(null);
  const suggestionDebounceRef = useRef<number | null>(null);

  const uniqueMakes = useMemo(() => [...new Set(vehicles.map(v => v.make))].sort(), [vehicles]);
  const availableModels = useMemo(() => {
    if (!makeFilter) return [];
    return [...new Set(vehicles.filter(v => v.make === makeFilter).map(v => v.model))].sort();
  }, [makeFilter, vehicles]);
  const uniqueYears = useMemo(() => [...new Set(vehicles.map(v => v.year))].sort((a, b) => b - a), [vehicles]);
  const uniqueColors = useMemo(() => [...new Set(vehicles.map(v => v.color))].sort(), [vehicles]);
  const allFeatures = useMemo(() => [...new Set(vehicles.flatMap(v => v.features))].sort(), [vehicles]);
  
  const filteredFeatures = useMemo(() => {
      return allFeatures.filter(feature => feature.toLowerCase().includes(featureSearch.toLowerCase()));
  }, [allFeatures, featureSearch]);

  const handleAiSearch = async (queryOverride?: string) => {
    const query = typeof queryOverride === 'string' ? queryOverride : aiSearchQuery;
    if (!query.trim()) return;

    setShowSuggestions(false);
    setIsAiSearching(true);
    const parsedFilters = await parseSearchQuery(query);
    
    if (parsedFilters.make && uniqueMakes.includes(parsedFilters.make)) {
      const newMake = parsedFilters.make;
      setMakeFilter(newMake);
      const modelsForMake = [...new Set(vehicles.filter(v => v.make === newMake).map(v => v.model))];
      if (parsedFilters.model && modelsForMake.includes(parsedFilters.model)) setModelFilter(parsedFilters.model);
      else setModelFilter('');
    } else if (parsedFilters.model && makeFilter) {
        const currentModels = [...new Set(vehicles.filter(v => v.make === makeFilter).map(v => v.model))];
        if (currentModels.includes(parsedFilters.model)) setModelFilter(parsedFilters.model);
    }
    
    if (parsedFilters.minPrice || parsedFilters.maxPrice) {
      setPriceRange({ min: parsedFilters.minPrice || MIN_PRICE, max: parsedFilters.maxPrice || MAX_PRICE });
    }
    if (parsedFilters.features) {
        const validFeatures = parsedFilters.features.filter(f => allFeatures.includes(f));
        setSelectedFeatures(validFeatures);
    }
    
    setIsAiSearching(false);
    setCurrentPage(1);
  };
  
  useEffect(() => {
      if (initialSearchQuery) {
          handleAiSearch(initialSearchQuery);
      }
  }, [initialSearchQuery]);

  useEffect(() => {
    setCategoryFilter(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (aiSearchRef.current && !aiSearchRef.current.contains(event.target as Node)) setShowSuggestions(false);
        if (featuresFilterRef.current && !featuresFilterRef.current.contains(event.target as Node)) setIsFeaturesOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        if (suggestionDebounceRef.current) clearTimeout(suggestionDebounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (isFeaturesOpen) {
        setTimeout(() => featuresSearchInputRef.current?.focus(), 0);
    }
  }, [isFeaturesOpen]);

  const handleAiQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setAiSearchQuery(query);

      if (suggestionDebounceRef.current) clearTimeout(suggestionDebounceRef.current);

      if (!query.trim()) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
      }

      suggestionDebounceRef.current = window.setTimeout(async () => {
          const vehicleContext = vehicles.map(v => ({ make: v.make, model: v.model, features: v.features }));
          const fetchedSuggestions = await getSearchSuggestions(query, vehicleContext);
          setSuggestions(fetchedSuggestions);
          setShowSuggestions(fetchedSuggestions.length > 0);
      }, 300);
  };

  const handleSuggestionClick = (suggestion: string) => {
      setAiSearchQuery(suggestion);
      setSuggestions([]);
      setShowSuggestions(false);
      handleAiSearch(suggestion);
  };
  
  const handleMakeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMakeFilter(e.target.value);
    setModelFilter('');
  };
  
  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev => prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]);
  };
  
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const val = parseInt(value, 10);
      setPriceRange(prev => {
          const newRange = { ...prev, [name]: val };
          if (newRange.min > newRange.max) {
            return name === 'min' ? { ...newRange, max: newRange.min } : { ...newRange, min: newRange.max };
          }
          return newRange;
      });
  };

  const handleResetFilters = () => {
    setAiSearchQuery(''); setCategoryFilter('ALL'); setMakeFilter(''); setModelFilter('');
    setPriceRange({ min: MIN_PRICE, max: MAX_PRICE }); setYearFilter('0'); setColorFilter('');
    setSelectedFeatures([]); setFeatureSearch(''); setSortOrder('YEAR_DESC'); onClearCompare(); setCurrentPage(1);
  };

  const processedVehicles = useMemo(() => {
    setCurrentPage(1);
    const sourceVehicles = isWishlistMode ? vehicles.filter(v => wishlist.includes(v.id)) : vehicles;

    const filtered = sourceVehicles.filter(vehicle => {
        const matchesCategory = categoryFilter === 'ALL' || vehicle.category === categoryFilter;
        const matchesMake = !makeFilter || vehicle.make === makeFilter;
        const matchesModel = !modelFilter || vehicle.model === modelFilter;
        const matchesPrice = vehicle.price >= priceRange.min && vehicle.price <= priceRange.max;
        const matchesYear = Number(yearFilter) === 0 || vehicle.year === Number(yearFilter);
        const matchesColor = !colorFilter || vehicle.color === colorFilter;
        const matchesFeatures = selectedFeatures.every(feature => vehicle.features.includes(feature));
        
        return matchesCategory && matchesMake && matchesModel && matchesPrice && matchesYear && matchesFeatures && matchesColor;
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
  }, [vehicles, categoryFilter, makeFilter, modelFilter, priceRange, yearFilter, selectedFeatures, sortOrder, isWishlistMode, wishlist, colorFilter]);
  
  const totalPages = Math.ceil(processedVehicles.length / ITEMS_PER_PAGE);
  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedVehicles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [processedVehicles, currentPage]);

  if (isWishlistMode) {
     return (
      <div className="animate-fade-in container mx-auto px-4 py-8">
        <h1 className="text-4xl font-extrabold text-brand-gray-800 dark:text-brand-gray-100 mb-6 border-b border-brand-gray-200 dark:border-brand-gray-700 pb-4">{categoryTitle}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => <VehicleCardSkeleton key={index} />)
          ) : processedVehicles.length > 0 ? (
            processedVehicles.map(vehicle => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} onSelect={onSelectVehicle} onToggleCompare={onToggleCompare} isSelectedForCompare={comparisonList.includes(vehicle.id)} onToggleWishlist={onToggleWishlist} isInWishlist={wishlist.includes(vehicle.id)} isCompareDisabled={!comparisonList.includes(vehicle.id) && comparisonList.length >= 4} onViewSellerProfile={onViewSellerProfile} onQuickView={setQuickViewVehicle} />
            ))
          ) : (
            <div className="col-span-full text-center py-16 bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft-lg">
              <h3 className="text-xl font-semibold text-brand-gray-700 dark:text-brand-gray-200">Your Wishlist is Empty</h3>
              <p className="text-brand-gray-500 dark:text-brand-gray-400 mt-2">Click the heart icon on any vehicle to save it here.</p>
            </div>
          )}
        </div>
        <QuickViewModal vehicle={quickViewVehicle} onClose={() => setQuickViewVehicle(null)} onSelectVehicle={onSelectVehicle} onToggleCompare={onToggleCompare} onToggleWishlist={onToggleWishlist} comparisonList={comparisonList} wishlist={wishlist} />
      </div>
    );
  }

  const formElementClass = "block w-full p-3 border border-brand-gray-300 dark:border-brand-gray-600 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-brand-blue focus:outline-none transition bg-brand-gray-50 dark:bg-brand-gray-800 dark:text-gray-200 disabled:bg-brand-gray-200 dark:disabled:bg-brand-gray-700 disabled:cursor-not-allowed";

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 container mx-auto px-4 py-8">
        <aside className={`lg:sticky top-24 self-start space-y-6 transition-all duration-300 ${isFilterVisible ? 'w-[300px] opacity-100' : 'w-0 opacity-0 -translate-x-full hidden lg:block'}`}>
            <div className={`bg-white dark:bg-brand-gray-800 p-6 rounded-xl shadow-soft-lg ${isFilterVisible ? 'block' : 'hidden'}`}>
              <h2 className="text-xl font-bold text-brand-gray-800 dark:text-brand-gray-100 mb-4">Filters</h2>
              <div className="space-y-4">
                  <div>
                      <label htmlFor="category-select" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Category</label>
                      <select id="category-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as VehicleCategory | 'ALL')} className={formElementClass}>
                          <option value="ALL">All Categories</option>
                          {Object.values(CategoryEnum).map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                      </select>
                  </div>
                  <div>
                      <label htmlFor="make-filter" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Make</label>
                      <select id="make-filter" value={makeFilter} onChange={handleMakeChange} className={formElementClass}>
                          <option value="">Any Make</option>
                          {uniqueMakes.map(make => <option key={make} value={make}>{make}</option>)}
                      </select>
                  </div>
                  
                  <div>
                      <label htmlFor="model-filter" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Model</label>
                      <select id="model-filter" value={modelFilter} onChange={(e) => setModelFilter(e.target.value)} disabled={!makeFilter || availableModels.length === 0} className={formElementClass}>
                          <option value="">Any Model</option>
                          {availableModels.map(model => <option key={model} value={model}>{model}</option>)}
                      </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-2">Price Range</label>
                    <div className="flex justify-between items-center text-xs text-brand-gray-600 dark:text-brand-gray-400">
                      <span>₹{priceRange.min.toLocaleString('en-IN')}</span>
                      <span>₹{priceRange.max.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="relative h-8 flex items-center">
                      <input name="min" type="range" min={MIN_PRICE} max={MAX_PRICE} step="10000" value={priceRange.min} onChange={handlePriceChange} className="absolute w-full h-1.5 bg-transparent appearance-none pointer-events-none z-10 slider-thumb" />
                      <input name="max" type="range" min={MIN_PRICE} max={MAX_PRICE} step="10000" value={priceRange.max} onChange={handlePriceChange} className="absolute w-full h-1.5 bg-transparent appearance-none pointer-events-none z-10 slider-thumb" />
                      <div className="relative w-full h-1.5 bg-brand-gray-200 dark:bg-brand-gray-600 rounded-full">
                          <div className="absolute h-1.5 bg-brand-blue rounded-full" style={{ left: `${((priceRange.min - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100}%`, right: `${100 - ((priceRange.max - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100}%` }}></div>
                      </div>
                    </div>
                    <style>{`
                      .slider-thumb { -webkit-appearance: none; appearance: none; background-color: transparent; pointer-events: none; }
                      .slider-thumb::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; background-color: #007AFF; border: 3px solid white; box-shadow: 0 0 0 1px #9CA3AF; border-radius: 50%; cursor: pointer; pointer-events: auto; transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; }
                      html.dark .slider-thumb::-webkit-slider-thumb { border-color: #1F2937; box-shadow: 0 0 0 1px #4B5563; }
                      .slider-thumb:hover::-webkit-slider-thumb, .slider-thumb:focus::-webkit-slider-thumb { transform: scale(1.15); box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.3); }
                      .slider-thumb::-moz-range-thumb { width: 20px; height: 20px; background-color: #007AFF; border: 3px solid white; box-shadow: 0 0 0 1px #9CA3AF; border-radius: 50%; cursor: pointer; pointer-events: auto; transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; }
                      html.dark .slider-thumb::-moz-range-thumb { border-color: #1F2937; box-shadow: 0 0 0 1px #4B5563; }
                      .slider-thumb:hover::-moz-range-thumb, .slider-thumb:focus::-moz-range-thumb { transform: scale(1.15); box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.3); }
                    `}</style>
                  </div>
                  
                  <div>
                    <label htmlFor="year-filter" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Year</label>
                    <select id="year-filter" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className={formElementClass}>
                        <option value="0">Any Year</option>
                        {uniqueYears.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="color-filter" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Color</label>
                    <select id="color-filter" value={colorFilter} onChange={(e) => setColorFilter(e.target.value)} className={formElementClass}>
                        <option value="">Any Color</option>
                        {uniqueColors.map(color => <option key={color} value={color}>{color}</option>)}
                    </select>
                  </div>
                  
                  <div className="relative" ref={featuresFilterRef}>
                    <label htmlFor="features-filter-button" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Features</label>
                    <button id="features-filter-button" type="button" onClick={() => setIsFeaturesOpen(prev => !prev)} className={`${formElementClass} flex justify-between items-center text-left min-h-[50px]`}>
                        <div className="flex flex-wrap gap-1 items-center">
                            {selectedFeatures.length > 0 ? ( selectedFeatures.slice(0, 2).map(feature => ( <span key={feature} className="bg-brand-blue text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1.5">{feature} <button type="button" onClick={(e) => { e.stopPropagation(); handleFeatureToggle(feature); }} className="bg-white/20 hover:bg-white/40 rounded-full h-4 w-4 flex items-center justify-center text-white" aria-label={`Remove ${feature}`}>&times;</button></span>)) ) : ( <span className="text-brand-gray-500 dark:text-brand-gray-400">Select features...</span> )}
                            {selectedFeatures.length > 2 && ( <span className="text-xs font-semibold text-brand-gray-500 dark:text-brand-gray-400">+{selectedFeatures.length - 2} more</span> )}
                        </div>
                        <svg className={`w-5 h-5 text-brand-gray-400 transition-transform flex-shrink-0 ${isFeaturesOpen ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {isFeaturesOpen && (
                        <div className="absolute top-full mt-2 w-full bg-white dark:bg-brand-gray-700 rounded-lg shadow-soft-xl border border-brand-gray-200 dark:border-brand-gray-600 z-20 overflow-hidden animate-fade-in">
                            <div className="p-2"><input ref={featuresSearchInputRef} type="text" placeholder="Search features..." value={featureSearch} onChange={e => setFeatureSearch(e.target.value)} className="block w-full p-2 border border-brand-gray-300 dark:border-brand-gray-500 rounded-md bg-white dark:bg-brand-gray-800 text-sm focus:ring-2 focus:ring-brand-blue focus:outline-none" /></div>
                            <div className="max-h-48 overflow-y-auto">
                                {filteredFeatures.map(feature => ( <label key={feature} className="flex items-center space-x-3 cursor-pointer group p-3 transition-colors hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600"><input type="checkbox" checked={selectedFeatures.includes(feature)} onChange={() => handleFeatureToggle(feature)} className="h-4 w-4 text-brand-blue rounded border-brand-gray-300 dark:border-brand-gray-500 focus:ring-brand-blue bg-transparent" /><span className="text-sm text-brand-gray-800 dark:text-brand-gray-200">{feature}</span></label> ))}
                                {filteredFeatures.length === 0 && ( <p className="p-3 text-sm text-center text-brand-gray-500 dark:text-brand-gray-400">No features found.</p> )}
                            </div>
                        </div>
                    )}
                  </div>
                   <button onClick={handleResetFilters} className="w-full bg-brand-gray-200 dark:bg-brand-gray-700 text-brand-gray-800 dark:text-brand-gray-200 font-bold py-3 px-4 rounded-lg hover:bg-brand-gray-300 dark:hover:bg-brand-gray-600 transition-colors mt-2">Reset Filters</button>
              </div>
            </div>
        </aside>

        <main className="space-y-6">
          <h1 className="text-4xl font-extrabold text-brand-gray-800 dark:text-brand-gray-100">Browse Vehicles</h1>
          <div className="bg-white dark:bg-brand-gray-800 p-4 rounded-xl shadow-soft-lg">
              <label htmlFor="ai-search" className="text-lg font-bold text-brand-gray-800 dark:text-brand-gray-100">✨ Intelligent Search</label>
              <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 mb-2">Describe what you're looking for, e.g., "a white Tata Nexon under ₹15 lakhs with a sunroof"</p>
              <div className="relative" ref={aiSearchRef}>
                  <div className="flex gap-2">
                      <input type="text" id="ai-search" placeholder="Let our AI find your perfect vehicle..." value={aiSearchQuery} onChange={handleAiQueryChange} onFocus={() => setShowSuggestions(suggestions.length > 0)} onKeyDown={(e) => { if (e.key === 'Enter') handleAiSearch(); }} autoComplete="off" className={formElementClass} />
                      <button onClick={() => handleAiSearch()} disabled={isAiSearching} className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-blue-dark transition-colors disabled:bg-brand-gray-400 disabled:cursor-wait">{isAiSearching ? '...' : 'Search'}</button>
                  </div>
                  {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full mt-2 w-full bg-white dark:bg-brand-gray-700 rounded-lg shadow-soft-xl border border-brand-gray-200 dark:border-brand-gray-600 z-10 overflow-hidden"><ul className="divide-y divide-brand-gray-100 dark:divide-brand-gray-600">{suggestions.map((suggestion, index) => ( <li key={index}><button onClick={() => handleSuggestionClick(suggestion)} className="w-full text-left px-4 py-2 text-brand-gray-800 dark:text-brand-gray-200 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 transition-colors">{suggestion}</button></li>))}</ul></div>
                  )}
              </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className='flex items-center gap-2'>
                <button onClick={() => setIsFilterVisible(prev => !prev)} className="p-2 rounded-md bg-white dark:bg-brand-gray-700 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" /></svg>
                </button>
                <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">Showing <span className="font-bold">{paginatedVehicles.length}</span> of <span className="font-bold">{processedVehicles.length}</span> results</p>
              </div>
              <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={`${formElementClass} w-auto text-sm`}>
                  {Object.entries(sortOptions).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
              </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {isLoading || isAiSearching ? (
              Array.from({ length: 6 }).map((_, index) => <VehicleCardSkeleton key={index} />)
            ) : paginatedVehicles.length > 0 ? (
              paginatedVehicles.map(vehicle => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} onSelect={onSelectVehicle} onToggleCompare={onToggleCompare} isSelectedForCompare={comparisonList.includes(vehicle.id)} onToggleWishlist={onToggleWishlist} isInWishlist={wishlist.includes(vehicle.id)} isCompareDisabled={!comparisonList.includes(vehicle.id) && comparisonList.length >= 4} onViewSellerProfile={onViewSellerProfile} onQuickView={setQuickViewVehicle} />
              ))
            ) : (
              <div className="col-span-full text-center py-16 bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft-lg">
                <h3 className="text-xl font-semibold text-brand-gray-700 dark:text-brand-gray-200">No Vehicles Found</h3>
                <p className="text-brand-gray-500 dark:text-brand-gray-400 mt-2">Try adjusting your filters or using the AI search to find your perfect vehicle.</p>
              </div>
            )}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </main>
      </div>
      <QuickViewModal vehicle={quickViewVehicle} onClose={() => setQuickViewVehicle(null)} onSelectVehicle={onSelectVehicle} onToggleCompare={onToggleCompare} onToggleWishlist={onToggleWishlist} comparisonList={comparisonList} wishlist={wishlist} />
    </>
  );
};

export default VehicleList;
