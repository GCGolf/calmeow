
import { FoodItem, UserStats } from './types';

export const INITIAL_USER_STATS: UserStats = {
  weight: 72.5,
  targetWeight: 68.0,
  tdee: 2200,
  waterIntake: 3,
  waterGoal: 8
};

export const MOCK_YESTERDAY_BREAKFAST: FoodItem = {
  id: 'y-br-1',
  name: 'โจ๊กหมูใส่ไข่',
  timestamp: Date.now() - 86400000,
  meal: 'มื้อเช้า',
  calories: 350,
  protein: 18,
  carbs: 42,
  fat: 12,
  fiber: 2,
  sugar: 1,
  sodium: 850,
  servingSize: { unit: 'ชาม', quantity: 1 }
};

export const MOCK_DAILY_LOGS = [
  { date: '2024-05-15', calories: 2100, goal: 2200, healthScore: 88 },
  { date: '2024-05-16', calories: 2350, goal: 2200, healthScore: 72 },
  { date: '2024-05-17', calories: 1950, goal: 2200, healthScore: 90 },
  { date: '2024-05-18', calories: 2200, goal: 2200, healthScore: 85 },
  { date: '2024-05-19', calories: 2400, goal: 2200, healthScore: 65 },
  { date: '2024-05-20', calories: 2050, goal: 2200, healthScore: 92 },
  { date: '2024-05-21', calories: 2150, goal: 2200, healthScore: 84 },
];
