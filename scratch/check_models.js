const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '/Users/mimi/piSante/medaichain-backend/.env' });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // There isn't a direct listModels in the standard SDK easily accessible without extra boilerplate, 
    // but we can try common names.
    const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro'];
    for (const m of models) {
      try {
        const model = genAI.getGenerativeModel({ model: m });
        await model.generateContent('test');
        console.log(`✅ Model ${m} is available`);
      } catch (e) {
        console.log(`❌ Model ${m} failed: ${e.message}`);
      }
    }
  } catch (err) {
    console.error(err);
  }
}

listModels();
