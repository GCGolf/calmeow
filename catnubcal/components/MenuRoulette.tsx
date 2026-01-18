import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Utensils, RotateCw, Ban, Gift, Package } from 'lucide-react';

interface MenuRouletteProps {
    remainingCalories: number;
}

interface FoodOption {
    name: string;
    calories: number;
    icon: string;
}

// Static list to avoid API latency (Instant load)
const THAI_MENU: FoodOption[] = [
    { name: 'กะเพราไก่ไข่ดาว', calories: 550, icon: '🍛' },
    { name: 'ส้มตำไทย', calories: 120, icon: '🥗' },
    { name: 'ข้าวมันไก่', calories: 600, icon: '🍗' },
    { name: 'ต้มยำกุ้งน้ำใส', calories: 150, icon: '🍲' },
    { name: 'ผัดไทย', calories: 650, icon: '🍜' },
    { name: 'แกงเขียวหวานไก่', calories: 450, icon: '🥘' },
    { name: 'ข้าวไข่เจียว', calories: 450, icon: '🍳' },
    { name: 'ยำวุ้นเส้น', calories: 180, icon: '🍝' },
    { name: 'ลาบหมู', calories: 250, icon: '🍖' },
    { name: 'สุกี้น้ำไก่', calories: 350, icon: '🍲' },
    { name: 'ข้าวหมูแดง', calories: 550, icon: '🥩' },
    { name: 'แกงจืดเต้าหู้หมูสับ', calories: 200, icon: '🥣' },
    { name: 'น้ำพริกปลาทู+ผัก', calories: 150, icon: '🐟' },
    { name: 'เส้นหมี่ลูกชิ้นน้ำใส', calories: 300, icon: '🍜' },
    { name: 'ข้าวต้มกุ้ง', calories: 250, icon: '🦐' },
    { name: 'โจ๊กหมูใส่ไข่', calories: 350, icon: '🥣' },
    { name: 'สลัดอกไก่', calories: 280, icon: '🥗' },
    { name: 'แซนวิชทูน่า', calories: 320, icon: '🥪' },
    { name: 'ไข่ต้ม 2 ฟอง', calories: 160, icon: '🥚' },
    { name: 'ฝรั่ง 1 ลูก', calories: 120, icon: '🍐' }
];

const MenuRoulette: React.FC<MenuRouletteProps> = ({ remainingCalories }) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState<FoodOption | null>(null);
    const [displayMenu, setDisplayMenu] = useState<FoodOption | null>(null);
    const [hasStarted, setHasStarted] = useState(false); // New state to track if we started
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const isOverLimit = remainingCalories <= 0;

    const handleSpin = () => {
        if (isSpinning || isOverLimit) return;

        setIsSpinning(true);
        setHasStarted(true); // Start showing items
        setSelectedMenu(null);

        // Filter valid options based on remaining calories
        // If remaining is very low (<200), show low cal options regardless to prevent empty list
        const validOptions = THAI_MENU.filter(f =>
            remainingCalories > 200 ? f.calories <= remainingCalories + 100 : f.calories <= 300
        );

        const pool = validOptions.length > 0 ? validOptions : THAI_MENU.filter(f => f.calories < 200);

        // Fast Animation Loop
        let counter = 0;
        const speed = 50; // ms
        const totalSpins = 30; // approx 1.5 seconds

        intervalRef.current = setInterval(() => {
            const random = pool[Math.floor(Math.random() * pool.length)];
            setDisplayMenu(random);
            counter++;

            if (counter >= totalSpins) {
                if (intervalRef.current) clearInterval(intervalRef.current);
                const finalChoice = pool[Math.floor(Math.random() * pool.length)];
                setDisplayMenu(finalChoice);
                setSelectedMenu(finalChoice);
                setIsSpinning(false);
            }
        }, speed);
    };

    return (
        <div className={`
            p-6 rounded-[2.5rem] border shadow-sm relative overflow-hidden transition-colors duration-500
            ${isOverLimit ? 'bg-slate-100 border-slate-200' : 'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-100'}
        `}>
            <div className="flex justify-between items-center relative z-10">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{isOverLimit ? '🛑' : '🎁'}</span>
                        <h3 className={`text-sm font-black uppercase tracking-wider ${isOverLimit ? 'text-slate-500' : 'text-rose-500'}`}>
                            {isOverLimit ? 'ครบโควต้าแล้ว' : 'กล่องจุ่มอาหาร'}
                        </h3>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium">
                        {isOverLimit ? 'วันนี้พอแค่นี้ก่อนดีกว่านะ' : 'ลุ้นอาหารเข้าธีม CalMeow Box'}
                    </p>
                </div>

                <button
                    onClick={handleSpin}
                    disabled={isSpinning || isOverLimit}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-xs shadow-sm transition-all
                        ${isSpinning || isOverLimit
                            ? 'bg-slate-200 text-slate-400 cursor-not-allowed scale-95 opacity-80'
                            : 'bg-white text-rose-500 hover:shadow-md active:scale-95 border border-pink-100'
                        }
                    `}
                >
                    {isSpinning ? (
                        <>
                            <RotateCw className="w-3.5 h-3.5 animate-spin" />
                            <span>หมุนๆ...</span>
                        </>
                    ) : isOverLimit ? (
                        <>
                            <Ban className="w-3.5 h-3.5" />
                            <span>พักก่อน</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>จุ่มเลย!</span>
                        </>
                    )}
                </button>
            </div>

            {/* Display Area */}
            <div className={`mt-4 backdrop-blur-sm rounded-2xl p-3 border flex items-center gap-4 transition-all h-[4.5rem]
                ${isOverLimit ? 'bg-slate-200/50 border-slate-200 opacity-60' : 'bg-white/60 border-white'}
            `}>
                {isOverLimit ? (
                    <div className="flex flex-col items-center justify-center w-full text-center">
                        <p className="font-black text-slate-400 text-sm">🎉 วันนี้ทำยอดเยี่ยมแล้ว!</p>
                        <p className="text-[10px] text-slate-400">พรุ่งนี้ค่อยมาลุ้นใหม่นะ</p>
                    </div>
                ) : !hasStarted ? (
                    /* Initial Blind Box State */
                    <div className="flex items-center justify-center w-full gap-3 animate-pulse">
                        <span className="font-bold text-slate-300 text-sm">กดปุ่มเพื่อสุ่มอาหาร...</span>
                    </div>
                ) : (
                    /* Revealed State */
                    <>
                        <div className="text-3xl filter drop-shadow-sm transition-transform duration-200 transform">
                            {displayMenu?.icon}
                        </div>
                        <div className="flex-1">
                            <p className={`font-black text-slate-800 leading-tight transition-opacity duration-100 ${isSpinning ? 'opacity-50' : 'opacity-100'}`}>
                                {displayMenu?.name || 'กำลังสุ่ม...'}
                            </p>
                            {selectedMenu && !isSpinning && (
                                <div className="flex items-center gap-1 mt-1 animate-fade-in">
                                    <Utensils className="w-3 h-3 text-slate-400" />
                                    <span className="text-[10px] font-bold text-slate-500">{selectedMenu.calories} kcal</span>
                                    {remainingCalories > 0 && selectedMenu.calories <= remainingCalories && (
                                        <span className="text-[10px] text-green-500 font-bold ml-1">(กินได้!)</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Background Decor */}
            {!isOverLimit && <div className="absolute -bottom-4 -right-4 text-8xl opacity-5 rotate-12 select-none">🎁</div>}
        </div>
    );
};

export default MenuRoulette;
