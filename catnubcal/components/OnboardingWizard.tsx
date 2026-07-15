import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import { calculateBMR, calculateTDEE, calculateMacros, normalizeGoalType, normalizeActivityLevel } from '../services/health-logic';

// --- Types ---
interface OnboardingData {
    id?: string;
    username: string;
    gender: string;
    age: number;
    height: number;
    heightUnit: 'cm' | 'ft';
    weight: number;
    weightUnit: 'kg' | 'lbs';
    targetWeight: number;
    primaryGoal: string;
    motivation: string;
    activityLevel: string;
    workoutFrequency: number;
    workoutDuration: string;
    programIntensity: string;
    targetDate: string;
    // Calculated
    bmr: number;
    tdee: number;
    dailyCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    estimatedCompletionDate: string;
    warningMessage?: string;
    recommendedSafeDate?: string;
    recommendedSafeCalories?: number;
}

const initialData: OnboardingData = {
    username: '',
    gender: '',
    age: 25,
    height: 170,
    heightUnit: 'cm',
    weight: 60,
    weightUnit: 'kg',
    targetWeight: 55,
    primaryGoal: '',
    motivation: '',
    activityLevel: '',
    workoutFrequency: 3,
    workoutDuration: '30m',
    programIntensity: 'Normal',
    targetDate: '',
    bmr: 0,
    tdee: 0,
    dailyCalories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    estimatedCompletionDate: '',
    warningMessage: '',
    recommendedSafeDate: '',
    recommendedSafeCalories: 0,
};

const STEPS_COUNT = 15; // Reduced after removing Program Intensity step

export default function OnboardingWizard() {
    const [currentStep, setCurrentStep] = useState(1);
    const [data, setData] = useState<OnboardingData>(initialData);
    const [direction, setDirection] = useState(0);
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleNext = () => {
        if (currentStep < STEPS_COUNT) {
            if (currentStep === 14) {
                // Calculate before showing results (Step 15)
                calculatePlan();
            }
            setDirection(1);
            setCurrentStep((prev) => prev + 1);
        } else {
            saveAndStart();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setDirection(-1);
            setCurrentStep((prev) => prev - 1);
        }
    };

    const updateData = (key: keyof OnboardingData, value: any) => {
        setData((prev) => ({ ...prev, [key]: value }));
    };

    const calculatePlan = () => {
        // --- 1. Validation ---
        if (!data.gender || !data.age || !data.height || !data.weight || !data.targetWeight || !data.activityLevel || !data.primaryGoal) {
            window.alert("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        if (data.age < 18) {
            window.alert("แอปพลิเคชันนี้ออกแบบมาสำหรับผู้ใหญ่ที่มีอายุ 18 ปีขึ้นไป การจำกัดแคลอรีในวัยเด็กอาจส่งผลเสียต่อพัฒนาการ กรุณาปรึกษาแพทย์หรือนักกำหนดอาหาร");
            return;
        }

        // --- 2. BMR Calculation (Mifflin-St Jeor) ---
        const weightKg = data.weightUnit === 'lbs' ? data.weight * 0.453592 : data.weight;
        const heightCm = data.heightUnit === 'ft' ? data.height * 30.48 : data.height;
        const targetWeightKg = data.weightUnit === 'lbs' ? data.targetWeight * 0.453592 : data.targetWeight;

        const heightM = heightCm / 100;
        const bmi = weightKg / (heightM * heightM);

        if (bmi < 18.5 && data.primaryGoal === 'Lose Weight') {
            window.alert("ดัชนีมวลกาย (BMI) ของคุณต่ำกว่าเกณฑ์ (Underweight) การลดน้ำหนักเพิ่มเติมอาจเป็นอันตรายต่อสุขภาพ กรุณาเลือกเป้าหมายรักษาน้ำหนักหรือเพิ่มกล้ามเนื้อ");
            return;
        }

        const bmr = calculateBMR(data.gender, data.age, weightKg, heightCm);

        // --- 3. TDEE Calculation ---
        const durationInt = parseInt(data.workoutDuration) || 30;
        const tdee = calculateTDEE(bmr, data.activityLevel, data.workoutFrequency, durationInt);

        // --- 4. REVERSE CALCULATION: Deficit/Surplus from Target Date ---
        const totalWeightChange = Math.abs(weightKg - targetWeightKg); // kg to change
        const totalCaloriesNeeded = totalWeightChange * 7700; // ~1kg = 7700 kcal

        // Calculate days to goal from target date
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let targetDateObj = data.targetDate ? new Date(data.targetDate) : null;

        // Safety limits (kcal/day)
        const MAX_DEFICIT = 1000; // Max safe deficit for weight loss (~1kg/week)
        const MAX_SURPLUS = 500;  // Max surplus for clean bulking (~0.5kg/week)

        let dailyAdjustment = 0;
        let daysToGoal = 0;
        let calculatedEndDate = '';
        let validationMessage = '';

        if (data.primaryGoal === 'Maintain') {
            dailyAdjustment = 0;
            calculatedEndDate = '∞ (รักษาน้ำหนัก)';
        } else if (targetDateObj && targetDateObj > today) {
            daysToGoal = Math.ceil((targetDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            const requiredDailyChange = totalCaloriesNeeded / daysToGoal;

            if (data.primaryGoal === 'Lose Weight') {
                if (requiredDailyChange > MAX_DEFICIT) {
                    // Date is too aggressive - WARN and HARD BLOCK max deficit
                    const safeDays = Math.ceil(totalCaloriesNeeded / MAX_DEFICIT);
                    const safeDate = new Date(today);
                    safeDate.setDate(safeDate.getDate() + safeDays);
                    const safeDateString = safeDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

                    dailyAdjustment = -MAX_DEFICIT; // HARD CAP
                    calculatedEndDate = safeDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
                    validationMessage = `⚠️ เป้าหมายโหดเกินไป! (จำกัดการลดสูงสุด 1kg/สัปดาห์ เพื่อความปลอดภัย)\n📅 วันที่คาดว่าจะสำเร็จ: ${safeDateString}`;
                } else {
                    dailyAdjustment = -requiredDailyChange;
                    calculatedEndDate = targetDateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
                }
            } else if (data.primaryGoal === 'Gain Muscle') {
                if (requiredDailyChange > MAX_SURPLUS) {
                    // Date is too aggressive - WARN and HARD BLOCK max surplus
                    const safeDays = Math.ceil(totalCaloriesNeeded / MAX_SURPLUS);
                    const safeDate = new Date(today);
                    safeDate.setDate(safeDate.getDate() + safeDays);
                    const safeDateString = safeDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });

                    dailyAdjustment = MAX_SURPLUS; // HARD CAP
                    calculatedEndDate = safeDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
                    validationMessage = `⚠️ เป้าหมายท้าทายเกินไป! (จำกัดการเพิ่มสูงสุด 0.5kg/สัปดาห์)\n📅 วันที่คาดว่าจะสำเร็จ: ${safeDateString}`;
                } else {
                    dailyAdjustment = requiredDailyChange;
                    calculatedEndDate = targetDateObj.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
                }
            }
        } else {
            // No target date selected or invalid - use default safe rate
            const defaultRate = data.primaryGoal === 'Lose Weight' ? -500 : 350;
            dailyAdjustment = defaultRate;
            const safeDays = Math.ceil(totalCaloriesNeeded / Math.abs(defaultRate));
            const safeDate = new Date(today);
            safeDate.setDate(safeDate.getDate() + safeDays);
            calculatedEndDate = safeDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
            daysToGoal = safeDays;
        }

        // --- 5. Calculate Daily Target ---
        let dailyTarget = Math.round(tdee + dailyAdjustment);

        // Safety Floor (never go below 1200 for women, 1500 for men)
        const safetyFloor = data.gender === 'Male' ? 1500 : 1200;
        if (dailyTarget < safetyFloor) {
            dailyTarget = safetyFloor;
            const floorMsg = `⚠️ ปรับแคลอรี่เป็นขั้นต่ำที่ปลอดภัย (${safetyFloor} kcal/วัน)`;
            validationMessage = validationMessage ? `${validationMessage}\n${floorMsg}` : floorMsg;
        }

        // --- 6. Macro Calculation ---
        const macros = calculateMacros(dailyTarget, data.primaryGoal);

        // Calculate Recommended Safe Date (for reference)
        const calcSafeDate = (maxRate: number) => {
            const d = Math.ceil(totalCaloriesNeeded / maxRate);
            const date = new Date(today);
            date.setDate(date.getDate() + d);
            return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
        };

        let safeDateStr = '';
        let safeCals = 0;

        if (data.primaryGoal === 'Lose Weight') {
            let maxDeficit = MAX_DEFICIT;
            // Respect safety floor for realistic recommendation
            if (tdee - maxDeficit < safetyFloor) {
                maxDeficit = Math.max(1, tdee - safetyFloor);
            }
            safeDateStr = calcSafeDate(maxDeficit);
            safeCals = Math.round(tdee - maxDeficit);
        } else if (data.primaryGoal === 'Gain Muscle') {
            safeDateStr = calcSafeDate(MAX_SURPLUS);
            safeCals = Math.round(tdee + MAX_SURPLUS);
        } else {
            safeCals = Math.round(tdee);
        }

        // Update State
        setData(prev => ({
            ...prev,
            bmr: Math.round(bmr),
            tdee: Math.round(tdee),
            dailyCalories: dailyTarget,
            protein: macros.protein,
            carbs: macros.carbs,
            fat: macros.fat,
            estimatedCompletionDate: calculatedEndDate,
            warningMessage: validationMessage,
            recommendedSafeDate: safeDateStr,
            recommendedSafeCalories: safeCals
        }));
    };

    const saveAndStart = async () => {
        try {
            // Use authenticated user ID from AuthContext
            const userId = user?.id;
            if (!userId) {
                alert('กรุณาเข้าสู่ระบบก่อน');
                navigate('/auth');
                return;
            }

            // Parse duration string "30m" -> 30
            const durationInt = parseInt(data.workoutDuration) || 30;

            // Map to Snake Case for Supabase
            const dataToSave = {
                id: userId,
                username: data.username,
                gender: data.gender,
                age: data.age,
                height: data.height,
                current_weight: data.weight, // MAPPED
                target_weight: data.targetWeight, // MAPPED
                primary_goal: normalizeGoalType(data.primaryGoal), // NORMALIZED
                motivation: data.motivation,
                activity_level: normalizeActivityLevel(data.activityLevel), // NORMALIZED
                workout_days_per_week: data.workoutFrequency, // MAPPED
                workout_duration_min: durationInt, // MAPPED
                program_intensity: data.programIntensity, // MAPPED
                target_end_date: data.targetDate || new Date().toISOString(), // Use calculated if implementing full date logic, for now user input
                bmr: data.bmr,
                tdee: data.tdee,
                daily_calorie_target: data.dailyCalories, // MAPPED
                protein_target: data.protein,
                carbs_target: data.carbs,
                fat_target: data.fat,
                estimated_days_to_goal: 0, // Calculate if needed
                avatar_url: ''
            };

            console.log("Saving to Supabase:", dataToSave);

            const { error } = await supabase.from('profiles').upsert([dataToSave]);
            if (error) {
                console.error("Error saving profile:", error);

                // If it's the RLS error (42501), warn but proceed
                if (error.code === '42501' || error.message.includes('row-level security')) {
                    alert("Database locked (RLS Policy). Saved to Offline Storage.");
                } else if (!confirm("Database Error: " + error.message + "\n\nContinue to Dashboard anyway?")) {
                    return;
                }
            }

            // Always save to offline storage as fallback/cache
            localStorage.setItem('offline_profile', JSON.stringify(dataToSave));
            navigate('/dashboard');
        } catch (e: any) {
            console.error("Supabase error:", e);
            if (confirm("Error: " + (e.message || "Unknown") + "\n\nContinue to Dashboard?")) {
                navigate('/dashboard');
            }
        }
    };

    // --- Animation Variants ---
    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0,
        }),
    };

    return (
        <div className="min-h-screen flex flex-col font-sans text-slate-800 relative overflow-hidden sm:px-0">
            {/* Progress Bar */}
            <div className="fixed top-0 left-0 w-full h-2 bg-gray-200 z-50">
                <motion.div
                    className="h-full bg-purple-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep / STEPS_COUNT) * 100}%` }}
                />
            </div>

            {/* Header */}
            <div className="flex justify-between items-center p-4 mt-2 sm:p-6 sm:mt-4">
                {currentStep > 1 ? (
                    <button onClick={handleBack} className="p-2 rounded-full bg-white shadow-sm hover:bg-gray-100 transition">
                        <ChevronLeft className="w-6 h-6 text-slate-600" />
                    </button>
                ) : <div />}
                <span className="font-semibold text-slate-400 text-sm tracking-widest uppercase">Step {currentStep}/{STEPS_COUNT}</span>
                <div className="w-10" />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col justify-center px-6 pb-24 overflow-y-auto">
                <AnimatePresence custom={direction} mode="wait">
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="w-full max-w-md mx-auto px-2 sm:px-0"
                    >
                        {renderStep(currentStep, data, updateData)}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Next Button - Safe Area for Mobile */}
            <div className="fixed bottom-0 left-0 w-full p-4 pb-8 sm:p-6 bg-white/90 backdrop-blur-md border-t border-gray-100 z-50 safe-area-bottom">
                <button
                    onClick={handleNext}
                    className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg hover:bg-slate-800 transition transform active:scale-95 flex items-center justify-center gap-2"
                >
                    {currentStep === STEPS_COUNT ? 'Start Journey' : 'Continue'}
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Cheering Cat Overlay (Example for Step 8) */}
            <AnimatePresence>
                {currentStep === 8 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-24 right-4 z-40 bg-white p-3 rounded-xl shadow-xl border border-purple-100 flex items-center gap-3"
                    >
                        <span className="text-2xl">🐱</span>
                        <p className="text-sm font-medium text-purple-700">เก่งมาก! มาครึ่งทางแล้วเหมียว!</p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- Step Content Renderer ---
function renderStep(step: number, data: OnboardingData, update: (k: keyof OnboardingData, v: any) => void) {
    switch (step) {
        case 1:
            return (
                <div className="text-center space-y-4 sm:space-y-6">
                    <div className="text-5xl sm:text-6xl animate-bounce">👋😺</div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">Welcome to CalMeow!</h1>
                    <p className="text-slate-600 text-lg">I'm your personal coach. Let's build a plan just for you, Meow!</p>
                </div>
            );
        case 2:
            return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">What should I call you?</h2>
                    <input
                        type="text"
                        value={data.username}
                        onChange={(e) => update('username', e.target.value)}
                        placeholder="Your Name"
                        className="w-full p-4 text-xl border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
                        autoFocus
                    />
                </div>
            );
        case 3:
            return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">What's your gender?</h2>
                    <p className="text-xs text-purple-500 mt-1 font-medium">* ใช้ระบุสูตรคำนวณ BMR</p>
                    <div className="grid grid-cols-1 gap-4">
                        {['Male', 'Female', 'Non-binary'].map(g => (
                            <KeyOption key={g} label={g} selected={data.gender === g} onClick={() => update('gender', g)} />
                        ))}
                    </div>
                </div>
            );
        case 4:
            return (
                <div className="space-y-6 text-center">
                    <h2 className="text-2xl font-bold">How old are you?</h2>
                    <p className="text-xs text-purple-500 mt-1 font-medium">* ใช้ระบุสูตรคำนวณ BMR</p>
                    <input
                        type="number"
                        value={data.age}
                        onChange={(e) => update('age', parseInt(e.target.value))}
                        className="w-32 p-4 text-4xl text-center font-bold text-purple-600 border-2 border-gray-200 rounded-xl mx-auto block focus:border-purple-500 outline-none"
                    />
                </div>
            );
        case 5:
            return (
                <div className="space-y-6 text-center">
                    <h2 className="text-2xl font-bold">How tall are you?</h2>
                    <p className="text-xs text-purple-500 mt-1 font-medium">* ใช้ระบุสูตรคำนวณ BMR</p>
                    <div className="flex justify-center gap-4 items-end">
                        <input
                            type="number"
                            value={data.height}
                            onChange={(e) => update('height', parseFloat(e.target.value))}
                            className="w-32 p-4 text-4xl text-center font-bold text-purple-600 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                        />
                        <span className="text-xl font-medium pb-4 text-slate-500">{data.heightUnit}</span>
                    </div>
                </div>
            );
        case 6:
            return (
                <div className="space-y-6 text-center">
                    <h2 className="text-2xl font-bold">Current Weight?</h2>
                    <p className="text-xs text-purple-500 mt-1 font-medium">* ใช้ระบุสูตรคำนวณ BMR</p>
                    <div className="flex justify-center gap-4 items-end">
                        <input
                            type="number"
                            value={data.weight}
                            onChange={(e) => update('weight', parseFloat(e.target.value))}
                            className="w-32 p-4 text-4xl text-center font-bold text-purple-600 border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                        />
                        <span className="text-xl font-medium pb-4 text-slate-500">{data.weightUnit}</span>
                    </div>
                </div>
            );
        case 7:
            return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-center">เป้าหมายของคุณคืออะไร?</h2>
                    <p className="text-xs text-purple-500 mt-1 text-center font-medium">* ใช้กำหนดทิศทางแผน (ลด/เพิ่ม)</p>
                    <div className="space-y-4">
                        {[
                            { value: 'Lose Weight', label: 'ลดน้ำหนัก', icon: '📉', desc: 'เผาผลาญไขมัน ลดน้ำหนัก' },
                            { value: 'Gain Muscle', label: 'เพิ่มน้ำหนัก/กล้ามเนื้อ', icon: '📈', desc: 'เพิ่มกล้ามเนื้อ สร้างมวล' },
                            { value: 'Maintain', label: 'รักษาน้ำหนัก', icon: '⚖️', desc: 'รักษาสมดุล ไม่เปลี่ยนแปลง' }
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => update('primaryGoal', opt.value)}
                                className={`w-full p-5 rounded-2xl flex items-center gap-4 text-left border-2 transition-all ${data.primaryGoal === opt.value
                                    ? 'border-purple-600 bg-purple-50 shadow-lg shadow-purple-100'
                                    : 'border-gray-100 bg-white hover:border-purple-200'
                                    }`}
                            >
                                <span className="text-4xl">{opt.icon}</span>
                                <div>
                                    <h3 className={`text-lg font-bold ${data.primaryGoal === opt.value ? 'text-purple-700' : 'text-slate-800'}`}>{opt.label}</h3>
                                    <p className="text-sm text-slate-500">{opt.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            );
        case 8:
            // Strict min/max based on goal - use stepped input
            const loseWeightMax = data.weight - 1;
            const gainWeightMin = data.weight + 1;

            // Set initial valid value based on goal
            const getValidTarget = () => {
                if (data.primaryGoal === 'Maintain') return data.weight;
                if (data.primaryGoal === 'Lose Weight') {
                    return data.targetWeight < data.weight ? data.targetWeight : loseWeightMax;
                }
                if (data.primaryGoal === 'Gain Muscle') {
                    return data.targetWeight > data.weight ? data.targetWeight : gainWeightMin;
                }
                return data.targetWeight;
            };

            const currentTarget = getValidTarget();
            const goalHint = data.primaryGoal === 'Lose Weight'
                ? `📉 สูงสุด ${loseWeightMax} ${data.weightUnit}`
                : data.primaryGoal === 'Gain Muscle'
                    ? `📈 ต่ำสุด ${gainWeightMin} ${data.weightUnit}`
                    : `⚖️ รักษาไว้ที่ ${data.weight} ${data.weightUnit}`;

            const canDecrement = data.primaryGoal === 'Lose Weight' ? currentTarget > 30 :
                data.primaryGoal === 'Gain Muscle' ? currentTarget > gainWeightMin : false;
            const canIncrement = data.primaryGoal === 'Gain Muscle' ? currentTarget < 200 :
                data.primaryGoal === 'Lose Weight' ? currentTarget < loseWeightMax : false;

            return (
                <div className="space-y-6 text-center">
                    <h2 className="text-2xl font-bold">น้ำหนักเป้าหมาย?</h2>
                    <p className="text-xs text-purple-500 mt-1 font-medium">* ใช้คำนวณพลังงานรวมที่ต้องใช้</p>
                    <p className="text-sm text-purple-600 font-medium">{goalHint}</p>

                    {data.primaryGoal !== 'Maintain' ? (
                        <div className="flex justify-center items-center gap-4">
                            {/* Decrement Button */}
                            <button
                                onClick={() => {
                                    if (canDecrement) {
                                        update('targetWeight', currentTarget - 1);
                                    }
                                }}
                                disabled={!canDecrement}
                                className={`w-14 h-14 rounded-full text-2xl font-bold transition-all ${canDecrement
                                    ? 'bg-purple-100 text-purple-600 hover:bg-purple-200 active:scale-95'
                                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                    }`}
                            >
                                −
                            </button>

                            {/* Display Value */}
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-purple-600">{currentTarget}</span>
                                <span className="text-xl font-medium text-slate-500">{data.weightUnit}</span>
                            </div>

                            {/* Increment Button */}
                            <button
                                onClick={() => {
                                    if (canIncrement) {
                                        update('targetWeight', currentTarget + 1);
                                    }
                                }}
                                disabled={!canIncrement}
                                className={`w-14 h-14 rounded-full text-2xl font-bold transition-all ${canIncrement
                                    ? 'bg-purple-100 text-purple-600 hover:bg-purple-200 active:scale-95'
                                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                    }`}
                            >
                                +
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-center items-baseline gap-2">
                            <span className="text-5xl font-black text-gray-400">{data.weight}</span>
                            <span className="text-xl font-medium text-slate-500">{data.weightUnit}</span>
                        </div>
                    )}

                    {data.primaryGoal === 'Maintain' && (
                        <p className="text-xs text-slate-400">รักษาน้ำหนัก = น้ำหนักเป้าหมาย = น้ำหนักปัจจุบัน</p>
                    )}
                    {data.primaryGoal === 'Lose Weight' && (
                        <p className="text-xs text-green-600">🔒 ล๊อคไม่ให้เกิน {loseWeightMax} {data.weightUnit}</p>
                    )}
                    {data.primaryGoal === 'Gain Muscle' && (
                        <p className="text-xs text-green-600">🔒 ล๊อคไม่ให้ต่ำกว่า {gainWeightMin} {data.weightUnit}</p>
                    )}
                </div>
            );
        case 9:
            return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">What motivates you?</h2>
                    <textarea
                        value={data.motivation}
                        onChange={(e) => update('motivation', e.target.value)}
                        placeholder="e.g. Wedding, Health, Feel good..."
                        className="w-full p-4 text-lg border-2 border-gray-200 rounded-xl h-32 resize-none focus:border-purple-500 outline-none"
                    />
                </div>
            );
        case 10:
            return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Activity Level</h2>
                    <p className="text-xs text-purple-500 mt-1 font-medium">* ใช้คำนวณการเผาผลาญต่อวัน (TDEE)</p>
                    <p className="text-sm text-slate-500">ประเมินแค่การขยับตัวในชีวิตประจำวันหรือการทำงานเท่านั้น (ไม่รวมออกกำลังกาย)</p>
                    <div className="space-y-3">
                        {[
                            { l: 'Sedentary', d: 'เน้นนั่งทำงานออฟฟิศเป็นหลัก ไม่ค่อยได้เดิน (Desk job)' },
                            { l: 'Lightly Active', d: 'มีการยืนหรือเดินบ้างระหว่างวัน (เช่น ครู, พนักงานขาย)' },
                            { l: 'Moderate', d: 'ต้องเดินตลอดเวลา หรือใช้แรงปานกลาง (เช่น พนักงานเสิร์ฟ, พยาบาล)' },
                            { l: 'Very Active', d: 'ทำงานใช้แรงงานหนัก หรือแบกหาม (เช่น ช่างก่อสร้าง, เกษตรกร)' }
                        ].map(opt => (
                            <button
                                key={opt.l}
                                onClick={() => update('activityLevel', opt.l)}
                                className={`w-full p-4 rounded-xl text-left border-2 transition-all ${data.activityLevel === opt.l
                                    ? 'border-purple-600 bg-purple-50'
                                    : 'border-gray-100 bg-white hover:border-purple-200'
                                    }`}
                            >
                                <h3 className={`font-bold ${data.activityLevel === opt.l ? 'text-purple-700' : 'text-slate-800'}`}>{opt.l}</h3>
                                <p className="text-sm text-slate-500">{opt.d}</p>
                            </button>
                        ))}
                    </div>
                    <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
                        <b>💡 ตัวคูณพื้นฐาน (Base Lifestyle Multiplier):</b>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li>Sedentary = 1.2</li>
                            <li>Lightly Active = 1.3</li>
                            <li>Moderate = 1.4</li>
                            <li>Very Active = 1.5</li>
                        </ul>
                    </div>
                </div>
            );
        case 11:
            return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Workout Frequency</h2>
                    <div className="text-center">
                        <span className="text-6xl font-bold text-purple-600">{data.workoutFrequency}</span>
                        <span className="text-xl text-slate-500 ml-2">days/week</span>
                    </div>
                    <input
                        type="range" min="0" max="7"
                        value={data.workoutFrequency}
                        onChange={(e) => update('workoutFrequency', parseInt(e.target.value))}
                        className="w-full accent-purple-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
                        <b>💡 โบนัสออกกำลังกาย (Exercise Bonus Multiplier):</b>
                        <p className="mt-1">ระบบจะนำ ความถี่ x ระยะเวลา = นาทีรวมต่อสัปดาห์ เพื่อหาโบนัสที่นำไปบวกเพิ่ม</p>
                    </div>
                </div>
            );
        case 12:
            return (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold">Workout Duration</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {['15m', '30m', '45m', '60m+'].map(t => (
                            <KeyOption key={t} label={t} selected={data.workoutDuration === t} onClick={() => update('workoutDuration', t)} />
                        ))}
                    </div>
                    <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 text-xs text-blue-700">
                        <b>💡 โบนัสออกกำลังกาย (Exercise Bonus Multiplier):</b>
                        <p className="mt-1">ความถี่ ({data.workoutFrequency} วัน) x ระยะเวลา = นาทีรวมต่อสัปดาห์</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>0 นาที ➔ โบนัส +0.0</li>
                            <li>1 - 60 นาที ➔ โบนัส +0.05</li>
                            <li>61 - 150 นาที ➔ โบนัส +0.15</li>
                            <li>151 - 250 นาที ➔ โบนัส +0.25</li>
                            <li>&gt; 250 นาที ➔ โบนัส +0.35</li>
                        </ul>
                    </div>
                </div>
            );
        case 13:
            return (
                <div className="space-y-6 text-center">
                    <h2 className="text-2xl font-bold">📅 วันที่ต้องการบรรลุเป้าหมาย</h2>
                    <p className="text-xs text-purple-500 mt-1 mb-2 font-medium">* ใช้คำนวณ Deficit/Surplus ต่อวัน</p>
                    <p className="text-slate-500 text-sm">เลือกวันที่คุณอยากถึงเป้าหมาย ระบบจะคำนวณแคลอรี่ให้เหมาะสม</p>
                    <input type="date"
                        value={data.targetDate}
                        onChange={(e) => update('targetDate', e.target.value)}
                        min={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} // Min 2 weeks from now
                        className="w-full p-4 text-xl border-2 border-gray-200 rounded-xl focus:border-purple-500 outline-none"
                    />
                    <p className="text-xs text-slate-400">💡 ถ้าไม่เลือก ระบบจะคำนวณวันที่ปลอดภัยให้อัตโนมัติ</p>
                </div>
            );
        case 14:
            return (
                <div className="text-center space-y-6 py-10">
                    <div className="text-6xl animate-pulse">👩‍💻😺</div>
                    <h2 className="text-2xl font-bold">กำลังคำนวณแผน...</h2>
                    <p className="text-slate-500">ปรับให้เหมาะกับการเผาผลาญของคุณ...</p>
                </div>
            );
        case 15:
            return (
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold mb-1">🎉 แผนของคุณพร้อมแล้ว!</h2>
                        <p className="text-slate-500 text-sm">คำนวณตามหลักวิทยาศาสตร์ & เป้าหมายของคุณ</p>
                        {data.warningMessage && (
                            <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium whitespace-pre-line animate-pulse">
                                {data.warningMessage}
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100 space-y-4">
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                            <span className="text-slate-500">แคลอรี่ต่อวัน</span>
                            <span className="text-3xl font-bold text-purple-600">{data.dailyCalories} kcal</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">BMR (พื้นฐาน)</span>
                            <span className="font-medium text-slate-800">{data.bmr} kcal</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">TDEE (รักษาน้ำหนัก)</span>
                            <span className="font-medium text-slate-800">{data.tdee} kcal</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-500">วันที่คาดว่าจะถึงเป้าหมาย</span>
                            <span className="font-medium text-slate-800">{data.estimatedCompletionDate}</span>
                        </div>

                        {/* Macro Breakdown */}
                        <div className="pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                            <div className="bg-cyan-50 p-3 rounded-xl">
                                <span className="block text-xs font-bold text-cyan-600 mb-1">โปรตีน</span>
                                <span className="text-lg font-black text-slate-800">{data.protein}g</span>
                            </div>
                            <div className="bg-orange-50 p-3 rounded-xl">
                                <span className="block text-xs font-bold text-orange-600 mb-1">คาร์บ</span>
                                <span className="text-lg font-black text-slate-800">{data.carbs}g</span>
                            </div>
                            <div className="bg-lime-50 p-3 rounded-xl">
                                <span className="block text-xs font-bold text-lime-600 mb-1">ไขมัน</span>
                                <span className="text-lg font-black text-slate-800">{data.fat}g</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-xl flex gap-3 items-start">
                        <span className="text-2xl">💡</span>
                        <div className="flex-1">
                            <p className="text-sm text-purple-800 leading-relaxed mb-2">
                                เพื่อไปถึง {data.targetWeight}{data.weightUnit} ภายใน {data.estimatedCompletionDate} ให้ทานวันละ <b>{data.dailyCalories} แคลอรี่</b> สู้ๆ นะครับ! 🐱
                            </p>
                            {data.recommendedSafeDate && (
                                <p className="text-xs text-purple-700 bg-white/50 p-2 rounded-lg inline-block border border-purple-100">
                                    🛡️ ระยะเวลาที่เหมาะสมเพื่อความปลอดภัย (เร็วสุด): <b>ถึงวันที่ {data.recommendedSafeDate}</b> (ใช้ {data.recommendedSafeCalories} kcal/วัน)
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            );
        default: return null;
    }
}

// --- Helper Components ---
const KeyOption: React.FC<{ label: string, selected: boolean, onClick: () => void }> = ({ label, selected, onClick }) => {
    return (
        <button
            onClick={onClick}
            className={`w-full p-4 rounded-xl font-bold text-lg transition-all ${selected
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                : 'bg-white text-slate-700 border-2 border-gray-100 hover:border-purple-200'
                }`}
        >
            <div className="flex items-center justify-between">
                {label}
                {selected && <Check className="w-5 h-5" />}
            </div>
        </button>
    )
}
