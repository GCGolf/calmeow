import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient'; // Adjust import if needed
import { FoodItem } from '../types';

interface FavoriteMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectFood: (food: FoodItem) => void;
    userId: string;
}

interface FavoriteFood {
    id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    image_url?: string;
}

const FavoriteMenuModal: React.FC<FavoriteMenuModalProps> = ({ isOpen, onClose, onSelectFood, userId }) => {
    const [favorites, setFavorites] = useState<FavoriteFood[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            fetchFavorites();
        }
    }, [isOpen, userId]);

    const fetchFavorites = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('favorite_foods')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error fetching favorites:", error);
        }
        if (data) {
            setFavorites(data);
        }
        setLoading(false);
    };

    const handleRemoveFavorite = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const { error } = await supabase.from('favorite_foods').delete().eq('id', id);
        if (!error) {
            setFavorites(prev => prev.filter(f => f.id !== id));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-[#FAF8F6] rounded-[2rem] shadow-2xl overflow-hidden max-h-[80vh] flex flex-col animate-bounce-slow">

                {/* Header */}
                <div className="p-6 bg-white border-b border-[#F1EFE9] flex justify-between items-center">
                    <h2 className="text-2xl font-black text-[#E88D67] flex items-center gap-2">
                        💖 เมนูที่ถูกใจ
                    </h2>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200">
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 hide-scrollbar">
                    {loading ? (
                        <div className="text-center py-10 text-slate-400">กำลังโหลด... 🐱</div>
                    ) : favorites.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                            ยังไม่มีเมนูโปรด <br /> กดหัวใจ ❤️ ที่เมนูเพื่อบันทึกได้เลย!
                        </div>
                    ) : (
                        favorites.map(food => (
                            <div
                                key={food.id}
                                onClick={() => onSelectFood({
                                    id: food.id,
                                    name: food.name,
                                    calories: food.calories,
                                    protein: food.protein,
                                    carbs: food.carbs,
                                    fat: food.fat,
                                    imageUrl: food.image_url,  // Map snake_case to camelCase
                                    meal: 'มื้อกลางวัน',
                                    fiber: 0, sugar: 0, sodium: 0, cholesterol: 0,
                                    servingSize: { unit: 'serving', quantity: 1 },
                                    timestamp: Date.now()
                                } as FoodItem)}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-[#F1EFE9] flex items-center gap-4 active:scale-95 transition-transform cursor-pointer"
                            >
                                <div className="w-16 h-16 rounded-xl bg-orange-100 overflow-hidden flex-shrink-0">
                                    {food.image_url ? (
                                        <img src={food.image_url} alt={food.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-800">{food.name}</h3>
                                    <p className="text-sm text-slate-500">{food.calories} kcal</p>
                                </div>
                                <button
                                    onClick={(e) => handleRemoveFavorite(e, food.id)}
                                    className="p-2 text-red-400 hover:text-red-600 active:scale-90"
                                >
                                    ❤️
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default FavoriteMenuModal;
