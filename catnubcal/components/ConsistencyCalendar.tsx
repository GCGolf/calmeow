import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X, HelpCircle } from 'lucide-react';

import { calculateScientificHealthGrade } from '../services/nutritionScience';

interface ConsistencyCalendarProps {
    logs: any[]; // Array of raw log objects with 'created_at' and nutrients
    tdee: number;
}

const ConsistencyCalendar: React.FC<ConsistencyCalendarProps> = ({ logs, tdee }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Calculate calendar data
    const { days, calendarGrid, stats } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Get total days in month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Get first day of week (0 = Sunday)
        const firstDayOfWeek = new Date(year, month, 1).getDay();

        // Group logs by date
        const dailyStats: Record<string, { calories: number, protein: number, sugar: number, sodium: number }> = {};

        logs.forEach(log => {
            const dateStr = new Date(log.created_at).toLocaleDateString('en-CA');
            if (!dailyStats[dateStr]) {
                dailyStats[dateStr] = { calories: 0, protein: 0, sugar: 0, sodium: 0 };
            }
            dailyStats[dateStr].calories += log.calories || 0;
            dailyStats[dateStr].protein += log.protein || 0;
            dailyStats[dateStr].sugar += log.sugar || 0;
            dailyStats[dateStr].sodium += log.sodium || 0;
        });

        // Calculate stats
        let loggedCount = 0;
        const today = new Date();
        const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
        const daysPassed = isCurrentMonth ? today.getDate() : daysInMonth;

        const targetProtein = (tdee * 0.3) / 4; // Approx protein target

        const days = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = new Date(year, month, day).toLocaleDateString('en-CA');
            const hasLog = !!dailyStats[dateStr];
            let grade = null;

            if (hasLog) {
                const dayStat = dailyStats[dateStr];
                // Calculate Daily Grade
                const result = calculateScientificHealthGrade(
                    dayStat.calories,
                    tdee,
                    dayStat.protein,
                    targetProtein,
                    dayStat.sugar,
                    dayStat.sodium,
                    5 // Treat single day as full consistency (100%) to grade food quality purely
                );
                grade = result.grade;
                loggedCount++;
            }

            // Check if future date
            const thisDate = new Date(year, month, day);
            const isFuture = thisDate > today;

            return {
                day,
                isLogged: hasLog,
                grade,
                isFuture,
                isToday: dateStr === today.toLocaleDateString('en-CA')
            };
        });

        // Pad start of month
        const padding = Array(firstDayOfWeek).fill(null);
        const calendarGrid = [...padding, ...days];

        const consistencyRate = daysPassed > 0 ? Math.round((loggedCount / daysPassed) * 100) : 0;

        return { days, calendarGrid, stats: { loggedCount, consistencyRate } };
    }, [currentDate, logs, tdee]);

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentDate(newDate);
    };

    return (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-slate-800">ปฏิทินวินัย</h3>
                        <div className="group relative z-50">
                            <HelpCircle size={16} className="text-slate-300 hover:text-[#E88D67] cursor-pointer transition-colors" />
                            <div className="absolute top-6 left-0 w-64 bg-white p-4 rounded-2xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.15)] border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto">
                                <h4 className="font-bold text-sm text-slate-800 mb-3 border-b border-slate-50 pb-2">เกณฑ์การให้เกรด (รายวัน)</h4>
                                <ul className="space-y-2 text-xs text-slate-600 font-medium">
                                    <li className="flex items-center gap-2.5">
                                        <span className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center text-sm">🔥</span>
                                        <span>แคลอรี่ <span className="text-slate-900 font-bold">±10%</span> ของเป้าหมาย</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <span className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-sm">🥩</span>
                                        <span>โปรตีน <span className="text-slate-900 font-bold">&gt; 80%</span> ของที่ควรทาน</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <span className="w-6 h-6 rounded-full bg-rose-50 flex items-center justify-center text-sm">🍬</span>
                                        <span>น้ำตาล <span className="text-slate-900 font-bold">&lt; 30g</span> (7.5 ช้อนชา)</span>
                                    </li>
                                    <li className="flex items-center gap-2.5">
                                        <span className="w-6 h-6 rounded-full bg-cyan-50 flex items-center justify-center text-sm">🧂</span>
                                        <span>โซเดียม <span className="text-slate-900 font-bold">&lt; 2300mg</span></span>
                                    </li>
                                </ul>
                                <div className="mt-3 pt-2 border-t border-slate-50 text-[10px] text-slate-400 text-center">
                                    ครบ 4 ข้อ = เกรด A 🏆
                                </div>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400">บันทึกสม่ำเสมอ: <span className="text-[#E88D67] font-bold">{stats.consistencyRate}%</span></p>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1">
                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-slate-600 shadow-sm">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-xs font-bold text-slate-600 min-w-[80px] text-center">
                        {currentDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-slate-600 shadow-sm">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-y-4 mb-2">
                {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-slate-300">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-3 gap-x-1">
                {calendarGrid.map((item, idx) => {
                    if (!item) return <div key={`pad-${idx}`} />;

                    return (
                        <div key={item.day} className="flex flex-col items-center gap-1">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all relative
                                ${item.isLogged
                                    ? 'bg-green-100 text-green-600 border border-green-200 shadow-sm'
                                    : item.isFuture
                                        ? 'bg-slate-50 text-slate-300 border border-transparent'
                                        : 'bg-red-50 text-red-300 border border-red-100' // Missed
                                }
                                ${item.isToday ? 'ring-2 ring-offset-2 ring-[#E88D67]' : ''}
                            `}>
                                {item.isLogged ? item.grade : item.day}

                                {item.isToday && (
                                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#E88D67] rounded-full border-2 border-white" />
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex justify-center gap-4">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-100 border border-green-200"></div>
                    <span className="text-[10px] text-slate-400">บันทึกแล้ว</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-50 border border-red-100"></div>
                    <span className="text-[10px] text-slate-400">ขาดบันทึก</span>
                </div>
            </div>
        </div>
    );
};

export default ConsistencyCalendar;
