import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import type { Vehicle, User, Conversation, VehicleData, ChatMessage, VehicleDocument } from './types';
import { VehicleCategory, View } from './types';
import { generateVehicleDescription, getAiVehicleSuggestions } from './services/geminiService';
import VehicleCard from './components/VehicleCard';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, LineController, BarController } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import AiAssistant from './components/AiAssistant';
import { ChatWidget } from './components/ChatWidget';
import { INDIAN_STATES, CITIES_BY_STATE, PLAN_DETAILS } from './constants';
import BulkUploadModal from './components/BulkUploadModal';
import { getPlaceholderImage } from './components/vehicleData';
import PricingGuidance from './components/PricingGuidance';
import { OfferModal, OfferMessage } from './components/ReadReceiptIcon';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, LineController, BarController);


interface DashboardProps {
  seller: User;
  sellerVehicles: Vehicle[];
  allVehicles: Vehicle[];
  reportedVehicles: Vehicle[];
  onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>, isFeaturing: boolean) => void;
  onAddMultipleVehicles: (vehicles: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>[]) => void;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (vehicleId: number) => void;
  onMarkAsSold: (vehicleId: number) => void;
  conversations: Conversation[];
  onSellerSendMessage: (conversationId: string, messageText: string, type?: ChatMessage['type'], payload?: any) => void;
  onMarkConversationAsReadBySeller: (conversationId: string) => void;
  typingStatus: { conversationId: string; userRole: 'customer' | 'seller' } | null;
  onUserTyping: (conversationId: string, userRole: 'customer' | 'seller') => void;
  onMarkMessagesAsRead: (conversationId: string, readerRole: 'customer' | 'seller') => void;
  onUpdateSellerProfile: (details: { dealershipName: string; bio: string; logoUrl: string; }) => void;
  vehicleData: VehicleData;
  onFeatureListing: (vehicleId: number) => void;
  onRequestCertification: (vehicleId: number) => void;
  onNavigate: (view: View) => void;
  onTestDriveResponse?: (conversationId: string, messageId: number, newStatus: 'confirmed' | 'rejected') => void;
  onOfferResponse: (conversationId: string, messageId: number, response: 'accepted' | 'rejected' | 'countered', counterPrice?: number) => void;
}

type DashboardView = 'overview' | 'listings' | 'form' | 'inquiries' | 'analytics' | 'salesHistory' | 'profile' | 'reports';

const HelpTooltip: React.FC<{ text: string }> = memo(({ text }) => (
    <span className="group relative ml-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span className="absolute bottom-full mb-2 w-48 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 left-1/2 -translate-x-1/2 z-10">{text}</span>
    </span>
));

const FormInput: React.FC<{ label: string; name: keyof Vehicle | 'summary'; type?: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void; onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void; error?: string; tooltip?: string; required?: boolean; children?: React.ReactNode; disabled?: boolean; placeholder?: string; rows?: number }> = 
  ({ label, name, type = 'text', value, onChange, onBlur, error, tooltip, required = false, children, disabled = false, placeholder, rows }) => (
  <div>
    <label htmlFor={String(name)} className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        {tooltip && <HelpTooltip text={tooltip} />}
    </label>
    {type === 'select' ? (
        <select id={String(name)} name={String(name)} value={String(value)} onChange={onChange} required={required} disabled={disabled} className={`block w-full p-3 border rounded-lg focus:ring-2 focus:outline-none transition bg-white dark:bg-brand-gray-darker dark:text-gray-200 disabled:bg-gray-100 dark:disabled:bg-gray-800 ${error ? 'border-red-500 focus:ring-red-300' : 'border-brand-gray dark:border-gray-600 focus:ring-brand-blue-light'}`}>
            {children}
        </select>
    ) : type === 'textarea' ? (
        <textarea id={String(name)} name={String(name)} value={String(value)} onChange={onChange} required={required} disabled={disabled} placeholder={placeholder} rows={rows} className={`block w-full p-3 border rounded-lg focus:ring-2 focus:outline-none transition bg-white dark:bg-brand-gray-darker dark:text-gray-200 disabled:bg-gray-100 dark:disabled:bg-gray-800 ${error ? 'border-red-500 focus:ring-red-300' : 'border-brand-gray dark:border-gray-600 focus:ring-brand-blue-light'}`} />
    ) : (
        <input type={type} id={String(name)} name={String(name)} value={value} onChange={onChange} onBlur={onBlur} required={required} disabled={disabled} placeholder={placeholder} className={`block w-full p-3 border rounded-lg focus:ring-2 focus:outline-none transition bg-white dark:bg-brand-gray-darker dark:text-gray-200 disabled:bg-gray-100 dark:disabled:bg-gray-800 ${error ? 'border-red-500 focus:ring-red-300' : 'border-brand-gray dark:border-gray-600 focus:ring-brand-blue-light'}`} />
    )}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);


const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = memo(({ title, value, icon }) => (
  <div className="bg-white dark:bg-brand-gray-dark p-6 rounded-lg shadow-md flex items-center">
    <div className="bg-brand-blue-lightest p-3 rounded-full mr-4">{icon}</div>
    <div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  </div>
));

const PlanStatusCard: React.FC<{
    seller: User;
    activeListingsCount: number;
    onNavigate: (view: View) => void;
}> = memo(({ seller, activeListingsCount, onNavigate }) => {
    const plan = PLAN_DETAILS[seller.subscriptionPlan || 'free'];
    const listingLimit = plan.listingLimit === 'unlimited' ? Infinity : plan.listingLimit;
    const usagePercentage = listingLimit === Infinity ? 0 : (activeListingsCount / listingLimit) * 100;

    return (
        <div className="bg-gradient-to-br from-indigo-500 to-blue-600 dark:from-indigo-700 dark:to-blue-800 text-white p-6 rounded-lg shadow-lg flex flex-col h-full">
            <h3 className="text-lg font-bold flex justify-between items-center">
                <span>Your Plan: <span className="text-yellow-300">{plan.name}</span></span>
            </h3>
            <div className="mt-4 space-y-3 text-sm flex-grow">
                <div className="flex justify-between">
                    <span>Active Listings:</span>
                    <span className="font-semibold">{activeListingsCount} / {plan.listingLimit === 'unlimited' ? '∞' : plan.listingLimit}</span>
                </div>
                <div className="w-full bg-blue-400/50 rounded-full h-2 mb-2">
                    <div
                        className="bg-yellow-300 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    ></div>
                </div>
                <div className="flex justify-between">
                    <span>Featured Credits:</span>
                    <span className="font-semibold">{seller.featuredCredits ?? 0} remaining</span>
                </div>
                 <div className="flex justify-between">
                    <span>Free Certifications:</span>
                    <span className="font-semibold">{plan.freeCertifications - (seller.usedCertifications || 0)} remaining</span>
                </div>

                <div className="mt-4 pt-4 border-t border-white/20">
                    <h4 className="font-semibold mb-2">Plan Features:</h4>
                    <ul className="space-y-2 text-xs">
                        {plan.features.map(feature => (
                            <li key={feature} className="flex items-start">
                                <svg className="w-4 h-4 text-green-300 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                                </svg>
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            {plan.id !== 'premium' && (
                <button
                    onClick={() => onNavigate(View.PRICING)}
                    className="mt-6 w-full bg-white text-indigo-600 font-bold py-2 px-4 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    Upgrade Plan
                </button>
            )}
        </div>
    );
});

const initialFormState: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'> = {
  make: '', model: '', variant: '', year: new Date().getFullYear(), price: 0, mileage: 0,
  description: '', engine: '', transmission: 'Automatic', fuelType: 'Petrol', fuelEfficiency: '',
  color: '', features: [], images: [], documents: [],
  sellerEmail: '',
  category: VehicleCategory.FOUR_WHEELER,
  status: 'published',
  isFeatured: false,
  registrationYear: new Date().getFullYear(),
  insuranceValidity: '',
  insuranceType: 'Comprehensive',
  rto: '',
  city: '',
  state: '',
  noOfOwners: 1,
  displacement: '',
  groundClearance: '',
  bootSpace: '',
  qualityReport: {
    summary: '',
    fixesDone: [],
  },
  certifiedInspection: null,
  certificationStatus: 'none',
};

const FormFieldset: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(true);
    return (
        <fieldset className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <legend className="px-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
                <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2">
                    <span>{isOpen ? '▼' : '►'}</span>
                    {title}
                </button>
            </legend>
            {isOpen && <div className="mt-4 animate-fade-in">{children}</div>}
        </fieldset>
    );
};

interface VehicleFormProps {
    seller: User;
    editingVehicle: Vehicle | null;
    allVehicles: Vehicle[];
    onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>, isFeaturing: boolean) => void;
    onUpdateVehicle: (vehicle: Vehicle) => void;
    onFeatureListing: (vehicleId: number) => void;
    onCancel: () => void;
    vehicleData: VehicleData;
}

const VehicleForm: React.FC<VehicleFormProps> = memo(({ editingVehicle, onAddVehicle, onUpdateVehicle, onCancel, vehicleData, seller, onFeatureListing, allVehicles }) => {
    const [formData, setFormData] = useState(editingVehicle ? { ...initialFormState, ...editingVehicle, sellerEmail: editingVehicle.sellerEmail } : initialFormState);
    const [featureInput, setFeatureInput] = useState('');
    const [fixInput, setFixInput] = useState('');
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>, string>>>({});
    const [isUploading, setIsUploading] = useState(false);
    const [isFeaturing, setIsFeaturing] = useState(false);
    
    const [aiSuggestions, setAiSuggestions] = useState<{
        structuredSpecs: Partial<Pick<Vehicle, 'engine' | 'transmission' | 'fuelType' | 'fuelEfficiency' | 'displacement' | 'groundClearance' | 'bootSpace'>>;
        featureSuggestions: Record<string, string[]>;
    } | null>(null);
    const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

    const availableMakes = useMemo(() => {
        if (!formData.category || !vehicleData[formData.category]) return [];
        return vehicleData[formData.category].map(make => make.name).sort();
    }, [formData.category, vehicleData]);

    const availableModels = useMemo(() => {
        if (!formData.category || !formData.make || !vehicleData[formData.category]) return [];
        const makeData = vehicleData[formData.category].find(m => m.name === formData.make);
        return makeData ? makeData.models.map(model => model.name).sort() : [];
    }, [formData.category, formData.make, vehicleData]);

    const availableVariants = useMemo(() => {
        if (!formData.category || !formData.make || !formData.model || !vehicleData[formData.category]) return [];
        const makeData = vehicleData[formData.category].find(m => m.name === formData.make);
        const modelData = makeData?.models.find(m => m.name === formData.model);
        return modelData ? [...modelData.variants].sort() : [];
    }, [formData.category, formData.make, formData.model, vehicleData]);

    const availableCities = useMemo(() => {
        if (!formData.state || !CITIES_BY_STATE[formData.state]) return [];
        return CITIES_BY_STATE[formData.state].sort();
    }, [formData.state]);

    const handleGetAiSuggestions = async () => {
        const { make, model, year, variant } = formData;
        if (!make || !model || !year) {
            alert('Please select a Make, Model, and Year first.');
            return;
        }
        
        setIsGeneratingSuggestions(true);
        setAiSuggestions(null);
        try {
            const suggestions = await getAiVehicleSuggestions({ make, model, year, variant });
            setAiSuggestions(suggestions);

            // Auto-apply structured specs if the fields are empty
            if (suggestions.structuredSpecs) {
                const updates: Partial<Vehicle> = {};
                for (const key in suggestions.structuredSpecs) {
                    const specKey = key as keyof typeof suggestions.structuredSpecs;
                    if (!formData[specKey] || formData[specKey] === 'N/A') {
                        updates[specKey] = suggestions.structuredSpecs[specKey];
                    }
                }
                if (Object.keys(updates).length > 0) {
                    setFormData(prev => ({ ...prev, ...updates }));
                }
            }
        } catch (error) {
            console.error("Failed to fetch AI suggestions:", error);
            setAiSuggestions({ structuredSpecs: {}, featureSuggestions: { "Error": ["Could not fetch suggestions."] } });
        } finally {
            setIsGeneratingSuggestions(false);
        }
    };
    
    const validateField = (name: keyof Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>, value: any): string => {
      switch(name) {
          case 'make': case 'model': return value.trim().length < 2 ? `${name} must be at least 2 characters long.` : '';
          case 'year': return value < 1900 || value > new Date().getFullYear() + 1 ? 'Please enter a valid year.' : '';
          case 'price': return value <= 0 ? 'Price must be greater than 0.' : '';
          case 'mileage': return value < 0 ? 'Mileage cannot be negative.' : '';
          default: return '';
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target as { name: keyof typeof initialFormState; value: string };
      
      const isNumeric = ['year', 'price', 'mileage', 'noOfOwners', 'registrationYear'].includes(name);
      const parsedValue = isNumeric ? parseInt(value, 10) || 0 : value;

      setFormData(prev => {
        const newState = { ...prev, [name]: parsedValue };
        if (name === 'category') {
            newState.make = ''; newState.model = ''; newState.variant = '';
        } else if (name === 'make') {
            newState.model = ''; newState.variant = '';
        } else if (name === 'model') {
            newState.variant = '';
        } else if (name === 'state') {
            newState.city = '';
        }
        return newState;
      });

      const error = validateField(name, parsedValue);
      setErrors(prev => ({...prev, [name]: error}));
    };

    const handleQualityReportChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            qualityReport: {
                ...(prev.qualityReport!),
                [name]: value,
            },
        }));
    };
    
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target as { name: keyof typeof initialFormState; value: string };
        const parsedValue = ['year', 'price', 'mileage'].includes(name) ? parseInt(value) || 0 : value;
        const error = validateField(name, parsedValue);
        setErrors(prev => ({...prev, [name]: error}));
    };
  
    const handleAddFeature = () => {
      if (featureInput.trim() && !formData.features.includes(featureInput.trim())) {
        setFormData(prev => ({ ...prev, features: [...prev.features, featureInput.trim()] }));
        setFeatureInput('');
      }
    };
  
    const handleRemoveFeature = (featureToRemove: string) => {
      setFormData(prev => ({ ...prev, features: prev.features.filter(f => f !== featureToRemove) }));
    };

    const handleAddFix = () => {
        if (fixInput.trim() && !formData.qualityReport?.fixesDone.includes(fixInput.trim())) {
            setFormData(prev => ({
                ...prev,
                qualityReport: {
                    summary: prev.qualityReport?.summary || '',
                    fixesDone: [...(prev.qualityReport?.fixesDone || []), fixInput.trim()]
                }
            }));
            setFixInput('');
        }
    };

    const handleRemoveFix = (fixToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            qualityReport: {
                summary: prev.qualityReport?.summary || '',
                fixesDone: (prev.qualityReport?.fixesDone || []).filter(f => f !== fixToRemove)
            }
        }));
    };

    const handleSuggestedFeatureToggle = (feature: string) => {
        setFormData(prev => {
            const currentFeatures = prev.features;
            const newFeatures = currentFeatures.includes(feature)
                ? currentFeatures.filter(f => f !== feature)
                : [...currentFeatures, feature];
            return { ...prev, features: newFeatures.sort() };
        });
    };
    
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document') => {
        const input = e.target;
        if (!input.files) return;

        setIsUploading(true);
        const files = Array.from(input.files);
        
        const readPromises = files.map((file: File) => new Promise<{ fileName: string, url: string }>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    resolve({ fileName: file.name, url: reader.result });
                } else {
                    reject(new Error('File read error.'));
                }
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        }));

        try {
            const results = await Promise.all(readPromises);
            if (type === 'image') {
                setFormData(prev => ({ ...prev, images: [...prev.images, ...results.map(r => r.url)] }));
            } else {
                 const docType = (document.getElementById('document-type') as HTMLSelectElement).value as VehicleDocument['name'];
                 const newDocs: VehicleDocument[] = results.map(r => ({ name: docType, url: r.url, fileName: r.fileName }));
                 setFormData(prev => ({ ...prev, documents: [...(prev.documents || []), ...newDocs] }));
            }
        } catch (error) { console.error("Error reading files:", error); } 
        finally {
            setIsUploading(false);
            if (input) input.value = '';
        }
    };
  
    const handleRemoveImageUrl = (urlToRemove: string) => {
      setFormData(prev => ({...prev, images: prev.images.filter(url => url !== urlToRemove)}));
    };

    const handleRemoveDocument = (urlToRemove: string) => {
        setFormData(prev => ({ ...prev, documents: (prev.documents || []).filter(doc => doc.url !== urlToRemove) }));
    };
  
    const handleGenerateDescription = async () => {
      if (!formData.make || !formData.model || !formData.year) {
        alert('Please enter Make, Model, and Year before generating a description.');
        return;
      }
      setIsGeneratingDesc(true);
      try {
        const description = await generateVehicleDescription(formData);
        if (description.includes("Failed to generate")) alert(description);
        else setFormData(prev => ({ ...prev, description }));
      } catch (error) { console.error(error); alert('There was an error generating the description.'); }
      finally { setIsGeneratingDesc(false); }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingVehicle) {
            onUpdateVehicle({ ...editingVehicle, ...formData });
            if (isFeaturing && !editingVehicle.isFeatured) {
                onFeatureListing(editingVehicle.id);
            }
        } else {
            onAddVehicle(formData, isFeaturing);
        }
        onCancel();
    };

    const previewVehicle: Vehicle = {
        id: editingVehicle?.id || Date.now(),
        averageRating: 0, ratingCount: 0,
        ...formData,
        images: formData.images.length > 0 ? formData.images : [getPlaceholderImage(formData.make, formData.model)],
    };

    const applyAiSpec = (specKey: keyof typeof aiSuggestions.structuredSpecs) => {
        if (aiSuggestions?.structuredSpecs[specKey]) {
            setFormData(prev => ({ ...prev, [specKey]: aiSuggestions.structuredSpecs[specKey] }));
        }
    };

    return (
      <div className="bg-white dark:bg-brand-gray-dark p-6 sm:p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 border-b dark:border-gray-700 pb-4">
          {editingVehicle ? 'Edit Vehicle Listing' : 'List a New Vehicle'}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Form Column */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <FormFieldset title="Vehicle Overview">
                <div className="flex justify-between items-center mb-4 -mt-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Enter core details about your vehicle.</p>
                    <button type="button" onClick={handleGetAiSuggestions} disabled={isGeneratingSuggestions || !formData.make || !formData.model || !formData.year} className="text-sm font-semibold text-indigo-600 disabled:opacity-50 flex items-center gap-1">
                        {isGeneratingSuggestions ? (<><div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-current"></div><span>Generating...</span></>) : '✨ Auto-fill with AI'}
                    </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                    <FormInput label="Category" name="category" type="select" value={formData.category} onChange={handleChange} required>
                        {Object.values(VehicleCategory).map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                    </FormInput>
                    <FormInput label="Make" name="make" type="select" value={formData.make} onChange={handleChange} error={errors.make} disabled={!formData.category} required>
                        <option value="" disabled>Select Make</option>
                        {availableMakes.map(make => <option key={make} value={make}>{make}</option>)}
                    </FormInput>
                    <FormInput label="Model" name="model" type="select" value={formData.model} onChange={handleChange} error={errors.model} disabled={!formData.make} required>
                        <option value="" disabled>Select Model</option>
                        {availableModels.map(model => <option key={model} value={model}>{model}</option>)}
                    </FormInput>
                    <FormInput label="Variant" name="variant" type="select" value={formData.variant || ''} onChange={handleChange} disabled={!formData.model}>
                        <option value="">Select Variant (Optional)</option>
                        {availableVariants.map(variant => <option key={variant} value={variant}>{variant}</option>)}
                    </FormInput>
                    <FormInput label="Make Year" name="year" type="number" value={formData.year} onChange={handleChange} onBlur={handleBlur} error={errors.year} required />
                    <FormInput label="Registration Year" name="registrationYear" type="number" value={formData.registrationYear} onChange={handleChange} required />
                    <div>
                        <FormInput label="Price (₹)" name="price" type="number" value={formData.price} onChange={handleChange} onBlur={handleBlur} error={errors.price} tooltip="Enter the listing price without commas or symbols." required />
                        {/* <PricingGuidance vehicleDetails={formData} allVehicles={allVehicles} /> */}
                    </div>
                    <FormInput label="Km Driven" name="mileage" type="number" value={formData.mileage} onChange={handleChange} onBlur={handleBlur} error={errors.mileage} />
                    <FormInput label="No. of Owners" name="noOfOwners" type="number" value={formData.noOfOwners} onChange={handleChange} />
                    <FormInput label="RTO" name="rto" value={formData.rto} onChange={handleChange} placeholder="e.g., MH01" />
                    <FormInput label="State" name="state" type="select" value={formData.state} onChange={handleChange} required>
                        <option value="" disabled>Select State</option>
                        {INDIAN_STATES.map(s => <option key={s.code} value={s.code}>{s.name}</option>)}
                    </FormInput>
                    <FormInput label="City" name="city" type="select" value={formData.city} onChange={handleChange} disabled={!formData.state} required>
                        <option value="" disabled>Select City</option>
                        {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                    </FormInput>
                    <FormInput label="Insurance Type" name="insuranceType" type="select" value={formData.insuranceType} onChange={handleChange}>
                        <option>Comprehensive</option>
                        <option>Third Party</option>
                    </FormInput>
                </div>
            </FormFieldset>
          </form>
        </div>
      </div>
    );
});

const Dashboard: React.FC<DashboardProps> = (props) => {
    // ... main dashboard logic
    return <div>Dashboard Content</div>;
};

export default Dashboard;
