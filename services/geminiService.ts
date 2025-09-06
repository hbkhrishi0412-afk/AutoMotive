import { GoogleGenAI, Type } from "@google/genai";
import type { Vehicle, ProsAndCons, ChatMessage } from '../types';
import type { SearchFilters } from "../types";

if (!process.env.API_KEY) {
  console.warn("Gemini API key is not set in environment variables. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const parseSearchQuery = async (query: string): Promise<SearchFilters> => {
    const prompt = `Parse the user's vehicle search query and extract structured filter criteria.
    The user's query is: "${query}".
    - If the user mentions a specific make or model, extract it.
    - If the user specifies a price range (e.g., "under ₹8 lakhs", "between 1000000 and 1500000"), extract the minPrice and maxPrice.
    - If the user mentions specific features (e.g., "with a sunroof", "has ADAS"), extract them into the features array.
    - The 'model' is the specific model of the car.
    Respond only with JSON matching the provided schema. If a value is not present, omit the key.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        make: { type: Type.STRING, description: "The make of the car, e.g., Tata, Hyundai." },
                        model: { type: Type.STRING, description: "The model of the car, e.g., Nexon, Creta." },
                        minPrice: { type: Type.NUMBER, description: "The minimum price in INR." },
                        maxPrice: { type: Type.NUMBER, description: "The maximum price in INR." },
                        features: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "An array of requested vehicle features, e.g., Sunroof, ADAS."
                        },
                    },
                },
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error parsing search query with Gemini:", error);
        return {};
    }
};

export const generateProsAndCons = async (vehicle: Vehicle): Promise<ProsAndCons> => {
    const prompt = `Based on the following vehicle data, generate a balanced list of 3 pros and 3 cons.
Make: ${vehicle.make}, Model: ${vehicle.model}, Year: ${vehicle.year}.
The car has run ${vehicle.mileage} kms. Its fuel efficiency is ${vehicle.fuelEfficiency}.
Key features include: ${vehicle.features.join(', ')}.
Provide the output in JSON format with two keys: "pros" and "cons", each containing an array of strings.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        pros: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        },
                        cons: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Failed to generate pros and cons:", error);
        return { pros: ['AI analysis unavailable.'], cons: ['Could not generate suggestions at this time.'] };
    }
};


export const generateVehicleDescription = async (vehicle: Partial<Vehicle>): Promise<string> => {
    if (!vehicle.make || !vehicle.model || !vehicle.year) {
        return "Please provide Make, Model, and Year for an accurate description.";
    }

    const prompt = `Generate a compelling, one-sentence vehicle description for an online marketplace, targeting an Indian audience.
Use the following details:
Make: ${vehicle.make}, Model: ${vehicle.model}, Year: ${vehicle.year}.
Price: ₹${vehicle.price}, Mileage: ${vehicle.mileage} kms.
Key features: ${vehicle.features?.slice(0, 3).join(', ')}.
The description should be concise, appealing, and highlight the vehicle's best qualities.
Do not start with "This is a..." or "For sale is a...". Just provide the single sentence description.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Failed to generate vehicle description:", error);
        return "Failed to generate AI description. Please write one manually.";
    }
};

export const getVehicleSpecs = async (vehicle: { make: string, model: string, year: number }): Promise<Record<string, string[]>> => {
    const prompt = `Provide a list of common features and specifications for a ${vehicle.year} ${vehicle.make} ${vehicle.model} in the Indian market.
Categorize the features into "Comfort & Convenience", "Safety", "Entertainment", and "Exterior".
Return the result as a JSON object where keys are the categories and values are arrays of feature strings.
Example: { "Safety": ["ABS", "Airbags"], "Comfort & Convenience": ["Automatic Climate Control"] }`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json'
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error fetching vehicle specs from Gemini:", error);
        return { "Error": ["Could not fetch suggestions."] };
    }
};
