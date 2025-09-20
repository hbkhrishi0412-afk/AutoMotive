import { GoogleGenAI } from "@google/genai";

// Vercel will automatically turn this into a serverless function.
// Using the Edge runtime for performance.
export const config = {
  runtime: 'edge',
};

// This is the main handler for the API route.
export default async function handler(req: Request) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    try {
        // The frontend will send a 'payload' object that contains all the parameters
        // for the Gemini API call (model, contents, config, etc.)
        const { payload } = await req.json();

        if (!process.env.API_KEY) {
            console.error("API_KEY not configured in Vercel environment variables.");
            return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        
        // Initialize the AI client on the server with the secure API key
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const { model, ...requestParams } = payload;

        // Make the actual call to the Gemini API
        const response = await ai.models.generateContent({
          model,
          ...requestParams
        });
        
        // The .text property conveniently provides the string output,
        // which could be plain text or a JSON string.
        const resultText = response.text;

        // Send the result back to the frontend
        return new Response(JSON.stringify({ result: resultText }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Error in /api/gemini proxy:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return new Response(JSON.stringify({ error: 'An error occurred processing your AI request.', details: errorMessage }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
