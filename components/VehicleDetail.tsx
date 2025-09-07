import React, { useState, useMemo, memo, useEffect } from 'react';
import type { Vehicle, ProsAndCons, User } from '../types';
import { generateProsAndCons } from '../services/geminiService';
import StarRating from './StarRating';
import VehicleCard from './VehicleCard';
import EMICalculator from './EMICalculator';
import Benefits from './Benefits';
import QuickViewModal from './QuickViewModal';

interface VehicleDetailProps {
  vehicle: Vehicle;
  onBack: () => void;
  comparisonList: number[];
  onToggleCompare: (id: number) => void;
  onAddSellerRating: (sellerEmail: string, rating: number) => void;
  wishlist: number[];
  onToggleWishlist: (id: number) => void;
  currentUser: User | null;
  onFlagContent: (type: 'vehicle' | 'conversation', id: number | string, reason: string) => void;
  users: User[];
  onViewSellerProfile: (sellerEmail: string) => void;
  onStartChat: (vehicle: Vehicle) => void;
  recommendations: Vehicle[];
  onSelectVehicle: (vehicle: Vehicle) => void;
}

const KeySpec: React.FC<{ label: string; value: string | number; icon?: React.ReactNode }> = memo(({ label, value, icon }) => (
    <div className="flex flex-col gap-1 p-4 bg-brand-gray-100 dark:bg-brand-gray-800 rounded-lg text-center">
        {icon && <div className="text-brand-blue mx-auto mb-1">{icon}</div>}
        <span className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400">{label}</span>
        <span className="font-bold text-brand-gray-900 dark:text-brand-gray-100">{value}</span>
    </div>
));

const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicle, onBack: onBackToHome, comparisonList, onToggleCompare, onAddSellerRating, wishlist, onToggleWishlist, currentUser, onFlagContent, users, onViewSellerProfile, onStartChat, recommendations, onSelectVehicle }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showSellerRatingSuccess, setShowSellerRatingSuccess] = useState(false);
  const [prosAndCons, setProsAndCons] = useState<ProsAndCons | null>(null);
  const [isGeneratingProsCons, setIsGeneratingProsCons] = useState<boolean>(false);
  const [quickViewVehicle, setQuickViewVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    setCurrentIndex(0);
    setProsAndCons(null);
    setIsGeneratingProsCons(false);
    window.scrollTo(0, 0);
  }, [vehicle]);
  
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex - 1 + vehicle.images.length) % vehicle.images.length);
  };
  
  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex + 1) % vehicle.images.length);
  };

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
        const reason = window.prompt("Please provide a reason for reporting this listing (optional):");
        if (reason !== null) {
            onFlagContent('vehicle', vehicle.id, reason || "No reason provided");
        }
      }
  }

  const isComparing = comparisonList.includes(vehicle.id);
  const isInWishlist = wishlist.includes(vehicle.id);
  const canRate = currentUser?.role === 'customer';
  const isCompareDisabled = !isComparing && comparisonList.length >= 4;
  
  const seller = useMemo(() => {
    return users.find(u => u.email === vehicle.sellerEmail);
  }, [users, vehicle.sellerEmail]);

  const filteredRecommendations = useMemo(() => {
      return recommendations.filter(rec => rec.id !== vehicle.id).slice(0, 3);
  }, [recommendations, vehicle.id]);

  return (
    <>
      <div className="bg-brand-gray-50 dark:bg-brand-gray-dark animate-fade-in">
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
                  <div className="lg:col-span-2 space-y-8">
                      <div className="space-y-4">
                        <div className="relative group">
                            <img 
                                key={currentIndex}
                                className="w-full h-auto object-cover rounded-xl shadow-soft-xl animate-fade-in" 
                                src={vehicle.images[currentIndex]} 
                                alt={`${vehicle.make} ${vehicle.model} image ${currentIndex + 1}`} 
                            />
                            {vehicle.images.length > 1 && (
                                <>
                                    <button 
                                        onClick={handlePrevImage}
                                        className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                        aria-label="Previous image"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <button 
                                        onClick={handleNextImage}
                                        className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                        aria-label="Next image"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </>
                            )}
                        </div>
                        {vehicle.images.length > 1 && (
                            <div className="flex space-x-2 overflow-x-auto pb-2 -mt-2">
                                {vehicle.images.map((img, index) => (
                                    <img 
                                        key={index} 
                                        src={img}
                                        alt={`Thumbnail ${index + 1} of ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                        className={`cursor-pointer rounded-md border-2 h-20 w-28 object-cover flex-shrink-0 ${currentIndex === index ? 'border-brand-blue' : 'border-transparent'} hover:border-brand-blue-light transition`}
                                        onClick={() => setCurrentIndex(index)}
                                    />
                                ))}
                            </div>
                        )}
                      </div>

                      <div className="p-6 bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft">
                          <h3 className="text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-4 border-b dark:border-gray-700 pb-2">Vehicle Overview</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                              <KeySpec label="Make Year" value={vehicle.year} />
                              <KeySpec label="Registration Year" value={vehicle.registrationYear} />
                              <KeySpec label="Fuel Type" value={vehicle.fuelType} />
                              <KeySpec label="Km Driven" value={`${vehicle.mileage.toLocaleString('en-IN')} km`} />
                              <KeySpec label="Transmission" value={vehicle.transmission} />
                              <KeySpec label="No. of Owners" value={`${vehicle.noOfOwners}${vehicle.noOfOwners === 1 ? 'st' : 'nd'} Owner`} />
                              <KeySpec label="Insurance" value={vehicle.insuranceType} />
                              <KeySpec label="RTO" value={vehicle.rto} />
                          </div>
                      </div>

                      <div className="p-6 bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft">
                          <h3 className="text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-4 border-b dark:border-gray-700 pb-2">Vehicle Specifications</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                              <KeySpec label="Mileage (ARAI)" value={vehicle.fuelEfficiency} />
                              <KeySpec label="Engine" value={vehicle.engine} />
                              <KeySpec label="Displacement" value={vehicle.displacement} />
                              <KeySpec label="Ground Clearance" value={vehicle.groundClearance} />
                              <KeySpec label="Boot Space" value={vehicle.bootSpace} />
                              <KeySpec label="Color" value={vehicle.color} />
                          </div>
                      </div>

                      {vehicle.qualityReport && (
                          <div className="p-6 bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft">
                              <h3 className="text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-4 border-b dark:border-gray-700 pb-2">Quality Report</h3>
                              <p className="text-brand-gray-700 dark:text-brand-gray-300 leading-relaxed mb-4">{vehicle.qualityReport.summary}</p>
                              {vehicle.qualityReport.fixesDone.length > 0 && (
                                  <>
                                      <h4 className="font-semibold text-brand-gray-800 dark:text-brand-gray-200 mb-2">Fixes & Upgrades</h4>
                                      <ul className="space-y-2">
                                          {vehicle.qualityReport.fixesDone.map((fix, index) => (
                                              <li key={index} className="flex items-start">
                                                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                                  <span className="text-brand-gray-700 dark:text-brand-gray-300">{fix}</span>
                                              </li>
                                          ))}
                                      </ul>
                                  </>
                              )}
                          </div>
                      )}
                      
                      <Benefits />
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
                      
                      <EMICalculator price={vehicle.price} />

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
              {filteredRecommendations.length > 0 && (
                  <div className="mt-16">
                      <h2 className="text-3xl font-bold text-brand-gray-800 dark:text-brand-gray-100 mb-6">You Might Also Like</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {filteredRecommendations.map(rec => (
                              <VehicleCard
                                  key={rec.id}
                                  vehicle={rec}
                                  onSelect={onSelectVehicle}
                                  onToggleCompare={onToggleCompare}
                                  isSelectedForCompare={comparisonList.includes(rec.id)}
                                  onToggleWishlist={onToggleWishlist}
                                  isInWishlist={wishlist.includes(rec.id)}
                                  isCompareDisabled={!comparisonList.includes(rec.id) && comparisonList.length >= 4}
                                  onViewSellerProfile={onViewSellerProfile}
                                  onQuickView={setQuickViewVehicle}
                              />
                          ))}
                      </div>
                  </div>
              )}
          </div>
      </div>
      <QuickViewModal
          vehicle={quickViewVehicle}
          onClose={() => setQuickViewVehicle(null)}
          onSelectVehicle={onSelectVehicle}
          onToggleCompare={onToggleCompare}
          onToggleWishlist={onToggleWishlist}
          comparisonList={comparisonList}
          wishlist={wishlist}
      />
    </>
  );
};

export default VehicleDetail;