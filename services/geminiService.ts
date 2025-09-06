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
    - If the user specifies a price range (e.g., "under $40k", "between 20000 and 30000"), extract the minPrice and maxPrice.
    - If the user mentions specific features (e.g., "with Autopilot", "has a sunroof"), extract them into the features array.
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
                        make: { type: Type.STRING, description: "The make of the car, e.g., Tesla, Ford." },
                        model: { type: Type.STRING, description: "The model of the car, e.g., Model 3, Mustang." },
                        minPrice: { type: Type.NUMBER, description: "The minimum price." },
                        maxPrice: { type: Type.NUMBER, description: "The maximum price." },
                        features: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "A list of requested features."
                        }
                    }
                }
            }
        });
        
        return JSON.parse(response.text) as SearchFilters;

    } catch (error) {
        console.error("Error parsing search query with AI:", error);
        // Return an empty object on failure so the app doesn't crash
        return {};
    }
};

export const getVehicleSpecs = async (vehicleData: { make: string; model: string; year: number }): Promise<Record<string, string[]>> => {
    const prompt = `Generate a list of common specifications and features for a ${vehicleData.year} ${vehicleData.make} ${vehicleData.model}.
    Organize them into logical categories: "Engine & Performance", "Safety", "Comfort & Convenience", "Technology & Entertainment", "Exterior", and "Interior".
    Provide a JSON object where keys are the category names and values are arrays of feature strings.
    For example: { "Safety": ["Blind Spot Monitoring", "Lane Keep Assist"] }.
    Be as accurate and comprehensive as possible for the given model and year. If a category has no relevant features, omit it from the response.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        "Engine & Performance": { type: Type.ARRAY, items: { type: Type.STRING } },
                        "Safety": { type: Type.ARRAY, items: { type: Type.STRING } },
                        "Comfort & Convenience": { type: Type.ARRAY, items: { type: Type.STRING } },
                        "Technology & Entertainment": { type: Type.ARRAY, items: { type: Type.STRING } },
                        "Exterior": { type: Type.ARRAY, items: { type: Type.STRING } },
                        "Interior": { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                }
            }
        });
        
        return JSON.parse(response.text) as Record<string, string[]>;

    } catch (error) {
        console.error("Error generating vehicle specs:", error);
        return { "Error": ["Could not generate suggestions. Please add features manually."] };
    }
};

export const generateProsAndCons = async (vehicle: Vehicle): Promise<ProsAndCons> => {
    const prompt = `Based on the following vehicle details, generate a balanced list of 3-4 pros and 3-4 cons for a potential buyer. Focus on common considerations like performance, value, features, and potential drawbacks for its category.

    Vehicle Details:
    - Make: ${vehicle.make}
    - Model: ${vehicle.model}
    - Year: ${vehicle.year}
    - Price: $${vehicle.price.toLocaleString()}
    - Mileage: ${vehicle.mileage.toLocaleString()} miles
    - Key Features: ${vehicle.features.join(', ')}
    - Engine: ${vehicle.engine}
    - MPG: ${vehicle.mpg}`;

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
        
        // The response text will be a JSON string, parse it
        return JSON.parse(response.text) as ProsAndCons;

    } catch (error) {
        console.error("Error generating vehicle pros and cons:", error);
        return { 
            pros: ["Could not generate pros at this time."], 
            cons: ["Please try again later."] 
        };
    }
};

export const generateVehicleDescription = async (vehicleData: Partial<Vehicle>): Promise<string> => {
    const prompt = `Generate a compelling and professional marketing description for the following vehicle.
    Highlight its key features and appeal to potential buyers. Keep it to 2-3 sentences. Be enthusiastic but not overly hype.

    Vehicle Details:
    - Make: ${vehicleData.make}
    - Model: ${vehicleData.model}
    - Year: ${vehicleData.year}
    - Price: $${vehicleData.price?.toLocaleString()}
    - Mileage: ${vehicleData.mileage?.toLocaleString()} miles
    - Key Features: ${vehicleData.features?.join(', ')}
    - Engine: ${vehicleData.engine}
    - Exterior Color: ${vehicleData.exteriorColor}
    - Interior Color: ${vehicleData.interiorColor}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are an expert car salesperson writing a captivating vehicle listing description for a marketplace.",
                temperature: 0.7,
            }
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating vehicle description:", error);
        return "Failed to generate description. Please try again or write one manually.";
    }
};


export const getAIResponse = async (vehicle: Vehicle, chatHistory: { role: string, parts: {text: string}[] }[]): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: chatHistory,
            config: {
                systemInstruction: `You are a helpful AI assistant in a car marketplace chat. A user is asking about a ${vehicle.year} ${vehicle.make} ${vehicle.model}. 
    
                Here are the vehicle's details:
                - Price: $${vehicle.price.toLocaleString()}
                - Mileage: ${vehicle.mileage.toLocaleString()} miles
                - Features: ${vehicle.features.join(', ')}
                - Description: ${vehicle.description}

                Keep your answers concise and friendly. Answer the user's question based on the provided details. If the question is about negotiation, financing, or test drives, politely suggest they speak directly with the seller for those details.`,
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error getting AI chat response:", error);
        return "I am unable to process that request right now. Please ask something else about the vehicle!";
    }
};