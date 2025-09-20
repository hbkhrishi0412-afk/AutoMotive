import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// This is the main handler for the API route.
// It now uses Vercel's native request/response objects for better compatibility.
export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // The VercelRequest object has a pre-parsed body.
        // We expect the client to send `{ "payload": { ... } }`
        const { payload } = req.body;

        if (!payload) {
            return res.status(400).json({ error: 'Missing payload in request body' });
        }

        // This log is crucial for debugging on Vercel
        console.log(`Gemini API proxy called. API_KEY present: ${!!process.env.API_KEY}`);
        
        if (!process.env.API_KEY) {
            console.error("API_KEY not configured in Vercel environment variables.");
            return res.status(500).json({ error: 'Server configuration error.' });
        }
        
        // Initialize the AI client on the server with the secure API key
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Make the actual call to the Gemini API
        // The payload from the client should match the expected format for generateContent.
        const response: GenerateContentResponse = await ai.models.generateContent(payload);
        
        // The .text property conveniently provides the string output,
        // which could be plain text or a JSON string.
        const resultText = response.text;

        // Send the result back to the frontend
        return res.status(200).json({ result: resultText });

    } catch (error) {
        console.error("Error in /api/gemini proxy:", error);
        
        // Check if it's a specific Gemini API error if possible, or just a generic one
        const errorMessage = error instanceof Error ? error.message : "An unknown server error occurred.";
        
        // Respond with a more structured error
        return res.status(500).json({ 
            error: 'An error occurred while communicating with the AI service.', 
            details: errorMessage 
        });
    }
}
