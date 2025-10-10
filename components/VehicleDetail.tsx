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

// SVG icons for social media
const ICONS = {
    facebook: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" /></svg>,
    twitter: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M22.46 6c-.77.35-1.6.58-2.46.67.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98-3.54-.18-6.69-1.87-8.8-4.46-.37.63-.58 1.37-.58 2.15 0 1.49.76 2.81 1.91 3.58-.7-.02-1.36-.21-1.94-.53v.05c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21c7.34 0 11.35-6.08 11.35-11.35 0-.17 0-.34-.01-.51.78-.57 1.45-1.28 1.99-2.08z" /></svg>,
    whatsapp: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zM12.04 20.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31c-.82-1.31-1.26-2.83-1.26-4.38 0-4.54 3.69-8.23 8.24-8.23 4.54 0 8.23 3.69 8.23 8.23 0 4.54-3.69 8.23-8.23 8.23zm4.52-6.2c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42-.14 0-.3 0-.47 0-.17 0-.43.06-.66.31-.22.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.05-.11-.2-.16-.44-.28z" /></svg>,
    link: <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" /></svg>,
};

interface SocialShareButtonsProps {
    vehicle: Vehicle;
}

const SocialShareButtons: React.FC<SocialShareButtonsProps> = ({ vehicle }) => {
    const [copyStatus, setCopyStatus] = useState('Copy Link');

    const handleShare = (platform: 'facebook' | 'twitter' | 'whatsapp') => {
        const url = encodeURIComponent(window.location.href);
        const text = encodeURIComponent(`Check out this ${vehicle.year} ${vehicle.make} ${vehicle.model} on ReRide!`);
        let shareUrl = '';

        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
                break;
            case 'whatsapp':
                shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
                break;
        }
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    };
    
    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            setCopyStatus('Copied!');
            setTimeout(() => setCopyStatus('Copy Link'), 2000);
        }, () => {
            setCopyStatus('Failed!');
            setTimeout(() => setCopyStatus('Copy Link'), 2000);
        });
    };

    return (
        <div className="mt-6 pt-6 border-t border-brand-gray-200 dark:border-brand-gray-700">
            <h4 className="text-sm font-semibold text-center text-brand-gray-600 dark:text-brand-gray-400 mb-3">Share this listing</h4>
            <div className="flex justify-center items-center gap-3">
                <button onClick={() => handleShare('facebook')} aria-label="Share on Facebook" className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors">{ICONS.facebook}</button>
                <button onClick={() => handleShare('twitter')} aria-label="Share on Twitter" className="p-2 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-colors">{ICONS.twitter}</button>
                <button onClick={() => handleShare('whatsapp')} aria-label="Share on WhatsApp" className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors">{ICONS.whatsapp}</button>
                <button 
                    onClick={handleCopyLink} 
                    className="flex items-center gap-2 text-sm font-semibold bg-brand-gray-200 dark:bg-brand-gray-700 text-brand-gray-800 dark:text-brand-gray-200 px-3 py-2 rounded-full hover:bg-brand-gray-300 dark:hover:bg-brand-gray-600 transition-colors"
                >
                    {ICONS.link}
                    <span>{copyStatus}</span>
                </button>
            </div>
        </div>
    );
};

const CollapsibleSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left p-6"
                aria-expanded={isOpen}
            >
                <h3 className="text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100">{title}</h3>
                <svg className={`w-6 h-6 text-brand-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div className={`grid transition-[grid-template-rows] duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                    <div className="p-6 pt-0 border-t border-brand-gray-200 dark:border-brand-gray-700">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};


const KeySpec: React.FC<{ label: string; value: string | number; icon?: React.ReactNode }> = memo(({ label, value, icon }) => (
    <div className="flex flex-col gap-1 p-4 bg-brand-gray-100 dark:bg-brand-gray-800 rounded-lg text-center">
        {icon && <div className="text-brand-blue mx-auto mb-1">{icon}</div>}
        <span className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400">{label}</span>
        <span className="font-bold text-brand-gray-900 dark:text-brand-gray-100">{value}</span>
    </div>
));

const SpecDetail: React.FC<{ label: string; value: string | number | undefined }> = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-brand-gray-100 dark:border-brand-gray-700 last:border-b-0">
        <dt className="text-sm text-brand-gray-600 dark:text-brand-gray-400">{label}</dt>
        <dd className="text-sm font-semibold text-brand-gray-900 dark:text-brand-gray-200 text-right">{value || '-'}</dd>
    </div>
);


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
        <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center border-b dark:border-gray-700 pb-4 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44-1.22a.75.75 0 00-1.06 0L8.172 6.172a.75.75 0 00-1.06 1.06L8.94 9.332a.75.75 0 001.191.04l3.22-4.294a.75.75 0 00-.04-1.19z" clipRule="evenodd" />
                </svg>
                <div>
                    <h3 className="text-xl font-semibold text-brand-gray-800 dark:text-brand-gray-100">ReRide Certified Inspection</h3>
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
                            <div className={`${scoreColor(Number(score))} h-2.5 rounded-full`} style={{ width: `${score}%` }}></div>
                        </div>
                        <p className="text-xs text-brand-gray-500 dark:text-brand-gray-400 mt-1">{report.details[key]}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};


export const VehicleDetail: React.FC<VehicleDetailProps> = ({ vehicle, onBack: onBackToHome, comparisonList, onToggleCompare, onAddSellerRating, wishlist, onToggleWishlist, currentUser, onFlagContent, users, onViewSellerProfile, onStartChat, recommendations, onSelectVehicle }) => {
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
    onAddSellerRating(vehicle.sellerEmail, Number(rating));
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
                  {/* Left Column: Media */}
                  <div className="lg:col-span-2 space-y-4">
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
                            <SocialShareButtons vehicle={vehicle} />
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

                  </div>
              </div>
              
              {/* Collapsible Sections */}
               <div className="mt-10 lg:mt-12 space-y-6">
                    <CollapsibleSection title="Overview" defaultOpen={true}>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            <KeySpec label="Make Year" value={vehicle.year} />
                            <KeySpec label="Registration" value={vehicle.registrationYear} />
                            <KeySpec label="Fuel Type" value={vehicle.fuelType} />
                            <KeySpec label="Km Driven" value={vehicle.mileage.toLocaleString('en-IN')} />
                            <KeySpec label="Transmission" value={vehicle.transmission} />
                            <KeySpec label="Owners" value={vehicle.noOfOwners} />
                            <KeySpec label="Insurance" value={vehicle.insuranceValidity} />
                            <KeySpec label="RTO" value={vehicle.rto} />
                        </div>
                        {vehicle.description && (
                            <div>
                                <h4 className="text-lg font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-2">Description</h4>
                                <p className="text-brand-gray-700 dark:text-brand-gray-300 whitespace-pre-line">{vehicle.description}</p>
                            </div>
                        )}
                    </CollapsibleSection>
                    
                     <CollapsibleSection title="Detailed Specifications">
                        <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                             <SpecDetail label="Engine" value={vehicle.engine} />
                             <SpecDetail label="Displacement" value={vehicle.displacement} />
                             <SpecDetail label="Transmission" value={vehicle.transmission} />
                             <SpecDetail label="Fuel Type" value={vehicle.fuelType} />
                             <SpecDetail label="Mileage / Range" value={vehicle.fuelEfficiency} />
                             <SpecDetail label="Ground Clearance" value={vehicle.groundClearance} />
                             <SpecDetail label="Boot Space" value={vehicle.bootSpace} />
                             <SpecDetail label="Color" value={vehicle.color} />
                        </dl>
                    </CollapsibleSection>

                    <CollapsibleSection title="Features, Pros & Cons">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="text-lg font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-4">Included Features</h4>
                                {vehicle.features.length > 0 ? (
                                    <div className="flex flex-wrap gap-3">
                                        {vehicle.features.map(feature => (
                                          <div key={feature} className="flex items-center gap-2 text-brand-gray-700 dark:text-brand-gray-300 bg-brand-gray-100 dark:bg-brand-gray-700 px-3 py-1 rounded-full text-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                            {feature}
                                          </div>
                                        ))}
                                    </div>
                                ) : <p className="text-brand-gray-500">No features listed.</p>}
                            </div>
                             <div>
                                <h4 className="text-lg font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-4">AI Expert Analysis</h4>
                                {isGeneratingProsCons ? (
                                    <div className="flex items-center gap-2 text-brand-gray-500"><div className="w-5 h-5 border-2 border-dashed rounded-full animate-spin border-brand-blue"></div> Generating...</div>
                                ) : prosAndCons ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <h5 className="font-semibold text-green-600 mb-2">Pros</h5>
                                            <ul className="list-disc list-inside space-y-1 text-sm">{prosAndCons.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
                                        </div>
                                        <div>
                                            <h5 className="font-semibold text-red-500 mb-2">Cons</h5>
                                            <ul className="list-disc list-inside space-y-1 text-sm">{prosAndCons.cons.map((c, i) => <li key={i}>{c}</li>)}</ul>
                                        </div>
                                    </div>
                                ) : (
                                    <button onClick={handleGenerateProsCons} className="text-sm font-bold text-brand-blue hover:underline">Generate Pros & Cons</button>
                                )}
                            </div>
                        </div>
                    </CollapsibleSection>
                    
                    {vehicle.certifiedInspection && (
                        <CollapsibleSection title="Certified Inspection Report">
                            <CertifiedInspectionReport report={vehicle.certifiedInspection} />
                        </CollapsibleSection>
                    )}

                    {(vehicle.serviceRecords || vehicle.accidentHistory || vehicle.documents) && (
                        <CollapsibleSection title="Vehicle History & Documents">
                            {(vehicle.serviceRecords || vehicle.accidentHistory) && (
                                <VehicleHistory serviceRecords={vehicle.serviceRecords || []} accidentHistory={vehicle.accidentHistory || []} />
                            )}
                            {vehicle.documents && vehicle.documents.length > 0 && <div className="mt-6">
                                <h4 className="text-lg font-semibold text-brand-gray-800 dark:text-brand-gray-100 mb-4">Available Documents</h4>
                                <div className="flex flex-wrap gap-4">
                                    {vehicle.documents.map(doc => <DocumentChip key={doc.name} doc={doc} />)}
                                </div>
                            </div>}
                        </CollapsibleSection>
                    )}
               </div>

              <div className="text-center mt-12">
                  <button onClick={handleFlagClick} className="text-xs text-brand-gray-500 hover:text-red-500">Report this listing</button>
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
