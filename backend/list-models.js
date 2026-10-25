import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function checkModel() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: 'ping' }] }]
    });
    console.log('✅ SUCCESS WITH gemini-3.8-flash:', response.text);
  } catch (err) {
    console.error('❌ FAILED:', err.message);
  }
}

checkModel();