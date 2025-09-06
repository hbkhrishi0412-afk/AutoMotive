
import React, { useState, useEffect } from 'react';
import type { Vehicle } from '../types';

interface EditVehicleModalProps {
    vehicle: Vehicle;
    onClose: () => void;
    onSave: (vehicle: Vehicle) => void;
}

const EditVehicleModal: React.FC<EditVehicleModalProps> = ({ vehicle, onClose, onSave }) => {
    const [formData, setFormData] = useState<Vehicle>(vehicle);
    const [featureInput, setFeatureInput] = useState('');

    useEffect(() => {
        if (vehicle) {
            setFormData(vehicle);
        }
    }, [vehicle]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const parsedValue = ['year', 'price', 'mileage'].includes(name) ? parseInt(value) || 0 : value;
        setFormData(prev => ({ ...prev, [name]: parsedValue }));
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    if (!vehicle) return null;

    const FormInput = ({ label, name, type = 'text', value, required = false }: { label: string, name: keyof Vehicle, type?: string, value: any, required?: boolean }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <input type={type} name={name} value={value} onChange={handleChange} required={required} className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-brand-gray-darker dark:text-gray-200" />
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-white dark:bg-brand-gray-dark rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <div className="p-6 overflow-y-auto">
                        <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-brand-gray-dark py-2 -mt-6">
                           <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Edit Vehicle: {vehicle.year} {vehicle.make} {vehicle.variant}</h2>
                           <button type="button" onClick={onClose} className="text-gray-500 dark:text-gray-400 text-2xl hover:text-gray-800 dark:hover:text-gray-200">&times;</button>
                        </div>
                        <div className="space-y-6">
                            <fieldset>
                                <legend className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Core Details</legend>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormInput label="Make" name="make" value={formData.make} required />
                                    <FormInput label="Variant" name="variant" value={formData.variant} required />
                                    <FormInput label="Year" name="year" type="number" value={formData.year} required />
                                    <FormInput label="Price ($)" name="price" type="number" value={formData.price} required />
                                    <FormInput label="Mileage" name="mileage" type="number" value={formData.mileage} required />
                                    <FormInput label="Exterior Color" name="exteriorColor" value={formData.exteriorColor} />
                                </div>
                            </fieldset>
                            
                            <fieldset>
                                <legend className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Specifications</legend>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormInput label="Engine" name="engine" value={formData.engine} />
                                    <FormInput label="Transmission" name="transmission" value={formData.transmission} />
                                    <FormInput label="Fuel Type" name="fuelType" value={formData.fuelType} />
                                    <FormInput label="MPG" name="mpg" value={formData.mpg} />
                                    <FormInput label="Interior Color" name="interiorColor" value={formData.interiorColor} />
                                </div>
                            </fieldset>
                            
                            <fieldset>
                                <legend className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Description</legend>
                                <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-brand-gray-darker dark:text-gray-200" />
                            </fieldset>
                            
                            <fieldset>
                                <legend className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Media & Features</legend>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Images</label>
                                    <div className="mt-1 p-5 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md text-center">
                                        <label htmlFor="file-upload" className="cursor-pointer font-medium text-brand-blue hover:text-brand-blue-dark"><span>Upload files</span><input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/*" onChange={handleImageUpload} /></label>
                                    </div>
                                    <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 gap-2">
                                        {formData.images.map((url, index) => (
                                            <div key={index} className="relative group">
                                                <img src={url} className="w-full h-20 object-cover rounded-md" alt="Vehicle thumbnail" />
                                                <button type="button" onClick={() => handleRemoveImageUrl(url)} className="absolute top-0 right-0 bg-red-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100">&times;</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Key Features</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }} placeholder="e.g., Sunroof" className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-brand-gray-darker dark:text-gray-200" />
                                        <button type="button" onClick={handleAddFeature} className="bg-gray-200 dark:bg-gray-600 font-bold py-2 px-4 rounded-lg">Add</button>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">{formData.features.map(feature => ( <span key={feature} className="bg-brand-blue-light text-white text-sm font-semibold px-3 py-1 rounded-full flex items-center gap-2">{feature}<button type="button" onClick={() => handleRemoveFeature(feature)}>&times;</button></span> ))}</div>
                                </div>
                            </fieldset>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-brand-gray-darker px-6 py-3 flex justify-end gap-4 rounded-b-lg mt-auto">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditVehicleModal;
