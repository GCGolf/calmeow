import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

interface PetSmartWalkProps {
    onReset?: () => void;
    currentCalories: number;
    goalCalories: number;
    streak?: number;
    feedTrigger?: number;
}

const CAT_MESSAGES = [
    "เจ้านายจ๋า... วันนี้กินข้าวยังเมี๊ยว? 🍣",
    "อย่าลืมดื่มน้ำนะเมี๊ยว! 💧",
    "สู้ๆ น้าา เป็นกำลังใจให้..เมี๊ยว! ✌️",
    "อยากกินปลาทู...เมี๊ยวว 🐟",
    "รักนะ เมี๊ยวๆ จุ๊บๆ ❤️",
    "ถ้าเหนื่อยก็พัก..มาเล่นกันเมี๊ยว 😺"
];

// ========== SIMPLE STATE ==========
type CatMode = 'walking' | 'sleeping' | 'playing' | 'goal';

const PetSmartWalk: React.FC<PetSmartWalkProps> = ({
    onReset, currentCalories, goalCalories, streak = 0, feedTrigger = 0
}) => {
    // ========== STATE ==========
    const [catMode, setCatMode] = useState<CatMode>('walking');
    const [message, setMessage] = useState('');
    const [showMessage, setShowMessage] = useState(false);
    const [customImage, setCustomImage] = useState<string | null>(null);
    const [clickCount, setClickCount] = useState(0);

    // Refs for DOM manipulation (no re-renders)
    const containerRef = useRef<HTMLDivElement>(null);
    const directionRef = useRef<HTMLDivElement>(null);
    const messageTimerRef = useRef<NodeJS.Timeout | null>(null);
    const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

    const isGoalReached = goalCalories > 0 && currentCalories >= goalCalories;

    // ========== MESSAGE SYSTEM ==========
    const showBubble = (text: string, duration = 3000) => {
        setMessage(text);
        setShowMessage(true);

        if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
        messageTimerRef.current = setTimeout(() => setShowMessage(false), duration);
    };

    // ========== RANDOM MESSAGES (while walking) ==========
    useEffect(() => {
        if (catMode !== 'walking') return;

        const interval = setInterval(() => {
            if (catMode === 'walking') {
                const msg = CAT_MESSAGES[Math.floor(Math.random() * CAT_MESSAGES.length)];
                showBubble(msg, 2500);
            }
        }, 8000); // Show message every 8 seconds

        return () => clearInterval(interval);
    }, [catMode]);

    // ========== GOAL REACHED ==========
    useEffect(() => {
        if (isGoalReached) {
            setCatMode('goal');
            showBubble("วันนี้อิ่มแล้วเหมียว ❤️", 999999);
        } else if (catMode === 'goal') {
            setCatMode('walking');
        }
    }, [isGoalReached]);

    // ========== FEED TRIGGER ==========
    useEffect(() => {
        if (feedTrigger > 0) {
            showBubble("ง่ำๆ อร่อยจัง! 😋", 2000);
        }
    }, [feedTrigger]);

    // ========== LOAD CUSTOM IMAGE ==========
    useEffect(() => {
        const saved = localStorage.getItem('pet_custom_image');
        if (saved) setCustomImage(saved);
    }, []);

    // ========== HANDLERS ==========
    const handleCatClick = () => {
        if (catMode === 'sleeping') {
            // Wake up
            setCatMode('walking');
            showBubble("อ๊า...ตื่นแล้วเมี๊ยว 😺", 2000);
            return;
        }

        setClickCount(prev => prev + 1);
        const isAngry = clickCount >= 4;
        showBubble(isAngry ? "แง่งงง! 😾💢" : "เมี๊ยว เมี๊ยว 😸✨", 1500);

        if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
        clickTimerRef.current = setTimeout(() => setClickCount(0), 2000);
    };

    // Helper: Smooth move cat to position with direction
    const smoothMoveTo = (targetLeft: string, faceLeft: boolean, callback?: () => void) => {
        if (!containerRef.current) return;
        const el = containerRef.current;

        // Get current computed left position
        const computed = window.getComputedStyle(el);
        const currentLeft = computed.left;

        // Flip cat to face the direction of movement
        if (directionRef.current) {
            directionRef.current.style.animation = 'none';
            directionRef.current.style.transform = faceLeft ? 'scaleX(-1)' : 'scaleX(1)';
        }

        // Pause animation and set current position
        el.style.animation = 'none';
        el.style.left = currentLeft;
        el.offsetHeight; // Force reflow

        // Enable transition and move to target
        el.style.transition = 'left 1s ease-in-out';
        el.style.left = targetLeft;

        // Callback after transition
        if (callback) {
            setTimeout(callback, 1000);
        }
    };

    const handleCondoClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (catMode === 'sleeping') return;

        // Move smoothly to condo (face right)
        smoothMoveTo('58%', false, () => {
            setCatMode('sleeping');
            showBubble("หลับแปป...zzZ 😴", 999999);
        });
    };

    const handleYarnClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (catMode === 'sleeping' || catMode === 'playing') return;

        // Move smoothly to yarn (face left)
        smoothMoveTo('12%', true, () => {
            setCatMode('playing');
            showBubble("เมี๊ยววว 🧶", 2000);
        });

        // Yarn bounce animation
        const target = e.currentTarget as HTMLElement;
        target.style.animation = 'none';
        target.offsetHeight;
        target.style.animation = 'yarnBounce 0.4s ease-out';

        // Return to walking after 3.5 seconds (1s move + 2.5s play)
        setTimeout(() => {
            if (containerRef.current) {
                containerRef.current.style.transition = '';
                containerRef.current.style.animation = '';
                containerRef.current.style.left = '';
            }
            if (directionRef.current) {
                directionRef.current.style.transform = '';
                directionRef.current.style.animation = '';
            }
            setCatMode('walking');
        }, 3500);
    };


    const handleAreaClick = () => {
        if (catMode === 'sleeping') {
            // Reset styles to allow CSS animation to take over
            if (containerRef.current) {
                containerRef.current.style.transition = '';
                containerRef.current.style.animation = '';
                containerRef.current.style.left = '';
            }
            if (directionRef.current) {
                directionRef.current.style.transform = '';
                directionRef.current.style.animation = '';
            }
            setCatMode('walking');
            showBubble("อ๊า...ตื่นแล้วเมี๊ยว 😺", 2000);
        }

    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const result = ev.target?.result as string;
                setCustomImage(result);
                localStorage.setItem('pet_custom_image', result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleReset = () => {
        setCatMode('walking');
        setShowMessage(false);
        onReset?.();
    };

    // ========== IMAGE SOURCE ==========
    const getImageSrc = () => {
        if (catMode === 'sleeping') return '/cat1sleep.png';
        if (isGoalReached) return "https://res.cloudinary.com/dtezruttf/image/upload/v1768657539/Gemini_Generated_Image_omgl4nomgl4nomgl_1_xpx7ra.png";
        return customImage || "https://res.cloudinary.com/dtezruttf/image/upload/v1768654043/11565122_x40zof.png";
    };

    // ========== RENDER ==========
    return (
        <div
            className="relative z-0 w-full h-48 mt-10 mb-6 group select-none overflow-hidden"
            onClick={handleAreaClick}
        >
            {/* Background */}
            <div
                className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${streak >= 45 ? 'opacity-100' : 'opacity-20'}`}
                style={{
                    backgroundImage: streak >= 45
                        ? `url('/cat_cafe_bg.png')`
                        : 'linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px)',
                    backgroundSize: streak >= 45 ? 'cover' : '40px 40px',
                }}
            />

            {/* Rug */}
            {streak < 45 && (
                <div
                    className="absolute bottom-0 w-full h-1/4 bg-[#D2B48C]/40 rounded-t-[2rem] pointer-events-none"
                    style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 20px)' }}
                />
            )}

            {/* Controls */}
            <div className="absolute top-0 right-0 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={handleReset} className="p-1.5 bg-white/80 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm">
                    <RefreshCw size={14} />
                </button>
                {!isGoalReached && (
                    <label className="p-1.5 bg-white/80 hover:bg-white rounded-full cursor-pointer text-slate-400 hover:text-slate-600 shadow-sm">
                        <Camera size={14} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                )}
            </div>

            {/* ========== CAT ========== */}
            <div
                ref={containerRef}
                className={`absolute bottom-2 w-32 md:w-36 z-50 cursor-pointer cat-container ${catMode === 'walking' ? 'walking-mode' : ''} ${catMode === 'sleeping' ? 'sleeping-mode' : ''} ${catMode === 'playing' ? 'playing-mode' : ''} ${catMode === 'goal' ? 'goal-mode' : ''}`}
                onClick={handleCatClick}
            >
                {/* Message Bubble */}
                {showMessage && (
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-2xl border border-orange-100 font-bold text-sm text-slate-700 whitespace-nowrap shadow-lg z-[100] pointer-events-none animate-bounce-in">
                        {message}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-t-8 border-t-white" />
                    </div>
                )}

                {/* Cat Wrapper (for direction flip) */}
                <div ref={directionRef} className="cat-direction w-full h-full flex justify-center items-end">

                    <div className={`cat-body w-full h-full flex justify-center items-end relative ${clickCount > 4 ? 'angry' : ''}`}>
                        {/* Shadow */}
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-[60%] h-3 bg-black/10 blur-sm rounded-full cat-shadow" />

                        {/* Cat Image */}
                        <img
                            src={getImageSrc()}
                            alt="My Cat"
                            loading="lazy"
                            className="w-full h-auto relative z-10 drop-shadow-sm select-none cat-image"
                        />

                        {/* Second Cat (Streak 30+) */}
                        {streak >= 30 && catMode !== 'sleeping' && (
                            <img
                                src="/cat2.png"
                                alt="Friend Cat"
                                loading="lazy"
                                className="absolute -left-8 bottom-0 w-full h-auto z-0 drop-shadow-sm select-none opacity-90"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Yarn (Streak 7+) */}
            {streak >= 7 && (
                <div
                    onClick={handleYarnClick}
                    className="absolute bottom-2 left-[2%] w-10 h-10 z-[60] cursor-pointer hover:scale-110 transition-transform"
                    title="ลูกไหมพรม"
                >
                    <span className="text-3xl">🧶</span>
                </div>
            )}

            {/* Condo (Streak 14+) */}
            {streak >= 14 && (
                <div
                    onClick={handleCondoClick}
                    className="absolute bottom-2 right-[2%] w-28 h-28 z-10 cursor-pointer hover:scale-105 transition-transform"
                    title="คอนโดแมว - จิ้มให้แมวนอน!"
                >
                    <img src="/cat_condo.png" alt="Cat Condo" className="w-full h-full object-contain" />
                </div>
            )}

            {/* ========== CSS ANIMATIONS ========== */}
            <style>{`
                /* ===== WALKING MODE: Pure CSS Animation ===== */
                .walking-mode {
                    animation: catWalkPath 20s ease-in-out infinite;
                }
                .walking-mode .cat-direction {
                    animation: catFlipDirection 20s steps(1) infinite;
                }
                .walking-mode .cat-image {
                    animation: catWaddle 0.8s ease-in-out infinite alternate;
                }
                .walking-mode .cat-shadow {
                    animation: shadowPulse 0.8s ease-in-out infinite alternate;
                }

                /* ===== SLEEPING MODE ===== */
                .sleeping-mode {
                    left: 58% !important;
                    animation: none !important;

                }
                .sleeping-mode .cat-image {
                    transform: scaleY(0.85) translateY(6px);
                    animation: none !important;
                    transition: transform 0.5s ease-out 1.3s;
                }
                .sleeping-mode .cat-direction {
                    transform: scaleX(1) !important;
                    animation: none !important;
                }

                /* ===== GOAL MODE ===== */
                .goal-mode {
                    left: 50% !important;
                    transform: translateX(-50%) !important;
                    animation: none !important;
                }
                .goal-mode .cat-image {
                    transform: scale(1.15);
                    animation: none !important;
                }
                .goal-mode .cat-direction {
                    animation: none !important;
                }

                /* ===== PLAYING MODE (Yarn) ===== */
                .playing-mode {
                    left: 10% !important;
                    animation: none !important;
                    transition: left 0.8s ease-out;
                }
                .playing-mode .cat-image {
                    animation: catWaddle 0.4s ease-in-out infinite alternate !important;
                }
                .playing-mode .cat-direction {
                    transform: scaleX(-1) !important;
                    animation: none !important;
                }

                /* ===== ANGRY ===== */
                .angry .cat-image {
                    animation: angryShake 0.15s infinite !important;
                    filter: saturate(1.3);
                }

                /* ===== KEYFRAMES ===== */
                @keyframes catWalkPath {
                    0%, 100% { left: 5%; }
                    25% { left: 65%; }
                    50% { left: 65%; }
                    75% { left: 5%; }
                }


                @keyframes catFlipDirection {
                    0%, 50% { transform: scaleX(1); }
                    50.01%, 100% { transform: scaleX(-1); }
                }

                @keyframes catWaddle {
                    0% { transform: rotate(-2deg) translateY(0); }
                    100% { transform: rotate(2deg) translateY(-2px); }
                }

                @keyframes shadowPulse {
                    0% { opacity: 0.15; transform: translateX(-50%) scale(1); }
                    100% { opacity: 0.1; transform: translateX(-50%) scale(0.9); }
                }

                @keyframes angryShake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-2px) rotate(-2deg); }
                    75% { transform: translateX(2px) rotate(2deg); }
                }

                @keyframes yarnBounce {
                    0% { transform: translateY(0) scale(1); }
                    40% { transform: translateY(-15px) scale(1.1); }
                    100% { transform: translateY(0) scale(1); }
                }

                @keyframes bounce-in {
                    0% { opacity: 0; transform: translateX(-50%) scale(0.5); }
                    50% { opacity: 1; transform: translateX(-50%) scale(1.1); }
                    100% { opacity: 1; transform: translateX(-50%) scale(1); }
                }
                .animate-bounce-in {
                    animation: bounce-in 0.3s ease-out forwards;
                }

                /* Reduced motion preference */
                @media (prefers-reduced-motion: reduce) {
                    .walking-mode,
                    .walking-mode .cat-direction,
                    .walking-mode .cat-image,
                    .walking-mode .cat-shadow {
                        animation: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default React.memo(PetSmartWalk);
