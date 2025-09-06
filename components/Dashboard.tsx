

import React, { useState, useMemo, useEffect, useRef } from 'react';
import type { Vehicle, User, Conversation } from '../types';
import { generateVehicleDescription, getVehicleSpecs } from '../services/geminiService';
import VehicleCard from './VehicleCard';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, LineController, BarController } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, PointElement, LineElement, LineController, BarController);
import { Bar, Line } from 'react-chartjs-2';


interface DashboardProps {
  seller: User;
  sellerVehicles: Vehicle[];
  onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>) => void;
  onUpdateVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (vehicleId: number) => void;
  onMarkAsSold: (vehicleId: number) => void;
  conversations: Conversation[];
  onSellerSendMessage: (conversationId: string, messageText: string) => void;
  onMarkConversationAsReadBySeller: (conversationId: string) => void;
  typingStatus: { conversationId: string; userRole: 'customer' | 'seller' } | null;
  onUserTyping: (conversationId: string, userRole: 'customer' | 'seller') => void;
  onMarkMessagesAsRead: (conversationId: string, readerRole: 'customer' | 'seller') => void;
  onUpdateSellerProfile: (details: { dealershipName: string; bio: string; logoUrl: string; }) => void;
}

type DashboardView = 'overview' | 'listings' | 'form' | 'inquiries' | 'analytics' | 'salesHistory' | 'profile';

const HelpTooltip: React.FC<{ text: string }> = ({ text }) => (
    <span className="group relative ml-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span className="absolute bottom-full mb-2 w-48 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 left-1/2 -translate-x-1/2 z-10">{text}</span>
    </span>
);

const FormInput: React.FC<{ label: string; name: keyof Vehicle; type?: string; value: string | number; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void; onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void; error?: string; tooltip?: string; required?: boolean; children?: React.ReactNode; }> = 
  ({ label, name, type = 'text', value, onChange, onBlur, error, tooltip, required = false, children }) => (
  <div>
    <label htmlFor={String(name)} className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        {tooltip && <HelpTooltip text={tooltip} />}
    </label>
    {type === 'select' ? (
        <select id={String(name)} name={String(name)} value={String(value)} onChange={onChange} required={required} className={`block w-full p-3 border rounded-lg focus:ring-2 focus:outline-none transition bg-white dark:bg-brand-gray-darker dark:text-gray-200 ${error ? 'border-red-500 focus:ring-red-300' : 'border-brand-gray dark:border-gray-600 focus:ring-brand-blue-light'}`}>
            {children}
        </select>
    ) : (
        <input type={type} id={String(name)} name={String(name)} value={value} onChange={onChange} onBlur={onBlur} required={required} className={`block w-full p-3 border rounded-lg focus:ring-2 focus:outline-none transition bg-white dark:bg-brand-gray-darker dark:text-gray-200 ${error ? 'border-red-500 focus:ring-red-300' : 'border-brand-gray dark:border-gray-600 focus:ring-brand-blue-light'}`} />
    )}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
  <div className="bg-white dark:bg-brand-gray-dark p-6 rounded-lg shadow-md flex items-center">
    <div className="bg-brand-blue-light p-3 rounded-full mr-4">{icon}</div>
    <div>
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  </div>
);

const initialFormState: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'> = {
  make: '', model: '', year: new Date().getFullYear(), price: 0, mileage: 0,
  description: '', engine: '', transmission: 'Automatic', fuelType: 'Petrol', fuelEfficiency: '',
  exteriorColor: '', interiorColor: '', features: [], images: [],
  sellerEmail: '',
  status: 'published',
  isFeatured: false,
};

const VehicleForm: React.FC<{
    editingVehicle: Vehicle | null;
    onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>) => void;
    onUpdateVehicle: (vehicle: Vehicle) => void;
    onCancel: () => void;
}> = ({ editingVehicle, onAddVehicle, onUpdateVehicle, onCancel }) => {
    const [formData, setFormData] = useState(editingVehicle ? { ...initialFormState, ...editingVehicle, sellerEmail: editingVehicle.sellerEmail } : initialFormState);
    const [featureInput, setFeatureInput] = useState('');
    const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
    const [errors, setErrors] = useState<Partial<Record<keyof Omit<Vehicle, 'id' | 'averageRating' | 'ratingCount'>, string>>>({});
    const [suggestedSpecs, setSuggestedSpecs] = useState<Record<string, string[]> | null>(null);
    const [isGeneratingSpecs, setIsGeneratingSpecs] = useState(false);
    const debounceTimeoutRef = useRef<number | null>(null);

     useEffect(() => {
        const { make, model, year } = formData;
        if (make.trim().length > 1 && model.trim().length > 1 && year >= 1900 && year <= new Date().getFullYear() + 1) {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
            debounceTimeoutRef.current = window.setTimeout(() => {
                const fetchSpecs = async () => {
                    setIsGeneratingSpecs(true);
                    setSuggestedSpecs(null);
                    try {
                        const specs = await getVehicleSpecs({ make, model, year });
                        setSuggestedSpecs(specs);
                    } catch (error) {
                        console.error("Failed to fetch vehicle specs:", error);
                        setSuggestedSpecs({ "Error": ["Could not fetch suggestions."] });
                    } finally {
                        setIsGeneratingSpecs(false);
                    }
                };
                fetchSpecs();
            }, 1000); // Debounce for 1 second
        } else {
            setSuggestedSpecs(null);
        }

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [formData.make, formData.model, formData.year]);
    
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
      const parsedValue = ['year', 'price', 'mileage'].includes(name) ? parseInt(value) || 0 : value;
      setFormData(prev => ({ ...prev, [name]: parsedValue }));
      const error = validateField(name, parsedValue);
      setErrors(prev => ({...prev, [name]: error}));
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

    const handleSuggestedFeatureToggle = (feature: string) => {
        setFormData(prev => {
            const currentFeatures = prev.features;
            const newFeatures = currentFeatures.includes(feature)
                ? currentFeatures.filter(f => f !== feature)
                : [...currentFeatures, feature];
            return { ...prev, features: newFeatures.sort() };
        });
    };
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              setFormData(prev => ({ ...prev, images: [...prev.images, reader.result as string] }));
            }
          };
          reader.readAsDataURL(file);
        });
        e.target.value = '';
      }
    };
  
    const handleRemoveImageUrl = (urlToRemove: string) => {
      setFormData(prev => ({...prev, images: prev.images.filter(url => url !== urlToRemove)}));
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
      } else {
        onAddVehicle(formData);
      }
      onCancel(); // Return to listings view
    };

    const previewVehicle: Vehicle = {
        id: editingVehicle?.id || Date.now(),
        averageRating: 0, ratingCount: 0,
        ...formData,
        images: formData.images.length > 0 ? formData.images : ['https://via.placeholder.com/800x600/E5E7EB/374151?text=Your+Image+Here'],
    };

    return (
      <div className="bg-white dark:bg-brand-gray-dark p-6 sm:p-8 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 border-b dark:border-gray-700 pb-4">
          {editingVehicle ? 'Edit Vehicle Listing' : 'List a New Vehicle'}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Form Column */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset>
                <legend className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Core Details</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <FormInput label="Make" name="make" value={formData.make} onChange={handleChange} onBlur={handleBlur} error={errors.make as string} required />
                    <FormInput label="Model" name="model" value={formData.model} onChange={handleChange} onBlur={handleBlur} error={errors.model as string} required />
                    <FormInput label="Year" name="year" type="number" value={formData.year} onChange={handleChange} onBlur={handleBlur} error={errors.year as string} required />
                    <FormInput label="Price (₹)" name="price" type="number" value={formData.price} onChange={handleChange} onBlur={handleBlur} error={errors.price as string} tooltip="Enter the listing price without commas or symbols." required />
                    <FormInput label="Mileage (kms)" name="mileage" type="number" value={formData.mileage} onChange={handleChange} onBlur={handleBlur} error={errors.mileage as string} />
                    <FormInput label="Exterior Color" name="exteriorColor" value={formData.exteriorColor} onChange={handleChange} onBlur={handleBlur} />
                    <FormInput label="Interior Color" name="interiorColor" value={formData.interiorColor} onChange={handleChange} onBlur={handleBlur} />
                </div>
            </fieldset>
             <fieldset>
                <legend className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Specifications</legend>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    <FormInput label="Engine" name="engine" value={formData.engine} onChange={handleChange} tooltip="e.g., 1.5L Petrol, 150kW Motor"/>
                    <FormInput label="Transmission" name="transmission" type="select" value={formData.transmission} onChange={handleChange}>
                        <option>Automatic</option>
                        <option>Manual</option>
                        <option>CVT</option>
                        <option>DCT</option>
                    </FormInput>
                    <FormInput label="Fuel Type" name="fuelType" type="select" value={formData.fuelType} onChange={handleChange}>
                        <option>Petrol</option>
                        <option>Diesel</option>
                        <option>Electric</option>
                        <option>CNG</option>
                        <option>Hybrid</option>
                    </FormInput>
                    <FormInput label="Fuel Efficiency" name="fuelEfficiency" value={formData.fuelEfficiency} onChange={handleChange} tooltip="e.g., 18 KMPL or 300 km range"/>
                </div>
            </fieldset>
            <fieldset>
                <legend className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Media & Features</legend>
                <div className="space-y-4">
                    <div>
                        <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300">Images</label>
                        <div className="mt-1 p-5 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md text-center">
                            <label htmlFor="file-upload" className="cursor-pointer font-medium text-brand-blue hover:text-brand-blue-dark"><span>Upload files</span><input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleImageUpload} /></label>
                        </div>
                        <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {formData.images.map((url, index) => (
                                <div key={index} className="relative group">
                                    <img src={url} className="w-full h-16 object-cover rounded-md" alt="Vehicle thumbnail" />
                                    <button type="button" onClick={() => handleRemoveImageUrl(url)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100">&times;</button>
                                </div>
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
                </div>
            </fieldset>
          
            <fieldset>
                <legend className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Description</legend>
                <div className="flex justify-between items-center mb-1">
                    <label htmlFor="description" className="block text-sm font-medium">Vehicle Description</label>
                    <button type="button" onClick={handleGenerateDescription} disabled={isGeneratingDesc || !formData.make || !formData.model} className="text-sm font-semibold text-indigo-600 disabled:opacity-50"> {isGeneratingDesc ? '...' : '✨ Generate with AI'}</button>
                </div>
                <textarea id="description" name="description" rows={4} value={formData.description} onChange={handleChange} className="block w-full p-3 border border-brand-gray dark:border-gray-600 rounded-lg" />
            </fieldset>

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
                         <VehicleCard vehicle={previewVehicle} onSelect={() => {}} onToggleCompare={() => {}} isSelectedForCompare={false} onToggleWishlist={() => {}} isInWishlist={false} />
                      </div>
                  </div>
                  <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                           <span>✨ Suggested Features</span>
                           {isGeneratingSpecs && <div className="w-4 h-4 border-2 border-dashed rounded-full animate-spin border-brand-blue"></div>}
                        </h3>
                        <div className="bg-brand-gray-light dark:bg-brand-gray-darker p-4 rounded-lg border dark:border-gray-700 max-h-96 overflow-y-auto">
                            {isGeneratingSpecs && !suggestedSpecs && (
                                <div className="space-y-4">
                                    <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/3 animate-pulse"></div>
                                    <div className="space-y-2 pl-2">
                                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full animate-pulse"></div>
                                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-5/6 animate-pulse"></div>
                                    </div>
                                    <div className="h-5 bg-gray-300 dark:bg-gray-600 rounded w-1/3 animate-pulse mt-4"></div>
                                    <div className="space-y-2 pl-2">
                                        <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-full animate-pulse"></div>
                                    </div>
                                </div>
                            )}
                            {!isGeneratingSpecs && !suggestedSpecs && (
                                <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-4">Enter Make, Model, and Year above to get AI-powered suggestions.</p>
                            )}
                            {suggestedSpecs && Object.entries(suggestedSpecs).map(([category, features]) => {
                                if (features.length === 0) return null;
                                return (
                                    <div key={category} className="mb-4 last:mb-0">
                                        <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2 pb-1 border-b dark:border-gray-600">{category}</h4>
                                        <div className="space-y-2">
                                            {features.map(feature => (
                                                <label key={feature} className="flex items-center space-x-3 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={formData.features.includes(feature)}
                                                        onChange={() => handleSuggestedFeatureToggle(feature)}
                                                        className="h-4 w-4 text-brand-blue rounded border-gray-300 dark:border-gray-500 focus:ring-brand-blue-light bg-transparent"
                                                    />
                                                    <span className="text-sm text-gray-800 dark:text-gray-300 group-hover:text-brand-blue dark:group-hover:text-brand-blue-light">{feature}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
              </div>
          </div>
        </div>
      </div>
    );
}

const ReadReceiptIcon: React.FC<{ isRead: boolean }> = ({ isRead }) => (
    isRead ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block ml-1 text-blue-400" viewBox="0 0 24 24" fill="none">
            <path d="M1.5 12.5L5.5 16.5L11.5 10.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8.5 12.5L12.5 16.5L22.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 inline-block ml-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
    )
);

const TypingIndicator: React.FC<{ name: string }> = ({ name }) => (
    <div className="flex items-start">
        <div className="rounded-xl px-4 py-3 max-w-lg bg-brand-gray dark:bg-brand-gray-dark text-gray-800 dark:text-gray-200 flex items-center space-x-2">
            <span className="text-sm font-medium">{name} is typing</span>
            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
        </div>
    </div>
);

const InquiriesView: React.FC<{
  conversations: Conversation[];
  onSendMessage: (conversationId: string, messageText: string) => void;
  onMarkAsRead: (conversationId: string) => void;
  typingStatus: { conversationId: string; userRole: 'customer' | 'seller' } | null;
  onUserTyping: (conversationId: string, userRole: 'customer' | 'seller') => void;
  onMarkMessagesAsRead: (conversationId: string, readerRole: 'customer' | 'seller') => void;
}> = ({ conversations, onSendMessage, onMarkAsRead, typingStatus, onUserTyping, onMarkMessagesAsRead }) => {
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
    const [replyText, setReplyText] = useState("");
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedConv?.messages, typingStatus]);

    useEffect(() => {
        if (selectedConv) {
            const updatedConversation = conversations.find(c => c.id === selectedConv.id);
            if (updatedConversation && updatedConversation.messages.length !== selectedConv.messages.length) {
                setSelectedConv(updatedConversation);
            } else if (!updatedConversation) {
                setSelectedConv(null);
            }
        }
    }, [conversations, selectedConv]);

    const handleSelectConversation = (conv: Conversation) => {
      setSelectedConv(conv);
      if(!conv.isReadBySeller) {
        onMarkAsRead(conv.id);
        onMarkMessagesAsRead(conv.id, 'seller');
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setReplyText(e.target.value);
        if (selectedConv) {
            onUserTyping(selectedConv.id, 'seller');
        }
    };

    const handleSendReply = (e: React.FormEvent) => {
        e.preventDefault();
        if (replyText.trim() && selectedConv) {
            onSendMessage(selectedConv.id, replyText);
            setReplyText("");
        }
    };

    const sortedConversations = useMemo(() => {
        return [...conversations].sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    }, [conversations]);

    if(selectedConv) {
      return (
        <div className="bg-white dark:bg-brand-gray-dark rounded-lg shadow-md h-[70vh] flex flex-col">
          <div className="p-4 border-b dark:border-gray-700 flex items-center gap-4">
            <button onClick={() => setSelectedConv(null)} className="font-bold text-lg hover:text-brand-blue">&larr;</button>
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100">{selectedConv.customerName}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Inquiring about: {selectedConv.vehicleName}</p>
            </div>
          </div>
          <div className="flex-grow p-4 overflow-y-auto bg-brand-gray-light dark:bg-brand-gray-darker space-y-4">
            {selectedConv.messages.map(msg => {
                if (msg.sender === 'system') {
                    return (
                        <div key={msg.id} className="text-center text-xs text-gray-500 dark:text-gray-400 italic py-2">
                            {msg.text}
                        </div>
                    );
                }
                return (
                    <div key={msg.id} className={`flex flex-col ${msg.sender === 'seller' ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-xl px-4 py-2 max-w-lg ${ msg.sender === 'seller' ? 'bg-brand-blue text-white' : 'bg-brand-gray dark:bg-brand-gray-dark text-gray-800 dark:text-gray-200'}`}>
                        {msg.text}
                      </div>
                      <div className="text-xs text-gray-400 mt-1 px-1 flex items-center">
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        {msg.sender === 'seller' && <ReadReceiptIcon isRead={msg.isRead} />}
                      </div>
                    </div>
                )
            })}
            {typingStatus?.conversationId === selectedConv?.id && typingStatus?.userRole === 'customer' && <TypingIndicator name={selectedConv.customerName} />}
            <div ref={chatEndRef} />
          </div>
           <div className="p-4 border-t dark:border-gray-700">
            <form onSubmit={handleSendReply} className="flex gap-2">
              <input type="text" value={replyText} onChange={handleInputChange} placeholder="Type your reply..." className="flex-grow p-3 border rounded-lg focus:ring-2 focus:ring-brand-blue-light focus:outline-none bg-white dark:bg-brand-gray-darker dark:text-gray-200 border-brand-gray dark:border-gray-600" />
              <button type="submit" className="bg-brand-blue text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-blue-dark">Send</button>
            </form>
          </div>
        </div>
      );
    }

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
}

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


const SellerProfileForm: React.FC<{ seller: User; onUpdateProfile: (details: any) => void; }> = ({ seller, onUpdateProfile }) => {
    const [formData, setFormData] = useState({
        dealershipName: seller.dealershipName || '',
        bio: seller.bio || '',
        logoUrl: seller.logoUrl || '',
    });
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if(event.target?.result) {
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
        </div>
    );
};


// Main Dashboard Component
const Dashboard: React.FC<DashboardProps> = ({ seller, sellerVehicles, onAddVehicle, onUpdateVehicle, onDeleteVehicle, onMarkAsSold, conversations, onSellerSendMessage, onMarkConversationAsReadBySeller, typingStatus, onUserTyping, onMarkMessagesAsRead, onUpdateSellerProfile }) => {
  const [activeView, setActiveView] = useState<DashboardView>('overview');
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const handleEditClick = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setActiveView('form');
  };
  
  const handleAddNewClick = () => {
    setEditingVehicle(null);
    setActiveView('form');
  }

  const handleFormCancel = () => {
    setEditingVehicle(null);
    setActiveView('listings');
  }

  const unreadCount = useMemo(() => conversations.filter(c => !c.isReadBySeller).length, [conversations]);
  const activeListings = useMemo(() => sellerVehicles.filter(v => v.status !== 'sold'), [sellerVehicles]);
  const soldListings = useMemo(() => sellerVehicles.filter(v => v.status === 'sold'), [sellerVehicles]);
  
  const analyticsData = useMemo(() => {
    const totalViews = activeListings.reduce((sum, v) => sum + (v.views || 0), 0);
    const totalInquiries = activeListings.reduce((sum, v) => sum + (v.inquiriesCount || 0), 0);
    const chartLabels = activeListings.map(v => `${v.year} ${v.model}`);
    const chartData = {
      labels: chartLabels,
      datasets: [
        {
          label: 'Views',
          data: activeListings.map(v => v.views || 0),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
        },
        {
          label: 'Inquiries',
          data: activeListings.map(v => v.inquiriesCount || 0),
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          borderColor: 'rgba(34, 197, 94, 1)',
          borderWidth: 1,
        },
      ],
    };
    return { totalViews, totalInquiries, chartData };
  }, [activeListings]);

  const renderContent = () => {
    switch(activeView) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StatCard title="Active Listings" value={activeListings.length} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 17v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><path d="M13 17v-2a4 4 0 00-4-4h-1.5m1.5 4H13m-2 0a2 2 0 104 0 2 2 0 00-4 0z" /><path d="M17 11V7a4 4 0 00-4-4H7a4 4 0 00-4 4v4" /></svg>} />
            <StatCard title="Unread Messages" value={unreadCount} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>} />
            <StatCard title="Total Views" value={analyticsData.totalViews} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>} />
            <StatCard title="Total Inquiries" value={analyticsData.totalInquiries} icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          </div>
        );
      case 'analytics':
        return (
            <div className="bg-white dark:bg-brand-gray-dark p-6 sm:p-8 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">Performance Analytics</h2>
                {activeListings.length > 0 ? (
                    <Bar data={analyticsData.chartData} options={{ responsive: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'Listing Views vs. Inquiries' } } }} />
                ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No active listings to analyze. Add a vehicle to see performance data.</p>
                )}
            </div>
        );
      case 'profile':
          return <SellerProfileForm seller={seller} onUpdateProfile={onUpdateSellerProfile} />;
      case 'listings':
        return (
          <div className="bg-white dark:bg-brand-gray-dark p-6 sm:p-8 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Active Listings</h2>
              <button onClick={handleAddNewClick} className="bg-brand-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-blue-dark">List New Vehicle</button>
            </div>
            {activeListings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-800"><tr><th className="px-6 py-3 text-left text-xs font-medium uppercase">Vehicle</th><th className="px-6 py-3 text-left text-xs font-medium uppercase">Price</th><th className="relative px-6 py-3"></th></tr></thead>
                  <tbody className="bg-white dark:bg-brand-gray-dark divide-y divide-gray-200 dark:divide-gray-700">
                    {activeListings.map((v) => (
                      <tr key={v.id}>
                        <td className="px-6 py-4 font-medium">{v.year} {v.make} {v.model}</td>
                        <td className="px-6 py-4">₹{v.price.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-right whitespace-nowrap">
                          <button onClick={() => onMarkAsSold(v.id)} className="text-green-600 hover:text-green-800 mr-4">Mark as Sold</button>
                          <button onClick={() => handleEditClick(v)} className="text-brand-blue hover:text-brand-blue-dark mr-4">Edit</button>
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
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
                        <td className="px-6 py-4 font-medium">{v.year} {v.make} {v.model}</td>
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
        return <VehicleForm editingVehicle={editingVehicle} onAddVehicle={onAddVehicle} onUpdateVehicle={onUpdateVehicle} onCancel={handleFormCancel} />;
      case 'inquiries':
        return <InquiriesView conversations={conversations} onSendMessage={onSellerSendMessage} onMarkAsRead={onMarkConversationAsReadBySeller} typingStatus={typingStatus} onUserTyping={onUserTyping} onMarkMessagesAsRead={onMarkMessagesAsRead} />;
    }
  }

  const NavItem: React.FC<{ view: DashboardView, children: React.ReactNode, count?: number }> = ({ view, children, count }) => (
    <button onClick={() => setActiveView(view)} className={`flex justify-between items-center w-full text-left px-4 py-3 rounded-lg transition-colors ${activeView === view ? 'bg-brand-blue text-white' : 'hover:bg-brand-gray-light dark:hover:bg-brand-gray-darker'}`}>
      <span>{children}</span>
      {count && count > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5">{count}</span>}
    </button>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
        <aside>
          <div className="bg-white dark:bg-brand-gray-dark p-4 rounded-lg shadow-md space-y-2">
            <NavItem view="overview">Overview</NavItem>
            <NavItem view="analytics">Analytics</NavItem>
            <NavItem view="listings">My Listings</NavItem>
            <NavItem view="salesHistory">Sales History</NavItem>
            <NavItem view="form">Add Vehicle</NavItem>
            <NavItem view="inquiries" count={unreadCount}>Inquiries</NavItem>
            <NavItem view="profile">My Profile</NavItem>
          </div>
        </aside>
        <main>
          {renderContent()}
        </main>
    </div>
  );
};

export default Dashboard;
