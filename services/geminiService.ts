import { GoogleGenAI, Type } from "@google/genai";
import type { Vehicle, ProsAndCons } from '../types';

if (!process.env.API_KEY) {
  console.warn("Gemini API key is not set in environment variables. AI features will not work.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateProsAndCons = async (vehicle: Vehicle): Promise<ProsAndCons> => {
    const prompt = `Based on the following vehicle details, generate a balanced list of 3-4 pros and 3-4 cons for a potential buyer. Focus on common considerations like performance, value, features, and potential drawbacks for its category.

    Vehicle Details:
    - Make: ${vehicle.make}
    - Variant: ${vehicle.variant}
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
    - Variant: ${vehicleData.variant}
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
                systemInstruction: `You are a helpful AI assistant in a car marketplace chat. A user is asking about a ${vehicle.year} ${vehicle.make} ${vehicle.variant}. 
    
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