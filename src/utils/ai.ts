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
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    // Convert current app context to a readable string for the model
    const contextString = JSON.stringify(contextData, null, 2);
    
    const fullPrompt = `
You are the WorkForce AI, a highly intelligent and conversational AI assistant embedded within a SaaS management application.
You possess full general knowledge and should converse naturally like a helpful, real-world AI. 
If the user asks general questions, gives a greeting, or asks for business advice, answer them intelligently using your broad knowledge!

To help you give personalized advice, here is the CURRENT SNAPSHOT of the user's business data:
${contextString}

USER QUERY:
---
${prompt}
---
Please respond intelligently. Be conversational, natural, and helpful. Use the provided business data if it's relevant to their query, but DO NOT restrict yourself to only answering about the data.
`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    console.error('Error with Gemini API:', error);
    return `I'm sorry, I'm currently unable to process your request due to an API error. The error is: ${error?.message || error}. Please ensure your API key is accurate and active.`;
  }
}
