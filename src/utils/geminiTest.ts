// Simple Gemini API test to diagnose chatbot issues
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = 'AIzaSyAlhlPZPfwIV7Ts_EqE9w_m-XC61T6G0Qo';

export async function testGeminiAPI(): Promise<void> {
  console.log('🧪 Starting Gemini API diagnosis...');
  
  try {
    // Test 1: Basic API initialization
    console.log('📡 Step 1: Initializing Gemini API...');
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    console.log('✅ API initialized');

    // Test 2: Get model
    console.log('🤖 Step 2: Getting Gemini model...');
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('✅ Model obtained');

    // Test 3: Simple prompt
    console.log('💬 Step 3: Testing simple prompt...');
    const simplePrompt = "Hello, please respond with a short greeting.";
    
    const result = await model.generateContent(simplePrompt);
    console.log('✅ API call successful');
    
    const response = await result.response;
    const text = response.text();
    
    console.log('📝 Response received:');
    console.log('Length:', text.length);
    console.log('Content:', text.substring(0, 200));
    
    // Test 4: Therapeutic prompt (like what the app uses)
    console.log('🩺 Step 4: Testing therapeutic prompt...');
    const therapeuticPrompt = `You are Sage, a compassionate AI mental health companion. 

A user says: "I'm feeling anxious today."

Provide a supportive, empathetic response that validates their feelings and asks a follow-up question.`;

    const therapeuticResult = await model.generateContent(therapeuticPrompt);
    const therapeuticResponse = await therapeuticResult.response;
    const therapeuticText = therapeuticResponse.text();
    
    console.log('✅ Therapeutic response successful');
    console.log('Length:', therapeuticText.length);
    console.log('Content:', therapeuticText.substring(0, 300));
    
    console.log('🎉 All tests passed! Gemini API is working correctly.');
    
  } catch (error: any) {
    console.error('❌ Gemini API test failed:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.status) {
      console.error('HTTP Status:', error.status);
    }
    
    if (error.response) {
      console.error('Response:', error.response);
    }
    
    // Try to get more details
    try {
      console.error('Full error object:', JSON.stringify(error, null, 2));
    } catch (stringifyError) {
      console.error('Could not stringify error object');
    }
  }
}

// Make it available in browser console for testing
if (typeof window !== 'undefined') {
  (window as any).testGemini = testGeminiAPI;
  console.log('🔧 Gemini test loaded! Type "testGemini()" in console to run diagnostics');
}