import React from 'react';

import {
    calculateWeightProjection,
    analyzeMacroBalance,
    calculateConsistencyScore,
    generateHealthTip,
    calculateWeeklyBalance,
    calculateMetabolicSplit,

    WeightProjection,
    MacroAnalysis
} from '../services/nutritionScience';

/**
 * DeepInsights - Health Insights Dashboard Component
 * 
 * แสดงข้อมูลเชิงลึกด้านสุขภาพจากข้อมูลจริงของผู้ใช้
 * อ้างอิงหลักโภชนาการสากล (WHO, USDA)
 */

interface DeepInsightsProps {
    tdee: number; // Target Daily Energy Expenditure
    avgCalories: number; // ค่าเฉลี่ยแคลอรี่ 7 วัน
    dailyCalories: number[]; // Array ของแคลอรี่รายวัน
    macros: {
        protein: number;
        carbs: number;
        fat: number;
    };
    logs?: any[];
}

const DeepInsights: React.FC<DeepInsightsProps> = ({
    tdee,
    dailyCalories,
    macros,
    logs = []
}) => {
    // Run all calculations
    const avgCalories = dailyCalories.reduce((sum, cal) => sum + cal, 0) / dailyCalories.length;
    const projection = calculateWeightProjection(tdee, avgCalories);
    const weeklyBalance = calculateWeeklyBalance(dailyCalories, tdee);
    const metabolicSplit = calculateMetabolicSplit(tdee);



    const macroAnalysis = analyzeMacroBalance(macros.protein, macros.carbs, macros.fat);
    const consistencyScore = calculateConsistencyScore(dailyCalories, tdee);

    const healthTip = generateHealthTip(projection, avgCalories, tdee);

    // Color helpers


    const getMacroBarColor = (type: string) => {
        switch (type) {
            case 'protein': return 'bg-gradient-to-r from-rose-400 to-red-500';
            case 'carbs': return 'bg-gradient-to-r from-amber-400 to-yellow-500';
            case 'fat': return 'bg-gradient-to-r from-cyan-400 to-blue-500';
            default: return 'bg-gray-300';
        }
    };

    return (
        <div className="space-y-4">

            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🩺</span>
                <h3 className="text-lg font-bold text-slate-800">ข้อมูลเชิงลึกด้านสุขภาพ</h3>
            </div>

            {/* Health Tip Banner */}
            <div className={`p-4 rounded-2xl border ${healthTip.type === 'success' ? 'bg-green-50 border-green-200' :
                healthTip.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                    'bg-blue-50 border-blue-200'
                }`}>
                <div className="flex items-start gap-3">
                    <span className="text-2xl">{healthTip.icon}</span>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">คำแนะนำวันนี้</p>
                        <p className={`text-sm font-semibold ${healthTip.type === 'success' ? 'text-green-700' :
                            healthTip.type === 'warning' ? 'text-amber-700' :
                                'text-blue-700'
                            }`}>{healthTip.tip}</p>
                    </div>
                </div>
            </div>

            {/* Weekly Balance Card */}
            <div className={`p-4 rounded-2xl border ${weeklyBalance.status === 'deficit' ? 'bg-green-50 border-green-200 text-green-700' : weeklyBalance.status === 'surplus' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">⚖️</span>
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">สมดุลพลังงาน 7 วัน</p>
                </div>
                <p className="text-2xl font-black">
                    {weeklyBalance.totalBalance > 0 ? '+' : ''}{weeklyBalance.totalBalance} kcal
                </p>
                <p className="text-[10px] mt-1 opacity-80 font-medium">
                    {weeklyBalance.message}
                </p>
            </div>





            {/* Macro Balance Section */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="text-lg">⚖️</span>
                        <p className="text-xs font-bold text-slate-700">สัดส่วนสารอาหาร</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${macroAnalysis.quality === 'good' ? 'bg-green-100 text-green-600' :
                        macroAnalysis.quality === 'warning' ? 'bg-amber-100 text-amber-600' :
                            'bg-red-100 text-red-600'
                        }`}>
                        {macroAnalysis.quality === 'good' ? 'สมดุล' : macroAnalysis.quality === 'warning' ? 'ควรปรับ' : 'ต้องแก้ไข'}
                    </span>
                </div>

                {/* Macro Bars */}
                <div className="space-y-3">
                    {/* Protein */}
                    <div>
                        <div className="flex justify-between text-[10px] mb-1">
                            <span className="font-bold text-slate-600">🥩 โปรตีน</span>
                            <span className="text-rose-500 font-bold">{macroAnalysis.pRatio}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${getMacroBarColor('protein')} rounded-full transition-all duration-500`} style={{ width: `${Math.min(macroAnalysis.pRatio, 100)}%` }} />
                        </div>
                    </div>

                    {/* Carbs */}
                    <div>
                        <div className="flex justify-between text-[10px] mb-1">
                            <span className="font-bold text-slate-600">🍚 คาร์โบไฮเดรต</span>
                            <span className="text-amber-500 font-bold">{macroAnalysis.cRatio}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${getMacroBarColor('carbs')} rounded-full transition-all duration-500`} style={{ width: `${Math.min(macroAnalysis.cRatio, 100)}%` }} />
                        </div>
                    </div>

                    {/* Fat */}
                    <div>
                        <div className="flex justify-between text-[10px] mb-1">
                            <span className="font-bold text-slate-600">🧈 ไขมัน</span>
                            <span className="text-cyan-500 font-bold">{macroAnalysis.fRatio}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${getMacroBarColor('fat')} rounded-full transition-all duration-500`} style={{ width: `${Math.min(macroAnalysis.fRatio, 100)}%` }} />
                        </div>
                    </div>
                </div>

                {/* Macro Advice */}
                <div className="mt-3 p-2 bg-slate-50 rounded-xl">
                    <p className="text-[11px] text-slate-600">{macroAnalysis.advice}</p>
                </div>
            </div>

            {/* Metabolism Split (Educational) */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">🔥</span>
                    <p className="text-xs font-bold text-slate-700">การเผาผลาญของคุณ (โดยประมาณ)</p>
                </div>
                <div className="flex items-center gap-1 h-4 rounded-full overflow-hidden mb-2">
                    <div className="h-full bg-orange-400 flex items-center justify-center" style={{ width: `${metabolicSplit.bmrPercent}%` }}>
                    </div>
                    <div className="h-full bg-blue-400 flex items-center justify-center" style={{ width: `${100 - metabolicSplit.bmrPercent}%` }}>
                    </div>
                </div>
                <div className="flex justify-between text-[10px] font-medium text-slate-500">
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <span>BMR (อยู่นิ่งๆ): {metabolicSplit.bmr}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        <span>กิจกรรม: {metabolicSplit.activity}</span>
                    </div>
                </div>
            </div>

            {/* Consistency Score */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">📊</span>
                            <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">วินัยการบันทึก</p>
                        </div>
                        <p className="text-3xl font-black">{consistencyScore}%</p>
                        <p className="text-[10px] opacity-80 mt-1">
                            {consistencyScore >= 80 ? 'ยอดเยี่ยม! สม่ำเสมอมาก' :
                                consistencyScore >= 50 ? 'ดี แต่พยายามต่อไป' :
                                    'ลองบันทึกให้บ่อยขึ้นนะ'}
                        </p>
                    </div>
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <span className="text-3xl">
                            {consistencyScore >= 80 ? '🔥' : consistencyScore >= 50 ? '💪' : '📝'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Disclaimer */}
            <p className="text-[9px] text-slate-400 text-center">
                *ข้อมูลอ้างอิงตามหลักโภชนาการสากล (WHO & USDA) เพื่อการศึกษาเท่านั้น
            </p>
        </div>
    );
};

export default DeepInsights;
