
export interface FoodItem {
  id: string;
  name: string;
  timestamp: number;
  meal: 'มื้อเช้า' | 'มื้อกลางวัน' | 'มื้อเย็น' | 'ของว่าง';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  cholesterol: number; // mg
  imageUrl?: string;
  servingSize: {
    unit: string;
    quantity: number;
  };
}

export interface UserStats {
  name?: string;
  weight: number;
  targetWeight: number;
  tdee: number;
  waterIntake: number;
  waterGoal: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
}

export enum PetState {
  HAPPY = 'HAPPY',
  NORMAL = 'NORMAL',
  SAD = 'SAD'
}
