import { Type } from "@google/genai";
import type { Vehicle, ProsAndCons, Conversation, Suggestion } from '../types';
import type { SearchFilters } from "../types";

/**
 * A helper function to call our secure backend proxy for the Gemini API.
 * @param payload - The complete request object for the Gemini API (model, contents, config).
 * @returns The text result from the Gemini API.
 */
async function callGeminiAPI(payload: any): Promise<string> {
    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ payload }),
        });

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ error: `API error: ${response.statusText}` }));
            throw new Error(errorBody.error || `API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.result;
    } catch (error) {
        console.error("Error calling Gemini proxy API:", error);
        // Return a default value that won't break the UI.
        const isJson = payload.config?.responseMimeType === "application/json";
        if (isJson) {
            // Check if the expected response is an array or object
            return payload.config?.responseSchema?.type === Type.ARRAY ? "[]" : "{}";
        }
        return `Error: ${error instanceof Error ? error.message : "Could not connect to AI service."}`;
    }
}


export const parseSearchQuery = async (query: string): Promise<SearchFilters> => {
    const prompt = `Parse the user's vehicle search query and extract structured filter criteria.
    The user's query is: "${query}".
    - If the user mentions a specific make or model, extract it.
    - If the user specifies a price range (e.g., "under ₹8 lakhs", "between 1000000 and 1500000"), extract the minPrice and maxPrice.
    - If the user mentions specific features (e.g., "with a sunroof", "has ADAS"), extract them into the features array.
    - The 'model' is the specific model of the car.
    Respond only with JSON matching the provided schema. If a value is not present, omit the key.`;

    const requestPayload = {
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
            thinkingConfig: { thinkingBudget: 0 },
        },
    };

    try {
        const jsonText = await callGeminiAPI(requestPayload);
        return JSON.parse(jsonText.trim());
    } catch (error) {
        console.error("Error parsing search query from proxy:", error);
        return {};
    }
};

export const generateProsAndCons = async (vehicle: Vehicle): Promise<ProsAndCons> => {
    const prompt = `Based on the following vehicle data, generate a balanced list of 3 pros and 3 cons.
Make: ${vehicle.make}, Model: ${vehicle.model}, Year: ${vehicle.year}.
The car has run ${vehicle.mileage} kms. Its fuel efficiency is ${vehicle.fuelEfficiency}.
Key features include: ${vehicle.features.join(', ')}.
Provide the output in JSON format with two keys: "pros" and "cons", each containing an array of strings.`;

    const requestPayload = {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    pros: { type: Type.ARRAY, items: { type: Type.STRING } },
                    cons: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        }
    };

    try {
        const jsonText = await callGeminiAPI(requestPayload);
        return JSON.parse(jsonText.trim());
    } catch (error) {
        console.error("Failed to generate pros and cons from proxy:", error);
        return { pros: ['AI analysis unavailable.'], cons: ['Could not generate suggestions at this time.'] };
    }
};

export const getSellerPriceSuggestion = async (
    vehicle: Pick<Vehicle, 'make' | 'model' | 'year' | 'mileage' | 'city' | 'state' | 'noOfOwners'>,
    marketVehicles: Pick<Vehicle, 'price' | 'year' | 'mileage' | 'status'>[]
): Promise<{ summary: string; suggestedMinPrice: number; suggestedMaxPrice: number }> => {
    const prompt = `Act as an expert Indian used car valuator. Given the vehicle details and a sample of market listings, provide a fair market price suggestion for a seller.

    **Vehicle to be Priced:**
    - ${vehicle.year} ${vehicle.make} ${vehicle.model}
    - Mileage: ${vehicle.mileage.toLocaleString('en-IN')} kms
    - Location: ${vehicle.city}, ${vehicle.state}
    - Owners: ${vehicle.noOfOwners}

    **Comparable Market Listings (mix of active and sold):**
    ${JSON.stringify(marketVehicles.slice(0, 20), null, 2)}

    Your task is to:
    1.  Provide a concise 'summary' explaining the rationale for your valuation. Mention positive and negative factors (e.g., "high mileage but a desirable model in this city").
    2.  Provide a 'suggestedMinPrice' and 'suggestedMaxPrice' in INR. This should be a realistic range for the seller to list their vehicle.

    Respond ONLY with a JSON object matching the specified schema. If you cannot determine a price, return 0 for both price fields.`;

    const requestPayload = {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    suggestedMinPrice: { type: Type.NUMBER },
                    suggestedMaxPrice: { type: Type.NUMBER }
                },
                required: ["summary", "suggestedMinPrice", "suggestedMaxPrice"]
            }
        }
    };

    try {
        const jsonText = await callGeminiAPI(requestPayload);
        return JSON.parse(jsonText.trim());
    } catch (error) {
        console.error("Failed to generate seller price suggestion from proxy:", error);
        return { summary: 'AI analysis failed. Could not determine a fair market value.', suggestedMinPrice: 0, suggestedMaxPrice: 0 };
    }
};

export const generateVehicleDescription = async (vehicle: Partial<Vehicle>): Promise<string> => {
    if (!vehicle.make || !vehicle.model || !vehicle.year) {
        return "Please provide Make, Model, and Year for an accurate description.";
    }

    const prompt = `Generate a detailed and appealing vehicle description for an online marketplace, targeting an Indian audience. The description should be well-structured, easy to read, and highlight the vehicle's key selling points.
    
    Here is the vehicle data:
    - Make: ${vehicle.make}
    - Model: ${vehicle.model}
    - Variant: ${vehicle.variant || 'N/A'}
    - Year: ${vehicle.year}
    - Price: ₹${vehicle.price?.toLocaleString('en-IN')}
    - Mileage: ${vehicle.mileage?.toLocaleString('en-IN')} kms
    - Fuel Type: ${vehicle.fuelType}
    - Transmission: ${vehicle.transmission}
    - Color: ${vehicle.color}
    - No. of Owners: ${vehicle.noOfOwners}
    - Key Features: ${vehicle.features?.join(', ')}

    Follow these instructions:
    1. Start with a strong, catchy opening sentence.
    2. Write a paragraph detailing the vehicle's condition, performance, and key features. Mention its suitability for different types of buyers (e.g., for a family, for city driving).
    3. Use bullet points to list 3-5 of the most attractive features.
    4. Conclude with a sentence that encourages buyers to take action (e.g., "Don't miss out on this well-maintained vehicle!").
    5. The tone should be professional yet persuasive. Avoid overly technical jargon.
    6. The total length should be around 3-4 paragraphs, including the bullet points.
    7. Ensure the output is just the description text, without any introductory phrases like "Here is the description:".`;

    const requestPayload = {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            thinkingConfig: { thinkingBudget: 0 },
        },
    };
    
    const descriptionText = await callGeminiAPI(requestPayload);
    if (descriptionText.startsWith("Error:")) {
        return "Failed to generate AI description. Please write one manually.";
    }
    return descriptionText.trim();
};

export const getAiVehicleSuggestions = async (
    vehicle: { make: string, model: string, variant?: string, year: number }
): Promise<{
    structuredSpecs: Partial<Pick<Vehicle, 'engine' | 'transmission' | 'fuelType' | 'fuelEfficiency' | 'displacement' | 'groundClearance' | 'bootSpace'>>;
    featureSuggestions: Record<string, string[]>;
}> => {
    const prompt = `For a ${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.variant || ''} in the Indian market, provide:
1.  Key technical specifications.
2.  A list of common features, categorized.

Respond ONLY with a single JSON object matching this schema. If a value is not applicable or commonly available, return "N/A" for specs or an empty array for features.
- The root object should have two keys: "structuredSpecs" and "featureSuggestions".
- "structuredSpecs" should be an object with keys: "engine", "transmission", "fuelType", "fuelEfficiency", "displacement", "groundClearance", "bootSpace".
- "featureSuggestions" should be an object where keys are categories like "Comfort & Convenience", "Safety", "Entertainment", and "Exterior", and values are arrays of feature strings.`;
    
    const requestPayload = {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    structuredSpecs: {
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
                    },
                    featureSuggestions: {
                        type: Type.OBJECT,
                        properties: {
                            "Comfort & Convenience": { type: Type.ARRAY, items: { type: Type.STRING } },
                            "Safety": { type: Type.ARRAY, items: { type: Type.STRING } },
                            "Entertainment": { type: Type.ARRAY, items: { type: Type.STRING } },
                            "Exterior": { type: Type.ARRAY, items: { type: Type.STRING } },
                        },
                        additionalProperties: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    }
                }
            },
            thinkingConfig: { thinkingBudget: 0 },
        }
    };

    try {
        const jsonText = await callGeminiAPI(requestPayload);
        const parsed = JSON.parse(jsonText.trim());
        return {
            structuredSpecs: parsed.structuredSpecs || {},
            featureSuggestions: parsed.featureSuggestions || {}
        };
    } catch (error) {
        console.error("Error fetching AI vehicle suggestions from proxy:", error);
        return { structuredSpecs: {}, featureSuggestions: { "Error": ["Could not fetch suggestions."] } };
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

    const requestPayload = {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
            },
            thinkingConfig: { thinkingBudget: 0 },
        }
    };
    
    try {
        const jsonText = await callGeminiAPI(requestPayload);
        return JSON.parse(jsonText.trim());
    } catch (error) {
        console.error("Error fetching search suggestions from proxy:", error);
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

    const requestPayload = {
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
    };
    
    try {
        const jsonText = await callGeminiAPI(requestPayload);
        const result = JSON.parse(jsonText.trim());
        
        return result.suggestions.map((s: any) => ({
            ...s,
            targetId: s.type === 'urgent_inquiry' ? String(s.targetId) : Number(s.targetId)
        }));
    } catch (error) {
        console.error("Error generating seller suggestions from proxy:", error);
        return [];
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

    const requestPayload = {
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER }
            }
        }
    };

    try {
        const jsonText = await callGeminiAPI(requestPayload);
        return JSON.parse(jsonText.trim());
    } catch (error) {
        console.error("Error generating vehicle recommendations from proxy:", error);
        return [];
    }
};