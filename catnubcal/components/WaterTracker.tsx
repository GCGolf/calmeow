
import React from 'react';
import { Minus, Plus, GlassWater } from 'lucide-react';

interface WaterTrackerProps {
  current: number;
  goal: number;
  onUpdate: (val: number) => void;
}

const WaterTracker: React.FC<WaterTrackerProps> = ({ current, goal = 8, onUpdate }) => {
  // Ensure goal is at least 8 for display purposes as requested ("อย่างน้อย 8 ต่อวัน")
  const effectiveGoal = Math.max(goal, 8);

  return (
    <div className="bg-white p-5 rounded-[2.5rem] border border-[#F1EFE9] shadow-[0_10px_30px_rgba(0,0,0,0.02)] relative overflow-hidden">
      <div className="flex items-center justify-between mb-5 z-10 relative">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <GlassWater className="w-4 h-4 fill-blue-500" />
            </div>
            <h3 className="font-black text-slate-800 text-lg leading-tight">บันทึกดื่มน้ำ</h3>
          </div>
          <p className="text-[10px] text-slate-300 uppercase font-black tracking-widest pl-10">250 มล. / แก้ว</p>
        </div>
        <div className="flex items-baseline gap-1.5 bg-[#FAF8F6] px-4 py-2 rounded-[1.5rem] border border-slate-50">
          <span className="text-2xl font-black text-blue-500 leading-none">{current}</span>
          <span className="text-xs font-bold text-slate-300">/ {effectiveGoal}</span>
        </div>
      </div>

      <div className="flex items-end justify-between gap-1.5 h-16 mb-5 px-1">
        {Array.from({ length: effectiveGoal }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-[0.8rem] transition-all duration-500 ease-out py-1 relative ${i < current
              ? 'bg-gradient-to-t from-blue-500 to-cyan-300 shadow-[0_4px_12px_rgba(59,130,246,0.3)] scale-y-100 opacity-100'
              : 'bg-[#F1EFE9] opacity-40 scale-y-75'
              }`}
            style={{ height: i < current ? '100%' : '60%' }} // Animated height difference
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onUpdate(Math.max(0, current - 1))}
          className="w-12 h-12 flex items-center justify-center rounded-[1.5rem] bg-[#FAF8F6] text-slate-400 active:scale-90 transition-all border border-slate-100 hover:bg-slate-100"
        >
          <Minus className="w-5 h-5 stroke-[3px]" />
        </button>
        <button
          onClick={() => onUpdate(current + 1)}
          className="flex-1 h-12 flex items-center justify-center rounded-[1.5rem] bg-[#3B82F6] text-white shadow-[0_10px_25px_rgba(59,130,246,0.3)] active:scale-95 transition-all hover:bg-blue-600 hover:shadow-blue-200"
        >
          <Plus className="w-6 h-6 stroke-[3px]" />
        </button>
      </div>
    </div>
  );
};

export default React.memo(WaterTracker);
