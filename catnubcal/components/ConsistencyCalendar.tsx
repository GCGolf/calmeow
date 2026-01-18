import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';

interface ConsistencyCalendarProps {
    logs: any[]; // Array of raw log objects with 'created_at'
}

const ConsistencyCalendar: React.FC<ConsistencyCalendarProps> = ({ logs }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Calculate calendar data
    const { days, calendarGrid, stats } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Get total days in month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Get first day of week (0 = Sunday)
        const firstDayOfWeek = new Date(year, month, 1).getDay();

        // Map logs to unique dates set
        const loggedDates = new Set(
            logs.map(log => new Date(log.created_at).toLocaleDateString('en-CA'))
        );

        // Calculate stats
        let loggedCount = 0;
        const today = new Date();
        const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
        const daysPassed = isCurrentMonth ? today.getDate() : daysInMonth;

        const days = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = new Date(year, month, day).toLocaleDateString('en-CA');
            const isLogged = loggedDates.has(dateStr);

            // Check if future date
            const thisDate = new Date(year, month, day);
            const isFuture = thisDate > today;

            if (isLogged) loggedCount++;

            return {
                day,
                isLogged,
                isFuture,
                isToday: dateStr === today.toLocaleDateString('en-CA')
            };
        });

        // Pad start of month
        const padding = Array(firstDayOfWeek).fill(null);
        const calendarGrid = [...padding, ...days];

        const consistencyRate = daysPassed > 0 ? Math.round((loggedCount / daysPassed) * 100) : 0;

        return { days, calendarGrid, stats: { loggedCount, consistencyRate } };
    }, [currentDate, logs]);

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentDate(newDate);
    };

    return (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-bold text-slate-800">ปฏิทินวินัย</h3>
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
                                {item.isLogged ? <Check className="w-3.5 h-3.5" /> : item.day}

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
