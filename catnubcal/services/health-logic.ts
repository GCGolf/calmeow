
import { FoodItem, PetState } from '../types';

/**
 * Calculates a health score (0-100) based on nutritional density.
 */
export const calculateHealthScore = (item: FoodItem): number => {
  let score = 50;
  score += (item.protein / item.calories) * 200;
  score += (item.fiber / item.calories) * 500;
  score -= (item.sugar / item.calories) * 300;
  score -= (item.sodium / 1000) * 10;
  score -= (item.fat / item.calories) * 100;
  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Determines the pet's state based on daily progress.
 */
export const determinePetState = (caloriesEaten: number, target: number, averageHealthScore: number): PetState => {
  if (caloriesEaten <= target + 100 && averageHealthScore > 75) {
    return PetState.HAPPY;
  }
  if (caloriesEaten > target + 500 || averageHealthScore < 40) {
    return PetState.SAD;
  }
  return PetState.NORMAL;
};

// --- Standardized Normalizers ---

export const normalizeActivityLevel = (level: string): string => {
    const l = level.toLowerCase().trim();
    if (l === 'sedentary' || l === 'little to no exercise') return 'sedentary';
    if (l === 'lightly active' || l === 'light' || l === '1-3 days/week') return 'light';
    if (l === 'moderate' || l === '3-5 days/week') return 'moderate';
    if (l === 'very active' || l === 'active' || l === '6-7 days/week') return 'active';
    return 'sedentary';
};

export const normalizeGoalType = (goal: string): 'lose' | 'maintain' | 'gain' => {
    const g = goal.toLowerCase().trim();
    if (g === 'lose weight' || g === 'lose') return 'lose';
    if (g === 'gain muscle' || g === 'gain') return 'gain';
    return 'maintain';
};

// --- Core Health Calculations ---

export const calculateBMR = (gender: string, age: number, weightKg: number, heightCm: number): number => {
    const normalizedGender = gender.toLowerCase().trim();
    if (normalizedGender === 'male' || normalizedGender === 'ชาย') {
        return Math.round((10 * weightKg) + (6.25 * heightCm) - (5 * age) + 5);
    } else {
        return Math.round((10 * weightKg) + (6.25 * heightCm) - (5 * age) - 161);
    }
};

export const calculateTDEE = (bmr: number, activityLevel: string, workoutFrequency: number, workoutDurationMin: number): number => {
    const normLevel = normalizeActivityLevel(activityLevel);
    
    // 1. Base Lifestyle Multiplier
    let baseMultiplier = 1.2;
    if (normLevel === 'light') baseMultiplier = 1.3;
    if (normLevel === 'moderate') baseMultiplier = 1.4;
    if (normLevel === 'active') baseMultiplier = 1.5;

    // 2. Exercise Volume Calculation
    const weeklyExerciseMinutes = workoutFrequency * workoutDurationMin;

    // 3. Exercise Bonus Multiplier
    let bonus = 0.0;
    if (weeklyExerciseMinutes > 250) {
        bonus = 0.35;
    } else if (weeklyExerciseMinutes >= 151) {
        bonus = 0.25;
    } else if (weeklyExerciseMinutes >= 61) {
        bonus = 0.15;
    } else if (weeklyExerciseMinutes >= 1) {
        bonus = 0.05;
    }

    // 4. Final TDEE Calculation
    const finalMultiplier = baseMultiplier + bonus;
    return Math.round(bmr * finalMultiplier);
};

export const calculateMacros = (dailyCalories: number, goalType: string): { protein: number, carbs: number, fat: number } => {
    const normGoal = normalizeGoalType(goalType);
    let pSplit = 0.30, cSplit = 0.40, fSplit = 0.30; // Default (maintain)

    if (normGoal === 'lose') {
        pSplit = 0.40; cSplit = 0.30; fSplit = 0.30;
    } else if (normGoal === 'gain') {
        pSplit = 0.30; cSplit = 0.45; fSplit = 0.25;
    }

    return {
        protein: Math.round((dailyCalories * pSplit) / 4),
        carbs: Math.round((dailyCalories * cSplit) / 4),
        fat: Math.round((dailyCalories * fSplit) / 9)
    };
};

export const calculateDaysToGoal = (currentWeight: number, targetWeight: number, dailyCalories: number, tdee: number, createdAt?: string): string | null => {
    if (!currentWeight || !targetWeight) return null;
    
    const weightDiff = currentWeight - targetWeight; // positive if losing, negative if gaining
    const calDiff = tdee - dailyCalories; // positive if deficit, negative if surplus

    if (weightDiff === 0) {
        return 'ถึงเป้าหมายแล้ว 🎉';
    }
    
    if (Math.sign(weightDiff) === Math.sign(calDiff) && calDiff !== 0) {
        const daysNeeded = Math.ceil((Math.abs(weightDiff) * 7700) / Math.abs(calDiff));
        const baseDate = createdAt ? new Date(createdAt) : new Date();
        const completionDate = new Date(baseDate);
        completionDate.setDate(completionDate.getDate() + daysNeeded);
        return `${daysNeeded} วัน (${completionDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })})`;
    }
    
    return 'ไม่สำเร็จในแผนนี้';
};
