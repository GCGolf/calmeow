
import { GoogleGenAI, Type } from '@google/genai';
import { FoodItem } from '../types';

/**
 * Helper to convert a File object to a base64 string for the Gemini API.
 */
const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Analyzes a food image using the Gemini API.
 * Replaces the previous webhook-based approach to ensure reliability and higher accuracy.
 * @param file The image file to analyze
 * @returns A partial FoodItem object with nutritional data
 */
export const analyzeFoodImage = async (file: File): Promise<Partial<FoodItem>> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imagePart = await fileToGenerativePart(file);

    const prompt = `You are an expert Thai Nutritionist. Analyze the food in this image and identify what it is.

    CRITICAL RULES:
    1. **NEVER return empty values**: You MUST always provide a valid name and calorie estimate. If you see rice, say "ข้าวสวย". If you see bread or sandwich, say "แซนด์วิช" or "ขนมปังโฮลวีท". NEVER leave the name blank or return 0 calories for real food.
    2. **Simple Foods First**: If the image shows basic items (plain rice, boiled egg, bread, sandwich), identify them DIRECTLY without overthinking (e.g., "ข้าวสวย", "ไข่ต้ม", "แซนด์วิชไข่ทูน่า").
    3. **Complex Foods**: If the dish has multiple components (e.g., rice with curry and toppings), list ALL components in the name for accurate nutrition.
    4. **Thai Context**: Use natural Thai dish names.
    5. **Realistic Estimates**: Use standard Thai serving sizes for calorie/nutrient estimates.
    6. Return the data strictly in JSON format matching the requested schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'The name of the food dish in Thai' },
            calories: { type: Type.NUMBER, description: 'Estimated calories' },
            protein: { type: Type.NUMBER, description: 'Estimated protein in grams' },
            carbs: { type: Type.NUMBER, description: 'Estimated carbohydrates in grams' },
            fat: { type: Type.NUMBER, description: 'Estimated fat in grams' },
            fiber: { type: Type.NUMBER, description: 'Estimated fiber in grams' },
            sugar: { type: Type.NUMBER, description: 'Estimated sugar in grams' },
            sodium: { type: Type.NUMBER, description: 'Estimated sodium in milligrams' },
            cholesterol: { type: Type.NUMBER, description: 'Estimated cholesterol in milligrams' },
            servingSize: {
              type: Type.OBJECT,
              properties: {
                unit: { type: Type.STRING, description: 'Unit of measurement (e.g., จาน, ชาม, ชิ้น)' },
                quantity: { type: Type.NUMBER }
              },
              required: ['unit', 'quantity']
            }
          },
          required: ['name', 'calories', 'protein', 'carbs', 'fat'],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');

    return {
      name: result.name || 'อาหารที่ระบุไม่ได้',
      calories: Number(result.calories) || 0,
      protein: Number(result.protein) || 0,
      carbs: Number(result.carbs) || 0,
      fat: Number(result.fat) || 0,
      fiber: Number(result.fiber) || 0,
      sugar: Number(result.sugar) || 0,
      sodium: Number(result.sodium) || 0,
      cholesterol: Number(result.cholesterol) || 0,
      servingSize: result.servingSize || { unit: 'ที่', quantity: 1 }
    };
  } catch (error) {
    console.error('Gemini AI Analysis Error:', error);
    throw new Error('ไม่สามารถวิเคราะห์รูปภาพได้ในขณะนี้ โปรดลองอีกครั้งหรือกรอกข้อมูลด้วยตนเอง');
  }
};
