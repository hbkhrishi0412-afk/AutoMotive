import React, { useState, useMemo, memo, useEffect } from 'react';
import type { Vehicle, ProsAndCons, User, CertifiedInspection, VehicleDocument } from '../types';
import { generateProsAndCons } from '../services/geminiService';
import StarRating from './StarRating';
import VehicleCard from './VehicleCard';
import EMICalculator from './EMICalculator';
import Benefits from './Benefits';
import QuickViewModal from './QuickViewModal';
import BadgeDisplay from './BadgeDisplay';
import VehicleHistory from './VehicleHistory';

interface VehicleDetailProps {
  vehicle: Vehicle;
  allVehicles: Vehicle[];
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

const DocumentChip: React.FC<{ doc: VehicleDocument }> = ({ doc }) => {
    return (
        <a href={doc.url} target="_blank" rel="noopener noreferrer" title={`View ${doc.fileName}`}
           className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2-2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
            <span>{doc.name}</span>
        </a>
    )
}

const CertifiedInspectionReport: React.FC<{ report: CertifiedInspection }> = ({ report }) => {
    const scoreColor = (score: number) => {
        if (score >= 90) return 'bg-green-500';
        if (score >= 75) return 'bg-yellow-500';
        return 'bg-red-500';
    };
    return (
        <div className="p-6 bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center border-b dark:border-gray-700 pb-4 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44-1.22a.75.75 0 00-1.06 0L8.172 6.172a.75.75 0 00-1.06 1.06L8.94 9.332a.75.75 0 001.191.04l3.22-4.294a.75.75 0 00-.04-1.19z" clipRule="evenodd" />
                </svg>
                <div>
                    <h3 className="text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100">AutoVerse Certified Inspection</h3>
                    <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400">Inspected by {report.inspector} on {new Date(report.date).toLocaleDateString()}</p>
                </div>
            </div>
            <p className="italic text-brand-gray-700 dark:text-brand-gray-300 mb-6">{report.summary}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {Object.entries(report.scores).map(([key, score]) => (
                    <div key={key}>
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-sm text-brand-gray-700 dark:text-brand-gray-300">{key}</span>
                            <span className="font-bold text-sm text-brand-gray-900 dark:text-brand-gray-100">{score}/100</span>
                        </div>
                        <div className="w-full bg-brand-gray-200 dark:bg-brand-gray-700 rounded-full h-2.5">
                            {/* FIX: Cast score to Number to resolve typing error as Object.entries may not be inferred as a number type for the value. */}
                            <div className={`${scoreColor(Number(score))} h-2.5 rounded-full`} style={{ width: `${score}%` }}></div>
                        </div>
                        <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-1">{report.details[key]}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};


export const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicle, allVehicles, onBack: onBackToHome, comparisonList, onToggleCompare, onAddSellerRating, wishlist, onToggleWishlist, currentUser, onFlagContent, users, onViewSellerProfile, onStartChat, recommendations, onSelectVehicle }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeMediaTab, setActiveMediaTab] = useState<'images' | 'video'>('images');
  const [showSellerRatingSuccess, setShowSellerRatingSuccess] = useState(false);
  const [prosAndCons, setProsAndCons] = useState<ProsAndCons | null>(null);
  const [isGeneratingProsCons, setIsGeneratingProsCons] = useState<boolean>(false);
  const [quickViewVehicle, setQuickViewVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    setCurrentIndex(0);
    setProsAndCons(null);
    setIsGeneratingProsCons(false);
    setActiveMediaTab(vehicle.videoUrl ? 'images' : 'images');
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
              <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <StarRating rating={vehicle.averageRating || 0} readOnly />
                    <span className="text-brand-gray-600 dark:text-brand-gray-400">
                        {vehicle.averageRating?.toFixed(1) || 'No rating'} ({vehicle.ratingCount || 0} reviews)
                    </span>
                  </div>
                  {vehicle.certifiedInspection && (
                      <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44-1.22a.75.75 0 00-1.06 0L8.172 6.172a.75.75 0 00-1.06 1.06L8.94 9.332a.75.75 0 001.191.04l3.22-4.294a.75.75 0 00-.04-1.19z" clipRule="evenodd" /></svg>
                          Certified
                      </span>
                  )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Image Gallery and Details */}
                  <div className="lg:col-span-2 space-y-8">
                      <div className="space-y-4">
                        {vehicle.videoUrl && (
                          <div className="flex space-x-2 border-b-2 border-brand-gray-200 dark:border-brand-gray-700">
                            <button onClick={() => setActiveMediaTab('images')} className={`py-2 px-4 font-semibold ${activeMediaTab === 'images' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-brand-gray-500'}`}>Images</button>
                            <button onClick={() => setActiveMediaTab('video')} className={`py-2 px-4 font-semibold ${activeMediaTab === 'video' ? 'border-b-2 border-brand-blue text-brand-blue' : 'text-brand-gray-500'}`}>Video</button>
                          </div>
                        )}
                        {activeMediaTab === 'images' ? (
                          <>
                            <div className="relative group">
                                <img key={currentIndex} className="w-full h-auto object-cover rounded-xl shadow-soft-xl animate-fade-in" src={vehicle.images[currentIndex]} alt={`${vehicle.make} ${vehicle.model} image ${currentIndex + 1}`} />
                                {vehicle.images.length > 1 && (
                                    <>
                                        <button onClick={handlePrevImage} className="absolute top-1/2 left-4 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100" aria-label="Previous image"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                                        <button onClick={handleNextImage} className="absolute top-1/2 right-4 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100" aria-label="Next image"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                                    </>
                                )}
                            </div>
                            {vehicle.images.length > 1 && (
                                <div className="flex space-x-2 overflow-x-auto pb-2 -mt-2">
                                    {vehicle.images.map((img, index) => (
                                        <img key={index} src={img} alt={`Thumbnail ${index + 1}`} className={`cursor-pointer rounded-md border-2 h-20 w-28 object-cover flex-shrink-0 ${currentIndex === index ? 'border-brand-blue' : 'border-transparent'} hover:border-brand-blue-light transition`} onClick={() => setCurrentIndex(index)} />
                                    ))}
                                </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full aspect-video bg-black rounded-xl shadow-soft-xl overflow-hidden animate-fade-in">
                            <video src={vehicle.videoUrl} controls className="w-full h-full object-cover">Your browser does not support the video tag.</video>
                          </div>
                        )}
                      </div>
                      
                      {vehicle.certifiedInspection && <CertifiedInspectionReport report={vehicle.certifiedInspection} />}

                      <div className="p-6 bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft">
                          <h3 className="text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-4 border-b dark:border-gray-700 pb-2">Vehicle Specifications</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                              <KeySpec label="Make Year" value={vehicle.year} />
                              <KeySpec label="Registration Year" value={vehicle.registrationYear} />
                              <KeySpec label="Fuel Type" value={vehicle.fuelType} />
                              <KeySpec label="Km Driven" value={vehicle.mileage.toLocaleString('en-IN')} />
                              <KeySpec label="Transmission" value={vehicle.transmission} />
                              <KeySpec label="No. of Owners" value={vehicle.noOfOwners} />
                              <KeySpec label="Insurance" value={vehicle.insuranceValidity} />
                              <KeySpec label="RTO" value={vehicle.rto} />
                          </div>
                      </div>
                      
                      {vehicle.description && <div className="p-6 bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft">
                          <h3 className="text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-4 border-b dark:border-gray-700 pb-2">Description</h3>
                          <p className="text-brand-gray-700 dark:text-brand-gray-300 whitespace-pre-line">{vehicle.description}</p>
                      </div>}
                      
                      {vehicle.features.length > 0 && <div className="p-6 bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft">
                          <h3 className="text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-4 border-b dark:border-gray-700 pb-2">Features</h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {vehicle.features.map(feature => (
                              <div key={feature} className="flex items-center gap-2 text-brand-gray-700 dark:text-brand-gray-300">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                {feature}
                              </div>
                            ))}
                          </div>
                      </div>}

                      {vehicle.documents && vehicle.documents.length > 0 && <div className="p-6 bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft">
                          <h3 className="text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-4 border-b dark:border-gray-700 pb-2">Available Documents</h3>
                          <div className="flex flex-wrap gap-4">
                              {vehicle.documents.map(doc => <DocumentChip key={doc.name} doc={doc} />)}
                          </div>
                      </div>}

                      {(vehicle.serviceRecords || vehicle.accidentHistory) && (
                        <VehicleHistory serviceRecords={vehicle.serviceRecords || []} accidentHistory={vehicle.accidentHistory || []} />
                      )}

                  </div>
                  
                  {/* Right Column: Price and Actions */}
                  <div className="space-y-6 self-start lg:sticky top-24">
                      <div className="p-6 bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft-lg space-y-4">
                           <p className="text-4xl font-extrabold text-brand-blue dark:text-brand-blue-light">₹{vehicle.price.toLocaleString('en-IN')}</p>
                           <button onClick={() => onStartChat(vehicle)} className="w-full bg-brand-blue text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-brand-blue-dark transition-all transform hover:scale-105">
                                Chat with Seller
                            </button>
                            <div className="flex gap-4">
                               <button
                                  onClick={() => onToggleCompare(vehicle.id)}
                                  disabled={isCompareDisabled}
                                  className={`w-full font-bold py-3 px-4 rounded-lg text-lg transition-all flex items-center justify-center gap-2 ${isComparing ? 'bg-indigo-100 text-indigo-600' : 'bg-brand-gray-200 dark:bg-brand-gray-700'} ${isCompareDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {isComparing ? 'Comparing' : 'Compare'}
                              </button>
                               <button
                                  onClick={() => onToggleWishlist(vehicle.id)}
                                  className={`w-full font-bold py-3 px-4 rounded-lg text-lg transition-all flex items-center justify-center gap-2 ${isInWishlist ? 'bg-pink-100 text-pink-600' : 'bg-brand-gray-200 dark:bg-brand-gray-700'}`}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                                  {isInWishlist ? 'Saved' : 'Save'}
                              </button>
                            </div>
                      </div>
                      
                      {seller && <div className="p-6 bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft">
                            <h3 className="text-lg font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-3">Seller Information</h3>
                            <div className="flex items-center gap-4">
                                <img src={seller.logoUrl || `https://i.pravatar.cc/100?u=${seller.email}`} alt="Seller Logo" className="w-16 h-16 rounded-full object-cover" />
                                <div>
                                    <h4 className="font-bold text-brand-gray-900 dark:text-brand-gray-100">{seller.dealershipName || seller.name}</h4>
                                    <div className="flex items-center gap-1 mt-1">
                                        <StarRating rating={seller.averageRating || 0} size="sm" readOnly />
                                        <span className="text-xs text-brand-gray-500 dark:text-brand-gray-400">({seller.ratingCount || 0})</span>
                                    </div>
                                    <BadgeDisplay badges={seller.badges || []} size="sm" />
                                </div>
                            </div>
                            <button onClick={() => onViewSellerProfile(seller.email)} className="mt-4 w-full text-center text-sm font-bold text-brand-blue hover:underline">View Seller Profile</button>
                            {canRate && <div className="mt-4 pt-4 border-t dark:border-gray-700">
                                <p className="text-sm font-medium text-center text-brand-gray-600 dark:text-brand-gray-400 mb-2">Rate your experience with this seller</p>
                                <div className="flex justify-center">
                                  <StarRating rating={0} onRate={handleRateSeller} />
                                </div>
                                {showSellerRatingSuccess && <p className="text-center text-green-600 text-sm mt-2">Thanks for your feedback!</p>}
                            </div>}
                      </div>}
                      
                      <EMICalculator price={vehicle.price} />

                      <div className="text-center">
                          <button onClick={handleFlagClick} className="text-xs text-brand-gray-500 hover:text-red-500">Report this listing</button>
                      </div>
                  </div>
              </div>

              {filteredRecommendations.length > 0 && <div className="mt-12">
                  <h2 className="text-3xl font-bold text-brand-gray-800 dark:text-brand-gray-100 mb-6">Similar Vehicles</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredRecommendations.map(v => (
                          <VehicleCard key={v.id} vehicle={v} onSelect={onSelectVehicle} onToggleCompare={onToggleCompare} isSelectedForCompare={comparisonList.includes(v.id)} onToggleWishlist={onToggleWishlist} isInWishlist={wishlist.includes(v.id)} isCompareDisabled={!comparisonList.includes(v.id) && comparisonList.length >= 4} onViewSellerProfile={onViewSellerProfile} onQuickView={setQuickViewVehicle}/>
                      ))}
                  </div>
              </div>}

          </div>
      </div>
      <QuickViewModal vehicle={quickViewVehicle} onClose={() => setQuickViewVehicle(null)} onSelectVehicle={onSelectVehicle} onToggleCompare={onToggleCompare} onToggleWishlist={onToggleWishlist} comparisonList={comparisonList} wishlist={wishlist} />
    </>
  );
};