import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area } from 'recharts';
import { HelpCircle } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../services/AuthContext';
import { COLORS } from '../constants';
import CatGoalTracker from './CatGoalTracker';
import DeepInsights from './DeepInsights';
import ConsistencyCalendar from './ConsistencyCalendar';
import { calculateScientificHealthGrade, HealthGradeResult, QuestItem } from '../services/nutritionScience';

const Analytics: React.FC = () => {
  const { user } = useAuth();

  // Existing State
  const [stats, setStats] = useState<any[]>([]);
  const [avgCalories, setAvgCalories] = useState(0);
  const [dailyCalories, setDailyCalories] = useState<number[]>([]);
  const [tdee, setTdee] = useState(2000);
  const [macros, setMacros] = useState({ protein: 0, carbs: 0, fat: 0 });
  const [rawLogs, setRawLogs] = useState<any[]>([]);
  const [goalProgress, setGoalProgress] = useState({
    startDate: new Date(),
    targetDate: new Date(),
    currentDay: 0,
    totalDays: 7
  });

  // New State for Advanced Analytics
  const [weightData, setWeightData] = useState<{ date: string, weight: number }[]>([]);
  const [macroStats, setMacroStats] = useState<any[]>([]);
  const [weeklyHighlights, setWeeklyHighlights] = useState({
    totalCalories: 0,
    avgProtein: 0,
    loggedDays: 0,
    onTrackDays: 0,
    avgCholesterol: 0,
    avgSodium: 0,
    avgSugar: 0,
    healthGrade: 'F',
    healthScore: 0,
    healthAdvice: [] as string[],
    scoreBreakdown: { calorie: 0, nutrient: 0, consistency: 0 },
    nutritionGap: { missingProtein: 0, excessSugar: 0, excessSodium: 0 },
    quests: [] as QuestItem[]
  });

  // Fetch Profile for Goal Dates and TDEE
  useEffect(() => {
    const fetchProfile = async () => {
      const userId = user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('created_at, target_end_date, tdee, current_weight, target_weight') // Removed non-existent starting_weight
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        const start = new Date(data.created_at);
        const target = data.target_end_date ? new Date(data.target_end_date) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
        const today = new Date();

        const totalDays = Math.max(1, Math.ceil((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        const daysPassed = Math.max(0, Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

        setGoalProgress({
          startDate: start,
          targetDate: target,
          currentDay: Math.min(daysPassed, totalDays),
          totalDays
        });

        if (data.tdee) setTdee(data.tdee);

        // [NEW] Mock Weight Journey based on Start -> Current -> Target
        // Ideally this would come from a weight_logs table
        const startW = data.current_weight || 70; // Fallback to current since starting_weight doesn't exist
        const currentW = data.current_weight || 70;
        const targetW = data.target_weight || 60;

        const weightPoints = [
          { date: start.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }), weight: startW, type: 'Start' },
          { date: today.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }), weight: currentW, type: 'Current' },
          { date: target.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }), weight: targetW, type: 'Goal' }
        ];
        // Sort by date roughly (approximation for visualization)
        setWeightData(weightPoints);

      } else {
        // Fallback to localStorage
        const offlineData = JSON.parse(localStorage.getItem('offline_profile') || '{}');
        if (offlineData.target_end_date) {
          // ... (keep existing fallback logic if needed, simplified here)
        }
        if (offlineData.tdee) setTdee(offlineData.tdee);
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      const userId = user?.id;
      if (!userId) return;

      // Fetch last 7 days Logs with macros
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);

      const { data, error } = await supabase
        .from('food_logs')
        .select('calories, protein, carbs, fat, cholesterol, sodium, sugar, created_at')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString());

      if (data) {
        setRawLogs(data); // Save raw logs

        const dailyMap: { [key: string]: { calories: number, protein: number, carbs: number, fat: number, cholesterol: number, sodium: number, sugar: number } } = {};

        // Initialize last 7 days
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(endDate.getDate() - i);
          const dateKey = d.toLocaleDateString('en-CA');
          dailyMap[dateKey] = { calories: 0, protein: 0, carbs: 0, fat: 0, cholesterol: 0, sodium: 0, sugar: 0 };
        }

        let totalProtein = 0;
        let onTrackCount = 0;

        data.forEach(log => {
          const dateKey = new Date(log.created_at).toLocaleDateString('en-CA');
          if (dailyMap[dateKey]) {
            dailyMap[dateKey].calories += log.calories || 0;
            dailyMap[dateKey].protein += log.protein || 0;
            dailyMap[dateKey].carbs += log.carbs || 0;
            dailyMap[dateKey].fat += log.fat || 0;
            dailyMap[dateKey].cholesterol += log.cholesterol || 0;
            dailyMap[dateKey].sodium += log.sodium || 0;
            dailyMap[dateKey].sugar += log.sugar || 0;
          }
          totalProtein += log.protein || 0;
        });

        // Convert to Chart Data
        const chartData = Object.keys(dailyMap).sort().map(date => {
          const d = dailyMap[date];
          if (d.calories > 0 && d.calories <= tdee + 200) onTrackCount++; // Simple "On Track" logic
          return {
            date,
            calories: d.calories,
            protein: d.protein,
            carbs: d.carbs,
            fat: d.fat,
            cholesterol: d.cholesterol,
            sodium: d.sodium,
            sugar: d.sugar
          };
        });

        setStats(chartData);
        setDailyCalories(chartData.map(d => d.calories));
        setMacroStats(chartData);

        const totalCal = chartData.reduce((sum, d) => sum + d.calories, 0);
        const loggedDaysCount = chartData.filter(d => d.calories > 0).length;

        setAvgCalories(Math.round(totalCal / 7));
        setMacros({ protein: totalProtein, carbs: 0, fat: 0 }); // Total protein for fallback

        // Logic for Health Grade & Deep Health
        // Fix: chartData has unknown type to TS here, cast or trust it matches. 
        // We know it has the fields we just added.
        const avgCholesterol = loggedDaysCount ? Math.round(chartData.reduce((sum, d: any) => sum + (d.cholesterol || 0), 0) / loggedDaysCount) : 0;
        const avgSodium = loggedDaysCount ? Math.round(chartData.reduce((sum, d: any) => sum + (d.sodium || 0), 0) / loggedDaysCount) : 0;
        const avgSugar = loggedDaysCount ? Math.round(chartData.reduce((sum, d: any) => sum + (d.sugar || 0), 0) / loggedDaysCount) : 0;
        const calculatedAvgCalories = loggedDaysCount ? Math.round(totalCal / loggedDaysCount) : 0;

        // Scientific Grade Calculation
        const targetProtein = (tdee * 0.3) / 4; // Approx 30% or just use 1.2g/kg
        const scientificGrade = calculateScientificHealthGrade(
          calculatedAvgCalories,
          tdee,
          loggedDaysCount ? totalProtein / loggedDaysCount : 0,
          targetProtein,
          avgSugar,
          avgSodium,
          loggedDaysCount
        );

        setWeeklyHighlights({
          totalCalories: totalCal,
          avgProtein: loggedDaysCount ? Math.round(totalProtein / loggedDaysCount) : 0,
          loggedDays: loggedDaysCount,
          onTrackDays: onTrackCount,
          avgCholesterol,
          avgSodium,
          avgSugar,
          healthGrade: scientificGrade.grade,
          healthScore: scientificGrade.totalScore,
          healthAdvice: scientificGrade.advice,
          scoreBreakdown: {
            calorie: scientificGrade.breakdown.calorieScore,
            nutrient: scientificGrade.breakdown.nutrientScore,
            consistency: scientificGrade.breakdown.consistencyScore
          },
          nutritionGap: scientificGrade.nutritionGap,
          quests: scientificGrade.quests
        });
      }
    };
    fetchStats();
  }, [user, tdee]);

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Cat Goal Tracker - Real Goal Journey */}
      <CatGoalTracker
        currentDay={goalProgress.currentDay}
        targetDay={goalProgress.totalDays}
        goalDate={goalProgress.targetDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
        goalLabel="ไปถึงเป้าหมายกัน!"
      />

      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-800">แนวโน้มแคลอรี่</h3>
          <p className="text-xs text-slate-400">ภาพรวมในช่วง 7 วันที่ผ่านมา</p>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#cbd5e1', fontWeight: 600 }}
                tickFormatter={(val) => val.split('-')[2]}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1', fontWeight: 600 }} />
              <Tooltip
                cursor={{ fill: '#f8fafc', radius: 8 }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', padding: '12px' }}
                labelFormatter={(label) => `วันที่ ${label.split('-')[2]}`}
              />
              <ReferenceLine y={tdee} stroke="#fb923c" strokeDasharray="5 5" label={{ position: 'right', value: 'เป้าหมาย', fill: '#fb923c', fontSize: 10, fontWeight: 700 }} />
              <Bar
                dataKey="calories"
                fill={COLORS.primary}
                radius={[8, 8, 8, 8]}
                barSize={20}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Consistency Calendar - [NEW] Feature */}
      <ConsistencyCalendar logs={rawLogs} tdee={tdee} />





      {/* NEW: Deep Health & Health Grade Row */}
      <div className="grid grid-cols-2 gap-4">

        {/* Card 1: Deep Health Tracker (Cholesterol Focus) */}
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-4xl">❤️</span>
          </div>
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2">สุขภาพหัวใจ (เฉลี่ย)</p>

          {/* Cholesterol */}
          <div className="mb-3">
            <div className="flex justify-between items-end mb-1">
              <span className="text-xs font-bold text-slate-600">Cholesterol</span>
              <span className={`text-xs font-bold ${weeklyHighlights.avgCholesterol > 300 ? 'text-red-500' : 'text-green-500'}`}>
                {weeklyHighlights.avgCholesterol} <span className="text-[10px] text-slate-400">/ 300mg</span>
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${weeklyHighlights.avgCholesterol > 300 ? 'bg-red-500' : 'bg-green-500'}`}
                style={{ width: `${Math.min(100, (weeklyHighlights.avgCholesterol / 300) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Sodium */}
          <div>
            <div className="flex justify-between items-end mb-1">
              <span className="text-xs font-bold text-slate-600">Sodium</span>
              <span className={`text-xs font-bold ${weeklyHighlights.avgSodium > 2300 ? 'text-orange-500' : 'text-blue-500'}`}>
                {weeklyHighlights.avgSodium} <span className="text-[10px] text-slate-400">/ 2300</span>
              </span>
            </div>
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${weeklyHighlights.avgSodium > 2300 ? 'bg-orange-500' : 'bg-blue-400'}`}
                style={{ width: `${Math.min(100, (weeklyHighlights.avgSodium / 2300) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 2: Neko Health Grade */}
        <div className={`p-5 rounded-[2rem] text-white shadow-lg relative overflow-visible group/tooltip flex flex-col justify-center items-center
            ${weeklyHighlights.healthGrade === 'A' ? 'bg-gradient-to-br from-green-400 to-emerald-600 shadow-emerald-200/50' :
            weeklyHighlights.healthGrade === 'B' ? 'bg-gradient-to-br from-blue-400 to-cyan-500 shadow-blue-200/50' :
              weeklyHighlights.healthGrade === 'C' ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-orange-200/50' :
                'bg-gradient-to-br from-red-400 to-rose-600 shadow-red-200/50'}
        `}>
          <div className="absolute top-[-20px] left-[-20px] w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>

          <p className="text-[10px] uppercase font-bold text-white/80 tracking-widest absolute top-5 left-5">เกรดสุขภาพ</p>

          {/* Tooltip Icon */}
          <div className="absolute top-4 right-4 cursor-pointer hover:scale-110 transition-transform">
            <HelpCircle size={20} className="text-white/80" />
          </div>

          {/* Tooltip Content (Hover) */}
          <div className="absolute top-12 -right-4 w-80 bg-white text-slate-700 p-5 rounded-[2rem] shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-300 z-50 transform translate-y-2 group-hover/tooltip:translate-y-0 pointer-events-none group-hover/tooltip:pointer-events-auto border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">📜</span>
              <h4 className="font-bold text-sm text-slate-800">ภารกิจพิชิตเกรด A (มาตรฐาน WHO)</h4>
            </div>

            <div className="space-y-3">
              {weeklyHighlights.quests && weeklyHighlights.quests.map((quest, index) => (
                <div key={index} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{quest.icon}</span>
                      <span className="text-xs font-bold text-slate-700">{quest.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{quest.score}/{quest.maxScore} XP</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mb-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${quest.status === 'success' ? 'bg-green-500' :
                        quest.status === 'warning' ? 'bg-orange-400' : 'bg-red-500'
                        }`}
                      style={{ width: `${quest.progressPercent}%` }}
                    ></div>
                  </div>

                  {/* Action Message */}
                  <p className={`text-[10px] font-medium ${quest.status === 'success' ? 'text-green-600' :
                    quest.status === 'warning' ? 'text-orange-500' : 'text-red-500'
                    }`}>
                    {quest.status === 'success' ? '✅ ' : '🎯 '} {quest.message}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 text-center border-t border-slate-100 pt-2">
              <p className="text-[10px] font-bold text-slate-500">🏆 เงื่อนไขเกรด A: ทำคะแนนรวมให้เกิน 80 XP</p>
              <p className="text-[9px] text-slate-400 mt-0.5">อ้างอิง: องค์การอนามัยโลก (WHO) และ Thai RDI</p>
            </div>
          </div>

          <div className="text-center relative z-10 mt-2">
            <h2 className="text-[5rem] font-black leading-none drop-shadow-md">{weeklyHighlights.healthGrade}</h2>
            <p className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm inline-block mt-1">
              {weeklyHighlights.healthGrade === 'A' ? 'ยอดเยี่ยม! 🏆' :
                weeklyHighlights.healthGrade === 'B' ? 'ดีมาก! 👍' :
                  weeklyHighlights.healthGrade === 'C' ? 'พอใช้ 💪' : 'สู้ๆนะ! ✌️'}
            </p>
          </div>
        </div>
      </div>



      {/* Macro Trends (Stacked Bar) */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-50">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-800">สมดุลสารอาหาร (7 วัน)</h3>
          <div className="flex gap-4 mt-2">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-400"></div><span className="text-[10px] text-slate-400">Protein</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-400"></div><span className="text-[10px] text-slate-400">Carbs</span></div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-lime-400"></div><span className="text-[10px] text-slate-400">Fat</span></div>
          </div>
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={macroStats} stackOffset="expand" margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tickFormatter={(val) => val.split('-')[2]} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
              <YAxis tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="protein" stackId="a" fill="#22d3ee" radius={[0, 0, 4, 4]} />
              <Bar dataKey="carbs" stackId="a" fill="#fb923c" />
              <Bar dataKey="fat" stackId="a" fill="#a3e635" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

