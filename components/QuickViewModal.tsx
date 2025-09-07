import React, { useState, useEffect, memo } from 'react';
import type { Vehicle } from '../types';

// KeySpec component copied for reuse
const KeySpec: React.FC<{ label: string; value: string | number; }> = memo(({ label, value }) => (
    <div className="flex justify-between items-baseline py-2 border-b border-brand-gray-100 dark:border-brand-gray-700">
        <span className="text-sm font-medium text-brand-gray-600 dark:text-brand-gray-400">{label}</span>
        <span className="font-bold text-brand-gray-900 dark:text-brand-gray-100 text-right">{value}</span>
    </div>
));

interface QuickViewModalProps {
  vehicle: Vehicle | null;
  onClose: () => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  onToggleCompare: (id: number) => void;
  onToggleWishlist: (id: number) => void;
  comparisonList: number[];
  wishlist: number[];
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ vehicle, onClose, onSelectVehicle, onToggleCompare, onToggleWishlist, comparisonList, wishlist }) => {
  const [mainImage, setMainImage] = useState('');

  useEffect(() => {
    if (vehicle) {
      setMainImage(vehicle.images[0]);
    }
  }, [vehicle]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  if (!vehicle) {
    return null;
  }

  const isComparing = comparisonList.includes(vehicle.id);
  const isInWishlist = wishlist.includes(vehicle.id);
  const isCompareDisabled = !isComparing && comparisonList.length >= 4;

  const handleFullDetailsClick = () => {
      onSelectVehicle(vehicle);
      onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100] p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-2 right-2 text-white md:text-brand-gray-500 bg-black/30 md:bg-transparent rounded-full w-8 h-8 flex items-center justify-center hover:text-brand-gray-800 dark:hover:text-white z-10 text-2xl">&times;</button>
        
        {/* Image Section */}
        <div className="w-full md:w-1/2 p-4 flex flex-col">
          <img src={mainImage} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-64 md:h-auto object-cover rounded-lg flex-grow" />
          <div className="grid grid-cols-5 gap-2 mt-2">
            {vehicle.images.slice(0, 5).map((img, index) => (
              <img
                key={index}
                src={img}
                alt={`Thumbnail ${index + 1}`}
                className={`cursor-pointer rounded-md border-2 h-16 w-full object-cover ${mainImage === img ? 'border-brand-blue' : 'border-transparent'} hover:border-brand-blue-light transition`}
                onClick={() => setMainImage(img)}
              />
            ))}
          </div>
        </div>
        
        {/* Details Section */}
        <div className="w-full md:w-1/2 p-6 flex flex-col overflow-y-auto">
          <div>
            <h2 className="text-3xl font-bold text-brand-gray-900 dark:text-brand-gray-100">{vehicle.year} {vehicle.make} {vehicle.model}</h2>
            <p className="text-brand-gray-500 dark:text-brand-gray-400">{vehicle.variant || ''}</p>
            <p className="text-3xl font-extrabold text-brand-blue dark:text-brand-blue-light my-4">₹{vehicle.price.toLocaleString('en-IN')}</p>
          </div>

          <div className="space-y-2 my-4">
            <KeySpec label="Mileage" value={`${vehicle.mileage.toLocaleString('en-IN')} kms`} />
            <KeySpec label="Fuel Type" value={vehicle.fuelType} />
            <KeySpec label="Transmission" value={vehicle.transmission} />
            <KeySpec label="Registration Year" value={vehicle.registrationYear} />
            <KeySpec label="No. of Owners" value={vehicle.noOfOwners} />
          </div>

          <div className="mt-auto pt-6 space-y-3">
             <button onClick={handleFullDetailsClick} className="w-full bg-brand-blue text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-brand-blue-dark transition-all transform hover:scale-105">
                View Full Details
            </button>
            <div className="flex gap-3">
                <button
                    onClick={() => onToggleWishlist(vehicle.id)}
                    className={`w-full font-bold py-3 px-6 rounded-lg text-lg transition-all flex items-center justify-center gap-2 ${isInWishlist ? 'bg-pink-100 text-pink-600' : 'bg-brand-gray-200 dark:bg-brand-gray-700'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>
                    Wishlist
                </button>
                 <button
                    onClick={() => onToggleCompare(vehicle.id)}
                    disabled={isCompareDisabled}
                    className={`w-full font-bold py-3 px-6 rounded-lg text-lg transition-all ${isComparing ? 'bg-indigo-100 text-indigo-600' : 'bg-brand-gray-200 dark:bg-brand-gray-700'} ${isCompareDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    Compare
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickViewModal;
