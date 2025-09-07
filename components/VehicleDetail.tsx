

import React, { useState, useMemo, memo } from 'react';
import type { Vehicle, ProsAndCons, User, Conversation } from '../types';
import { generateProsAndCons } from '../services/geminiService';
import StarRating from './StarRating';

interface VehicleDetailProps {
  vehicle: Vehicle;
  onBack: () => void;
  comparisonList: number[];
  onToggleCompare: (id: number) => void;
  onAddSellerRating: (sellerEmail: string, rating: number) => void;
  wishlist: number[];
  onToggleWishlist: (id: number) => void;
  currentUser: User | null;
  onFlagContent: (type: 'vehicle' | 'conversation', id: number | string) => void;
  users: User[];
  onViewSellerProfile: (sellerEmail: string) => void;
  onStartChat: (vehicle: Vehicle) => void;
}

const KeySpec: React.FC<{ label: string; value: string; }> = memo(({ label, value }) => (
    <div className="flex justify-between border-b border-brand-gray-200 dark:border-brand-gray-700 py-3">
        <span className="font-medium text-brand-gray-600 dark:text-brand-gray-400">{label}</span>
        <span className="font-semibold text-brand-gray-900 dark:text-brand-gray-100">{value}</span>
    </div>
));

type Tab = 'overview' | 'features';

const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicle, onBack: onBackToHome, comparisonList, onToggleCompare, onAddSellerRating, wishlist, onToggleWishlist, currentUser, onFlagContent, users, onViewSellerProfile, onStartChat }) => {
  const [mainImage, setMainImage] = useState(vehicle.images[0]);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showSellerRatingSuccess, setShowSellerRatingSuccess] = useState(false);
  const [prosAndCons, setProsAndCons] = useState<ProsAndCons | null>(null);
  const [isGeneratingProsCons, setIsGeneratingProsCons] = useState<boolean>(false);

  const handleGenerateProsCons = async () => {
    setIsGeneratingProsCons(true);
    const result = await generateProsAndCons(vehicle);
    setProsAndCons(result);
    setIsGeneratingProsCons(false);
  };
  
  const handleRateSeller = (rating: number) => {
    onAddSellerRating(vehicle.sellerEmail, rating);
    setShowSellerRatingSuccess(true);
    setTimeout(() => setShowSellerRatingSuccess(false), 3000);
  };

  const handleFlagClick = () => {
      if(window.confirm('Are you sure you want to report this listing for review by an administrator?')) {
        onFlagContent('vehicle', vehicle.id);
      }
  }

  const isComparing = comparisonList.includes(vehicle.id);
  const isInWishlist = wishlist.includes(vehicle.id);
  const canRate = currentUser?.role === 'customer';
  const isCompareDisabled = !isComparing && comparisonList.length >= 4;
  
  const seller = useMemo(() => {
    return users.find(u => u.email === vehicle.sellerEmail);
  }, [users, vehicle.sellerEmail]);

  return (
    <div className="bg-brand-gray-50 dark:bg-brand-gray-900 animate-fade-in">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <button onClick={onBackToHome} className="mb-6 bg-white dark:bg-brand-gray-800 text-brand-gray-700 dark:text-brand-gray-200 font-bold py-2 px-4 rounded-lg hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 transition-colors shadow-soft">
              &larr; Back to Listings
            </button>
            
            <h1 className="text-4xl font-extrabold text-brand-gray-900 dark:text-brand-gray-100 mb-2">{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.variant || ''}</h1>
            <div className="flex items-center gap-2 mb-6">
                <StarRating rating={vehicle.averageRating || 0} readOnly />
                <span className="text-brand-gray-600 dark:text-brand-gray-400">
                    {vehicle.averageRating?.toFixed(1) || 'No rating'} ({vehicle.ratingCount || 0} reviews)
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Image Gallery and Details */}
                <div className="lg:col-span-2">
                    <img className="w-full h-auto object-cover rounded-xl shadow-soft-xl mb-4" src={mainImage} alt={`${vehicle.make} ${vehicle.model}`} />
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        {vehicle.images.map((img, index) => (
                            <img 
                                key={index} 
                                src={img}
                                alt={`Thumbnail ${index + 1} of ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                className={`cursor-pointer rounded-md border-2 ${mainImage === img ? 'border-brand-blue' : 'border-transparent'} hover:border-brand-blue-light transition`}
                                onClick={() => setMainImage(img)}
                            />
                        ))}
                    </div>

                    <div className="mt-8 pt-6">
                         <div className="border-b border-brand-gray-200 dark:border-brand-gray-700 mb-4">
                            <nav className="-mb-px flex space-x-6">
                                <button 
                                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'overview' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-brand-gray-500 dark:text-brand-gray-400 hover:text-brand-gray-700 dark:hover:text-brand-gray-200 hover:border-brand-gray-300 dark:hover:border-brand-gray-500'}`}
                                    onClick={() => setActiveTab('overview')}
                                >
                                    Overview
                                </button>
                                <button 
                                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'features' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-brand-gray-500 dark:text-brand-gray-400 hover:text-brand-gray-700 dark:hover:text-brand-gray-200 hover:border-brand-gray-300 dark:hover:border-brand-gray-500'}`}
                                    onClick={() => setActiveTab('features')}
                                >
                                    Features & Specs
                                </button>
                            </nav>
                        </div>
                        
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="p-6 bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft">
                                    <h3 className="text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-3">Description</h3>
                                    <p className="text-brand-gray-700 dark:text-brand-gray-300 leading-relaxed">{vehicle.description}</p>
                                </div>
                                
                                <div className="p-6 bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft">
                                    <h3 className="text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-4">AI-Generated Pros &amp; Cons</h3>
                                    {isGeneratingProsCons ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <div className="h-5 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-1/3 animate-pulse"></div>
                                                <div className="h-4 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-full animate-pulse"></div>
                                                <div className="h-4 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-5/6 animate-pulse"></div>
                                                <div className="h-4 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-full animate-pulse"></div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="h-5 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-1/3 animate-pulse"></div>
                                                <div className="h-4 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-full animate-pulse"></div>
                                                <div className="h-4 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-5/6 animate-pulse"></div>
                                                <div className="h-4 bg-brand-gray-200 dark:bg-brand-gray-700 rounded w-full animate-pulse"></div>
                                            </div>
                                        </div>
                                    ) : prosAndCons ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                            <div>
                                                <h4 className="font-bold text-lg text-green-600 dark:text-green-500 mb-2">Pros</h4>
                                                <ul className="space-y-2">
                                                {prosAndCons.pros.map((pro, i) => (
                                                    <li key={`pro-${i}`} className="flex items-start">
                                                        <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                                        <span className="text-brand-gray-700 dark:text-brand-gray-300">{pro}</span>
                                                    </li>
                                                ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg text-red-600 dark:text-red-500 mb-2">Cons</h4>
                                                <ul className="space-y-2">
                                                {prosAndCons.cons.map((con, i) => (
                                                    <li key={`con-${i}`} className="flex items-start">
                                                        <svg className="w-5 h-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                                                        <span className="text-brand-gray-700 dark:text-brand-gray-300">{con}</span>
                                                    </li>
                                                ))}
                                                </ul>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleGenerateProsCons}
                                            className="w-full bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg text-md hover:bg-indigo-600 transition-transform transform hover:scale-105"
                                        >
                                            ✨ Generate Pros &amp; Cons
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'features' && (
                            <div className="space-y-8">
                                <div>
                                    <h3 className="text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-4">Key Features</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {vehicle.features.map((feature, index) => (
                                            <div key={index} className="bg-white dark:bg-brand-gray-800 p-3 rounded-lg flex items-center gap-3 shadow-soft border border-brand-gray-100 dark:border-brand-gray-700">
                                                <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/50 p-1 rounded-full">
                                                     <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <span className="text-brand-gray-800 dark:text-brand-gray-200 font-medium text-sm">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                 <div>
                                    <h3 className="text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-3">Specifications</h3>
                                    <div className="space-y-2 text-sm bg-white dark:bg-brand-gray-800 p-4 rounded-lg shadow-soft">
                                        <KeySpec label="Engine" value={vehicle.engine} />
                                        <KeySpec label="Transmission" value={vehicle.transmission} />
                                        <KeySpec label="Fuel Type" value={vehicle.fuelType} />
                                        <KeySpec label="Fuel Efficiency" value={vehicle.fuelEfficiency} />
                                        <KeySpec label="Color" value={vehicle.color} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Price and Actions (Sticky) */}
                <div className="lg:sticky top-24 self-start space-y-4">
                    <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft-lg p-6">
                        <p className="text-3xl font-bold text-brand-gray-900 dark:text-brand-gray-100">₹{vehicle.price.toLocaleString('en-IN')}</p>
                        <div className="mt-6 space-y-3">
                             <button
                              onClick={() => onStartChat(vehicle)}
                              className="w-full bg-brand-blue text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-brand-blue-dark transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={!currentUser || currentUser.role !== 'customer'}
                              title={!currentUser || currentUser.role !== 'customer' ? "Log in as a customer to chat" : ""}
                            >
                              Contact Seller
                            </button>
                             <button
                                onClick={() => onToggleWishlist(vehicle.id)}
                                className={`w-full font-bold py-3 px-6 rounded-lg text-lg transition-all transform hover:scale-105 flex items-center justify-center gap-2 ${
                                    isInWishlist 
                                    ? 'bg-pink-600 hover:bg-pink-700 text-white' 
                                    : 'bg-brand-gray-200 dark:bg-brand-gray-700 text-brand-gray-800 dark:text-brand-gray-200 hover:bg-brand-gray-300 dark:hover:bg-brand-gray-600'
                                }`}
                                >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                                {isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                            </button>
                             <button
                                onClick={() => onToggleCompare(vehicle.id)}
                                disabled={isCompareDisabled}
                                title={isCompareDisabled ? "Comparison limit reached (max 4)" : ""}
                                className={`w-full font-bold py-3 px-6 rounded-lg text-lg transition-all transform hover:scale-105 ${
                                    isComparing 
                                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                                    : 'bg-brand-gray-200 dark:bg-brand-gray-700 text-brand-gray-800 dark:text-brand-gray-200 hover:bg-brand-gray-300 dark:hover:bg-brand-gray-600'
                                } ${isCompareDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                {isComparing ? 'Remove from Compare' : 'Add to Compare'}
                            </button>
                        </div>
                         <div className="mt-4 text-center">
                            <button
                                onClick={handleFlagClick}
                                disabled={vehicle.isFlagged}
                                className="text-xs text-brand-gray-500 hover:text-red-500 dark:text-brand-gray-400 dark:hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {vehicle.isFlagged ? 'Reported for review' : 'Report this listing'}
                            </button>
                        </div>
                    </div>
                     {seller && (
                        <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft-lg p-6">
                            <h3 className="text-lg font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-4">Seller Information</h3>
                            <div className="flex items-start gap-4">
                                <img src={seller.logoUrl || `https://i.pravatar.cc/100?u=${seller.email}`} alt="Seller logo" className="w-16 h-16 rounded-full object-cover"/>
                                <div className="flex-1">
                                    <p className="font-bold text-brand-gray-900 dark:text-brand-gray-100">{seller.dealershipName || seller.name}</p>
                                    <button onClick={() => onViewSellerProfile(seller.email)} className="text-sm font-medium text-brand-blue hover:underline focus:outline-none">
                                        View Seller's Profile
                                    </button>
                                    <div className="flex items-center gap-2 mt-2">
                                        <StarRating rating={seller.averageRating || 0} readOnly size="sm" />
                                        <span className="text-xs text-brand-gray-500 dark:text-brand-gray-400">({seller.ratingCount || 0} ratings)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                     <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft-lg p-6 text-center">
                        <h3 className="text-lg font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-3">Rate This Seller</h3>
                        {canRate ? (
                            <>
                                <div className="flex justify-center">
                                    <StarRating onRate={handleRateSeller} rating={0} size="lg"/>
                                </div>
                                {showSellerRatingSuccess && <p className="text-green-600 text-sm mt-3 animate-fade-in">Thank you for your rating!</p>}
                            </>
                        ) : (
                            <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400 px-4">
                                {currentUser ? 'Only customers can rate sellers.' : 'Please log in as a customer to rate this seller.'}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default VehicleDetail;