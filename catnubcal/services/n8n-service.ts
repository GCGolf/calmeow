
import { GoogleGenAI, Type } from '@google/genai';
import { FoodItem } from '../types';

/**
 * Helper to convert a File object to a base64 string
 */
const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Analyzes a food image using the OpenRouter API.
 * @param file The image file to analyze
 * @returns A partial FoodItem object with nutritional data
 */
export const analyzeFoodImage = async (file: File): Promise<Partial<FoodItem>> => {
  try {
    const base64Image = await fileToBase64(file);

    const prompt = `You are an expert Thai Nutritionist analyzing food images.

    RULES:
    1. **Simple Foods ARE Valid**: Even if you only see plain steamed white rice by itself with NO side dishes, that IS food. Identify it as "ข้าวสวย" (approximately 200 kcal per serving). Do NOT return empty just because there's no curry or toppings.
    2. **Complex Dishes**: For dishes with multiple components, list all visible items in the name.
    3. **Thai Names**: Always use Thai dish names.
    4. **Accurate Estimates**: Use standard Thai serving sizes for nutrition values.
    5. Return ONLY a valid JSON object matching the exact schema below. Do not include markdown code blocks like \`\`\`json or any other text.

    EXPECTED JSON FORMAT:
    {
      "name": "string (Thai dish name)",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number,
      "sugar": number,
      "sodium": number,
      "cholesterol": number,
      "servingSize": {
        "unit": "string",
        "quantity": number
      }
    }`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "CalMeow"
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite", // User requested model on OpenRouter
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: base64Image } }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${response.status} ${errorData.error?.message || ''}`);
    }

    const data = await response.json();
    let textResponse = data.choices[0].message.content;
    
    // Clean up potential markdown formatting (```json ... ```)
    textResponse = textResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const result = JSON.parse(textResponse);

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
    console.error('OpenRouter AI Analysis Error:', error);
    throw new Error('ไม่สามารถวิเคราะห์รูปภาพได้ในขณะนี้ โปรดลองอีกครั้งหรือกรอกข้อมูลด้วยตนเอง');
  }
};

export interface FoodSuggestion {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  description: string;
  emoji: string;
}

// ฐานข้อมูลอาหารไทยและอาหารยอดนิยม
const THAI_FOOD_DB: FoodSuggestion[] = [
  { name: 'ข้าวต้มหมู', calories: 200, protein: 14, carbs: 30, fat: 4, description: 'เบาท้อง ย่อยง่าย เหมาะกับมื้อเบาๆ', emoji: '🍚' },
  { name: 'ไข่ต้ม 2 ฟอง', calories: 155, protein: 13, carbs: 1, fat: 11, description: 'โปรตีนสูง ไขมันดี เหมาะเป็นอาหารว่าง', emoji: '🥚' },
  { name: 'สลัดผักรวม + น้ำสลัด', calories: 120, protein: 3, carbs: 10, fat: 8, description: 'ไฟเบอร์สูง ช่วยอิ่มนาน', emoji: '🥗' },
  { name: 'ข้าวกล้องกับปลาทูนึ่ง', calories: 350, protein: 28, carbs: 42, fat: 7, description: 'โปรตีนสูง คาร์บดี เหมาะสำหรับมื้อหลัก', emoji: '🐟' },
  { name: 'โยเกิร์ตกรีกกับผลไม้', calories: 180, protein: 15, carbs: 20, fat: 3, description: 'โปรตีนสูง โปรไบโอติก เหมาะเป็นของว่าง', emoji: '🍶' },
  { name: 'ก๋วยเตี๋ยวน้ำใส', calories: 280, protein: 18, carbs: 38, fat: 5, description: 'แคลอรี่ไม่มาก อิ่มได้นาน', emoji: '🍜' },
  { name: 'ลาบหมูสับ (ข้าวไม่มาก)', calories: 320, protein: 25, carbs: 20, fat: 12, description: 'โปรตีนสูง รสชาติดี', emoji: '🥩' },
  { name: 'ต้มจืดเต้าหู้หมูสับ', calories: 180, protein: 16, carbs: 8, fat: 8, description: 'แคลอรี่ต่ำ โปรตีนดี ไม่มัน', emoji: '🍲' },
  { name: 'กล้วยหอม 1 ผล', calories: 89, protein: 1, carbs: 23, fat: 0, description: 'คาร์บดี แมกนีเซียมสูง กินง่าย', emoji: '🍌' },
  { name: 'แอปเปิ้ล 1 ลูก', calories: 80, protein: 0, carbs: 21, fat: 0, description: 'ไฟเบอร์สูง น้ำตาลธรรมชาติ', emoji: '🍎' },
  { name: 'ไก่ย่าง + ผัก', calories: 280, protein: 32, carbs: 8, fat: 12, description: 'โปรตีนสูงมาก ไขมันต่ำ เหมาะสำหรับคนออกกำลังกาย', emoji: '🍗' },
  { name: 'อกไก่นึ่ง + ข้าวกล้อง', calories: 380, protein: 35, carbs: 45, fat: 6, description: 'มาตรฐาน clean eating สมดุลสารอาหาร', emoji: '🍱' },
  { name: 'ผลไม้รวม (แตงโม สับปะรด มะละกอ)', calories: 130, protein: 2, carbs: 33, fat: 0, description: 'วิตามินสูง รีเฟรชชิ่ง เหมาะอากาศร้อน', emoji: '🍉' },
  { name: 'ซุปผักใส', calories: 90, protein: 4, carbs: 14, fat: 2, description: 'แคลอรี่ต่ำมาก อิ่มได้ด้วยไฟเบอร์', emoji: '🥣' },
  { name: 'ขนมปังโฮลวีต + ไข่ดาว', calories: 250, protein: 14, carbs: 28, fat: 10, description: 'อาหารเช้าง่ายๆ พลังงานสมดุล', emoji: '🍳' },
  { name: 'สมูทตี้โปรตีน (นม + กล้วย + โอ้ตมีล)', calories: 300, protein: 16, carbs: 45, fat: 6, description: 'ง่ายทำเอง สารอาหารครบ พลังงานดี', emoji: '🥤' },
  { name: 'ซาลาเปา 2 ลูก', calories: 240, protein: 10, carbs: 40, fat: 5, description: 'ของว่างไทย กินง่าย พลังงานพอดี', emoji: '🥟' },
  { name: 'ข้าวผัดกระเพราไก่ (ลดน้ำมัน)', calories: 420, protein: 28, carbs: 50, fat: 12, description: 'อาหารไทยยอดนิยม โปรตีนสูง', emoji: '🍛' },
  { name: 'แซนด์วิชทูน่า', calories: 290, protein: 22, carbs: 30, fat: 8, description: 'โปรตีนสูง หาง่าย อิ่มนาน', emoji: '🥪' },
  { name: 'ต้มยำกุ้งน้ำใส', calories: 180, protein: 20, carbs: 8, fat: 6, description: 'แคลอรี่ต่ำ โปรตีนดี รสชาติดี', emoji: '🦐' },
  { name: 'โอ้ตมีลผสมนม', calories: 220, protein: 10, carbs: 36, fat: 5, description: 'ไฟเบอร์สูง ลดคอเลสเตอรอล', emoji: '🌾' },
  { name: 'ถั่วเขียวต้ม', calories: 150, protein: 8, carbs: 27, fat: 1, description: 'ไฟเบอร์สูง โปรตีนพืช แคลอรี่ต่ำ', emoji: '🫘' },
  { name: 'มักกะโรนีต้ม + ซอสมะเขือเทศ', calories: 310, protein: 12, carbs: 55, fat: 4, description: 'คาร์บดี พลังงานนาน ราคาถูก', emoji: '🍝' },
  { name: 'น้ำเต้าหู้ + ปาท่องโก๋', calories: 260, protein: 10, carbs: 38, fat: 8, description: 'อาหารเช้าไทยดั้งเดิม โปรตีนพืช', emoji: '🥛' },
  { name: 'ปลาหมึกนึ่งมะนาว', calories: 160, protein: 22, carbs: 6, fat: 3, description: 'โปรตีนสูงมาก แคลอรี่ต่ำ รสดี', emoji: '🦑' },
  { name: 'ข้าวโพดต้ม 1 ฝัก', calories: 130, protein: 4, carbs: 28, fat: 2, description: 'ไฟเบอร์ดี วิตามินสูง ของว่างเบาๆ', emoji: '🌽' },
  { name: 'เต้าหู้ผัดผัก', calories: 200, protein: 14, carbs: 10, fat: 10, description: 'โปรตีนพืช ผักครบ แคลอรี่พอดี', emoji: '🫕' },
  { name: 'ข้าวหมูแดง (ไม่มีน้ำ)', calories: 450, protein: 26, carbs: 58, fat: 14, description: 'มื้อใหญ่ พลังงานพอ สารอาหารครบ', emoji: '🍖' },
  { name: 'สลัดผลไม้รวม', calories: 140, protein: 2, carbs: 35, fat: 0, description: 'วิตามินสูง น้ำตาลธรรมชาติ รีเฟรช', emoji: '🍓' },
  { name: 'ข้าวกะเพรากุ้ง (ลดน้ำมัน)', calories: 400, protein: 24, carbs: 50, fat: 10, description: 'โปรตีนดี ไขมันไม่มาก อาหารไทยแท้', emoji: '🍤' },
];

/**
 * Suggests 3 foods based on remaining calories using OpenRouter AI.
 */
export const suggestFoodByCalories = async (remainingCalories: number): Promise<FoodSuggestion[]> => {
  try {
    // Inject a random seed to ensure varied responses if the user clicks multiple times
    const randomSeed = Math.floor(Math.random() * 10000);
    const prompt = `You are an expert Thai Nutritionist. The user has ${remainingCalories} kcal remaining for today.
    Suggest 3 different Thai dishes that fit within this calorie limit (each dish should have <= ${remainingCalories} kcal).
    Make the suggestions highly varied and creative (e.g. mix of noodles, rice, salads, soups, or snacks). 
    Random Seed: ${randomSeed} (Use this to randomize your selection).
    
    Return ONLY a valid JSON array of objects matching this exact schema:
    [
      {
        "name": "string (Thai dish name)",
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "description": "string (short description of why it's good in Thai)",
        "emoji": "string (1 relevant emoji)"
      }
    ]
    Do not include markdown blocks like \`\`\`json or any other text. Return only the raw JSON array.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "CalMeow"
      },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-lite",
        temperature: 1.0, // Max temperature for maximum variety
        seed: randomSeed,  // Pass seed directly in request body for true randomization
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${response.status} ${errorData.error?.message || ''}`);
    }

    const data = await response.json();
    let textResponse = data.choices[0].message.content;
    
    // Clean up potential markdown formatting
    textResponse = textResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const result = JSON.parse(textResponse);
    
    if (Array.isArray(result) && result.length > 0) {
      return result;
    }
    
    throw new Error('Invalid format returned');
  } catch (error) {
    console.error('AI Food Suggestion Error:', error);
    
    // Fallback to offline database if API fails
    const eligible = THAI_FOOD_DB.filter(f => f.calories <= remainingCalories);
    if (eligible.length === 0) {
      return [...THAI_FOOD_DB].sort((a, b) => a.calories - b.calories).slice(0, 3);
    }
    const shuffled = [...eligible].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }
};
