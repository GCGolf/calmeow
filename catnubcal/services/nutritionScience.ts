/**
 * nutritionScience.ts - Health Calculation Logic
 * 
 * "สมอง" ของระบบ - คำนวณตัวเลขทางสุขภาพตามหลักโภชนาการสากล
 * อ้างอิง: WHO & USDA Guidelines
 */

// --- CONSTANTS: หลักโภชนาการสากล ---
export const CALORIES_PER_KG_FAT = 7700; // พลังงาน 7,700 kcal = ไขมัน 1 kg
export const SODIUM_LIMIT_MG = 2300; // ลิมิตโซเดียมต่อวัน (2300mg USDA/WHO)
export const SUGAR_LIMIT_G = 30; // ลิมิตน้ำตาลต่อวัน (30g = 7.5 ช้อนชา roughly, WHO recommends <10% energy ~50g but <5% ~25g is better)
export const FIBER_TARGET_G = 25; // เป้าหมายไฟเบอร์ต่อวัน

// --- 1. Energy Balance & Weight Projection ---
export interface WeightProjection {
    dailyDeficit: number;
    projectedWeightChangeKg: number;
    status: 'losing' | 'gaining' | 'maintaining';
    message: string;
}

export const calculateWeightProjection = (tdee: number, avgDailyIntake: number): WeightProjection => {
    if (tdee <= 0) return { dailyDeficit: 0, projectedWeightChangeKg: 0, status: 'maintaining', message: 'ไม่มีข้อมูลเพียงพอ' };

    const dailyDeficit = tdee - avgDailyIntake;
    const projectedWeightChangeKg = (dailyDeficit * 30) / CALORIES_PER_KG_FAT;

    let status: 'losing' | 'gaining' | 'maintaining';
    let message: string;

    if (dailyDeficit > 200) {
        status = 'losing';
        message = `กำลังลดน้ำหนักได้ดี! คาดว่าจะลดได้ ${Math.abs(projectedWeightChangeKg).toFixed(1)} kg ใน 30 วัน`;
    } else if (dailyDeficit < -200) {
        status = 'gaining';
        message = `ระวัง! กินเกินเป้าหมาย อาจเพิ่มขึ้น ${Math.abs(projectedWeightChangeKg).toFixed(1)} kg ใน 30 วัน`;
    } else {
        status = 'maintaining';
        message = 'รักษาน้ำหนักได้คงที่ ยอดเยี่ยม!';
    }

    return {
        dailyDeficit,
        projectedWeightChangeKg: Number(projectedWeightChangeKg.toFixed(2)),
        status,
        message
    };
};

// --- 2. Macro Quality Analysis ---
export interface MacroAnalysis {
    pRatio: number;
    cRatio: number;
    fRatio: number;
    advice: string;
    quality: 'good' | 'warning' | 'danger';
}

export const analyzeMacroBalance = (protein: number, carbs: number, fat: number): MacroAnalysis => {
    const totalMacros = protein + carbs + fat;
    if (totalMacros === 0) return { pRatio: 0, cRatio: 0, fRatio: 0, advice: 'ไม่มีข้อมูล', quality: 'warning' };

    const pRatio = (protein / totalMacros) * 100;
    const cRatio = (carbs / totalMacros) * 100;
    const fRatio = (fat / totalMacros) * 100;

    let advice = '✅ สัดส่วนสารอาหารสมดุลดี!';
    let quality: 'good' | 'warning' | 'danger' = 'good';

    if (pRatio < 15) {
        advice = '⚠️ โปรตีนต่ำเกินไป ควรเพิ่มเนื้อสัตว์/ไข่/ถั่ว';
        quality = 'warning';
    } else if (fRatio > 40) {
        advice = '🚨 ไขมันสูงมาก ควรลดของทอดและอาหารมัน';
        quality = 'danger';
    } else if (cRatio > 65) {
        advice = '⚠️ คาร์บสูง ระวังน้ำตาลในเลือดพุ่ง';
        quality = 'warning';
    }

    return { pRatio: Math.round(pRatio), cRatio: Math.round(cRatio), fRatio: Math.round(fRatio), advice, quality };
};

// --- 3. Calorie Consistency Score (วินัยการกิน) ---
export const calculateConsistencyScore = (dailyCalories: number[], targetCalories: number): number => {
    if (dailyCalories.length === 0 || targetCalories <= 0) return 0;

    const daysWithLogs = dailyCalories.filter(c => c > 0).length;
    const logRate = (daysWithLogs / dailyCalories.length) * 100;

    // Calculate variance from target
    const variance = dailyCalories.reduce((sum, cal) => {
        if (cal === 0) return sum;
        const diff = Math.abs(cal - targetCalories) / targetCalories;
        return sum + (1 - Math.min(diff, 1));
    }, 0);

    const consistencyScore = daysWithLogs > 0 ? (variance / daysWithLogs) * 100 : 0;

    // Combine log rate and consistency
    return Math.round((logRate * 0.4 + consistencyScore * 0.6));
};



// --- 5. Health Tip Generator ---
export const generateHealthTip = (
    projection: WeightProjection,
    avgCalories: number,
    targetCalories: number
): { tip: string; icon: string; type: 'success' | 'warning' | 'info' } => {
    // Priority-based tips
    if (avgCalories === 0) {
        return { tip: 'เริ่มบันทึกอาหารเพื่อรับคำแนะนำส่วนตัว!', icon: '📝', type: 'info' };
    }

    if (projection.status === 'gaining' && projection.projectedWeightChangeKg > 1) {
        return { tip: 'ลองลดปริมาณอาหารมื้อเย็นลง 20% จะช่วยควบคุมน้ำหนักได้', icon: '🍽️', type: 'warning' };
    }

    if (projection.status === 'losing' && projection.projectedWeightChangeKg < -2) {
        return { tip: 'กินน้อยเกินไป! ควรเพิ่มโปรตีนเพื่อรักษามวลกล้ามเนื้อ', icon: '💪', type: 'warning' };
    }

    if (avgCalories < targetCalories * 0.5) {
        return { tip: 'กินให้เพียงพอเพื่อไม่ให้ร่างกายขาดพลังงาน', icon: '⚡', type: 'warning' };
    }

    if (projection.status === 'maintaining') {
        return { tip: 'รักษาความสม่ำเสมอได้ดีมาก! ทำต่อไป!', icon: '🎯', type: 'success' };
    }

    return { tip: 'ดื่มน้ำอย่างน้อย 8 แก้วต่อวันเพื่อช่วยเผาผลาญ', icon: '💧', type: 'info' };
};

// --- 6. Weekly Calorie Balance (สมดุลพลังงาน 7 วัน) ---
export const calculateWeeklyBalance = (
    dailyCalories: number[],
    dailyTarget: number
): { totalBalance: number; status: 'deficit' | 'surplus' | 'balanced'; message: string } => {
    // Sum only days with logs (to avoid skewing if user didn't log)
    // But for weekly weight loss meaningfulness, we usually treat missing days as 0 or exclude them.
    // Let's assume dailyCalories contains 7 days. If 0, it means no log.

    // Better Logic: Calculate deficit based on logged days count
    let loggedDays = 0;
    let totalIntake = 0;

    dailyCalories.forEach(cal => {
        if (cal > 0) {
            totalIntake += cal;
            loggedDays++;
        }
    });

    if (loggedDays === 0) return { totalBalance: 0, status: 'balanced', message: 'รอการบันทึก' };

    const totalTarget = dailyTarget * loggedDays;
    const balance = totalIntake - totalTarget;

    // Deficit = Negative balance (Good for weight loss)
    // Surplus = Positive balance (Good for gaining)

    let status: 'deficit' | 'surplus' | 'balanced' = 'balanced';
    if (balance < -1000) status = 'deficit';
    else if (balance > 1000) status = 'surplus';

    // 7700 kcal = 1kg fat
    const fatChange = (balance / 7700).toFixed(2);

    let message = '';
    if (status === 'deficit') message = `แนวโน้มลดลง ${Math.abs(Number(fatChange))} kg จากสัปดาห์นี้`;
    else if (status === 'surplus') message = `แนวโน้มเพิ่มขึ้น ${Math.abs(Number(fatChange))} kg จากสัปดาห์นี้`;
    else message = 'น้ำหนักคงที่ในสัปดาห์นี้';

    return { totalBalance: balance, status, message };
};

// --- 7. BMR vs Activity Education ---
export const calculateMetabolicSplit = (tdee: number): { bmr: number; activity: number; bmrPercent: number } => {
    // Rough estimate: BMR is usually ~70% of TDEE for sedentary/light active
    // We can just fix it for educational purposes.
    const bmr = Math.round(tdee * 0.7);
    const activity = tdee - bmr;
    return { bmr, activity, bmrPercent: 70 };
};

// --- 8. Scientific Health Grade (Neko Health Grade) ---
export interface QuestItem {
    name: string;
    icon: string;
    score: number;
    maxScore: number;
    progressPercent: number;
    status: 'success' | 'warning' | 'danger';
    message: string;
}

export interface HealthGradeResult {
    totalScore: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    breakdown: {
        calorieScore: number; // 40pts
        nutrientScore: number; // 40pts
        consistencyScore: number;// 20pts
    };
    nutritionGap: {
        missingProtein: number;
        excessSugar: number;
        excessSodium: number;
    };
    quests: QuestItem[]; // New Gamified Details
    advice: string[];
}

export const calculateScientificHealthGrade = (
    avgCalories: number,
    tdee: number,
    avgProtein: number,
    targetProtein: number,
    avgSugar: number,
    avgSodium: number,
    loggedDays: number
): HealthGradeResult => {
    let calorieScore = 0;
    let nutrientScore = 0;
    let consistencyScore = 0;
    const advice: string[] = [];
    const quests: QuestItem[] = [];

    // Gaps tracking
    let missingProtein = 0;
    let excessSugar = 0;
    let excessSodium = 0;

    // 1. Calorie Balance (40pts)
    const lowerBound = tdee * 0.8;
    const upperBound = tdee * 1.1;
    let calStatus: 'success' | 'warning' | 'danger' = 'success';
    let calMessage = 'ยอดเยี่ยม! พลังงานสมดุล';

    if (avgCalories >= lowerBound && avgCalories <= upperBound) {
        calorieScore = 40;
    } else {
        const diff = Math.min(Math.abs(avgCalories - tdee), tdee);
        const deduction = (diff / tdee) * 40;
        calorieScore = Math.max(0, 40 - deduction);
        calStatus = 'warning';

        if (avgCalories < lowerBound) {
            calMessage = `กินเพิ่มอีก ${Math.round(lowerBound - avgCalories)} kcal ให้ถึงเกณฑ์`;
            advice.push('กินน้อยกว่าเป้าหมายมากไประวังโยโย่');
        }
        else if (avgCalories > upperBound) {
            calMessage = `ลดลง ${Math.round(avgCalories - upperBound)} kcal จะสมบูรณ์แบบ`;
            advice.push('กินเกินเป้าหมาย ระวังน้ำหนักเพิ่ม');
        }
    }

    quests.push({
        name: 'ภารกิจ: สมดุลพลังงาน (TDEE ±10%)',
        icon: '⚖️',
        score: Math.round(calorieScore),
        maxScore: 40,
        progressPercent: (calorieScore / 40) * 100,
        status: calStatus,
        message: calMessage
    });

    // 2. Nutrient Quality (40pts)
    // Protein (15pts)
    let pScore = 0;
    let pMsg = 'โปรตีนถึงเป้าแล้ว เยี่ยม!';
    let pStatus: 'success' | 'warning' | 'danger' = 'success';

    if (avgProtein >= targetProtein * 0.8) {
        pScore = 15;
    } else {
        pScore = (avgProtein / targetProtein) * 15;
        missingProtein = Math.max(0, targetProtein - avgProtein);
        pMsg = `ขาดอีก ${Math.round(missingProtein)}g (ไข่ต้ม ~${Math.ceil(missingProtein / 6)} ฟอง)`;
        pStatus = 'warning';
        advice.push(`โปรตีนไม่ถึงเป้า (ขาดอีก ${Math.round(missingProtein)}g)`);
    }
    quests.push({ name: 'ภารกิจ: โปรตีนถึงเป้า (> 80%)', icon: '🥩', score: Math.round(pScore), maxScore: 15, progressPercent: (pScore / 15) * 100, status: pStatus, message: pMsg });

    // Sugar (15pts)
    let sScore = 0;
    let sMsg = 'คุมน้ำตาลได้ดีมาก!';
    let sStatus: 'success' | 'warning' | 'danger' = 'success';

    if (avgSugar <= SUGAR_LIMIT_G) {
        sScore = 15;
    } else {
        const over = avgSugar - SUGAR_LIMIT_G;
        const deduction = over / 2;
        sScore = Math.max(0, 15 - deduction);
        excessSugar = over;
        sMsg = `เกินมา ${Math.round(excessSugar)}g (ลดหวานลงหน่อย)`;
        sStatus = 'danger';
        if (avgSugar > SUGAR_LIMIT_G + 10) advice.push(`น้ำตาลเกินมาตรฐาน (เกิน ${Math.round(excessSugar)}g)`);
    }
    quests.push({ name: `ภารกิจ: คุมน้ำตาล (< ${SUGAR_LIMIT_G}g)`, icon: '🍬', score: Math.round(sScore), maxScore: 15, progressPercent: (sScore / 15) * 100, status: sStatus, message: sMsg });

    // Sodium (10pts)
    let naScore = 0;
    let naMsg = 'คุมเค็มได้ยอดเยี่ยม!';
    let naStatus: 'success' | 'warning' | 'danger' = 'success';

    if (avgSodium <= SODIUM_LIMIT_MG) {
        naScore = 10;
    } else {
        const over = avgSodium - SODIUM_LIMIT_MG;
        const deduction = over / 200;
        naScore = Math.max(0, 10 - deduction);
        excessSodium = over;
        naMsg = `เกินมา ${Math.round(excessSodium)}mg (งดซดน้ำซุป)`;
        naStatus = 'danger';
        if (avgSodium > SODIUM_LIMIT_MG + 500) advice.push(`โซเดียมสูงเสี่ยงไต (เกิน ${Math.round(excessSodium)}mg)`);
    }
    quests.push({ name: `ภารกิจ: คุมโซเดียม (< ${SODIUM_LIMIT_MG}mg)`, icon: '🧂', score: Math.round(naScore), maxScore: 10, progressPercent: (naScore / 10) * 100, status: naStatus, message: naMsg });

    nutrientScore = pScore + sScore + naScore;

    // 3. Consistency (20pts)
    let cMsg = 'วินัยดีเยี่ยม!';
    let cStatus: 'success' | 'warning' | 'danger' = 'success';

    if (loggedDays >= 5) consistencyScore = 20;
    else {
        consistencyScore = (loggedDays / 5) * 20;
        cMsg = `บันทึกอีก ${5 - loggedDays} วันเพื่อคะแนนเต็ม`;
        cStatus = 'warning';
        advice.push('ขาดความต่อเนื่อง บันทึกให้บ่อยขึ้นนะ');
    }
    quests.push({ name: 'ภารกิจ: วินัยสม่ำเสมอ (5 วัน/สัปดาห์)', icon: '📅', score: Math.round(consistencyScore), maxScore: 20, progressPercent: (consistencyScore / 20) * 100, status: cStatus, message: cMsg });

    const totalScore = Math.round(calorieScore + nutrientScore + consistencyScore);

    let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    if (totalScore >= 80) grade = 'A';
    else if (totalScore >= 70) grade = 'B';
    else if (totalScore >= 50) grade = 'C';
    else if (totalScore >= 40) grade = 'D';

    // Fallback advice if perfect
    if (advice.length === 0) advice.push('ยอดเยี่ยม! รักษาระดับนี้ต่อไป');

    return {
        totalScore,
        grade,
        breakdown: {
            calorieScore: Math.round(calorieScore),
            nutrientScore: Math.round(nutrientScore),
            consistencyScore: Math.round(consistencyScore)
        },
        nutritionGap: {
            missingProtein: Math.round(missingProtein),
            excessSugar: Math.round(excessSugar),
            excessSodium: Math.round(excessSodium)
        },
        quests,
        advice
    };
};
