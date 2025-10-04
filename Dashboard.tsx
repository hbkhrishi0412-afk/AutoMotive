import React, { useState, useMemo, useEffect, useRef, memo } from 'react';
import type { Vehicle, User, Conversation, VehicleData, ChatMessage, VehicleDocument } from '../types';
import { VehicleCategory, View } from '../types';
import { generateVehicleDescription, getAiVehicleSuggestions } from '../services/geminiService';
import VehicleCard from './VehicleCard';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, LineController, BarController } from 'chart.js';
import AiAssistant from './AiAssistant';
import ChatWidget from './ChatWidget';
import { INDIAN_STATES, CITIES_BY_STATE, PLAN_DETAILS } from '../constants';
import BulkUploadModal from './BulkUploadModal';
import { getPlaceholderImage } from './vehicleData';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, LineController, BarController);
import { Bar, Line } from 'react-chartjs-2';


interface DashboardProps {
  seller: User;
  sellerVehicles: Vehicle[];
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
    <div className="bg-brand-blue-light p-3 rounded-full mr-4">{icon}</div>
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
                <div className="w-full bg-blue-400/50 rounded-full h-2">
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
    onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>, isFeaturing: boolean) => void;
    onUpdateVehicle: (vehicle: Vehicle) => void;
    onFeatureListing: (vehicleId: number) => void;
    onCancel: () => void;
    vehicleData: VehicleData;
}

const VehicleForm: React.FC<VehicleFormProps> = memo(({ editingVehicle, onAddVehicle, onUpdateVehicle, onCancel, vehicleData, seller, onFeatureListing }) => {
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
            reader.onloadend = () => typeof reader.result === 'string' ? resolve({ fileName: file.name, url: reader.result }) : reject(new Error('File read error.'));
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
                        <option>Expired</option>
                    </FormInput>
                    <FormInput label="Insurance Validity" name="insuranceValidity" value={formData.insuranceValidity} onChange={handleChange} placeholder="e.g., Aug 2026" />
                </div>
            </FormFieldset>
            
            <FormFieldset title="Vehicle Specifications">
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
                    <div>
                        <FormInput label="Engine" name="engine" value={formData.engine} onChange={handleChange} tooltip="e.g., 1.5L Petrol, 150kW Motor"/>
                        {aiSuggestions?.structuredSpecs.engine && formData.engine !== aiSuggestions.structuredSpecs.engine && (<button type="button" onClick={() => applyAiSpec('engine')} className="text-xs text-indigo-500 hover:underline mt-1">Apply: "{aiSuggestions.structuredSpecs.engine}"</button>)}
                    </div>
                    <div>
                        <FormInput label="Displacement" name="displacement" value={formData.displacement} onChange={handleChange} placeholder="e.g., 1497 cc"/>
                        {aiSuggestions?.structuredSpecs.displacement && formData.displacement !== aiSuggestions.structuredSpecs.displacement && (<button type="button" onClick={() => applyAiSpec('displacement')} className="text-xs text-indigo-500 hover:underline mt-1">Apply: "{aiSuggestions.structuredSpecs.displacement}"</button>)}
                    </div>
                     <div>
                        <FormInput label="Transmission" name="transmission" type="select" value={formData.transmission} onChange={handleChange}>
                            <option>Automatic</option><option>Manual</option><option>CVT</option><option>DCT</option>
                        </FormInput>
                        {aiSuggestions?.structuredSpecs.transmission && formData.transmission !== aiSuggestions.structuredSpecs.transmission && (<button type="button" onClick={() => applyAiSpec('transmission')} className="text-xs text-indigo-500 hover:underline mt-1">Apply: "{aiSuggestions.structuredSpecs.transmission}"</button>)}
                    </div>
                    <div>
                        <FormInput label="Fuel Type" name="fuelType" type="select" value={formData.fuelType} onChange={handleChange}>
                            <option>Petrol</option><option>Diesel</option><option>Electric</option><option>CNG</option><option>Hybrid</option>
                        </FormInput>
                         {aiSuggestions?.structuredSpecs.fuelType && formData.fuelType !== aiSuggestions.structuredSpecs.fuelType && (<button type="button" onClick={() => applyAiSpec('fuelType')} className="text-xs text-indigo-500 hover:underline mt-1">Apply: "{aiSuggestions.structuredSpecs.fuelType}"</button>)}
                    </div>
                    <div>
                        <FormInput label="Mileage / Range" name="fuelEfficiency" value={formData.fuelEfficiency} onChange={handleChange} tooltip="e.g., 18 KMPL or 300 km range"/>
                         {aiSuggestions?.structuredSpecs.fuelEfficiency && formData.fuelEfficiency !== aiSuggestions.structuredSpecs.fuelEfficiency && (<button type="button" onClick={() => applyAiSpec('fuelEfficiency')} className="text-xs text-indigo-500 hover:underline mt-1">Apply: "{aiSuggestions.structuredSpecs.fuelEfficiency}"</button>)}
                    </div>
                     <div>
                        <FormInput label="Ground Clearance" name="groundClearance" value={formData.groundClearance} onChange={handleChange} placeholder="e.g., 190 mm"/>
                        {aiSuggestions?.structuredSpecs.groundClearance && formData.groundClearance !== aiSuggestions.structuredSpecs.groundClearance && (<button type="button" onClick={() => applyAiSpec('groundClearance')} className="text-xs text-indigo-500 hover:underline mt-1">Apply: "{aiSuggestions.structuredSpecs.groundClearance}"</button>)}
                    </div>
                    <div>
                        <FormInput label="Boot Space" name="bootSpace" value={formData.bootSpace} onChange={handleChange} placeholder="e.g., 433 litres"/>
                        {aiSuggestions?.structuredSpecs.bootSpace && formData.bootSpace !== aiSuggestions.structuredSpecs.bootSpace && (<button type="button" onClick={() => applyAiSpec('bootSpace')} className="text-xs text-indigo-500 hover:underline mt-1">Apply: "{aiSuggestions.structuredSpecs.bootSpace}"</button>)}
                    </div>
                    <FormInput label="Color" name="color" value={formData.color} onChange={handleChange} onBlur={handleBlur} />
                 </div>
            </FormFieldset>

            <FormFieldset title="Quality Report">
                <div className="space-y-4">
                    <FormInput label="Summary" name="summary" type="textarea" value={formData.qualityReport?.summary || ''} onChange={handleQualityReportChange} rows={3} placeholder="e.g., Excellent condition, single owner, full service history..."/>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fixes Done / Upgrades</label>
                        <div className="flex gap-2">
                            <input type="text" value={fixInput} onChange={(e) => setFixInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFix(); } }} placeholder="e.g., New tires installed" className="flex-grow p-3 border border-brand-gray dark:border-gray-600 rounded-lg" />
                            <button type="button" onClick={handleAddFix} className="bg-gray-200 dark:bg-gray-600 font-bold py-2 px-4 rounded-lg">Add Fix</button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {(formData.qualityReport?.fixesDone || []).map(fix => (
                                <span key={fix} className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-2">
                                    {fix}
                                    <button type="button" onClick={() => handleRemoveFix(fix)}>&times;</button>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </FormFieldset>
            
            <FormFieldset title="Media, Documents & Description">
                <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Images</label>
                        <div className="mt-1">
                            <label htmlFor="file-upload" className={`relative cursor-pointer bg-white dark:bg-brand-gray-darker rounded-lg border-2 border-gray-300 dark:border-gray-600 border-dashed hover:border-brand-blue dark:hover:border-brand-blue-light transition-colors duration-200 flex flex-col items-center justify-center text-center p-6 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="mt-2 block text-sm font-semibold text-brand-blue">
                                    {isUploading ? 'Uploading...' : 'Upload images'}
                                </span>
                                <input id="file-upload" type="file" className="sr-only" multiple accept="image/png, image/jpeg" onChange={(e) => handleFileUpload(e, 'image')} disabled={isUploading} />
                            </label>
                        </div>
                        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                            {formData.images.map((url, index) => (
                                <div key={index} className="relative group">
                                    <img src={url} className="w-full h-24 object-cover rounded-lg shadow-sm" alt={`Vehicle thumbnail ${index + 1}`} />
                                    <button type="button" onClick={() => handleRemoveImageUrl(url)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100">&times;</button>
                                </div>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Documents</label>
                        <div className="mt-1 flex items-center gap-2">
                             <select id="document-type" className="p-3 border rounded-lg bg-white dark:bg-brand-gray-darker dark:text-gray-200 border-brand-gray dark:border-gray-600">
                                <option>Registration Certificate (RC)</option>
                                <option>Insurance</option>
                                <option>Pollution Under Control (PUC)</option>
                                <option>Service Record</option>
                                <option>Other</option>
                            </select>
                            <label htmlFor="doc-upload" className={`cursor-pointer font-semibold text-white py-2 px-4 rounded-lg transition-colors ${isUploading ? 'bg-gray-400' : 'bg-brand-blue hover:bg-brand-blue-dark'}`}>
                                {isUploading ? '...' : 'Upload'}
                                <input id="doc-upload" type="file" className="sr-only" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileUpload(e, 'document')} disabled={isUploading} />
                            </label>
                        </div>
                         <div className="mt-2 flex flex-wrap gap-2">
                            {(formData.documents || []).map(doc => (
                                <span key={doc.url} className="bg-gray-200 dark:bg-gray-700 text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-2">
                                    {doc.fileName} ({doc.name})
                                    <button type="button" onClick={() => handleRemoveDocument(doc.url)}>&times;</button>
                                </span>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key Features</label>
                        <div className="flex gap-2">
                            <input type="text" value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }} placeholder="e.g., Sunroof" className="flex-grow p-3 border border-brand-gray dark:border-gray-600 rounded-lg" />
                            <button type="button" onClick={handleAddFeature} className="bg-gray-200 dark:bg-gray-600 font-bold py-2 px-4 rounded-lg">Add</button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">{formData.features.map(feature => ( <span key={feature} className="bg-brand-blue-light text-white text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-2">{feature}<button type="button" onClick={() => handleRemoveFeature(feature)}>&times;</button></span> ))}</div>
                    </div>
                     <div>
                        <div className="flex justify-between items-center mb-1">
                            <label htmlFor="description" className="block text-sm font-medium">Vehicle Description</label>
                            <button type="button" onClick={handleGenerateDescription} disabled={isGeneratingDesc || !formData.make || !formData.model} className="text-sm font-semibold text-indigo-600 disabled:opacity-50"> {isGeneratingDesc ? '...' : '✨ Generate with AI'}</button>
                        </div>
                        <textarea id="description" name="description" rows={4} value={formData.description} onChange={handleChange} className="block w-full p-3 border border-brand-gray dark:border-gray-600 rounded-lg" />
                    </div>
                </div>
            </FormFieldset>

            <FormFieldset title="Promotion">
                {(!editingVehicle || !editingVehicle.isFeatured) && (
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <label htmlFor="feature-listing" className="font-bold text-purple-800 dark:text-purple-200 flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    Feature this Listing
                                </label>
                                <p className="text-xs text-purple-600 dark:text-purple-300 mt-1">
                                    Use 1 of your {seller.featuredCredits || 0} available credits.
                                </p>
                            </div>
                            <input
                                id="feature-listing"
                                type="checkbox"
                                checked={isFeaturing}
                                onChange={(e) => setIsFeaturing(e.target.checked)}
                                disabled={(seller.featuredCredits || 0) <= 0}
                                className="h-6 w-6 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                        </div>
                        {(seller.featuredCredits || 0) <= 0 && <p className="text-xs text-red-500 mt-2">You have no featured credits. Upgrade your plan to get more.</p>}
                    </div>
                )}
            </FormFieldset>

            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                <button type="submit" className="w-full sm:w-auto flex-grow bg-brand-blue text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-brand-blue-dark"> {editingVehicle ? 'Update Vehicle' : 'List My Vehicle'} </button>
                <button type="button" onClick={onCancel} className="w-full sm:w-auto bg-gray-500 text-white font-bold py-3 px-6 rounded-lg text-lg hover:bg-gray-600">Cancel</button>
            </div>
          </form>

          <div className="hidden lg:block">
              <div className="sticky top-24 self-start space-y-6">
                  <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Live Preview</h3>
                      <div className="pointer-events-none">
                         <VehicleCard vehicle={previewVehicle} onSelect={() => {}} onToggleCompare={() => {}} isSelectedForCompare={false} onToggleWishlist={() => {}} isInWishlist={false} isCompareDisabled={true} onViewSellerProfile={() => {}} onQuickView={() => {}} />
                      </div>
                  </div>
                   {aiSuggestions && Object.keys(aiSuggestions.featureSuggestions).length > 0 && (
                     <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">✨ Suggested Features</h3>
                        <div className="bg-brand-gray-light dark:bg-brand-gray-darker p-4 rounded-lg border dark:border-gray-700 max-h-96 overflow-y-auto">
                            {Object.entries(aiSuggestions.featureSuggestions).map(([category, features]) => {
                                if (!Array.isArray(features) || features.length === 0) return null;
                                return (
                                    <div key={category} className="mb-4 last:mb-0">
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2 pb-1 border-b dark:border-gray-600">{category}</h4>
                                        <div className="space-y-2">
                                            {features.map(feature => (
                                                <label key={feature} className="flex items-center space-x-3 cursor-pointer group">
                                                    <input type="checkbox" checked={formData.features.includes(feature)} onChange={() => handleSuggestedFeatureToggle(feature)} className="h-4 w-4 text-brand-blue rounded border-gray-300 dark:border-gray-500 focus:ring-brand-blue-light bg-transparent" />
                                                    <span className="text-sm text-gray-800 dark:text-gray-300 group-hover:text-brand-blue dark:group-hover:text-brand-blue-light">{feature}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
              </div>
          </div>
        </div>
      </div>
    );
});

const InquiriesView: React.FC<{
  conversations: Conversation[];
  onMarkConversationAsReadBySeller: (conversationId: string) => void;
  onMarkMessagesAsRead: (conversationId: string, readerRole: 'customer' | 'seller') => void;
  onSelectConv: (conv: Conversation) => void;
  onTestDriveResponse?: (conversationId: string, messageId: number, newStatus: 'confirmed' | 'rejected') => void;
  onSellerSendMessage: (conversationId: string, messageText: string) => void;

}> = memo(({ conversations, onMarkConversationAsReadBySeller, onMarkMessagesAsRead, onSelectConv, onTestDriveResponse, onSellerSendMessage }) => {

    const handleSelectConversation = (conv: Conversation) => {
      onSelectConv(conv);
      if(!conv.isReadBySeller) {
        onMarkConversationAsReadBySeller(conv.id);
        onMarkMessagesAsRead(conv.id, 'seller');
      }
    };
    
    const handleAcceptTestDrive = (convId: string, msgId: number, date: string, time: string) => {
        if(onTestDriveResponse) onTestDriveResponse(convId, msgId, 'confirmed');
        const confirmationText = `Sounds great! Your test drive for the ${conversations.find(c=>c.id === convId)?.vehicleName} is confirmed for ${new Date(date).toLocaleDateString()} at ${time}. We look forward to seeing you.`;
        onSellerSendMessage(convId, confirmationText);
    };
    
    const handleDeclineTestDrive = (convId: string, msgId: number) => {
        if(onTestDriveResponse) onTestDriveResponse(convId, msgId, 'rejected');
        const declineText = `Apologies, but we are unable to accommodate your test drive request at this time. Please suggest an alternative date or time.`;
        onSellerSendMessage(convId, declineText);
    }

    const sortedConversations = useMemo(() => {
        return [...conversations].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    }, [conversations]);

    return (
       <div className="bg-white dark:bg-brand-gray-dark p-6 sm:p-8 rounded-lg shadow-md">
         <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Customer Inquiries</h2>
         <div className="space-y-2">
            {sortedConversations.length > 0 ? sortedConversations.map(conv => (
              <div key={conv.id} onClick={() => handleSelectConversation(conv)} className="p-4 rounded-lg cursor-pointer hover:bg-brand-gray-light dark:hover:bg-brand-gray-darker border-b dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {!conv.isReadBySeller && <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>}
                    <div>
                      <p className="font-bold text-gray-800 dark:text-gray-100">{conv.customerName} - <span className="font-normal text-gray-600 dark:text-gray-300">{conv.vehicleName}</span></p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">{conv.messages[conv.messages.length - 1].text}</p>
                    </div>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(conv.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            )) : (
                <div className="text-center py-16 px-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">No inquiries yet</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">When a customer sends a message about one of your listings, it will appear here.</p>
                </div>
            )}
         </div>
       </div>
    );
});

const ProfileInput: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ label, name, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <input
            type="text"
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white dark:bg-brand-gray-darker dark:text-gray-200"
        />
    </div>
);

const ProfileTextarea: React.FC<{ label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder?: string; }> = ({ label, name, value, onChange, placeholder }) => (
     <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <textarea
            name={name}
            id={name}
            rows={4}
            value={value}
            onChange={onChange}
            className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm bg-white dark:bg-brand-gray-darker dark:text-gray-200"
            placeholder={placeholder}
        />
    </div>
);


const SellerProfileForm: React.FC<{ seller: User; onUpdateProfile: (details: any) => void; }> = memo(({ seller, onUpdateProfile }) => {
    const [formData, setFormData] = useState({
        dealershipName: seller.dealershipName || '',
        bio: seller.bio || '',
        logoUrl: seller.logoUrl || '',
    });
    const [copySuccess, setCopySuccess] = useState('');
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if(event.target && typeof event.target.result === 'string') {
                    setFormData(prev => ({ ...prev, logoUrl: event.target.result as string }));
                }
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateProfile(formData);
    };

    const profileUrl = `${window.location.origin}${window.location.pathname}?seller=${seller.email}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`;
    
    const handleCopy = () => {
        navigator.clipboard.writeText(profileUrl).then(() => {
            setCopySuccess('Copied!');
            setTimeout(() => setCopySuccess(''), 2000);
        }, () => {
            setCopySuccess('Failed to copy');
            setTimeout(() => setCopySuccess(''), 2000);
        });
    };

    return (
        <div className="bg-white dark:bg-brand-gray-dark p-6 sm:p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Seller Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-6">
                    <img src={formData.logoUrl || 'https://via.placeholder.com/100'} alt="Logo" className="w-24 h-24 rounded-full object-cover bg-gray-200" />
                    <div>
                        <label htmlFor="logo-upload" className="cursor-pointer font-medium text-brand-blue hover:text-brand-blue-dark">
                            <span>Upload New Logo</span>
                            <input id="logo-upload" name="logo-upload" type="file" className="sr-only" accept="image/*" onChange={handleLogoUpload} />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 2MB.</p>
                    </div>
                </div>
                <ProfileInput 
                    label="Dealership Name"
                    name="dealershipName"
                    value={formData.dealershipName}
                    onChange={handleChange}
                />
                <ProfileTextarea
                    label="Public Bio / About"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell customers about your dealership..."
                />
                <div>
                    <button type="submit" className="bg-brand-blue text-white font-bold py-3 px-6 rounded-lg hover:bg-brand-blue-dark">Save Profile</button>
                </div>
            </form>

             <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Your Public Profile</h3>
                <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-gray-50 dark:bg-brand-gray-darker rounded-lg">
                    <div className="text-center">
                        <img src={qrCodeUrl} alt="Seller Profile QR Code" className="w-36 h-36 rounded-lg border dark:border-gray-600" />
                         <a href={qrCodeUrl} download={`qr-code-${seller.email}.png`} className="mt-2 inline-block text-sm text-brand-blue hover:underline">
                            Download QR Code
                        </a>
                    </div>
                    <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">Share this QR code or link with customers. When they scan or click it, they'll be taken directly to your profile page with all your listings.</p>
                        <div className="mt-2 p-2 bg-gray-200 dark:bg-gray-800 rounded-md flex items-center justify-between gap-2">
                           <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 dark:text-blue-400 font-mono truncate hover:underline">{profileUrl}</a>
                           <button onClick={handleCopy} className="text-sm font-semibold px-3 py-1 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark transition-colors whitespace-nowrap">
                               {copySuccess || 'Copy Link'}
                           </button>
                        </div>
                    </div>
                </div>
              </div>
        </div>
    );
});

const ReportsView: React.FC<{
    reportedVehicles: Vehicle[];
    onEditVehicle: (vehicle: Vehicle) => void;
    onDeleteVehicle: (vehicleId: number) => void;
}> = memo(({ reportedVehicles, onEditVehicle, onDeleteVehicle }) => (
    <div className="bg-white dark:bg-brand-gray-dark p-6 sm:p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Reported Listings</h2>
        {reportedVehicles.length > 0 ? (
            <div className="space-y-4">
                {reportedVehicles.map(v => (
                    <div key={v.id} className="border border-yellow-400 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                        <h3 className="font-bold text-gray-800 dark:text-gray-100">{v.year} {v.make} {v.model}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Reported on: {v.flaggedAt ? new Date(v.flaggedAt).toLocaleString() : 'N/A'}</p>
                        <p className="mt-2 text-sm italic text-gray-700 dark:text-gray-200">Reason: "{v.flagReason || 'No reason provided.'}"</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">An administrator will review this report. You can edit the listing to correct any issues or delete it if it's no longer valid.</p>
                        <div className="mt-3 space-x-4">
                            <button onClick={() => onEditVehicle(v)} className="text-brand-blue font-semibold text-sm hover:underline">Edit Listing</button>
                            <button onClick={() => onDeleteVehicle(v.id)} className="text-red-500 font-semibold text-sm hover:underline">Delete Listing</button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
             <div className="text-center py-16 px-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">All Clear!</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">You have no reported listings at this time.</p>
            </div>
        )}
    </div>
));


// Main Dashboard Component
const Dashboard: React.FC<DashboardProps> = ({ seller, sellerVehicles, reportedVehicles, onAddVehicle, onAddMultipleVehicles, onUpdateVehicle, onDeleteVehicle, onMarkAsSold, conversations, onSellerSendMessage, onMarkConversationAsReadBySeller, typingStatus, onUserTyping, onMarkMessagesAsRead, onUpdateSellerProfile, vehicleData, onFeatureListing, onRequestCertification, onNavigate, onTestDriveResponse }) => {
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);

  useEffect(() => {
    if (selectedConv) {
        const updatedConversation = conversations.find(c => c.id === selectedConv.id);
        if (updatedConversation) {
            // Using stringify is a simple way to deep-compare for changes.
            if (JSON.stringify(updatedConversation) !== JSON.stringify(selectedConv)) {
                 setSelectedConv(updatedConversation);
            }
        } else {
            // The selected conversation is no longer in the list, so deselect it.
            setSelectedConv(null);
        }
    }
  }, [conversations, selectedConv]);

  const handleNavigate = (view: DashboardView) => {
    if (view !== 'inquiries') {
        setSelectedConv(null);
    }
    setActiveView(view);
  };

  const handleEditClick = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    handleNavigate('form');
  };
  
  const handleAddNewClick = () => {
    setEditingVehicle(null);
    handleNavigate('form');
  }

  const handleFormCancel = () => {
    setEditingVehicle(null);
    handleNavigate('listings');
  }

  const handleNavigateToVehicle = (vehicleId: number) => {
    const vehicle = sellerVehicles.find(v => v.id === vehicleId);
    if (vehicle) {
        handleEditClick(vehicle);
    }
  };

  const handleNavigateToInquiry = (conversationId: string) => {
    const conv = conversations.find(c => c.id === conversationId);
    if (conv) {
        setSelectedConv(conv);
        handleNavigate('inquiries');
    }
  };

  const unreadCount = useMemo(() => conversations.filter(c => !c.isReadBySeller).length, [conversations]);
  const activeListings = useMemo(() => sellerVehicles.filter(v => v.status !== 'sold'), [sellerVehicles]);
  const soldListings = useMemo(() => sellerVehicles.filter(v => v.status === 'sold'), [sellerVehicles]);
  const reportedCount = useMemo(() => reportedVehicles.length, [reportedVehicles]);
  
  const analyticsData = useMemo(() => {
    const totalSalesValue = soldListings.reduce((sum, v) => sum + v.price, 0);
    const totalViews = activeListings.reduce((sum, v) => sum + (v.views || 0), 0);
    const totalInquiries = activeListings.reduce((sum, v) => sum + (v.inquiriesCount || 0), 0);
    const chartLabels = activeListings.map(v => `${v.year} ${v.model} ${v.variant || ''}`.trim().slice(0, 25));
    const chartData = {
      labels: chartLabels,
      datasets: [
        {
          label: 'Views',
          data: activeListings.map(v => v.views || 0),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          label: 'Inquiries',
          data: activeListings.map(v => v.inquiriesCount || 0),
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
          yAxisID: 'y1',
        },
      ],
    };
    return { totalSalesValue, totalViews, totalInquiries, chartData };
  }, [activeListings, soldListings]);

  const getCertificationButton = (vehicle: Vehicle) => {
      const status = vehicle.certificationStatus || 'none';
      switch (status) {
          case 'requested':
              return <button disabled className="text-yellow-600 text-sm font-semibold">Pending Approval</button>;
          case 'approved':
              return <span className="text-green-600 text-sm font-semibold">Certified</span>;
          case 'rejected':
              return <button onClick={() => onRequestCertification(vehicle.id)} className="text-red-600 hover:text-red-800" title="Certification was rejected, you can request again.">Request Again</button>;
          case 'none':
          default:
              return <button onClick={() => onRequestCertification(vehicle.id)} className="text-teal-600 hover:text-teal-800" title="Request a certified inspection report">Get Certified</button>;
      }
  };

  const renderContent = () => {
    switch(activeView) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Active Listings" value={activeListings.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17v-2a4 4 0 00-4-4h-1.5m1.5 4H13m-2 0a2 2 0 104 0 2 2 0 00-4 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 11V7a4 4 0 00-4-4H7a4 4 0 00-4 4v4" /></svg>} />
              <StatCard title="Unread Messages" value={unreadCount} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>} />
              <StatCard title="Your Seller Rating" value={`${seller.averageRating?.toFixed(1) || 'N/A'} (${seller.ratingCount || 0})`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.522 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.522 4.674c.3.921-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838-.197-1.539-1.118l1.522-4.674a1 1 0 00-.363-1.118L2.98 8.11c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.522-4.674z" /></svg>} />
              <PlanStatusCard seller={seller} activeListingsCount={activeListings.length} onNavigate={onNavigate} />
            </div>
            <AiAssistant
              vehicles={activeListings}
              conversations={conversations}
              onNavigateToVehicle={handleNavigateToVehicle}
              onNavigateToInquiry={handleNavigateToInquiry}
            />
          </div>
        );
      case 'analytics':
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Active Listings" value={activeListings.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17v-2a4 4 0 00-4-4h-1.5m1.5 4H13m-2 0a2 2 0 104 0 2 2 0 00-4 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 11V7a4 4 0 00-4-4H7a4 4 0 00-4 4v4" /></svg>} />
                    <StatCard title="Total Sales Value" value={`₹${analyticsData.totalSalesValue.toLocaleString('en-IN')}`} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} />
                    <StatCard title="Total Views" value={analyticsData.totalViews.toLocaleString('en-IN')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057 5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>} />
                    <StatCard title="Total Inquiries" value={analyticsData.totalInquiries.toLocaleString('en-IN')} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>} />
                </div>
                <div className="bg-white dark:bg-brand-gray-dark p-6 sm:p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Listing Performance</h2>
                    {activeListings.length > 0 ? (
                        <Bar 
                            data={analyticsData.chartData} 
                            options={{ 
                                responsive: true, 
                                plugins: { 
                                    legend: { position: 'top' }, 
                                    title: { display: true, text: 'Views vs. Inquiries per Vehicle' } 
                                },
                                scales: {
                                    y: {
                                        type: 'linear',
                                        display: true,
                                        position: 'left',
                                        title: {
                                            display: true,
                                            text: 'Views'
                                        }
                                    },
                                    y1: {
                                        type: 'linear',
                                        display: true,
                                        position: 'right',
                                        title: {
                                            display: true,
                                            text: 'Inquiries'
                                        },
                                        grid: {
                                            drawOnChartArea: false, // only want the grid lines for one axis to show up
                                        },
                                    },
                                }
                            }} 
                        />
                    ) : (
                        <div className="text-center py-16 px-6">
                            <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">No Data to Display</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Add a vehicle to see performance data.</p>
                        </div>
                    )}
                </div>
            </div>
        );
      case 'profile':
          return <SellerProfileForm seller={seller} onUpdateProfile={onUpdateSellerProfile} />;
      case 'listings':
        return (
          <div className="bg-white dark:bg-brand-gray-dark p-6 sm:p-8 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Active Listings</h2>
              <div className="flex gap-2">
                <button onClick={() => setIsBulkUploadOpen(true)} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700">Bulk Upload</button>
                <button onClick={handleAddNewClick} className="bg-brand-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-blue-dark">List New Vehicle</button>
              </div>
            </div>
            {activeListings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800"><tr><th className="px-6 py-3 text-left text-xs font-medium uppercase">Vehicle</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Price</th><th className="relative px-6 py-3 text-right text-xs font-medium uppercase">Actions</th></tr></thead>
                  <tbody className="bg-white dark:bg-brand-gray-dark divide-y divide-gray-200 dark:divide-gray-700">
                    {activeListings.map((v) => (
                      <tr key={v.id}>
                        <td className="px-6 py-4 font-medium">{v.year} {v.make} {v.model} {v.variant || ''}</td>
                        <td className="px-6 py-4">₹{v.price.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap text-sm font-semibold space-x-3">
                          {!v.isFeatured && (seller.featuredCredits ?? 0) > 0 && (
                              <button onClick={() => onFeatureListing(v.id)} className="text-purple-600 hover:text-purple-800" title="Use a credit to feature this listing">Feature</button>
                          )}
                          {getCertificationButton(v)}
                          <button onClick={() => onMarkAsSold(v.id)} className="text-green-600 hover:text-green-800">Sold</button>
                          <button onClick={() => handleEditClick(v)} className="text-brand-blue hover:text-brand-blue-dark">Edit</button>
                          <button onClick={() => onDeleteVehicle(v.id)} className="text-red-600 hover:text-red-800">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 dark:bg-brand-gray-darker rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2-2H5a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-gray-100">No vehicles listed yet</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Ready to sell? Add your first vehicle to get started.</p>
                    <div className="mt-6">
                        <button
                            onClick={handleAddNewClick}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-blue hover:bg-brand-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue-light"
                        >
                            List Your First Vehicle
                        </button>
                    </div>
                </div>
            )}
          </div>
        );
      case 'salesHistory':
        return (
          <div className="bg-white dark:bg-brand-gray-dark p-6 sm:p-8 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Sales History</h2>
            {soldListings.length > 0 ? (
                <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800"><tr><th className="px-6 py-3 text-left text-xs font-medium uppercase">Vehicle</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Sold Price</th></tr></thead>
                  <tbody className="bg-white dark:bg-brand-gray-dark divide-y divide-gray-200 dark:divide-gray-700">
                    {soldListings.map((v) => (
                      <tr key={v.id}>
                        <td className="px-6 py-4 font-medium">{v.year} {v.make} {v.model} {v.variant || ''}</td>
                        <td className="px-6 py-4">₹{v.price.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">You have not sold any vehicles yet.</p>
            )}
          </div>
        );
      case 'form':
        return <VehicleForm 
            seller={seller}
            editingVehicle={editingVehicle} 
            onAddVehicle={onAddVehicle} 
            onUpdateVehicle={onUpdateVehicle} 
            onCancel={handleFormCancel} 
            vehicleData={vehicleData} 
            onFeatureListing={onFeatureListing}
        />;
      case 'inquiries':
        return <InquiriesView 
                    conversations={conversations} 
                    onMarkConversationAsReadBySeller={onMarkConversationAsReadBySeller} 
                    onMarkMessagesAsRead={onMarkMessagesAsRead}
                    onSelectConv={setSelectedConv}
                    onTestDriveResponse={onTestDriveResponse}
                    onSellerSendMessage={onSellerSendMessage}
                />;
      case 'reports':
        return <ReportsView
                    reportedVehicles={reportedVehicles}
                    onEditVehicle={handleEditClick}
                    onDeleteVehicle={onDeleteVehicle}
                />;
    }
  }

  const NavItem: React.FC<{ view: DashboardView, children: React.ReactNode, count?: number }> = ({ view, children, count }) => (
    <button onClick={() => handleNavigate(view)} className={`flex justify-between items-center w-full text-left px-4 py-3 rounded-lg transition-colors ${activeView === view ? 'bg-brand-blue text-white' : 'hover:bg-brand-gray-light dark:hover:bg-brand-gray-darker'}`}>
      <span>{children}</span>
      {count && count > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{count}</span>}
    </button>
  );

  return (
    <div className="container mx-auto py-8 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
            <aside>
            <div className="bg-white dark:bg-brand-gray-dark p-4 rounded-lg shadow-md space-y-2">
                <NavItem view="overview">Overview</NavItem>
                <NavItem view="analytics">Analytics</NavItem>
                <NavItem view="listings">My Listings</NavItem>
                <NavItem view="reports" count={reportedCount}>Reports</NavItem>
                <NavItem view="salesHistory">Sales History</NavItem>
                <NavItem view="form">Add Vehicle</NavItem>
                <NavItem view="inquiries" count={unreadCount}>Inquiries</NavItem>
                <NavItem view="profile">My Profile</NavItem>
            </div>
            </aside>
            <main>
            {renderContent()}
            </main>
            {selectedConv && seller && (
                <ChatWidget
                    conversation={selectedConv}
                    currentUserRole="seller"
                    otherUserName={selectedConv.customerName}
                    onSendMessage={(messageText) => onSellerSendMessage(selectedConv.id, messageText)}
                    onClose={() => setSelectedConv(null)}
                    onUserTyping={onUserTyping}
                    onMarkMessagesAsRead={onMarkMessagesAsRead}
                    onFlagContent={() => {}}
                    typingStatus={typingStatus}
                />
            )}
             {isBulkUploadOpen && (
                <BulkUploadModal 
                    onClose={() => setIsBulkUploadOpen(false)}
                    onAddMultipleVehicles={onAddMultipleVehicles}
                    sellerEmail={seller.email}
                />
            )}
        </div>
    </div>
  );
};

export default Dashboard;