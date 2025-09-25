import React from 'react';
import type { User } from '../types';
import StarRating from './StarRating';
import BadgeDisplay from './BadgeDisplay';

interface DealerProfilesProps {
  sellers: User[];
  onViewProfile: (sellerEmail: string) => void;
}

const DealerCard: React.FC<{ seller: User; onViewProfile: (sellerEmail: string) => void; }> = ({ seller, onViewProfile }) => (
    <div
        onClick={() => onViewProfile(seller.email)}
        className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft-lg p-6 flex flex-col items-center text-center cursor-pointer transform hover:-translate-y-1 hover:shadow-soft-xl transition-all duration-300"
    >
        <img
            src={seller.logoUrl || `https://i.pravatar.cc/100?u=${seller.email}`}
            alt={`${seller.dealershipName || seller.name}'s logo`}
            className="w-24 h-24 rounded-full object-cover border-4 border-brand-gray-200 dark:border-brand-gray-700 mb-4"
        />
        <h3 className="font-bold text-xl text-brand-gray-800 dark:text-brand-gray-100">{seller.dealershipName || seller.name}</h3>
        <div className="my-2">
             <BadgeDisplay badges={seller.badges || []} />
        </div>
        <div className="flex items-center gap-2 mt-1">
            <StarRating rating={seller.averageRating || 0} readOnly size="sm" />
            <span className="text-xs text-brand-gray-500 dark:text-brand-gray-400">({seller.ratingCount || 0} reviews)</span>
        </div>
        <p className="text-sm text-brand-gray-600 dark:text-brand-gray-400 mt-3 flex-grow line-clamp-3">{seller.bio}</p>
        <button className="mt-4 w-full bg-brand-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-blue-dark transition-colors">
            View Profile & Listings
        </button>
    </div>
);


const DealerProfiles: React.FC<DealerProfilesProps> = ({ sellers, onViewProfile }) => {
  return (
    <div className="container mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-4xl font-extrabold text-brand-gray-800 dark:text-brand-gray-100 mb-8 text-center">
        Certified Dealer Profiles
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sellers.map(seller => (
              <DealerCard key={seller.email} seller={seller} onViewProfile={onViewProfile} />
          ))}
          {sellers.length === 0 && (
            <div className="col-span-full text-center py-16">
              <p className="text-lg text-brand-gray-600 dark:text-brand-gray-400">No certified dealers found at the moment.</p>
            </div>
          )}
      </div>
    </div>
  );
};

export default DealerProfiles;