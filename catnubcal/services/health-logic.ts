
import { FoodItem, PetState } from '../types';

/**
 * Calculates a health score (0-100) based on nutritional density.
 * Higher protein/fiber and lower sugar/sodium/fat relative to calories improves score.
 */
export const calculateHealthScore = (item: FoodItem): number => {
  let score = 50; // Starting baseline

  // Protein bonus
  score += (item.protein / item.calories) * 200;
  // Fiber bonus
  score += (item.fiber / item.calories) * 500;
  // Sugar penalty
  score -= (item.sugar / item.calories) * 300;
  // Sodium penalty
  score -= (item.sodium / 1000) * 10;
  // Saturated Fat (assuming half of fat is bad for simple logic)
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
