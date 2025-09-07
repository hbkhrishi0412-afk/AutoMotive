import React, { useState } from 'react';
import type { User, Vehicle } from '../types';
import VehicleCard from './VehicleCard';
import StarRating from './StarRating';
import QuickViewModal from './QuickViewModal';

interface SellerProfilePageProps {
    seller: User;
    vehicles: Vehicle[];
    onSelectVehicle: (vehicle: Vehicle) => void;
    comparisonList: number[];
    onToggleCompare: (id: number) => void;
    wishlist: number[];
    onToggleWishlist: (id: number) => void;
    onBack: () => void;
    onViewSellerProfile: (sellerEmail: string) => void;
}

const SellerProfilePage: React.FC<SellerProfilePageProps> = ({ seller, vehicles, onSelectVehicle, comparisonList, onToggleCompare, wishlist, onToggleWishlist, onBack, onViewSellerProfile }) => {
    const [quickViewVehicle, setQuickViewVehicle] = useState<Vehicle | null>(null);

    return (
        <div className="animate-fade-in container mx-auto px-4 py-8">
            <button onClick={onBack} className="mb-6 bg-white dark:bg-brand-gray-800 text-brand-gray-700 dark:text-brand-gray-200 font-bold py-2 px-4 rounded-lg hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 transition-colors shadow-soft">
                &larr; Back
            </button>
            
            <header className="bg-white dark:bg-brand-gray-800 p-8 rounded-xl shadow-soft-lg mb-8 flex flex-col md:flex-row items-center gap-8">
                <img 
                    src={seller.logoUrl || `https://i.pravatar.cc/150?u=${seller.email}`} 
                    alt={`${seller.dealershipName || seller.name} logo`} 
                    className="w-32 h-32 rounded-full object-cover border-4 border-brand-blue-light shadow-lg"
                />
                <div>
                    <h1 className="text-4xl font-extrabold text-brand-gray-800 dark:text-brand-gray-100">{seller.dealershipName || seller.name}</h1>
                    {seller.bio && <p className="mt-2 text-brand-gray-600 dark:text-brand-gray-300 max-w-2xl">{seller.bio}</p>}
                    <div className="flex items-center gap-2 mt-4">
                        <StarRating rating={seller.averageRating || 0} readOnly />
                        <span className="text-brand-gray-600 dark:text-brand-gray-400 font-semibold">
                            {seller.averageRating?.toFixed(1) || 'No Rating'} ({seller.ratingCount || 0} ratings)
                        </span>
                    </div>
                </div>
            </header>

            <h2 className="text-3xl font-bold text-brand-gray-800 dark:text-brand-gray-100 mb-6">Listings from this Seller ({vehicles.length})</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {vehicles.length > 0 ? (
                    vehicles.map(vehicle => (
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
                    ))
                ) : (
                    <div className="col-span-full text-center py-16 bg-white dark:bg-brand-gray-800 rounded-xl shadow-soft-lg">
                        <h3 className="text-xl font-semibold text-brand-gray-700 dark:text-brand-gray-200">No active listings</h3>
                        <p className="text-brand-gray-500 dark:text-brand-gray-400 mt-2">This seller currently has no vehicles for sale.</p>
                    </div>
                )}
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
        </div>
    );
};

export default SellerProfilePage;
