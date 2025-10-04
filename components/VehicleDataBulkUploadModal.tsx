import React, { useState, useCallback } from 'react';
// FIX: Import VehicleMake and VehicleModel from their source file, not types.ts
import type { VehicleData } from '../types';
import type { VehicleMake, VehicleModel } from './vehicleData';
import { VEHICLE_DATA } from './vehicleData';

interface BulkUploadModalProps {
    onClose: () => void;
    onUpdateData: (newData: VehicleData) => void;
}

// Helper to parse CSV text into an array of objects
const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.trim().replace(/\r/g, '').split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length === headers.length) {
            const row = headers.reduce((obj, header, index) => {
                obj[header] = values[index];
                return obj;
            }, {} as Record<string, string>);
            data.push(row);
        }
    }
    return data;
};


const VehicleDataBulkUploadModal: React.FC<BulkUploadModalProps> = ({ onClose, onUpdateData }) => {
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<VehicleData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleParseAndValidate = useCallback(() => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const parsedRows = parseCSV(text);

                if (parsedRows.length === 0) {
                    throw new Error("CSV file is empty or formatted incorrectly.");
                }

                const requiredHeaders = ['category', 'make', 'model'];
                const fileHeaders = Object.keys(parsedRows[0]);
                if (!requiredHeaders.every(h => fileHeaders.includes(h))) {
                    throw new Error(`CSV file must contain at least the following headers: ${requiredHeaders.join(', ')}.`);
                }

                const newData: VehicleData = {};
                parsedRows.forEach((row, index) => {
                    const { category, make, model, variant } = row;
                    if (!category || !make || !model) {
                        console.warn(`Skipping row ${index + 2} due to missing required fields (category, make, model).`);
                        return;
                    }

                    if (!newData[category]) {
                        newData[category] = [];
                    }

                    let makeObj = newData[category].find((m: VehicleMake) => m.name === make);
                    if (!makeObj) {
                        makeObj = { name: make, models: [] };
                        newData[category].push(makeObj);
                    }

                    let modelObj = makeObj.models.find((m: VehicleModel) => m.name === model);
                    if (!modelObj) {
                        modelObj = { name: model, variants: [] };
                        makeObj.models.push(modelObj);
                    }

                    if (variant && !modelObj.variants.includes(variant)) {
                        modelObj.variants.push(variant);
                    }
                });
                
                setParsedData(newData);
                setError(null);
                setStep(2);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to parse CSV file.");
                setParsedData(null);
            }
        };
        reader.onerror = () => {
            setError("Failed to read the file.");
        };
        reader.readAsText(file);
    }, [file]);
    
    const handleConfirm = () => {
        if (parsedData) {
            onUpdateData(parsedData);
        }
        onClose();
    };

    const downloadTemplate = () => {
        const rows = [['category', 'make', 'model', 'variant']];
        for (const category in VEHICLE_DATA) {
            for (const make of VEHICLE_DATA[category]) {
                for (const model of make.models) {
                    if (model.variants.length > 0) {
                        for (const variant of model.variants) {
                            rows.push([category, make.name, model.name, variant]);
                        }
                    } else {
                        rows.push([category, make.name, model.name, '']);
                    }
                }
            }
        }
        const csvContent = rows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'vehicle_data_template.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-brand-gray-dark rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Bulk Upload Vehicle Data</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Replace all vehicle dropdown data using a spreadsheet (CSV) file.</p>
                </div>

                <div className="p-6 overflow-y-auto">
                    {step === 1 && (
                        <div className="space-y-4 text-center">
                            <h3 className="font-semibold">Step 1: Prepare Your CSV File</h3>
                            <p>Download our template, fill it with your vehicle data, and upload it here. This will <strong className="text-red-500">replace all existing data</strong>.</p>
                            <button onClick={downloadTemplate} className="font-semibold text-brand-blue hover:underline">Download CSV Template</button>
                            <div className="mt-4 p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                                <input type="file" accept=".csv, text/csv" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-blue-lightest file:text-brand-blue-dark hover:file:bg-brand-blue-light" />
                            </div>
                            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
                        </div>
                    )}
                    {step === 2 && parsedData && (
                        <div className="space-y-4">
                            <h3 className="font-semibold">Step 2: Review and Confirm</h3>
                            <div className="p-4 bg-gray-50 dark:bg-brand-gray-darker rounded-lg">
                                <p className="font-bold text-green-600 dark:text-green-400">File validated successfully.</p>
                                <ul className="text-sm list-disc list-inside mt-2">
                                    <li>Found {Object.keys(parsedData).length} categories.</li>
                                    {/* FIX: Provide an initial value of 0 to the reduce function to ensure the accumulator is a number, preventing arithmetic errors. */}
                                    <li>Total makes found: {Object.values(parsedData).reduce((sum: number, makes: VehicleMake[]) => sum + makes.length, 0)}</li>
                                </ul>
                            </div>
                            <p className="text-sm text-red-500">Warning: Confirming will overwrite all existing vehicle dropdown data. This action cannot be undone.</p>
                        </div>
                    )}
                </div>

                <div className="bg-gray-50 dark:bg-brand-gray-darker px-6 py-3 flex justify-end gap-4 rounded-b-lg">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    {step === 1 && <button onClick={handleParseAndValidate} disabled={!file} className="px-4 py-2 bg-brand-blue text-white rounded-md hover:bg-brand-blue-dark disabled:opacity-50">Next: Review</button>}
                    {step === 2 && <button onClick={handleConfirm} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Confirm & Upload</button>}
                </div>
            </div>
        </div>
    );
};

export default VehicleDataBulkUploadModal;