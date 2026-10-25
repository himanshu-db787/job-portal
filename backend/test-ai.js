import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: 'Respond with: ATS API test successful' }] }]
    });
    console.log('SUCCESS:', response.text);
  } catch (err) {
    console.error('FAILURE LOG:', err);
  }
}

test();