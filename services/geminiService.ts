
import { GoogleGenAI, Type } from "@google/genai";
import type { Vehicle, ProsAndCons, ChatMessage, Conversation, Suggestion, PricingSuggestion } from '../types';
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
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        "Comfort & Convenience": { type: Type.ARRAY, items: { type: Type.STRING } },
                        "Safety": { type: Type.ARRAY, items: { type: Type.STRING } },
                        "Entertainment": { type: Type.ARRAY, items: { type: Type.STRING } },
                        "Exterior": { type: Type.ARRAY, items: { type: Type.STRING } },
                    }
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error fetching vehicle specs from Gemini:", error);
        return { "Error": ["Could not fetch suggestions."] };
    }
};

export const getStructuredVehicleSpecs = async (
    vehicle: { make: string, model: string, variant?: string, year: number }
): Promise<Partial<Pick<Vehicle, 'engine' | 'transmission' | 'fuelType' | 'fuelEfficiency' | 'displacement' | 'groundClearance' | 'bootSpace'>>> => {
    const prompt = `Provide key technical specifications for a ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.variant || ''} for the Indian market.
Respond ONLY with a JSON object with these keys: "engine", "transmission", "fuelType", "fuelEfficiency", "displacement", "groundClearance", "bootSpace".
- engine: Brief description (e.g., "1.5L i-VTEC Petrol").
- transmission: e.g., "CVT", "6-Speed Automatic".
- fuelType: e.g., "Petrol", "Diesel", "Electric".
- fuelEfficiency: e.g., "18.4 KMPL" or "325 km range".
- displacement: e.g., "1498 cc".
- groundClearance: e.g., "165 mm".
- bootSpace: e.g., "506 litres".
If a value is not applicable or commonly available, return "N/A".`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        engine: { type: Type.STRING },
                        transmission: { type: Type.STRING },
                        fuelType: { type: Type.STRING },
                        fuelEfficiency: { type: Type.STRING },
                        displacement: { type: Type.STRING },
                        groundClearance: { type: Type.STRING },
                        bootSpace: { type: Type.STRING },
                    }
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error fetching structured vehicle specs from Gemini:", error);
        return {};
    }
};


export const getSearchSuggestions = async (query: string, vehicles: Pick<Vehicle, 'make' | 'model' | 'features'>[]): Promise<string[]> => {
    if (!query.trim()) {
        return [];
    }

    const makes = [...new Set(vehicles.map(v => v.make))];
    const models = [...new Set(vehicles.map(v => v.model))];
    const features = [...new Set(vehicles.flatMap(v => v.features))];

    const prompt = `Based on the user's partial search query and the available vehicle inventory, generate up to 5 relevant and concise search suggestions.
Suggestions can be for makes, models, features, or common search phrases (e.g., "SUV with sunroof").
Prioritize suggestions that are highly relevant to the user's input.

User's partial query: "${query}"

Available makes: ${makes.slice(0, 15).join(', ')}
Available models: ${models.slice(0, 20).join(', ')}
Available features: ${features.slice(0, 20).join(', ')}

Return the suggestions as a JSON array of strings. For example: ["Hyundai Creta", "Sunroof", "under 15 lakhs"].`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error fetching search suggestions from Gemini:", error);
        return [];
    }
};

export const generateSellerSuggestions = async (vehicles: Vehicle[], conversations: Conversation[]): Promise<Suggestion[]> => {
    const vehicleSummary = vehicles.map(v => ({
        id: v.id,
        name: `${v.year} ${v.make} ${v.model}`,
        price: v.price,
        mileage: v.mileage,
        descriptionLength: v.description.length,
        imageCount: v.images.length,
        views: v.views || 0,
        inquiries: v.inquiriesCount || 0,
        status: v.status,
    })).filter(v => v.status === 'published');

    const conversationSummary = conversations.map(c => ({
        id: c.id,
        vehicleName: c.vehicleName,
        isReadBySeller: c.isReadBySeller,
        lastMessageTimestamp: c.lastMessageAt,
        lastMessageText: c.messages[c.messages.length - 1].text,
        lastMessageSender: c.messages[c.messages.length - 1].sender,
    })).filter(c => c.lastMessageSender !== 'seller' && !c.isReadBySeller);

    const prompt = `You are an expert AI Sales Assistant for a used vehicle marketplace. Your goal is to provide actionable suggestions to a seller to help them sell their vehicles faster and improve customer communication.
Analyze the following JSON data which contains the seller's current vehicle listings and un-replied customer inquiries.

**Active Vehicle Listings:**
${JSON.stringify(vehicleSummary, null, 2)}

**Un-replied Customer Inquiries:**
${JSON.stringify(conversationSummary, null, 2)}

Based on this data, provide up to 4 high-impact suggestions. Categorize them into 'pricing', 'listing_quality', or 'urgent_inquiry'.
- For pricing suggestions, identify vehicles that might be over or underpriced. A vehicle with high views but very few inquiries could be overpriced. A vehicle with very low views might need a price drop to attract attention.
- For listing quality, suggest improvements. A vehicle with few images (less than 3) or a very short description (less than 50 characters) is a good candidate.
- For urgent inquiries, identify unread messages from customers, especially recent ones or those asking direct questions about price, availability, or test drives, and flag them as high priority.

Respond ONLY with a JSON object containing a "suggestions" key, which is an array of suggestion objects. Each object must have these keys:
- "type": (string) one of 'pricing', 'listing_quality', 'urgent_inquiry'.
- "title": (string) a short, catchy title for the suggestion.
- "description": (string) a one or two-sentence explanation of the suggestion and why it's important.
- "targetId": (string or number) the ID of the vehicle or conversation this suggestion applies to. For vehicles, use the numeric ID. For conversations, use the string ID.
- "priority": (string) one of 'high', 'medium', 'low'.

If there is no data or no meaningful suggestions can be made, return an empty array for "suggestions".`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    type: { type: Type.STRING },
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    targetId: { type: Type.STRING },
                                    priority: { type: Type.STRING },
                                }
                            }
                        }
                    }
                }
            }
        });
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        return result.suggestions.map((s: any) => ({
            ...s,
            targetId: s.type === 'urgent_inquiry' ? String(s.targetId) : Number(s.targetId)
        }));
    } catch (error) {
        console.error("Error generating seller suggestions with Gemini:", error);
        return [];
    }
};

export const getPricingSuggestion = async (
    vehicleDetails: Pick<Vehicle, 'make' | 'model' | 'year' | 'mileage'>,
    marketVehicles: Pick<Vehicle, 'make' | 'model' | 'year' | 'mileage' | 'price'>[]
): Promise<PricingSuggestion | null> => {
    const prompt = `You are a vehicle pricing expert for the Indian used car market.
Given the details of a vehicle a user wants to sell, and a list of similar vehicles currently on the market, provide a suggested price range.

**Vehicle to Price:**
- Make: ${vehicleDetails.make}
- Model: ${vehicleDetails.model}
- Year: ${vehicleDetails.year}
- Mileage: ${vehicleDetails.mileage.toLocaleString('en-IN')} kms

**Comparable Market Listings:**
${JSON.stringify(marketVehicles, null, 2)}

Analyze the market data. Consider the year, mileage, and prices of comparable vehicles.
Provide a fair, competitive price range (minPrice and maxPrice) in INR for the "Vehicle to Price".
Also, provide a brief, one-sentence justification for your suggestion.
Respond ONLY with a JSON object matching the provided schema.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        minPrice: { type: Type.NUMBER },
                        maxPrice: { type: Type.NUMBER },
                        justification: { type: Type.STRING }
                    }
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating pricing suggestion with Gemini:", error);
        return null;
    }
};

export const getVehicleRecommendations = async (
    activity: { viewed: number[], wishlisted: number[], compared: number[] },
    allVehicles: Pick<Vehicle, 'id' | 'make' | 'model' | 'year' | 'price' | 'features' | 'fuelType'>[]
): Promise<number[]> => {
    const interactedIds = [...new Set([...activity.viewed, ...activity.wishlisted, ...activity.compared])];
    const prompt = `You are a vehicle recommendation engine. A user has shown interest in certain vehicles.
Their activity is summarized below:
- Viewed Vehicle IDs: [${activity.viewed.join(', ')}]
- Wishlisted Vehicle IDs: [${activity.wishlisted.join(', ')}]
- Compared Vehicle IDs: [${activity.compared.join(', ')}]

Here is the full list of available vehicles:
${JSON.stringify(allVehicles, null, 2)}

Analyze the user's activity to understand their preferences (e.g., brand, price range, vehicle type, features).
Based on their preferences, recommend up to 5 vehicle IDs from the full list that they might be interested in.
**Crucially, do not recommend any vehicle IDs that are already in this list of interacted IDs: [${interactedIds.join(', ')}].**

Respond ONLY with a JSON array of recommended vehicle IDs (numbers). For example: [10, 25, 3]. If no suitable recommendations are found, return an empty array.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER }
                }
            }
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating vehicle recommendations with Gemini:", error);
        return [];
    }
};
