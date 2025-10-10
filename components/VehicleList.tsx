import React, { useState, useMemo, useRef, useEffect } from 'react';
import VehicleCard from './VehicleCard';
import type { Vehicle, VehicleCategory } from '../types';
import { VehicleCategory as CategoryEnum } from '../types';
import { parseSearchQuery, getSearchSuggestions } from '../services/geminiService';
import QuickViewModal from './QuickViewModal';
import VehicleTile from './VehicleTile';
import VehicleTileSkeleton from './VehicleTileSkeleton';
import { INDIAN_STATES, FUEL_TYPES } from '../constants';

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

const ITEMS_PER_PAGE = 12;

const VehicleCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft-lg overflow-hidden">
      <div className="w-full h-40 sm:h-56 bg-brand-gray-200 dark:bg-brand-gray-700 animate-pulse"></div>
      <div className="p-3 sm:p-5">
        <div className="flex justify-between items-start">
          <div className="h-5 sm:h-6 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-3/5 mb-2 animate-pulse"></div>
          <div className="h-5 sm:h-6 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-1/5 mb-2 animate-pulse"></div>
        </div>
        <div className="h-3 sm:h-4 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-px bg-brand-gray-200 dark:bg-brand-gray-700 my-3 sm:my-4"></div>
        <div className="grid grid-cols-2 gap-2">
           <div className="h-4 sm:h-5 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-full animate-pulse"></div>
           <div className="h-4 sm:h-5 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-full animate-pulse"></div>
           <div className="h-4 sm:h-5 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-full animate-pulse"></div>
           <div className="h-4 sm:h-5 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-full animate-pulse"></div>
        </div>
        <div className="flex justify-between items-center mt-4 sm:mt-6">
           <div className="h-7 sm:h-8 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-2/5 animate-pulse"></div>
           <div className="h-5 sm:h-6 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-1/4 animate-pulse"></div>
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
const MIN_MILEAGE = 0;
const MAX_MILEAGE = 200000;

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
  const [mileageRange, setMileageRange] = useState({ min: MIN_MILEAGE, max: MAX_MILEAGE });
  const [fuelTypeFilter, setFuelTypeFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('0');
  const [colorFilter, setColorFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [featureSearch, setFeatureSearch] = useState('');
  const [isFeaturesOpen, setIsFeaturesOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('YEAR_DESC');
  const [quickViewVehicle, setQuickViewVehicle] = useState<Vehicle | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<VehicleCategory | 'ALL'>(initialCategory);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDesktopFilterVisible, setIsDesktopFilterVisible] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'tile'>('grid');

  // Mobile modal state
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [tempFilters, setTempFilters] = useState({
    categoryFilter, makeFilter, modelFilter, priceRange, yearFilter, colorFilter, stateFilter, selectedFeatures, featureSearch: '', mileageRange, fuelTypeFilter
  });
  const [isMobileFeaturesOpen, setIsMobileFeaturesOpen] = useState(false);

  const aiSearchRef = useRef<HTMLDivElement>(null);
  const featuresFilterRef = useRef<HTMLDivElement>(null);
  const mobileFeaturesFilterRef = useRef<HTMLDivElement>(null);
  const featuresSearchInputRef = useRef<HTMLInputElement>(null);
  const suggestionDebounceRef = useRef<number | null>(null);

  const uniqueMakes = useMemo(() => [...new Set(vehicles.map(v => v.make))].sort(), [vehicles]);
  const availableModels = useMemo(() => {
    if (!makeFilter) return [];
    return [...new Set(vehicles.filter(v => v.make === makeFilter).map(v => v.model))].sort();
  }, [makeFilter, vehicles]);
  const tempAvailableModels = useMemo(() => {
      if (!tempFilters.makeFilter) return [];
      return [...new Set(vehicles.filter(v => v.make === tempFilters.makeFilter).map(v => v.model))].sort();
  }, [tempFilters.makeFilter, vehicles]);
  const uniqueYears = useMemo(() => [...new Set(vehicles.map(v => v.year))].sort((a, b) => Number(b) - Number(a)), [vehicles]);
  const uniqueColors = useMemo(() => [...new Set(vehicles.map(v => v.color))].sort(), [vehicles]);
  const uniqueStates = useMemo(() => INDIAN_STATES, []);

  const allFeatures = useMemo(() => [...new Set(vehicles.flatMap(v => v.features))].sort(), [vehicles]);
  
  const filteredFeatures = useMemo(() => {
      return allFeatures.filter(feature => feature.toLowerCase().includes(featureSearch.toLowerCase()));
  }, [allFeatures, featureSearch]);

  const tempFilteredFeatures = useMemo(() => {
    return allFeatures.filter(feature => feature.toLowerCase().includes(tempFilters.featureSearch.toLowerCase()));
  }, [allFeatures, tempFilters.featureSearch]);

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
  };
  
  useEffect(() => {
      if (initialSearchQuery) {
          handleAiSearch(initialSearchQuery);
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSearchQuery]);

  useEffect(() => {
    setCategoryFilter(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (aiSearchRef.current && !aiSearchRef.current.contains(event.target as Node)) setShowSuggestions(false);
        if (featuresFilterRef.current && !featuresFilterRef.current.contains(event.target as Node)) setIsFeaturesOpen(false);
        if (mobileFeaturesFilterRef.current && !mobileFeaturesFilterRef.current.contains(event.target as Node)) setIsMobileFeaturesOpen(false);
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
  
  useEffect(() => {
    if (isFilterModalOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isFilterModalOpen]);

  // Mobile Modal Filter Logic
  const handleOpenFilterModal = () => {
    setTempFilters({
      categoryFilter, makeFilter, modelFilter, priceRange, yearFilter, colorFilter, stateFilter, selectedFeatures, featureSearch: '', mileageRange, fuelTypeFilter
    });
    setIsFilterModalOpen(true);
  };
  
  const handleCloseFilterModal = () => {
    setIsFilterModalOpen(false);
  };

  const handleApplyFilters = () => {
    setCategoryFilter(tempFilters.categoryFilter);
    setMakeFilter(tempFilters.makeFilter);
    setModelFilter(tempFilters.modelFilter);
    setPriceRange(tempFilters.priceRange);
    setMileageRange(tempFilters.mileageRange);
    setFuelTypeFilter(tempFilters.fuelTypeFilter);
    setYearFilter(tempFilters.yearFilter);
    setColorFilter(tempFilters.colorFilter);
    setStateFilter(tempFilters.stateFilter);
    setSelectedFeatures(tempFilters.selectedFeatures);
    setIsFilterModalOpen(false);
  };
  
  const handleResetTempFilters = () => {
      setTempFilters({
          categoryFilter: 'ALL',
          makeFilter: '',
          modelFilter: '',
          priceRange: { min: MIN_PRICE, max: MAX_PRICE },
          mileageRange: { min: MIN_MILEAGE, max: MAX_MILEAGE },
          fuelTypeFilter: '',
          yearFilter: '0',
          colorFilter: '',
          stateFilter: '',
          selectedFeatures: [],
          featureSearch: '',
      });
  };

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
  
  const handleResetFilters = () => {
    setAiSearchQuery(''); setCategoryFilter('ALL'); setMakeFilter(''); setModelFilter('');
    setPriceRange({ min: MIN_PRICE, max: MAX_PRICE }); setYearFilter('0'); setColorFilter(''); setStateFilter('');
    setSelectedFeatures([]); setFeatureSearch(''); setSortOrder('YEAR_DESC'); onClearCompare(); setCurrentPage(1);
    setMileageRange({ min: MIN_MILEAGE, max: MAX_MILEAGE }); setFuelTypeFilter('');
  };

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, makeFilter, modelFilter, priceRange, mileageRange, fuelTypeFilter, yearFilter, colorFilter, stateFilter, selectedFeatures, sortOrder, aiSearchQuery]);


  const processedVehicles = useMemo(() => {
    const sourceVehicles = isWishlistMode ? vehicles.filter(v => wishlist.includes(v.id)) : vehicles;

    const filtered = sourceVehicles.filter(vehicle => {
        const matchesCategory = categoryFilter === 'ALL' || vehicle.category === categoryFilter;
        const matchesMake = !makeFilter || vehicle.make === makeFilter;
        const matchesModel = !modelFilter || vehicle.model === modelFilter;
        const matchesPrice = vehicle.price >= priceRange.min && vehicle.price <= priceRange.max;
        const matchesMileage = vehicle.mileage >= mileageRange.min && vehicle.mileage <= mileageRange.max;
        const matchesFuelType = !fuelTypeFilter || vehicle.fuelType === fuelTypeFilter;
        const matchesYear = Number(yearFilter) === 0 || vehicle.year === Number(yearFilter);
        const matchesColor = !colorFilter || vehicle.color === colorFilter;
        const matchesState = !stateFilter || vehicle.state === stateFilter;
        const matchesFeatures = selectedFeatures.every(feature => vehicle.features.includes(feature));
        
        return matchesCategory && matchesMake && matchesModel && matchesPrice && matchesYear && matchesFeatures && matchesColor && matchesState && matchesMileage && matchesFuelType;
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
  }, [vehicles, categoryFilter, makeFilter, modelFilter, priceRange, mileageRange, fuelTypeFilter, yearFilter, selectedFeatures, sortOrder, isWishlistMode, wishlist, colorFilter, stateFilter]);
  
  const totalPages = Math.ceil(processedVehicles.length / ITEMS_PER_PAGE);
  const paginatedVehicles = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return processedVehicles.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [processedVehicles, currentPage]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (categoryFilter !== 'ALL' && !isWishlistMode) count++;
    if (makeFilter) count++;
    if (modelFilter) count++;
    if (priceRange.min !== MIN_PRICE || priceRange.max !== MAX_PRICE) count++;
    if (mileageRange.min !== MIN_MILEAGE || mileageRange.max !== MAX_MILEAGE) count++;
    if (fuelTypeFilter) count++;
    if (yearFilter !== '0') count++;
    if (colorFilter) count++;
    if (stateFilter) count++;
    count += selectedFeatures.length;
    return count;
  }, [categoryFilter, makeFilter, modelFilter, priceRange, mileageRange, fuelTypeFilter, yearFilter, colorFilter, stateFilter, selectedFeatures, isWishlistMode]);

  if (isWishlistMode) {
     return (
      <div className="animate-fade-in container mx-auto px-4 py-8">
        <h1 className="text-4xl font-extrabold text-brand-gray-800 dark:text-brand-gray-100 mb-6 border-b border-brand-gray-200 dark:border-brand-gray-700 pb-4">{categoryTitle}</h1>
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

  const renderFilterControls = (isMobile: boolean) => {
    const state = isMobile ? tempFilters : { categoryFilter, makeFilter, modelFilter, priceRange, mileageRange, fuelTypeFilter, yearFilter, colorFilter, stateFilter, selectedFeatures, featureSearch };
    
    const handleRangeChange = (e: React.ChangeEvent<HTMLInputElement>, rangeType: 'price' | 'mileage') => {
        const { name, value } = e.target;
        const val = parseInt(value, 10);
        
        if (isMobile) {
            setTempFilters(prev => {
                const currentRange = rangeType === 'price' ? prev.priceRange : prev.mileageRange;
                const newRange = { ...currentRange, [name]: val };
                if (newRange.min > newRange.max) {
                     if (name === 'min') newRange.max = newRange.min;
                     else newRange.min = newRange.max;
                }
                return rangeType === 'price' ? { ...prev, priceRange: newRange } : { ...prev, mileageRange: newRange };
            });
        } else {
            const setter = rangeType === 'price' ? setPriceRange : setMileageRange;
            setter(prev => {
                const newRange = { ...prev, [name]: val };
                if (newRange.min > newRange.max) {
                     if (name === 'min') newRange.max = newRange.min;
                     else newRange.min = newRange.max;
                }
                return newRange;
            });
        }
    };
    
    const handleFeatureToggleLocal = (feature: string) => {
        if (isMobile) {
            setTempFilters(prev => ({
                ...prev,
                selectedFeatures: prev.selectedFeatures.includes(feature)
                    ? prev.selectedFeatures.filter(f => f !== feature)
                    : [...prev.selectedFeatures, feature]
            }));
        } else {
            setSelectedFeatures(prev =>
                prev.includes(feature)
                    ? prev.filter(f => f !== feature)
                    : [...prev, feature]
            );
        }
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (isMobile) {
            setTempFilters(prev => {
                const newState = { ...prev, [name]: value };
                if (name === 'makeFilter') {
                    newState.modelFilter = '';
                }
                return newState;
            });
        } else {
            switch(name) {
                case 'categoryFilter': setCategoryFilter(value as any); break;
                case 'makeFilter': setMakeFilter(value); setModelFilter(''); break;
                case 'modelFilter': setModelFilter(value); break;
                case 'fuelTypeFilter': setFuelTypeFilter(value); break;
                case 'yearFilter': setYearFilter(value); break;
                case 'colorFilter': setColorFilter(value); break;
                case 'stateFilter': setStateFilter(value); break;
            }
        }
    };
    
    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="category-select" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Category</label>
                <select id="category-select" name="categoryFilter" value={state.categoryFilter} onChange={handleSelectChange} className={formElementClass}>
                    <option value="ALL">All Categories</option>
                    {Object.values(CategoryEnum).map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                </select>
            </div>
            <div>
                <label htmlFor="make-filter" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Make</label>
                <select id="make-filter" name="makeFilter" value={state.makeFilter} onChange={handleSelectChange} className={formElementClass}>
                    <option value="">Any Make</option>
                    {uniqueMakes.map(make => <option key={make} value={make}>{make}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="model-filter" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Model</label>
                <select id="model-filter" name="modelFilter" value={state.modelFilter} onChange={handleSelectChange} disabled={!state.makeFilter || (isMobile ? tempAvailableModels.length === 0 : availableModels.length === 0)} className={formElementClass}>
                    <option value="">Any Model</option>
                    {(isMobile ? tempAvailableModels : availableModels).map(model => <option key={model} value={model}>{model}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-2">Price Range</label>
                <div className="flex justify-between items-center text-xs text-brand-gray-600 dark:text-brand-gray-400">
                    <span>₹{state.priceRange.min.toLocaleString('en-IN')}</span>
                    <span>₹{state.priceRange.max.toLocaleString('en-IN')}</span>
                </div>
                <div className="relative h-8 flex items-center">
                    <input name="min" type="range" min={MIN_PRICE} max={MAX_PRICE} step="10000" value={state.priceRange.min} onChange={(e) => handleRangeChange(e, 'price')} className="absolute w-full h-1.5 bg-transparent appearance-none z-10 slider-thumb" />
                    <input name="max" type="range" min={MIN_PRICE} max={MAX_PRICE} step="10000" value={state.priceRange.max} onChange={(e) => handleRangeChange(e, 'price')} className="absolute w-full h-1.5 bg-transparent appearance-none z-10 slider-thumb" />
                    <div className="relative w-full h-1.5 bg-brand-gray-200 dark:bg-brand-gray-600 rounded-full">
                        <div className="absolute h-1.5 bg-brand-blue rounded-full" style={{ left: `${((state.priceRange.min - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100}%`, right: `${100 - ((state.priceRange.max - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100}%` }}></div>
                    </div>
                </div>
            </div>
             <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-2">Mileage (kms)</label>
                <div className="flex justify-between items-center text-xs text-brand-gray-600 dark:text-brand-gray-400">
                    <span>{state.mileageRange.min.toLocaleString('en-IN')}</span>
                    <span>{state.mileageRange.max.toLocaleString('en-IN')}</span>
                </div>
                <div className="relative h-8 flex items-center">
                    <input name="min" type="range" min={MIN_MILEAGE} max={MAX_MILEAGE} step="1000" value={state.mileageRange.min} onChange={(e) => handleRangeChange(e, 'mileage')} className="absolute w-full h-1.5 bg-transparent appearance-none z-10 slider-thumb" />
                    <input name="max" type="range" min={MIN_MILEAGE} max={MAX_MILEAGE} step="1000" value={state.mileageRange.max} onChange={(e) => handleRangeChange(e, 'mileage')} className="absolute w-full h-1.5 bg-transparent appearance-none z-10 slider-thumb" />
                    <div className="relative w-full h-1.5 bg-brand-gray-200 dark:bg-brand-gray-600 rounded-full">
                        <div className="absolute h-1.5 bg-brand-blue rounded-full" style={{ left: `${((state.mileageRange.min - MIN_MILEAGE) / (MAX_MILEAGE - MIN_MILEAGE)) * 100}%`, right: `${100 - ((state.mileageRange.max - MIN_MILEAGE) / (MAX_MILEAGE - MIN_MILEAGE)) * 100}%` }}></div>
                    </div>
                </div>
            </div>
            <div>
                <label htmlFor="fuel-type-filter" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Fuel Type</label>
                <select id="fuel-type-filter" name="fuelTypeFilter" value={state.fuelTypeFilter} onChange={handleSelectChange} className={formElementClass}>
                    <option value="">Any Fuel Type</option>
                    {FUEL_TYPES.map(fuel => <option key={fuel} value={fuel}>{fuel}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="year-filter" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Year</label>
                <select id="year-filter" name="yearFilter" value={state.yearFilter} onChange={handleSelectChange} className={formElementClass}>
                    <option value="0">Any Year</option>
                    {uniqueYears.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="color-filter" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Color</label>
                <select id="color-filter" name="colorFilter" value={state.colorFilter} onChange={handleSelectChange} className={formElementClass}>
                    <option value="">Any Color</option>
                    {uniqueColors.map(color => <option key={color} value={color}>{color}</option>)}
                </select>
            </div>
            <div>
                <label htmlFor="state-filter" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">State</label>
                <select id="state-filter" name="stateFilter" value={state.stateFilter} onChange={handleSelectChange} className={formElementClass}>
                    <option value="">Any State</option>
                    {uniqueStates.map(st => <option key={st.code} value={st.code}>{st.name}</option>)}
                </select>
            </div>
            <div className="relative" ref={isMobile ? mobileFeaturesFilterRef : featuresFilterRef}>
                <label htmlFor="features-filter-button" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Features</label>
                <button id="features-filter-button" type="button" onClick={() => isMobile ? setIsMobileFeaturesOpen(p => !p) : setIsFeaturesOpen(p => !p)} className={`${formElementClass} flex justify-between items-center text-left min-h-[50px]`}>
                    <div className="flex flex-wrap gap-1 items-center">
                        {state.selectedFeatures.length > 0 ? ( state.selectedFeatures.slice(0, 2).map(feature => ( <span key={feature} className="bg-brand-blue text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1.5">{feature} <button type="button" onClick={(e) => { e.stopPropagation(); handleFeatureToggleLocal(feature); }} className="bg-white/20 hover:bg-white/40 rounded-full h-4 w-4 flex items-center justify-center text-white" aria-label={`Remove ${feature}`}>&times;</button></span>)) ) : ( <span className="text-brand-gray-500 dark:text-brand-gray-400">Select features...</span> )}
                        {state.selectedFeatures.length > 2 && ( <span className="text-xs font-semibold text-brand-gray-500 dark:text-brand-gray-400">+{state.selectedFeatures.length - 2} more</span> )}
                    </div>
                    <svg className={`w-5 h-5 text-brand-gray-400 transition-transform flex-shrink-0 ${(isMobile ? isMobileFeaturesOpen : isFeaturesOpen) ? 'transform rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {(isMobile ? isMobileFeaturesOpen : isFeaturesOpen) && (
                    <div className="absolute top-full mt-2 w-full bg-white dark:bg-brand-gray-700 rounded-lg shadow-soft-xl border border-brand-gray-200 dark:border-brand-gray-600 z-20 overflow-hidden animate-fade-in">
                        <div className="p-2"><input ref={featuresSearchInputRef} type="text" placeholder="Search features..." value={state.featureSearch} onChange={e => { isMobile ? setTempFilters(p => ({...p, featureSearch: e.target.value})) : setFeatureSearch(e.target.value) }} className="block w-full p-2 border border-brand-gray-300 dark:border-brand-gray-500 rounded-md bg-white dark:bg-brand-gray-800 text-sm focus:ring-2 focus:ring-brand-blue focus:outline-none" /></div>
                        <div className="max-h-48 overflow-y-auto">
                            {(isMobile ? tempFilteredFeatures : filteredFeatures).map(feature => ( <label key={feature} className="flex items-center space-x-3 cursor-pointer group p-3 transition-colors hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600"><input type="checkbox" checked={state.selectedFeatures.includes(feature)} onChange={() => handleFeatureToggleLocal(feature)} className="h-4 w-4 text-brand-blue rounded border-brand-gray-300 dark:border-brand-gray-500 focus:ring-brand-blue bg-transparent" /><span className="text-sm text-brand-gray-800 dark:text-brand-gray-200">{feature}</span></label> ))}
                            {(isMobile ? tempFilteredFeatures.length === 0 : filteredFeatures.length === 0) && ( <p className="p-3 text-sm text-center text-brand-gray-500 dark:text-brand-gray-400">No features found.</p> )}
                        </div>
                    </div>
                )}
            </div>
            {!isMobile && <button onClick={handleResetFilters} className="w-full bg-brand-gray-200 dark:bg-brand-gray-700 text-brand-gray-800 dark:text-brand-gray-200 font-bold py-3 px-4 rounded-lg hover:bg-brand-gray-300 dark:hover:bg-brand-gray-600 transition-colors mt-2">Reset Filters</button>}
        </div>
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 container mx-auto px-4 py-8">
        <aside className={`hidden lg:block lg:sticky top-24 self-start space-y-6 transition-all duration-300 ${isDesktopFilterVisible ? 'w-[300px] opacity-100' : 'w-0 opacity-0 -translate-x-full'}`}>
            <div className={`bg-white dark:bg-brand-gray-800 p-6 rounded-xl shadow-soft-lg ${isDesktopFilterVisible ? 'block' : 'hidden'}`}>
              <h2 className="text-xl font-bold text-brand-gray-800 dark:text-brand-gray-100 mb-4">Filters</h2>
              {renderFilterControls(false)}
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
                <button onClick={() => setIsDesktopFilterVisible(prev => !prev)} className="hidden lg:block p-2 rounded-md bg-white dark:bg-brand-gray-700 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" /></svg>
                </button>
                <button onClick={handleOpenFilterModal} className="lg:hidden relative p-2 rounded-md bg-white dark:bg-brand-gray-700 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" /></svg>
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">{activeFilterCount}</span>
                    )}
                </button>
                <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">Showing <span className="font-bold">{paginatedVehicles.length}</span> of <span className="font-bold">{processedVehicles.length}</span> results</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center p-1 bg-brand-gray-100 dark:bg-brand-gray-700 rounded-lg">
                  <button title="Grid View" onClick={() => setViewMode('grid')} className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-brand-gray-800 shadow text-brand-blue' : 'text-brand-gray-500 hover:text-brand-gray-800 dark:hover:text-brand-gray-200'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                  </button>
                  <button title="List View" onClick={() => setViewMode('tile')} className={`p-2 rounded-md transition-colors ${viewMode === 'tile' ? 'bg-white dark:bg-brand-gray-800 shadow text-brand-blue' : 'text-brand-gray-500 hover:text-brand-gray-800 dark:hover:text-brand-gray-200'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2 4a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM2 9a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1zM2 14a1 1 0 011-1h14a1 1 0 110 2H3a1 1 0 01-1-1z" /></svg>
                  </button>
                </div>
                <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className={`${formElementClass} w-auto text-sm`}>
                    {Object.entries(sortOptions).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                </select>
              </div>
          </div>

          <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6" : "flex flex-col gap-4"}>
            {isLoading || isAiSearching ? (
              Array.from({ length: 8 }).map((_, index) => viewMode === 'grid' ? <VehicleCardSkeleton key={index} /> : <VehicleTileSkeleton key={index} />)
            ) : paginatedVehicles.length > 0 ? (
              paginatedVehicles.map(vehicle => (
                viewMode === 'grid' ? (
                  <VehicleCard 
                    key={vehicle.id} 
                    vehicle={vehicle} 
                    onSelect={onSelectVehicle} 
                    onToggleCompare={onToggleCompare} 
                    isSelectedForCompare={comparisonList.includes(vehicle.id)} 
                    onToggleWishlist={onToggleWishlist} 
                    isInWishlist={wishlist.includes(vehicle.id)} 
                    isCompareDisabled={!comparisonList.includes(vehicle.id) && comparisonList.length >= 4} 
                    onViewSellerProfile={onViewSellerProfile} 
                    onQuickView={setQuickViewVehicle} 
                  />
                ) : (
                  <VehicleTile 
                    key={vehicle.id} 
                    vehicle={vehicle} 
                    onSelect={onSelectVehicle} 
                    onToggleCompare={onToggleCompare} 
                    isSelectedForCompare={comparisonList.includes(vehicle.id)} 
                    onToggleWishlist={onToggleWishlist} 
                    isInWishlist={wishlist.includes(vehicle.id)} 
                    isCompareDisabled={!comparisonList.includes(vehicle.id) && comparisonList.length >= 4} 
                    onViewSellerProfile={onViewSellerProfile}
                  />
                )
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

      {/* Mobile Filter Modal */}
      {isFilterModalOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-60 z-50 animate-fade-in" onClick={handleCloseFilterModal}>
            <div className="bg-white dark:bg-brand-gray-800 rounded-t-2xl h-[90vh] flex flex-col absolute bottom-0 left-0 right-0 animate-slide-in-up" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-brand-gray-200 dark:border-brand-gray-700 flex justify-between items-center flex-shrink-0">
                    <h2 className="text-xl font-bold text-brand-gray-800 dark:text-brand-gray-100">Filters</h2>
                    <button onClick={handleCloseFilterModal} className="p-2 -mr-2 text-brand-gray-500 text-2xl">&times;</button>
                </div>
                <div className="overflow-y-auto p-6 flex-grow">
                    {renderFilterControls(true)}
                </div>
                <div className="p-4 border-t border-brand-gray-200 dark:border-brand-gray-700 flex gap-4 bg-white dark:bg-brand-gray-800 flex-shrink-0">
                    <button onClick={handleResetTempFilters} className="w-full bg-brand-gray-200 dark:bg-brand-gray-700 text-brand-gray-800 dark:text-brand-gray-200 font-bold py-3 px-4 rounded-lg hover:bg-brand-gray-300 dark:hover:bg-brand-gray-600 transition-colors">Reset</button>
                    <button onClick={handleApplyFilters} className="w-full bg-brand-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-brand-blue-dark transition-colors">Apply Filters</button>
                </div>
                 <style>{`
                  .slider-thumb { -webkit-appearance: none; appearance: none; background-color: transparent; }
                  .slider-thumb::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 20px; height: 20px; background-color: hsl(var(--color-brand-blue-DEFAULT)); border: 3px solid white; box-shadow: 0 0 0 1px #9CA3AF; border-radius: 50%; cursor: pointer; pointer-events: auto; transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; }
                  html.dark .slider-thumb::-webkit-slider-thumb { border-color: #1F2937; box-shadow: 0 0 0 1px #4B5563; }
                  .slider-thumb:hover::-webkit-slider-thumb, .slider-thumb:focus::-webkit-slider-thumb { transform: scale(1.15); box-shadow: 0 0 0 4px hsla(var(--color-brand-blue-DEFAULT) / 0.3); }
                  .slider-thumb::-moz-range-thumb { width: 20px; height: 20px; background-color: hsl(var(--color-brand-blue-DEFAULT)); border: 3px solid white; box-shadow: 0 0 0 1px #9CA3AF; border-radius: 50%; cursor: pointer; pointer-events: auto; transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; }
                  html.dark .slider-thumb::-moz-range-thumb { border-color: #1F2937; box-shadow: 0 0 0 1px #4B5563; }
                  .slider-thumb:hover::-moz-range-thumb, .slider-thumb:focus::-moz-range-thumb { transform: scale(1.15); box-shadow: 0 0 0 4px hsla(var(--color-brand-blue-DEFAULT) / 0.3); }
                `}</style>
            </div>
        </div>
      )}

      <QuickViewModal vehicle={quickViewVehicle} onClose={() => setQuickViewVehicle(null)} onSelectVehicle={onSelectVehicle} onToggleCompare={onToggleCompare} onToggleWishlist={onToggleWishlist} comparisonList={comparisonList} wishlist={wishlist} />
    </>
  );
};

export default VehicleList;
