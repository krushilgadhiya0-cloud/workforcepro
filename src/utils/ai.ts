import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
let genAI: GoogleGenerativeAI | null = null;

if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
}

export async function generateAIResponse(prompt: string, contextData: any): Promise<string> {
  if (!genAI) {
    return "Error: Gemini API Key is missing. Please configure VITE_GEMINI_API_KEY in your environment.";
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    // Convert current app context to a readable string for the model
    const contextString = JSON.stringify(contextData, null, 2);
    
    const fullPrompt = `
You are the WorkForce AI Assistant, an intelligent management agent embedded within a SaaS application for business management.
Your goal is to answer queries from users (owners, admins, or workers) about their business data. Keep your responses concise, helpful, analytical, and professional. 
Format your responses using Markdown when appropriate (e.g., bolding numbers, creating bullet lists).

CURRENT BUSINESS DATA CONTEXT:
${contextString}

USER SETTING / QUERY:
---
${prompt}
---
Please respond intelligently to the query based purely on the data provided above. If the query asks for something not in the data, state that you don't have that information. Keep the response natural and direct, as if you are a smart assistant.
`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('Error with Gemini API:', error);
    return `I'm sorry, I'm currently unable to process your request due to an API error. The error is: ${error?.message || error}. Please ensure your API key is accurate and active.`;
  }
}
