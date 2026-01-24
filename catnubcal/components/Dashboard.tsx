
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    BarChart2,
    Settings,
    Camera,
    ChevronLeft,
    ChevronRight,
    Trash2,
    Bookmark,
    X,
    History,
    Activity,
    Sparkles,
    UtensilsCrossed,
    ClipboardList,
    Flame,
    Droplet,
    Plus,
    Image as ImageIcon,
    Calendar,
    Edit3,
    Beef,
    Wheat,
    GlassWater,
    Edit // [NEW] Added Edit Icon
} from 'lucide-react';
import { FoodItem, UserStats, PetState } from '../types';
import { INITIAL_USER_STATS, MOCK_DAILY_LOGS } from '../mockData';
import { calculateHealthScore, determinePetState } from '../services/health-logic';
import { analyzeFoodImage } from '../services/n8n-service';
import PetSmartWalk from './PetSmartWalk';
import WaterTracker from './WaterTracker';
import FoodList from './FoodList'; // [NEW]
import Analytics from './Analytics';
import MovingBackground from './MovingBackground';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../services/AuthContext';
import FavoriteMenuModal from './FavoriteMenuModal';

const Dashboard: React.FC = () => {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'dashboard' | 'diary' | 'analytics'>('dashboard');
    const [userStats, setUserStats] = useState<UserStats>(INITIAL_USER_STATS);
    const [foodLog, setFoodLog] = useState<FoodItem[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [currentWater, setCurrentWater] = useState(0); // [NEW] Water state
    const [currentWeight, setCurrentWeight] = useState<number | null>(null); // [NEW] Weight state
    const [targetWeight, setTargetWeight] = useState<number | null>(null);
    const [streak, setStreak] = useState(0); // [NEW] Streak State
    const [showWeightModal, setShowWeightModal] = useState(false);
    const [nutrientPage, setNutrientPage] = useState(0); // [NEW] Carousel page state (0 = Macros, 1 = Micros)

    const [showFavoriteModal, setShowFavoriteModal] = useState(false);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showManualForm, setShowManualForm] = useState(false); // Toggle manual entry form
    const [showPortionInput, setShowPortionInput] = useState(false); // [NEW] Custom portion input state
    const [isEditingMacros, setIsEditingMacros] = useState(false); // [NEW] Toggle Edit Mode

    // Check if current food is favorited when selectedFood changes
    useEffect(() => {
        const checkFavorite = async () => {
            if (!selectedFood || !user) {
                setIsFavorite(false);
                return;
            }
            try {
                const { data, error } = await supabase
                    .from('favorite_foods')
                    .select('id')
                    .eq('user_id', user.id)
                    .eq('name', selectedFood.name)
                    .maybeSingle();

                setIsFavorite(!!data);
            } catch (err) {
                console.error("Error checking favorite:", err);
                setIsFavorite(false);
            }
        };
        checkFavorite();
    }, [selectedFood, user]);

    // Toggle Favorite Status (Add or Remove)
    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedFood || !user) return;

        try {
            if (isFavorite) {
                // Remove from favorites
                const { error } = await supabase
                    .from('favorite_foods')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('name', selectedFood.name);

                if (error) throw error;
                setIsFavorite(false);
            } else {
                // Add to favorites
                const { data, error } = await supabase
                    .from('favorite_foods')
                    .insert([{
                        user_id: user.id,
                        name: selectedFood.name,
                        calories: selectedFood.calories,
                        protein: selectedFood.protein,
                        carbs: selectedFood.carbs,
                        fat: selectedFood.fat,
                        image_url: selectedFood.imageUrl
                    }])
                    .select()
                    .single();

                if (error) throw error;
                setIsFavorite(true);
            }
        } catch (err) {
            console.error("Error toggling favorite:", err);
            alert('เกิดข้อผิดพลาด');
        }
    };



    // Date Selection State - MOVED UP to fix ReferenceError
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [showMonthPicker, setShowMonthPicker] = useState(false); // [NEW] Month Picker Modal Toggle
    const [pickerYear, setPickerYear] = useState(new Date().getFullYear()); // [NEW] Picker Year State

    // Handle Selecting from Favorite Menu
    const handleSelectFavorite = async (favFood: FoodItem) => {
        const userId = user?.id;
        if (!userId) return;

        const logDate = new Date(selectedDate);
        logDate.setHours(12, 0, 0, 0);

        const newEntry = {
            user_id: userId,
            food_name: favFood.name,
            calories: Math.round(favFood.calories || 0),
            protein: Math.round(favFood.protein || 0),
            carbs: Math.round(favFood.carbs || 0),
            fat: Math.round(favFood.fat || 0),
            sugar: 0,
            sodium: 0,
            cholesterol: 0,
            image_url: favFood.imageUrl || null,
            created_at: logDate.toISOString()
        };

        try {
            const { data, error } = await supabase.from('food_logs').insert([newEntry]).select().single();

            if (error) {
                console.error("Error inserting food log:", error);
                alert('เกิดข้อผิดพลาดในการบันทึก: ' + error.message);
                return;
            }

            if (data) {
                const newFood: FoodItem = {
                    id: data.id,
                    name: data.food_name,
                    calories: data.calories,
                    protein: data.protein,
                    carbs: data.carbs,
                    fat: data.fat,
                    timestamp: new Date(data.created_at).getTime(),
                    meal: 'มื้อกลางวัน',
                    imageUrl: data.image_url,
                    fiber: 0,
                    sugar: data.sugar || 0,
                    sodium: data.sodium || 0,
                    cholesterol: data.cholesterol || 0,
                    servingSize: { unit: 'serving', quantity: 1 }
                };
                setFoodLog(prev => [...prev, newFood]);
            }
        } catch (err) {
            console.error("Error:", err);
            alert('เกิดข้อผิดพลาด');
        }

        setShowFavoriteModal(false);
        setShowAddModal(false);
    };

    const dateScrollRef = useRef<HTMLDivElement>(null); // [NEW] Ref for date scroll container

    // [MODIFIED] Generate Full Month Dates based on selectedDate
    const dateButtons = useMemo(() => {
        const dates = [];
        const currentSelected = new Date(selectedDate);
        const year = currentSelected.getFullYear();
        const month = currentSelected.getMonth();
        const today = new Date();

        // Get total days in month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 1; i <= daysInMonth; i++) {
            const d = new Date(year, month, i);
            dates.push({
                full: d.toLocaleDateString('en-CA'),
                dayName: d.toLocaleDateString('th-TH', { weekday: 'short' }),
                dateNum: d.getDate(),
                isToday: d.toLocaleDateString('en-CA') === today.toLocaleDateString('en-CA')
            });
        }
        return dates;
    }, [selectedDate]);

    // [NEW] Auto-scroll to selected date
    useEffect(() => {
        if (dateScrollRef.current) {
            const selectedBtn = dateScrollRef.current.querySelector('.selected-date-btn');
            if (selectedBtn) {
                selectedBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [selectedDate, activeTab]);

    const manualFormRef = useRef<HTMLFormElement>(null);
    const manualImageInputRef = useRef<HTMLInputElement>(null);

    const openAddModal = () => setShowAddModal(true);



    const handleWaterUpdate = async (newAmount: number) => {
        setCurrentWater(newAmount); // Optimistic update
        if (!user) return;

        const dateStr = selectedDate;

        // Save to Local Storage (Offline fallback)
        const localKey = `water_${user.id}_${dateStr}`;
        localStorage.setItem(localKey, newAmount.toString());

        try {
            const { error } = await supabase
                .from('water_logs')
                .upsert({ user_id: user.id, date: dateStr, amount: newAmount }, { onConflict: 'user_id,date' });

            if (error) throw error;
        } catch (err) {
            console.error("Error saving water log:", err);
        }
    };
    // Fetch User Profile from Supabase
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const userId = user?.id;
                if (!userId) return;

                let query = supabase.from('profiles').select('*').eq('id', userId);

                const { data, error } = await query.maybeSingle();

                if (data && data.daily_calorie_target) {
                    console.log("Fetched Profile:", data);
                    setUserStats(prev => ({
                        ...prev,
                        name: data.display_name || data.username || 'User',
                        tdee: data.daily_calorie_target, // Set Target Limit
                        proteinTarget: data.protein_target,
                        carbsTarget: data.carbs_target,
                        fatTarget: data.fat_target,
                    }));
                    // Set weight data
                    if (data.current_weight) setCurrentWeight(data.current_weight);
                    if (data.target_weight) setTargetWeight(data.target_weight);
                }
            } catch (e) {
                console.error("Error fetching profile:", e);
            }

            // FALLBACK: Load from Local Storage if Supabase failed or returned no data
            const offlineDataStr = localStorage.getItem('offline_profile');
            if (offlineDataStr) {
                try {
                    const offlineData = JSON.parse(offlineDataStr);
                    console.log("Using Offline Profile Data:", offlineData);
                    setUserStats(prev => ({
                        ...prev,
                        name: offlineData.username || 'User',
                        tdee: offlineData.daily_calorie_target,
                        proteinTarget: offlineData.protein_target,
                        carbsTarget: offlineData.carbs_target,
                        fatTarget: offlineData.fat_target,
                    }));
                } catch (err) {
                    console.error("Error parsing offline data", err);
                }
            }
        };
        fetchProfile();
    }, [user]);

    // [NEW] Fetch Water Log for Selected Date
    useEffect(() => {
        const fetchWaterLog = async () => {
            if (!user) return;
            // Ensure selectedDate is a valid Date object or string
            const dateStr = selectedDate;
            try {
                const { data, error } = await supabase
                    .from('water_logs')
                    .select('amount')
                    .eq('user_id', user.id)
                    .eq('date', dateStr)
                    .maybeSingle();

                if (error) throw error;
                setCurrentWater(data?.amount || 0);
            } catch (err) {
                console.warn("Error fetching water log:", err);
                // Fallback to local storage if needed (optional, but requested persistence was DB)
                const localKey = `water_${user.id}_${dateStr}`;
                const saved = localStorage.getItem(localKey);
                if (saved) setCurrentWater(parseInt(saved));
                else setCurrentWater(0);
            }
        };
        fetchWaterLog();
    }, [selectedDate, user]);

    // [NEW] Calculate Streak (Consecutive Active Days)
    useEffect(() => {
        const calculateStreak = async () => {
            if (!user) return;

            // Fetch recent logs to calculate streak (e.g. last 60 days)
            const { data, error } = await supabase
                .from('food_logs')
                .select('created_at')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(100);

            if (data) {
                // 1. Get unique unique YYYY-MM-DD
                const uniqueDays = new Set(
                    data.map(log => new Date(log.created_at).toLocaleDateString('en-CA')) // YYYY-MM-DD in local time
                );

                // 2. Check backwards from today
                const today = new Date();
                const todayStr = today.toLocaleDateString('en-CA');

                const yesterday = new Date();
                yesterday.setDate(today.getDate() - 1);
                const yesterdayStr = yesterday.toLocaleDateString('en-CA');

                let currentStreak = 0;
                let checkDate = new Date();

                // If today is logged, we start counting from today. 
                // If today NOT logged, but Yesterday IS, we start counting from Yesterday (streak active but not updated today yet).
                // If neither, streak broken (0).

                if (uniqueDays.has(todayStr)) {
                    currentStreak = 1;
                    checkDate.setDate(checkDate.getDate() - 1); // Start checking previous days
                } else if (uniqueDays.has(yesterdayStr)) {
                    // Streak implies consecutive days ENDING now. 
                    // Common logic: if yesterday was logged, streak is alive.
                    currentStreak = 0; // Will be incremented in loop below starting from yesterday
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    setStreak(0);
                    return;
                }

                // Count backwards
                while (true) {
                    const dateStr = checkDate.toLocaleDateString('en-CA');
                    if (uniqueDays.has(dateStr)) {
                        currentStreak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else {
                        break;
                    }
                }
                setStreak(currentStreak);
            }
        };
        calculateStreak();
    }, [user, foodLog]); // Re-calc when foodLog updates (e.g. adding new food)




    // Fetch Food Logs for selected date
    useEffect(() => {
        const fetchFoodLogs = async () => {
            const startOfDay = new Date(selectedDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(selectedDate);
            endOfDay.setHours(23, 59, 59, 999);

            // [CACHE-FIRST] Immediate Load from LocalStorage (Instant UI)
            try {
                const offlineLogs = JSON.parse(localStorage.getItem('offline_food_logs') || '[]');
                const filteredLogs = offlineLogs.filter((item: any) => {
                    const itemDate = new Date(item.created_at);
                    return itemDate >= startOfDay && itemDate <= endOfDay;
                });

                if (filteredLogs.length > 0) {
                    const cacheLogs: FoodItem[] = filteredLogs.map((item: any) => ({
                        id: item.id,
                        name: item.name,
                        calories: item.calories,
                        protein: item.protein,
                        carbs: item.carbs,
                        fat: item.fat,
                        timestamp: new Date(item.created_at).getTime(),
                        meal: item.meal_type || 'Snack',
                        imageUrl: item.image_url || undefined,
                        fiber: 0,
                        sugar: item.sugar || 0,
                        sodium: item.sodium || 0,
                        cholesterol: item.cholesterol || 0,
                        servingSize: { unit: 'serving', quantity: 1 }
                    }));
                    setFoodLog(cacheLogs);
                } else {
                    setFoodLog([]); // Clear if no cache, to show empty state immediately
                }
            } catch (e) {
                console.error("Cache load error", e);
            }

            const userId = user?.id;
            if (!userId) return;

            // Background Fetch from Supabase
            const { data, error } = await supabase
                .from('food_logs')
                .select('*')
                .eq('user_id', userId)
                .gte('created_at', startOfDay.toISOString())
                .lte('created_at', endOfDay.toISOString());

            if (data) {
                // Formatting logic reused
                const formattedLogs: FoodItem[] = data.map(item => ({
                    id: item.id,
                    name: item.food_name,
                    calories: item.calories,
                    protein: item.protein,
                    carbs: item.carbs,
                    fat: item.fat,
                    timestamp: new Date(item.created_at).getTime(),
                    meal: item.meal_type || 'Snack',
                    imageUrl: item.image_url || undefined,
                    fiber: 0,
                    sugar: item.sugar || 0,
                    sodium: item.sodium || 0,
                    cholesterol: item.cholesterol || 0,
                    servingSize: { unit: 'serving', quantity: 1 }
                }));

                // Compare with current state to avoid unnecessary re-render if identical? 
                // For now, just set it to ensure Freshness
                setFoodLog(formattedLogs);

                // [OPTIONAL] Sync back to offline cache to keep it fresh?
                // Might be too expensive to do on every read. Keeping it simple.
            }
        };
        fetchFoodLogs();
    }, [selectedDate]);

    // Calculate Stats from Real Data (No Mocks)
    const currentDayStats = useMemo(() => {
        return foodLog.reduce((acc, curr) => ({
            calories: acc.calories + curr.calories,
            protein: acc.protein + curr.protein,
            carbs: acc.carbs + curr.carbs,
            fat: acc.fat + curr.fat,
            cholesterol: acc.cholesterol + (curr.cholesterol || 0),
            sugar: acc.sugar + (curr.sugar || 0),
            sodium: acc.sodium + (curr.sodium || 0),
            score: acc.score + 10 // Simplified score logic
        }), { calories: 0, protein: 0, carbs: 0, fat: 0, cholesterol: 0, sugar: 0, sodium: 0, score: 0 });
    }, [foodLog]);

    // Sync pet state
    const petState = useMemo(() => {
        return determinePetState(currentDayStats.calories, userStats.tdee, 80);
    }, [currentDayStats, userStats.tdee]);

    const remainingCalories = userStats.tdee - currentDayStats.calories;

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Read image as base64 and wait for it to complete
        const readImageAsBase64 = (file: File): Promise<string> => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });
        };

        setIsScanning(true);
        try {
            // Wait for image to be read first
            const capturedImage = await readImageAsBase64(file);
            setPreviewImage(capturedImage); // Show preview

            const result = await analyzeFoodImage(file);
            const userId = user?.id;

            // Use selected date
            const logDate = new Date(selectedDate);
            logDate.setHours(12, 0, 0, 0);

            // Save to DB
            if (userId) {
                const { data, error } = await supabase.from('food_logs').insert([{
                    user_id: userId,
                    food_name: result.name || 'AI Analysis',
                    calories: Math.round(result.calories || 0),
                    protein: Math.round(result.protein || 0),
                    carbs: Math.round(result.carbs || 0),
                    fat: Math.round(result.fat || 0),
                    sugar: Math.round(result.sugar || 0),
                    sodium: Math.round(result.sodium || 0),
                    cholesterol: Math.round(result.cholesterol || 0),
                    image_url: capturedImage,
                    created_at: logDate.toISOString()
                }]).select().single();

                if (error) {
                    throw new Error(error.message);
                }

                if (data) {
                    const newFood: FoodItem = {
                        id: data.id,
                        name: data.food_name,
                        calories: data.calories,
                        protein: data.protein,
                        carbs: data.carbs,
                        fat: data.fat,
                        timestamp: new Date(data.created_at).getTime(),
                        meal: 'ของว่าง',
                        imageUrl: capturedImage,
                        fiber: 0,
                        sugar: data.sugar || 0,
                        sodium: data.sodium || 0,
                        cholesterol: data.cholesterol || 0,
                        servingSize: { unit: 'serving', quantity: 1 }
                    };
                    setFoodLog(prev => [...prev, newFood]);
                    setSelectedFood(newFood);
                }
            }
            setShowAddModal(false);
            setPreviewImage(null); // Clear preview after success
        } catch (err: any) {
            console.error("AI Scan DB Error:", err);

            // FALLBACK: Save to LocalStorage
            const userId = user?.id;
            const logDate = new Date(selectedDate);
            logDate.setHours(12, 0, 0, 0);

            const offlineEntry = {
                id: crypto.randomUUID(),
                user_id: userId,
                name: 'AI Scan Item',
                calories: 0, // Set defaults as result might have failed too
                protein: 0,
                carbs: 0,
                fat: 0,
                meal_type: 'AI Scan',
                created_at: logDate.toISOString()
            };

            // Defer localStorage write
            setTimeout(() => {
                const logs = JSON.parse(localStorage.getItem('offline_food_logs') || '[]');
                logs.push(offlineEntry);
                localStorage.setItem('offline_food_logs', JSON.stringify(logs));
            }, 0);

            const newFood: FoodItem = {
                id: offlineEntry.id,
                name: offlineEntry.name,
                calories: offlineEntry.calories,
                protein: offlineEntry.protein,
                carbs: offlineEntry.carbs,
                fat: offlineEntry.fat,
                fiber: 0,
                sugar: 0,
                sodium: 0,
                cholesterol: 0,
                meal: 'ของว่าง',
                timestamp: new Date(offlineEntry.created_at).getTime(),
                servingSize: { unit: 'portion', quantity: 1 },
            };
            setFoodLog(prev => [...prev, newFood]);
        } finally {
            setIsScanning(false);
        }
    };

    const handleManualImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setPreviewImage(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleManualSubmit = async (e: any) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const userId = user?.id;

        if (!userId) return;

        // Use selected date for the log, set to Noon to be safe
        const logDate = new Date(selectedDate);
        logDate.setHours(12, 0, 0, 0);

        const newEntry = {
            user_id: userId,
            food_name: fd.get('name') as string,
            calories: Number(fd.get('calories')),
            protein: Number(fd.get('protein')) || 0,
            carbs: Number(fd.get('carbs')) || 0,
            fat: Number(fd.get('fat')) || 0,
            cholesterol: Number(fd.get('cholesterol')) || 0,
            sugar: Number(fd.get('sugar')) || 0,
            sodium: Number(fd.get('sodium')) || 0,
            image_url: previewImage,
            created_at: logDate.toISOString()
        };

        const { data, error } = await supabase.from('food_logs').insert([newEntry]).select().single();

        if (error) {
            console.error("Error saving food log:", error);

            // FALLBACK: Save to LocalStorage
            const offlineEntry = { ...newEntry, id: crypto.randomUUID() };
            // Defer localStorage write
            setTimeout(() => {
                const logs = JSON.parse(localStorage.getItem('offline_food_logs') || '[]');
                logs.push(offlineEntry);
                localStorage.setItem('offline_food_logs', JSON.stringify(logs));
            }, 0);

            console.log("Saved food log to Offline Storage");

            // Still update UI with the offline entry
            const newFood: FoodItem = {
                id: offlineEntry.id,
                name: offlineEntry.food_name,
                calories: offlineEntry.calories,
                protein: offlineEntry.protein,
                carbs: offlineEntry.carbs,
                fat: offlineEntry.fat,
                fiber: 0,
                sugar: 0,
                sodium: 0,
                cholesterol: 0,
                meal: 'ของว่าง',
                timestamp: new Date(offlineEntry.created_at).getTime(),
                servingSize: { unit: 'portion', quantity: 1 },
                imageUrl: offlineEntry.image_url,
            };
            setFoodLog(prev => [...prev, newFood]);
            setShowAddModal(false);
            manualFormRef.current?.reset();
            setPreviewImage(null);
            return;
        }

        if (data) {
            const newFood: FoodItem = {
                id: data.id,
                name: data.food_name,
                calories: data.calories,
                protein: data.protein,
                carbs: data.carbs,
                fat: data.fat,
                timestamp: new Date(data.created_at).getTime(),
                meal: 'ของว่าง',
                imageUrl: data.image_url || previewImage,
                fiber: 0,
                sugar: data.sugar || 0,
                sodium: data.sodium || 0,
                cholesterol: data.cholesterol || 0,
                servingSize: { unit: 'serving', quantity: 1 }
            };
            setFoodLog(prev => [...prev, newFood]);
        }

        setShowAddModal(false);
        setPreviewImage(null);
    };

    // [NEW] Portion Control & Manual Override State
    const [portion, setPortion] = useState(1); // 1.0 = 100%
    const [baseStats, setBaseStats] = useState<FoodItem | null>(null);
    const [manualOverride, setManualOverride] = useState<{
        calories?: number;
        protein?: number;
        carbs?: number;
        fat?: number;
    }>({});

    // Initialize Base Stats when opening Selected Food
    useEffect(() => {
        if (selectedFood) {
            setBaseStats(selectedFood);
            setPortion(1);
            setManualOverride({}); // Reset overrides
        }
    }, [selectedFood]);

    // Update DB with new portion
    const handleUpdatePortion = async () => {
        const hasManualChanges = Object.keys(manualOverride).length > 0;
        if (!selectedFood || !baseStats || (portion === 1 && !hasManualChanges)) {
            setSelectedFood(null); // Just close if no change
            return;
        }

        const userId = user?.id;
        const newCalories = manualOverride.calories ?? Math.round(baseStats.calories * portion);
        const newProtein = manualOverride.protein ?? Math.round(baseStats.protein * portion);
        const newCarbs = manualOverride.carbs ?? Math.round(baseStats.carbs * portion);
        const newFat = manualOverride.fat ?? Math.round(baseStats.fat * portion);
        const newChol = Math.round(baseStats.cholesterol * portion);
        const newSugar = Math.round(baseStats.sugar * portion);
        const newSodium = Math.round(baseStats.sodium * portion);

        const updatedFields = {
            calories: newCalories,
            protein: newProtein,
            carbs: newCarbs,
            fat: newFat,
            cholesterol: newChol,
            sugar: newSugar,
            sodium: newSodium
        };

        if (userId) {
            const { error } = await supabase
                .from('food_logs')
                .update(updatedFields)
                .eq('id', selectedFood.id);

            if (error) {
                console.error("Update failed, trying offline", error);
                // Offline fallback logic below
            }
        }

        // Update Local Storage (Offline Mirror)
        // Update Local Storage (Offline Mirror)
        setTimeout(() => {
            try {
                const offlineLogs = JSON.parse(localStorage.getItem('offline_food_logs') || '[]');
                const logIndex = offlineLogs.findIndex((l: any) => l.id === selectedFood.id);
                if (logIndex >= 0) {
                    offlineLogs[logIndex] = { ...offlineLogs[logIndex], ...updatedFields };
                    localStorage.setItem('offline_food_logs', JSON.stringify(offlineLogs));
                }
            } catch (e) {
                console.error("Error updating offline logs", e);
            }
        }, 0);

        // Update UI
        const updatedFood = {
            ...selectedFood,
            ...updatedFields
        };

        setFoodLog(prev => prev.map(f => f.id === selectedFood.id ? updatedFood : f));
        setSelectedFood(null); // Close modal
    };

    // Calculate display values based on portion OR manual override
    const displayFood = useMemo(() => {
        if (!baseStats) return selectedFood;

        // If nutrient is manually overridden, use it. Otherwise, calculate from portion.
        const currentToUse = {
            calories: manualOverride.calories ?? Math.round(baseStats.calories * portion),
            protein: manualOverride.protein ?? Math.round(baseStats.protein * portion),
            carbs: manualOverride.carbs ?? Math.round(baseStats.carbs * portion),
            fat: manualOverride.fat ?? Math.round(baseStats.fat * portion),
        };

        return {
            ...baseStats,
            calories: currentToUse.calories,
            protein: currentToUse.protein,
            carbs: currentToUse.carbs,
            fat: currentToUse.fat,
            cholesterol: Math.round(baseStats.cholesterol * portion),
            sugar: Math.round(baseStats.sugar * portion),
            sodium: Math.round(baseStats.sodium * portion),
        };
    }, [baseStats, portion, selectedFood, manualOverride]);

    // Handle Manual Macro Change
    const handleMacroChange = (field: 'protein' | 'carbs' | 'fat', value: string) => {
        const numVal = parseFloat(value);
        if (isNaN(numVal) || numVal < 0) return;

        const newOverrides = { ...manualOverride, [field]: numVal };

        // Auto-calculate calories based on changed macros + existing (or calculated) macros
        // Formula: P*4 + C*4 + F*9
        // We need to resolve the other macros (either from override or portion)
        const resolve = (f: 'protein' | 'carbs' | 'fat') => newOverrides[f] ?? Math.round((baseStats?.[f] || 0) * portion);

        const p = resolve('protein');
        const c = resolve('carbs');
        const f = resolve('fat');

        newOverrides.calories = Math.round((p * 4) + (c * 4) + (f * 9));

        setManualOverride(newOverrides);
    };

    // Delete Food Item from Database/Offline Storage
    const handleDeleteFood = async (foodId: string) => {
        const userId = user?.id;

        // Try to delete from Supabase
        if (userId) {
            const { error } = await supabase
                .from('food_logs')
                .delete()
                .eq('id', foodId)
                .eq('user_id', userId);

            if (error) {
                console.log("DB delete failed, trying offline storage:", error);
            }
        }

        // Also delete from offline storage (in case it was saved there)
        const offlineLogs = JSON.parse(localStorage.getItem('offline_food_logs') || '[]');
        const updatedLogs = offlineLogs.filter((item: any) => item.id !== foodId);
        localStorage.setItem('offline_food_logs', JSON.stringify(updatedLogs));

        // Update UI state
        setFoodLog(prev => prev.filter(f => f.id !== foodId));
        setSelectedFood(null);
    };

    return (
        <div className="max-w-md mx-auto min-h-screen relative pb-32 overflow-x-hidden">
            {/* Seamless Moving Cat Pattern */}
            <MovingBackground />

            {/* Enhanced Header - Premium Glass Theme */}
            <header className={`px-6 pt-10 pb-6 bg-white/30 backdrop-blur-xl rounded-b-[3.5rem] shadow-[0_20px_60px_-15px_rgba(232,141,103,0.15)] border-b border-white/60 ${activeTab === 'analytics' ? 'hidden' : ''}`}>

                {/* Top Row: Greeting + Progress Ring + Settings */}
                {/* Top Row: Greeting + Progress Ring + Settings - Unified Glass Card (Flattened for Performance) */}
                <div className="bg-gradient-to-br from-white/95 via-white/90 to-orange-50/50 rounded-[2rem] p-5 border border-white/60 shadow-[0_8px_32px_rgba(255,100,100,0.1)] mb-5 relative overflow-hidden group hover:shadow-[0_10px_40px_rgba(255,100,100,0.15)] transition-all duration-500">

                    <div className="flex flex-col items-center text-center relative z-10">
                        {/* Greeting Badge */}
                        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-50 to-rose-50 px-4 py-1.5 rounded-full mb-3 border border-white/60 shadow-sm">
                            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                            <span className="text-xs font-bold text-orange-600 tracking-wide">
                                {new Date().getHours() < 12 ? 'สวัสดีตอนเช้า ☀️' : new Date().getHours() < 18 ? 'สวัสดีตอนบ่าย 🌤️' : 'สวัสดีตอนเย็น 🌙'}
                            </span>
                        </div>

                        {/* Name */}
                        <div className="flex items-center gap-2 mb-2 justify-center">
                            <h1 className="font-header text-4xl font-black leading-tight uppercase tracking-[0.15em] text-slate-700/90 drop-shadow-sm bg-clip-text text-transparent bg-gradient-to-br from-slate-700 to-slate-500">
                                {userStats.name}
                            </h1>
                            {remainingCalories > 0 && remainingCalories < 500 && <span className="text-2xl animate-bounce">🔥</span>}
                            {remainingCalories <= 0 && <span className="text-2xl animate-bounce">🎉</span>}
                        </div>

                        {/* Calorie Status - Extended */}
                        <div className="flex items-center gap-3 text-sm text-slate-500 font-medium">
                            {remainingCalories > 0 ? (
                                <>
                                    <span>กินไปแล้ว <span className="font-header font-bold text-orange-500 text-lg">{currentDayStats.calories}</span> kcal</span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                    <span className="text-xs opacity-70">เป้าหมาย {userStats.tdee}</span>
                                </>
                            ) : (
                                <span className="font-bold text-green-500 flex items-center gap-2">
                                    ✨ เป้าหมายวันนี้สำเร็จแล้ว!
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Streak + Weight Journey Row */}
                <div className="flex gap-3 mb-5">
                    {/* Streak Counter - High Opacity Gradient (No Blur) */}
                    <div className="flex-[1.5] bg-gradient-to-br from-orange-400/95 to-rose-400/95 p-4 rounded-[2rem] flex items-center gap-3 shadow-[0_10px_30px_rgba(244,63,94,0.2)] border border-white/20">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center border border-white/30">
                            <span className="text-2xl drop-shadow-md">🔥</span>
                        </div>
                        <div>
                            <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider">Streak</p>
                            <p className="font-header text-white text-2xl font-bold leading-none drop-shadow-sm">{streak} วัน</p>
                        </div>
                    </div>

                    {/* Weight Journey - Solid/High Opacity (No Blur) */}
                    <div className="flex-1 bg-white/80 p-3 rounded-[2rem] flex flex-col justify-center pl-5 border border-white/60 shadow-sm relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                                {currentWeight && targetWeight ? (
                                    currentWeight > targetWeight
                                        ? `เป้าหมาย: ลด ${(currentWeight - targetWeight).toFixed(1)} kg`
                                        : `เป้าหมาย: เพิ่ม ${(targetWeight - currentWeight).toFixed(1)} kg`
                                ) : 'เป้าหมาย'}
                            </p>
                            <div className="flex items-baseline gap-1">
                                <span className="font-header text-cyan-700 text-2xl font-black tracking-tight">{currentWeight ?? '--'}</span>
                                {targetWeight && (
                                    <span className="text-cyan-400 text-xs font-bold">/ {targetWeight}</span>
                                )}
                            </div>
                        </div>
                        {/* Subtle decorative background */}
                        <Activity className="absolute -right-2 -bottom-2 w-16 h-16 text-cyan-100/50 -rotate-12 group-hover:scale-110 transition-transform" />
                    </div>
                </div>

                {/* Date Calendar Strip - Glass */}
                {/* Date Calendar Strip - High Opacity (No inner blur) */}
                <div className="bg-white/80 p-3 rounded-[2rem] border border-white/60 shadow-[0_10px_40px_-5px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-rose-400" />
                            <button
                                onClick={() => {
                                    setPickerYear(new Date(selectedDate).getFullYear());
                                    setShowMonthPicker(true);
                                }}
                                className="font-header text-sm font-medium text-slate-600 hover:text-rose-500 transition-colors"
                            >
                                {new Date(selectedDate).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                            </button>
                        </div>
                        <span className="text-xs font-semibold text-rose-500 bg-rose-50/50 px-3 py-1.5 rounded-full border border-rose-100/50">
                            {selectedDate === new Date().toLocaleDateString('en-CA') ? '📍 วันนี้' : new Date(selectedDate).toLocaleDateString('th-TH', { weekday: 'long' })}
                        </span>
                    </div>
                    {/* [MODIFIED] Scrollable Container with reduced gap */}
                    <div ref={dateScrollRef} className="flex overflow-x-auto gap-1 pb-2 snap-x snap-mandatory scroll-smooth hide-scrollbar px-1">
                        {dateButtons.map((d) => {
                            const isSelected = selectedDate === d.full;
                            return (
                                <button
                                    key={d.full}
                                    onClick={() => setSelectedDate(d.full)}
                                    // [MODIFIED] Width reduced to ~11.5vw (max 3.2rem) to squeeze 7 items
                                    className={`flex-shrink-0 w-[11.5vw] max-w-[3.2rem] flex flex-col items-center justify-center py-2.5 rounded-xl transition-all duration-300 relative group snap-center ${isSelected
                                        ? 'selected-date-btn bg-gradient-to-b from-orange-400 to-rose-400 text-white shadow-[0_8px_20px_rgba(244,63,94,0.3)] scale-110 z-10 border border-white/20'
                                        : 'bg-white/30 text-slate-400 border border-transparent'}`}
                                >
                                    <span className={`text-[8px] font-bold uppercase tracking-wider mb-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>{d.dayName}</span>
                                    <span className={`font-header text-sm font-bold ${isSelected ? '' : ''}`}>{d.dateNum}</span>
                                    {d.isToday && !isSelected && <div className="absolute -bottom-1 w-1 h-1 bg-rose-400 rounded-full animate-pulse" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            <main className="px-6 py-10 space-y-10">
                {activeTab === 'dashboard' && (
                    <div className="space-y-10">
                        <PetSmartWalk
                            currentCalories={currentDayStats.calories}
                            goalCalories={userStats.tdee}
                        />

                        {/* Nutrition Stats - Glass Design */}
                        <div className="space-y-6">
                            {/* Calorie Donut - Glass */}
                            <div className="bg-white/40 backdrop-blur-xl p-6 rounded-[3rem] border border-white/60 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.05)] flex flex-col items-center relative overflow-hidden">
                                {/* Subtle background glow */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-100/30 rounded-full blur-3xl -z-10 -translate-y-1/2 translate-x-1/2"></div>

                                <div className="relative w-64 h-64 flex items-center justify-center mb-6">
                                    <svg className="w-full h-full -rotate-90 drop-shadow-sm">
                                        {/* Background Circle */}
                                        <circle cx="128" cy="128" r="110" fill="transparent" stroke="rgba(255,255,255,0.4)" strokeWidth="24" />
                                        {/* Progress Circle */}
                                        <circle
                                            cx="128" cy="128" r="110" fill="transparent" stroke="url(#donutGradient)" strokeWidth="24"
                                            strokeDasharray={691}
                                            strokeDashoffset={691 - (691 * Math.min(1, currentDayStats.calories / userStats.tdee))}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000 ease-in-out"
                                        />
                                        <defs>
                                            <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <stop offset="0%" stopColor="#FB923C" />
                                                <stop offset="100%" stopColor="#F472B6" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <div className="flex flex-col items-center">
                                            <div className="bg-orange-50/80 backdrop-blur-sm p-3 rounded-full mb-1 border border-orange-100">
                                                <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
                                            </div>
                                            <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest mb-1">Calories Remaining</span>
                                            <span className={`text-5xl font-black text-slate-700 leading-none mb-1 drop-shadow-sm ${remainingCalories < 0 ? 'text-red-500' : ''}`}>
                                                {remainingCalories}
                                            </span>
                                            <div className="flex items-center gap-2 mt-2 bg-white/50 px-4 py-1.5 rounded-full border border-white/40">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">GOAL: {userStats.tdee}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Nutrient Carousel Container */}
                                <div className="w-full relative">
                                    <div className="overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar">
                                        <div className="flex w-[200%]">
                                            {/* Page 1: Macros */}
                                            <div className="w-1/2 flex-shrink-0 snap-center px-1">
                                                <div className="grid grid-cols-3 gap-4 w-full">
                                                    {[
                                                        { label: 'PROTEIN', val: currentDayStats.protein, target: userStats.proteinTarget, unit: 'g', color: '#06b6d4', bg: 'bg-cyan-50/50', ring: '#22d3ee', icon: <Beef className="w-5 h-5 text-cyan-600" /> },
                                                        { label: 'CARBS', val: currentDayStats.carbs, target: userStats.carbsTarget, unit: 'g', color: '#f97316', bg: 'bg-orange-50/50', ring: '#fdba74', icon: <Wheat className="w-5 h-5 text-orange-500" /> },
                                                        { label: 'FAT', val: currentDayStats.fat, target: userStats.fatTarget, unit: 'g', color: '#84cc16', bg: 'bg-lime-50/50', ring: '#a3e635', icon: <Droplet className="w-5 h-5 text-lime-600" /> }
                                                    ].map(m => (
                                                        <div key={m.label} className="bg-white/50 backdrop-blur-md p-4 rounded-[2.5rem] border border-white/60 flex flex-col items-center shadow-sm relative overflow-hidden group hover:bg-white/70 transition-colors">
                                                            {/* Circular Progress */}
                                                            <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
                                                                <svg className="w-full h-full -rotate-90">
                                                                    <circle cx="48" cy="48" r="40" fill="transparent" stroke="rgba(255,255,255,0.5)" strokeWidth="8" />
                                                                    <circle
                                                                        cx="48" cy="48" r="40" fill="transparent" stroke={m.ring} strokeWidth="8"
                                                                        strokeDasharray={251}
                                                                        strokeDashoffset={251 - (251 * Math.min(1, m.val / (m.target || 1)))}
                                                                        strokeLinecap="round"
                                                                        className="transition-all duration-1000 ease-in-out"
                                                                    />
                                                                </svg>
                                                                <div className={`absolute inset-0 m-auto w-12 h-12 ${m.bg} backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50`}>
                                                                    {m.icon}
                                                                </div>
                                                            </div>
                                                            <div className="text-center z-10">
                                                                <div className="flex items-baseline justify-center gap-0.5">
                                                                    <span className="text-xl font-black text-slate-700 leading-none">{m.val}</span>
                                                                    <span className="text-[10px] font-medium text-slate-400">/{m.target}g</span>
                                                                </div>
                                                                <span className="text-[9px] font-black text-slate-400/80 uppercase tracking-widest mt-1 block group-hover:text-slate-500">{m.label}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Page 2: Micros (Cholesterol, Sugar, Sodium) */}
                                            <div className="w-1/2 flex-shrink-0 snap-center px-1">
                                                <div className="grid grid-cols-3 gap-4 w-full">
                                                    {[
                                                        { label: 'CHOLESTEROL', val: currentDayStats.cholesterol, unit: 'mg', limit: 300, bg: 'bg-yellow-50/50', ring: '#facc15', icon: '🍳' },
                                                        { label: 'SUGAR', val: currentDayStats.sugar, unit: 'g', limit: 24, bg: 'bg-pink-50/50', ring: '#f472b6', icon: '🍬' },
                                                        { label: 'SODIUM', val: currentDayStats.sodium, unit: 'mg', limit: 2300, bg: 'bg-purple-50/50', ring: '#c084fc', icon: '🧂' }
                                                    ].map(m => (
                                                        <div key={m.label} className="bg-white/50 backdrop-blur-md p-4 rounded-[2.5rem] border border-white/60 flex flex-col items-center shadow-sm relative overflow-hidden group hover:bg-white/70 transition-colors">
                                                            {/* Circular Progress (No target displayed, just value) */}
                                                            <div className="relative w-24 h-24 mb-2 flex items-center justify-center">
                                                                <svg className="w-full h-full -rotate-90">
                                                                    <circle cx="48" cy="48" r="40" fill="transparent" stroke="rgba(255,255,255,0.5)" strokeWidth="8" />
                                                                    <circle
                                                                        cx="48" cy="48" r="40" fill="transparent" stroke={m.ring} strokeWidth="8"
                                                                        strokeDasharray={251}
                                                                        strokeDashoffset={251 - (251 * Math.min(1, m.val / m.limit))}
                                                                        strokeLinecap="round"
                                                                        className="transition-all duration-1000 ease-in-out"
                                                                    />
                                                                </svg>
                                                                <div className={`absolute inset-0 m-auto w-12 h-12 ${m.bg} backdrop-blur-sm rounded-full flex items-center justify-center border border-white/50 text-2xl`}>
                                                                    {m.icon}
                                                                </div>
                                                            </div>
                                                            <div className="text-center z-10">
                                                                <div className="flex items-baseline justify-center gap-0.5">
                                                                    <span className="text-xl font-black text-slate-700 leading-none">{m.val}</span>
                                                                    <span className="text-[10px] font-medium text-slate-400">/{m.limit}</span>
                                                                </div>
                                                                <span className="text-[9px] font-black text-slate-400/80 uppercase tracking-widest mt-1 block group-hover:text-slate-500">{m.label} ({m.unit})</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Dot Indicators */}
                                    <div className="flex justify-center gap-2 mt-6">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300/50"></div>
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300/50"></div>
                                    </div>
                                    <p className="text-center text-[9px] font-bold text-slate-300/60 uppercase tracking-widest mt-2">Swipe for details</p>
                                </div>
                            </div>
                        </div>

                        <WaterTracker current={currentWater} goal={userStats.waterGoal || 8} onUpdate={handleWaterUpdate} />
                    </div>
                )}

                {activeTab === 'diary' && (
                    <>
                        <div className="bg-white/80 p-3 rounded-[2rem] border border-white/60 shadow-[0_10px_40px_-5px_rgba(0,0,0,0.03)] mb-6">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <button
                                    onClick={() => {
                                        setPickerYear(new Date(selectedDate).getFullYear());
                                        setShowMonthPicker(true);
                                    }}
                                    className="flex items-center gap-2 group cursor-pointer"
                                >
                                    <Calendar className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
                                    <span className="font-header text-sm font-medium text-slate-600 group-hover:text-rose-500 transition-colors">
                                        {new Date(selectedDate).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                                    </span>
                                </button>
                                <span className="text-xs font-semibold text-rose-500 bg-rose-50/50 px-3 py-1.5 rounded-full border border-rose-100/50">
                                    {selectedDate === new Date().toLocaleDateString('en-CA') ? '📍 วันนี้' : new Date(selectedDate).toLocaleDateString('th-TH', { weekday: 'long' })}
                                </span>
                            </div>
                            <div className="space-y-8 pb-20">

                                <div className="bg-white p-8 rounded-[3rem] border border-[#F1EFE9] shadow-[0_20px_40px_rgba(0,0,0,0.02)] flex justify-between items-center">
                                    <div className="space-y-1">
                                        <h3 className="text-xl font-black text-slate-800">บันทึกอาหาร</h3>
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Food Log Progress</p>
                                    </div>
                                    <button onClick={openAddModal} className="bg-[#1A1C1E] text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all">
                                        <Plus className="w-7 h-7" />
                                    </button>
                                </div>

                                {/* [MODIFIED] Use Extracted FoodList Component */}
                                <FoodList foodLog={foodLog} onSelect={setSelectedFood} />
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'analytics' && <Analytics />}
            </main>

            {/* Navigation Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[94%] max-w-sm z-50">
                <div className="bg-white/80 backdrop-blur-2xl py-4 px-6 rounded-[2.8rem] shadow-[0_25px_60px_rgba(0,0,0,0.08)] flex justify-between items-end border border-white/90">
                    <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1.5 transition-all w-16 ${activeTab === 'dashboard' ? 'text-[#E88D67]' : 'text-slate-300'}`}>
                        <LayoutDashboard className={`w-6 h-6 ${activeTab === 'dashboard' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                        <span className="text-[9px] font-black uppercase tracking-widest">HOME</span>
                    </button>
                    <button onClick={() => setActiveTab('diary')} className={`flex flex-col items-center gap-1.5 transition-all w-16 ${activeTab === 'diary' ? 'text-[#E88D67]' : 'text-slate-300'}`}>
                        <ClipboardList className={`w-6 h-6 ${activeTab === 'diary' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                        <span className="text-[9px] font-black uppercase tracking-widest">DIARY</span>
                    </button>
                    <div className="relative -top-6">
                        <button onClick={openAddModal} className="w-16 h-16 bg-gradient-to-br from-[#E88D67] to-[#F3BD7E] rounded-full flex items-center justify-center text-white shadow-[0_12px_30px_rgba(232,141,103,0.35)] border-[6px] border-[#FAF8F6] active:scale-90 transition-all hover:brightness-110">
                            <Plus className="w-8 h-8 stroke-[3.5px]" />
                        </button>
                    </div>
                    <button onClick={() => setActiveTab('analytics')} className={`flex flex-col items-center gap-1.5 transition-all w-16 ${activeTab === 'analytics' ? 'text-[#E88D67]' : 'text-slate-300'}`}>
                        <BarChart2 className={`w-6 h-6 ${activeTab === 'analytics' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                        <span className="text-[9px] font-black uppercase tracking-widest">STATS</span>
                    </button>
                    <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1.5 text-slate-300 transition-all w-16 hover:text-[#E88D67]">
                        <Settings className="w-6 h-6" />
                        <span className="text-[9px] font-black uppercase tracking-widest">SET</span>
                    </button>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedFood && (
                <div className="fixed inset-0 z-[70] bg-white animate-in slide-in-from-bottom duration-500 overflow-y-auto max-w-md mx-auto shadow-2xl">
                    <div className="relative h-[38vh] w-full overflow-hidden">
                        <img src={selectedFood.imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop"} alt="Food Detail" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        <div className="absolute top-10 left-6 right-6 flex justify-between items-center">
                            <button onClick={() => setSelectedFood(null)} className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-slate-800 shadow-lg"><ChevronLeft className="w-6 h-6" /></button>
                            <button onClick={() => handleDeleteFood(selectedFood.id)} className="w-10 h-10 bg-white/90 backdrop-blur-md rounded-xl flex items-center justify-center text-red-500 shadow-lg"><Trash2 className="w-5 h-5" /></button>
                        </div>
                    </div>
                    <div className="relative -mt-12 bg-white rounded-t-[3.5rem] px-7 pt-9 pb-24 min-h-[62vh] shadow-2xl">
                        <div className="flex justify-between items-start mb-6 gap-4">
                            <div className="flex items-center gap-3 flex-1">
                                {/* [NEW] Heart Button (Moved to front) */}
                                <button
                                    onClick={handleToggleFavorite}
                                    className={`w-10 h-10 rounded-full border flex items-center justify-center hover:scale-110 transition-all active:scale-90 shadow-sm shrink-0 ${isFavorite
                                        ? 'bg-pink-100 border-pink-300 text-red-500'
                                        : 'bg-slate-50 border-slate-200 text-slate-300'
                                        }`}
                                >
                                    {isFavorite ? '❤️' : '🤍'}
                                </button>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">{displayFood?.name}</h2>
                            </div>

                            {/* [RESTORED] Small Plate Portion Control */}
                            <div className="relative w-12 h-12 shrink-0">
                                {/* Background */}
                                <div className="absolute inset-0 rounded-full border-2 border-slate-100 bg-slate-50"></div>

                                {/* 4 Quadrants */}
                                {/* Top-Right: 25% */}
                                <button
                                    onClick={() => setPortion(0.25)}
                                    className={`absolute top-0 right-0 w-1/2 h-1/2 rounded-tr-full border-l border-b border-white z-10 active:scale-95 transition-all ${portion >= 0.25 ? 'bg-orange-400' : 'bg-slate-200'}`}
                                />
                                {/* Bottom-Right: 50% */}
                                <button
                                    onClick={() => setPortion(0.50)}
                                    className={`absolute bottom-0 right-0 w-1/2 h-1/2 rounded-br-full border-l border-t border-white z-10 active:scale-95 transition-all ${portion >= 0.5 ? 'bg-orange-400' : 'bg-slate-200'}`}
                                />
                                {/* Bottom-Left: 75% */}
                                <button
                                    onClick={() => setPortion(0.75)}
                                    className={`absolute bottom-0 left-0 w-1/2 h-1/2 rounded-bl-full border-r border-t border-white z-10 active:scale-95 transition-all ${portion >= 0.75 ? 'bg-orange-400' : 'bg-slate-200'}`}
                                />
                                {/* Top-Left: 100% */}
                                <button
                                    onClick={() => setPortion(1.0)}
                                    className={`absolute top-0 left-0 w-1/2 h-1/2 rounded-tl-full border-r border-b border-white z-10 active:scale-95 transition-all ${portion >= 1 ? 'bg-orange-400' : 'bg-slate-200'}`}
                                />

                                {/* Center Label */}
                                {/* Center Label (Clickable for Custom Input) */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowPortionInput(true); }}
                                    className="absolute inset-0 m-auto w-5 h-5 bg-white rounded-full z-20 flex items-center justify-center shadow-sm cursor-pointer hover:scale-110 active:scale-90 transition-all border border-slate-100"
                                >
                                    {portion >= 10 ? (
                                        <span className="text-[6px] font-black text-slate-700">x{portion}</span>
                                    ) : (
                                        <span className="text-[8px] font-black text-slate-700">{Math.round(portion * 100)}</span>
                                    )}
                                </button>
                            </div>
                        </div>
                        <div className="bg-[#FAF8F6] rounded-[2.5rem] p-7 border border-slate-50 mb-6 flex flex-col items-center text-center">
                            <p className="text-5xl font-black text-slate-800">{displayFood?.calories} KCAL</p>
                            {portion < 1 && <span className="text-xs font-bold text-orange-500 mt-2 bg-orange-50 px-3 py-1 rounded-full">ปรับลดปริมาณเหลือ {Math.round(portion * 100)}%</span>}
                        </div>
                        {/* Nutrition Carousel */}
                        <div className="relative mb-8">
                            {/* Carousel Container */}
                            <div className="overflow-x-auto snap-x snap-mandatory scroll-smooth hide-scrollbar">
                                <div className="flex w-[200%]">
                                    {/* Page 1: Macros */}
                                    <div className="w-1/2 flex-shrink-0 snap-center px-1">
                                        <div className="grid grid-cols-3 gap-3 relative">
                                            {/* Edit Button (Top Right of Grid) */}
                                            <button
                                                onClick={() => setIsEditingMacros(!isEditingMacros)}
                                                className={`absolute -top-3 -right-2 z-10 p-2 rounded-full shadow-sm border transition-all ${isEditingMacros ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-slate-400 border-slate-100 hover:text-slate-600'}`}
                                            >
                                                <Edit3 className="w-3 h-3" />
                                            </button>

                                            {[
                                                { l: 'โปรตีน', id: 'protein' as const, v: displayFood?.protein, unit: 'g', color: 'bg-cyan-50 border-cyan-200', icon: '🥩', focusRing: 'focus:border-cyan-400 focus:bg-white' },
                                                { l: 'คาร์โบ', id: 'carbs' as const, v: displayFood?.carbs, unit: 'g', color: 'bg-amber-50 border-amber-200', icon: '🌾', focusRing: 'focus:border-amber-400 focus:bg-white' },
                                                { l: 'ไขมัน', id: 'fat' as const, v: displayFood?.fat, unit: 'g', color: 'bg-lime-50 border-lime-200', icon: '💧', focusRing: 'focus:border-lime-400 focus:bg-white' }
                                            ].map(x => (
                                                <div key={x.l} className={`${x.color} p-4 rounded-[2rem] border flex flex-col items-center text-center shadow-sm relative group transition-all duration-300`}>
                                                    <span className="text-2xl mb-2">{x.icon}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase mb-1">{x.l}</span>

                                                    {isEditingMacros ? (
                                                        <div className="flex items-baseline justify-center gap-1 w-full">
                                                            <input
                                                                type="number"
                                                                value={Math.round(x.v || 0).toString()}
                                                                onChange={(e) => handleMacroChange(x.id, e.target.value)}
                                                                className={`w-16 bg-white/50 text-center text-lg font-black text-slate-800 outline-none border border-transparent rounded-lg p-0 transition-all focus:bg-white focus:shadow-sm ${x.focusRing}`}
                                                                placeholder="0"
                                                                autoFocus={x.id === 'protein'}
                                                            />
                                                            <span className="text-xs font-bold text-slate-400">{x.unit}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-baseline justify-center gap-1">
                                                            <span className="text-lg font-black text-slate-800">{Math.round(x.v || 0)}</span>
                                                            <span className="text-xs font-bold text-slate-400">{x.unit}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Page 2: Micros */}
                                    <div className="w-1/2 flex-shrink-0 snap-center px-1">
                                        <div className="grid grid-cols-3 gap-3">
                                            {[
                                                { l: 'คอเลสเตอรอล', v: displayFood?.cholesterol, unit: 'mg', color: 'bg-yellow-50 border-yellow-200', icon: '🍳' },
                                                { l: 'น้ำตาล', v: displayFood?.sugar, unit: 'g', color: 'bg-pink-50 border-pink-200', icon: '🍬' },
                                                { l: 'โซเดียม', v: displayFood?.sodium, unit: 'mg', color: 'bg-purple-50 border-purple-200', icon: '🧂' }
                                            ].map(x => (
                                                <div key={x.l} className={`${x.color} p-4 rounded-[2rem] border flex flex-col items-center text-center shadow-sm`}>
                                                    <span className="text-2xl mb-2">{x.icon}</span>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase mb-1">{x.l}</span>
                                                    <p className="text-lg font-black text-slate-800">{x.v}{x.unit}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Dot Indicators */}
                        <div className="flex justify-center gap-2 mt-4">
                            <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                            <span className="w-2 h-2 rounded-full bg-slate-200"></span>
                        </div>
                        {/* Swipe Hint */}
                        <p className="text-center text-[10px] text-slate-400 mt-2">← ปัดเพื่อดูข้อมูลเพิ่มเติม →</p>
                    </div>



                    <div className="flex gap-3">
                        <button onClick={() => setSelectedFood(null)} className="flex-1 py-5 rounded-[1.5rem] bg-slate-100 text-slate-500 font-black uppercase tracking-widest text-[11px] hover:bg-slate-200 transition-all">ยกเลิก</button>
                        <button onClick={handleUpdatePortion} className="flex-[2] py-5 rounded-[1.5rem] bg-slate-800 text-white font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all">
                            {portion < 1 || Object.keys(manualOverride).length > 0 ? 'บันทึกการแก้ไข' : 'ปิดหน้าต่าง'}
                        </button>
                    </div>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[60] flex items-end justify-center bg-[#FAF8F6]/80 backdrop-blur-md p-4 animate-in fade-in duration-300 max-w-md mx-auto">
                    <div className="bg-white w-full rounded-[3.5rem] p-10 space-y-8 shadow-[0_-20px_80px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom-12 duration-700 max-h-[92vh] overflow-y-auto">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">เพิ่มเมนูใหม่</h2>
                            <button onClick={() => setShowAddModal(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><X className="w-5 h-5" /></button>
                        </div>
                        {isScanning ? (
                            <div className="py-20 flex flex-col items-center justify-center text-center space-y-7">
                                <div className="relative"><div className="w-20 h-20 border-[6px] border-orange-50 border-t-[#E88D67] rounded-full animate-spin" /><Activity className="absolute inset-0 m-auto w-6 h-6 text-[#E88D67] animate-pulse" /></div>
                                <p className="font-black text-slate-800 text-lg">AI กำลังวิเคราะห์ข้อมูล...</p>
                            </div>
                        ) : (
                            <div className="space-y-8 pb-10">
                                <label className="group relative block w-full bg-gradient-to-br from-[#E88D67] to-[#F3BD7E] p-8 rounded-[2.5rem] shadow-2xl shadow-orange-100 transition-all active:scale-95 cursor-pointer overflow-hidden">
                                    <div className="relative flex flex-col items-center justify-center gap-3 text-center">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#E88D67] shadow-xl"><Camera className="w-8 h-8" /></div>
                                        <span className="text-base font-black text-white block">วิเคราะห์ด้วย AI</span>
                                    </div>
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                </label>
                                <button
                                    onClick={() => setShowManualForm(!showManualForm)}
                                    className={`flex flex-col items-center justify-center gap-2 w-full p-8 border-2 text-slate-800 rounded-[2.5rem] font-black shadow-sm transition-all active:scale-95 ${showManualForm
                                        ? 'bg-slate-100 border-slate-200'
                                        : 'bg-white border-slate-100 hover:bg-slate-50'
                                        }`}
                                >
                                    <ImageIcon className="w-8 h-8 text-[#7DA6C9]" />
                                    <span className="text-[11px] uppercase tracking-[0.15em] text-center">
                                        {showManualForm ? 'ซ่อนฟอร์มกรอกข้อมูล' : 'เพิ่มรูปภาพและกรอกข้อมูลเอง'}
                                    </span>
                                </button>

                                {/* [NEW] Favorite Menu Button */}
                                <button
                                    onClick={() => setShowFavoriteModal(true)}
                                    className="flex flex-col items-center justify-center gap-2 w-full p-8 bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-100 text-slate-800 rounded-[2.5rem] font-black shadow-sm hover:from-pink-100 hover:to-rose-100 transition-all active:scale-95"
                                >
                                    <span className="text-3xl">❤️</span>
                                    <span className="text-[11px] uppercase tracking-[0.15em] text-center text-pink-600">เพิ่มเมนูที่ถูกใจ</span>
                                </button>

                                {/* Manual Form - Only show when toggled */}
                                {showManualForm && (
                                    <>
                                        <div className="h-px bg-slate-50 w-full" />
                                        <form ref={manualFormRef} className="space-y-6 pt-4" onSubmit={handleManualSubmit}>
                                            {/* Image Upload Button */}
                                            <button
                                                type="button"
                                                onClick={() => manualImageInputRef.current?.click()}
                                                className="w-full p-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-[#7DA6C9] hover:text-[#7DA6C9] transition-all"
                                            >
                                                📷 กดเพื่อเลือกรูปภาพ
                                            </button>
                                            <input ref={manualImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleManualImageSelect} />

                                            {previewImage && <div className="relative w-full h-40 rounded-2xl overflow-hidden mb-4 border border-slate-100"><img src={previewImage} className="w-full h-full object-cover" alt="Preview" /><button type="button" onClick={() => setPreviewImage(null)} className="absolute top-2 right-2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm"><X className="w-4 h-4" /></button></div>}

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">ชื่อเมนู</label>
                                                <input name="name" required placeholder="เช่น ผัดไทยกุ้งสด" className="w-full px-6 py-4 bg-[#FAF8F6] rounded-[1.2rem] border border-transparent focus:bg-white focus:border-slate-200 outline-none text-xs font-bold shadow-inner transition-all" />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">แคลอรี่ (kcal)</label>
                                                <input name="calories" type="number" required placeholder="0" className="w-full px-6 py-4 bg-[#FAF8F6] rounded-[1.2rem] border border-transparent focus:bg-white focus:border-slate-200 outline-none text-xs font-bold shadow-inner transition-all" />
                                            </div>

                                            <div className="grid grid-cols-3 gap-3 pt-2">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-cyan-500 uppercase tracking-widest ml-1 text-center block">Protein (g)</label>
                                                    <input name="protein" type="number" step="0.1" placeholder="0" className="w-full px-4 py-3 bg-[#FAF8F6] rounded-2xl border border-transparent focus:bg-white focus:border-cyan-100 outline-none text-[11px] font-black text-center shadow-inner" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest ml-1 text-center block">Carbs (g)</label>
                                                    <input name="carbs" type="number" step="0.1" placeholder="0" className="w-full px-4 py-3 bg-[#FAF8F6] rounded-2xl border border-transparent focus:bg-white focus:border-orange-100 outline-none text-[11px] font-black text-center shadow-inner" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-lime-500 uppercase tracking-widest ml-1 text-center block">Fat (g)</label>
                                                    <input name="fat" type="number" step="0.1" placeholder="0" className="w-full px-4 py-3 bg-[#FAF8F6] rounded-2xl border border-transparent focus:bg-white focus:border-lime-100 outline-none text-[11px] font-black text-center shadow-inner" />
                                                </div>
                                            </div>

                                            {/* Row 2: Micro Nutrients */}
                                            <div className="grid grid-cols-3 gap-3 pt-2">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-yellow-500 uppercase tracking-widest ml-1 text-center block">Cholesterol (mg)</label>
                                                    <input name="cholesterol" type="number" step="1" placeholder="0" className="w-full px-4 py-3 bg-[#FAF8F6] rounded-2xl border border-transparent focus:bg-white focus:border-yellow-100 outline-none text-[11px] font-black text-center shadow-inner" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-pink-500 uppercase tracking-widest ml-1 text-center block">Sugar (g)</label>
                                                    <input name="sugar" type="number" step="0.1" placeholder="0" className="w-full px-4 py-3 bg-[#FAF8F6] rounded-2xl border border-transparent focus:bg-white focus:border-pink-100 outline-none text-[11px] font-black text-center shadow-inner" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-purple-500 uppercase tracking-widest ml-1 text-center block">Sodium (mg)</label>
                                                    <input name="sodium" type="number" step="1" placeholder="0" className="w-full px-4 py-3 bg-[#FAF8F6] rounded-2xl border border-transparent focus:bg-white focus:border-purple-100 outline-none text-[11px] font-black text-center shadow-inner" />
                                                </div>
                                            </div>

                                            <button type="submit" className="w-full py-5 mt-4 bg-gradient-to-r from-slate-800 to-black text-white rounded-[2rem] font-black shadow-2xl active:scale-95 transition-all uppercase tracking-[0.2em] text-[10px]">บันทึกข้อมูล</button>
                                        </form>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )
            }

            {/* Weight Update Modal */}
            {
                showWeightModal && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 animate-in fade-in duration-300 max-w-md mx-auto">
                        <div className="bg-white w-full rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800">บันทึกน้ำหนัก</h2>
                                    <p className="text-[10px] text-slate-400 font-medium">อัพเดทน้ำหนักปัจจุบันของคุณ</p>
                                </div>
                                <button onClick={() => setShowWeightModal(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target as HTMLFormElement);
                                const newWeight = parseFloat(formData.get('weight') as string);
                                if (isNaN(newWeight)) return;

                                setCurrentWeight(newWeight);

                                // Save to Supabase
                                if (user?.id) {
                                    try {
                                        await supabase.from('profiles').update({ current_weight: newWeight }).eq('id', user.id);
                                    } catch (err) {
                                        console.error("Error saving weight:", err);
                                    }
                                    // Also update localStorage
                                    const offlineData = JSON.parse(localStorage.getItem('offline_profile') || '{}');
                                    offlineData.current_weight = newWeight;
                                    localStorage.setItem('offline_profile', JSON.stringify(offlineData));
                                }

                                setShowWeightModal(false);
                            }}>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="flex-1 space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">น้ำหนักปัจจุบัน (kg)</label>
                                            <input
                                                name="weight"
                                                type="number"
                                                step="0.1"
                                                defaultValue={currentWeight || ''}
                                                placeholder="65.5"
                                                className="w-full px-6 py-4 bg-[#FAF8F6] rounded-2xl border border-transparent focus:bg-white focus:border-cyan-200 outline-none text-2xl font-black text-center"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {targetWeight && (
                                        <div className="bg-cyan-50 p-4 rounded-2xl border border-cyan-100">
                                            <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider mb-1">เป้าหมายของคุณ</p>
                                            <p className="text-lg font-black text-cyan-700">{targetWeight} kg</p>
                                            {currentWeight && (
                                                <p className="text-[10px] text-cyan-500 mt-1">
                                                    {currentWeight > targetWeight
                                                        ? `เหลืออีก ${(currentWeight - targetWeight).toFixed(1)} kg`
                                                        : currentWeight < targetWeight
                                                            ? `ต้องเพิ่มอีก ${(targetWeight - currentWeight).toFixed(1)} kg`
                                                            : '🎉 ถึงเป้าหมายแล้ว!'}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    <button type="submit" className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-cyan-200/50 active:scale-95 transition-all">
                                        บันทึก
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* [NEW] Month Picker Modal */}
            {showMonthPicker && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] p-6 shadow-2xl w-full max-w-sm animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-800">เลือกเดือน</h2>
                            <button onClick={() => setShowMonthPicker(false)} className="w-8 h-8 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Year Selector */}
                        <div className="flex items-center justify-center gap-6 mb-6">
                            <button onClick={() => setPickerYear(prev => prev - 1)} className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center hover:bg-orange-100 transition-colors">
                                <ChevronLeft className="w-6 h-6" />
                            </button>
                            <span className="text-2xl font-black text-slate-700">{pickerYear + 543}</span>
                            <button onClick={() => setPickerYear(prev => prev + 1)} className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center hover:bg-orange-100 transition-colors">
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Month Grid */}
                        <div className="grid grid-cols-4 gap-3">
                            {['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'].map((m, idx) => {
                                const currentMonth = new Date().getMonth();
                                const currentYear = new Date().getFullYear();
                                const isCurrent = pickerYear === currentYear && idx === currentMonth;
                                const isSelected = new Date(selectedDate).getMonth() === idx && new Date(selectedDate).getFullYear() === pickerYear;

                                return (
                                    <button
                                        key={m}
                                        onClick={() => {
                                            const newDate = new Date(pickerYear, idx, 1);
                                            // Format as YYYY-MM-DD in local time
                                            const yyyy = newDate.getFullYear();
                                            const mm = String(newDate.getMonth() + 1).padStart(2, '0');
                                            const dd = '01';
                                            setSelectedDate(`${yyyy}-${mm}-${dd}`);
                                            setShowMonthPicker(false);
                                        }}
                                        className={`py-3 rounded-2xl text-sm font-bold transition-all ${isSelected
                                            ? 'bg-gradient-to-br from-orange-400 to-rose-400 text-white shadow-lg scale-105'
                                            : isCurrent
                                                ? 'bg-orange-50 text-orange-500 border border-orange-100'
                                                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                            }`}
                                    >
                                        {m}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Favorite Menu Modal */}
            <FavoriteMenuModal
                isOpen={showFavoriteModal}
                onClose={() => setShowFavoriteModal(false)}
                onSelectFood={handleSelectFavorite}
                userId={user?.id || ''}
            />
            {/* [NEW] Custom Portion Input Modal */}
            {showPortionInput && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-800">ระบุปริมาณเอง</h2>
                                <p className="text-[10px] text-slate-400 font-medium">ใส่จำนวนที่ต้องการ (เช่น 1, 1.5, 3)</p>
                            </div>
                            <button onClick={() => setShowPortionInput(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target as HTMLFormElement);
                            const val = parseFloat(formData.get('customPortion') as string);
                            if (!isNaN(val) && val > 0) {
                                setPortion(val);
                                setShowPortionInput(false);
                            }
                        }}>
                            <div className="space-y-4">
                                <input
                                    name="customPortion"
                                    type="number"
                                    step="0.1"
                                    autoFocus
                                    placeholder="1.0"
                                    defaultValue={portion}
                                    className="w-full px-6 py-4 bg-[#FAF8F6] rounded-2xl border border-transparent focus:bg-white focus:border-orange-200 outline-none text-3xl font-black text-center text-slate-800 shadow-inner"
                                />
                                <button type="submit" className="w-full py-4 bg-gradient-to-r from-orange-400 to-rose-400 text-white rounded-2xl font-black text-sm shadow-lg shadow-orange-200/50 active:scale-95 transition-all uppercase tracking-widest">
                                    ตกลง
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div >
    );
};

export default Dashboard;
