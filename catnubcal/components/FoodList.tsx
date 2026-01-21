import React from 'react';
import { UtensilsCrossed, ChevronRight } from 'lucide-react';
import { FoodItem } from '../types';

interface FoodListProps {
    foodLog: FoodItem[];
    onSelect: (food: FoodItem) => void;
}

const FoodList: React.FC<FoodListProps> = ({ foodLog, onSelect }) => {
    return (
        <div className="space-y-6">
            {foodLog.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-slate-200">
                    <UtensilsCrossed className="w-16 h-16 opacity-10 mb-4" />
                    <p className="text-xs font-black uppercase tracking-[0.2em]">ไม่มีรายการของวันที่เลือก</p>
                </div>
            ) : (
                foodLog.map((food) => (
                    <div
                        key={food.id}
                        onClick={() => onSelect(food)}
                        className="bg-white p-5 rounded-[2.8rem] border border-[#F1EFE9] shadow-[0_8px_30px_rgba(0,0,0,0.02)] flex flex-col gap-4 cursor-pointer active:scale-[0.98] transition-transform duration-200 hover:border-[#E88D67]/30"
                    >
                        <div className="flex items-center gap-5">
                            <div className="w-24 h-24 bg-[#FAF8F6] rounded-[2rem] flex items-center justify-center text-2xl border border-slate-100 overflow-hidden shadow-inner flex-shrink-0">
                                {food.imageUrl ? (
                                    <img src={food.imageUrl} className="w-full h-full object-cover" alt={food.name} />
                                ) : (
                                    <div className="text-slate-200">
                                        <UtensilsCrossed className="w-8 h-8" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="text-[9px] font-black text-[#E88D67] uppercase tracking-[0.15em] block mb-1">
                                            {food.meal}
                                        </span>
                                        <h4 className="font-black text-slate-800 text-base leading-tight">{food.name}</h4>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-slate-200" />
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black text-slate-800">{food.calories}</span>
                                    <span className="text-[10px] font-bold text-slate-300 uppercase">kcal</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 px-1">
                            {[
                                { label: 'P', val: food.protein, color: 'bg-cyan-50 border-cyan-200', icon: '🥩' },
                                { label: 'C', val: food.carbs, color: 'bg-amber-50 border-amber-200', icon: '🌾' },
                                { label: 'F', val: food.fat, color: 'bg-lime-50 border-lime-200', icon: '💧' }
                            ].map((m) => (
                                <div key={m.label} className={`${m.color} rounded-2xl py-2 px-2 flex items-center justify-center gap-1.5 border`}>
                                    <span className="text-sm">{m.icon}</span>
                                    <span className="text-[10px] font-black text-slate-700">{m.val}g</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default React.memo(FoodList);
