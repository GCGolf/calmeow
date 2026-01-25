import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';

interface PetSmartWalkProps {
    onReset?: () => void;
    currentCalories: number;
    goalCalories: number;
    streak?: number; // [NEW] Streak count for rewards
    feedTrigger?: number; // [NEW] Increment to trigger feeding animation
}

const CAT_MESSAGES = [
    "เจ้านายจ๋า... วันนี้กินข้าวยังเมี๊ยว? 🍣",
    "อย่าลืมดื่มน้ำนะเมี๊ยว! 💧",
    "วันนี้กินโปรตีนถึงเป้าไหมเมี๊ยว? 🍗",
    "สู้ๆ น้าา เป็นกำลังใจให้..เมี๊ยว! ✌️",
    "ขยับตัวบ่อยๆ ร่างกายแข็งแรงนะ! 🐾",
    "อยากกินปลาทู...เมี๊ยวว 🐟",
    "ดูแลตัวเองด้วยนะ รักเจ้านายที่สุด! 🥰",
    "วันนี้ทำได้ดีมากเก่งสุดๆ! 🌟",
    "พักผ่อนบ้าง..เป็นห่วงนะเมี๊ยว 🛌",
    "ลดน้ำตาลหน่อยนะเพื่อสุขภาพที่ดี 🍬",
    "กินผักเยอะๆ นะเมี๊ยว 🥦",
    "รักนะ เมี๊ยวๆ จุ๊บๆ ❤️",
    "ถ้าเหนื่อยก็พัก..มาเล่นกันเมี๊ยว 😺"
];

const PetSmartWalk: React.FC<PetSmartWalkProps> = ({ onReset, currentCalories, goalCalories, streak = 0, feedTrigger = 0 }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const directionWrapperRef = useRef<HTMLDivElement>(null);
    const animTargetRef = useRef<HTMLDivElement>(null);
    const bubbleRef = useRef<HTMLDivElement>(null);
    const [customImage, setCustomImage] = useState<string | null>(null);
    const isAnimating = useRef(false);

    // Interaction State
    const [clickCount, setClickCount] = useState(0);
    const [interactionMessage, setInteractionMessage] = useState<string | null>(null);
    const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

    const [isFeeding, setIsFeeding] = useState(false); // [NEW] Feeding state
    const [yarnClickCount, setYarnClickCount] = useState(0); // [NEW] Yarn interaction count

    // Check if goal is reached (and goal is valid > 0)
    const isGoalReached = goalCalories > 0 && currentCalories >= goalCalories;

    // [NEW] Handle Feeding Trigger
    useEffect(() => {
        if (feedTrigger > 0) {
            setIsFeeding(true);
            // Trigger happy cat reaction after food arrives
            setTimeout(() => {
                setIsFeeding(false);
                if (animTargetRef.current) {
                    animTargetRef.current.classList.add('eating-anim');
                    setTimeout(() => animTargetRef.current?.classList.remove('eating-anim'), 1000);
                }
                sit("ง่ำๆ อร่อยจัง! 😋", 2);
            }, 800);
        }
    }, [feedTrigger]);

    // Load saved image on mount
    useEffect(() => {
        const savedImage = localStorage.getItem('pet_custom_image');
        if (savedImage) setCustomImage(savedImage);
    }, []);

    // Determine which image to show
    const displayImageSrc = isGoalReached
        ? "https://res.cloudinary.com/dtezruttf/image/upload/v1768657539/Gemini_Generated_Image_omgl4nomgl4nomgl_1_xpx7ra.png"
        : (customImage || "https://res.cloudinary.com/dtezruttf/image/upload/v1768654043/11565122_x40zof.png");

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const walkTo = async (leftPosition: string, durationSec: number) => {
        if (!containerRef.current || !animTargetRef.current) return;

        const parent = containerRef.current.parentElement;
        if (!parent) return;

        const parentWidth = parent.clientWidth;
        const elementWidth = containerRef.current.clientWidth;

        // Parse percentage (e.g., '80%')
        const percentage = parseFloat(leftPosition) / 100;
        const targetPixel = (parentWidth * percentage) - (elementWidth / 2);

        animTargetRef.current.classList.remove('sitting-pose');
        animTargetRef.current.classList.add('walking-anim');

        // Use Transform instead of Left for GPU acceleration
        containerRef.current.style.transition = `transform ${durationSec}s linear`;
        containerRef.current.style.left = '0px'; // Ensure we are in absolute coordinate mode

        await new Promise<void>(resolve => {
            requestAnimationFrame(() => {
                if (containerRef.current) {
                    containerRef.current.style.transform = `translateX(${targetPixel}px)`;
                }
                resolve();
            });
        });

        await wait(durationSec * 1000);

        if (animTargetRef.current) {
            animTargetRef.current.classList.remove('walking-anim');
        }
    };

    const sit = async (text: string, durationSec: number) => {
        if (!animTargetRef.current || !bubbleRef.current) return;

        animTargetRef.current.classList.add('sitting-pose');

        if (text) {
            bubbleRef.current.innerText = text;
            await wait(300);
            bubbleRef.current.classList.add('show-bubble');
        }

        await wait(durationSec * 1000);

        if (bubbleRef.current) {
            bubbleRef.current.classList.remove('show-bubble');
        }
        await wait(300);
    };

    const runSequence = async () => {
        if (isGoalReached) return;

        if (isAnimating.current || !containerRef.current || !directionWrapperRef.current) return;
        isAnimating.current = true;

        while (isAnimating.current) {
            if (isGoalReached) break;
            if (!directionWrapperRef.current) break;

            // --- Phase 1: Walk to Right Side (80%) ---
            directionWrapperRef.current.style.transform = 'scaleX(1)';
            await walkTo('80%', 4);

            if (!isAnimating.current || isGoalReached) break;
            const msg1 = CAT_MESSAGES[Math.floor(Math.random() * CAT_MESSAGES.length)];
            await sit(msg1, 3);

            if (!isAnimating.current || isGoalReached) break;
            // --- Phase 2: Walk to Left Side (20%) ---
            directionWrapperRef.current.style.transform = 'scaleX(-1)';
            await wait(600);

            if (!isAnimating.current || isGoalReached) break;
            await walkTo('20%', 5);

            if (!isAnimating.current || isGoalReached) break;
            const msg2 = CAT_MESSAGES[Math.floor(Math.random() * CAT_MESSAGES.length)];
            await sit(msg2, 3);

            // --- Phase 3: Walk to Center (50%) ---
            directionWrapperRef.current.style.transform = 'scaleX(1)';
            await wait(600);
            await walkTo('50%', 3);
            const msg3 = CAT_MESSAGES[Math.floor(Math.random() * CAT_MESSAGES.length)];
            await sit(msg3, 3);
        }
    };

    const resetAndStart = () => {
        isAnimating.current = false;

        setTimeout(() => {
            if (animTargetRef.current) animTargetRef.current.classList.remove('sitting-pose', 'walking-anim', 'goal-pose', 'angry-anim');
            if (bubbleRef.current) bubbleRef.current.classList.remove('show-bubble');

            if (containerRef.current) {
                containerRef.current.style.transition = 'none';
                containerRef.current.style.left = '0px'; // Switch to absolute pixel mode
                // Reset to Center
                const parent = containerRef.current.parentElement;
                if (parent) {
                    const centerPixel = (parent.clientWidth * 0.5) - (containerRef.current.clientWidth / 2);
                    containerRef.current.style.transform = `translateX(${centerPixel}px)`;
                }
            }
            if (directionWrapperRef.current) directionWrapperRef.current.style.transform = 'scaleX(1)';

            if (isGoalReached) {
                // Goal reached logic handles position via CSS/State mainly, but ensure centered
                if (animTargetRef.current) animTargetRef.current.classList.add('goal-pose');
                if (bubbleRef.current) {
                    bubbleRef.current.innerText = "วันนี้อิ่มแล้วเหมียว ❤️";
                    bubbleRef.current.classList.add('show-bubble');
                }
            } else {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        runSequence();
                    }, 100);
                });
            }
        }, 100);

        if (onReset) onReset();
    };

    const handleYarnClick = async (e: React.MouseEvent) => {
        // Bounce Animation
        const target = e.currentTarget as HTMLDivElement;
        target.classList.add('animate-jump');
        setTimeout(() => target.classList.remove('animate-jump'), 400);

        e.stopPropagation();
        isAnimating.current = false; // Stop background loop

        setYarnClickCount(prev => prev + 1);
        const newCount = yarnClickCount + 1;
        const isAngry = newCount >= 5;

        // Reset Timer
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => {
            setYarnClickCount(0);
            if (animTargetRef.current) animTargetRef.current.classList.remove('angry-anim');
            resetAndStart();
        }, 4000);

        // Face Left & Walk to Yarn
        if (directionWrapperRef.current) directionWrapperRef.current.style.transform = 'scaleX(-1)';

        // Walk to Yarn (Left side)
        await walkTo('15%', 0.8);

        // React
        const msg = isAngry ? "แง๊งงง! 💢" : "เมี๊ยววว 🧶";
        if (isAngry && animTargetRef.current) {
            animTargetRef.current.classList.add('angry-anim');
        }
        await sit(msg, 2);
    };

    const handleCatClick = () => {
        setClickCount(prev => prev + 1);
        const newCount = clickCount + 1;
        const isAngry = newCount > 5;

        // Reset timer
        if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
        resetTimerRef.current = setTimeout(() => {
            setClickCount(0);
            setInteractionMessage(null);
            if (animTargetRef.current) animTargetRef.current.classList.remove('angry-anim');
        }, 2000);

        // Set Message
        setInteractionMessage(isAngry ? "แง่งงง! 😾💢" : "เมี๊ยว เมี๊ยว 😸✨");

        // Trigger Angry Animation
        if (isAngry && animTargetRef.current) {
            animTargetRef.current.classList.add('angry-anim');
        }
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setCustomImage(result);
                localStorage.setItem('pet_custom_image', result);
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        isAnimating.current = false;
        const timer = setTimeout(() => {
            resetAndStart();
        }, 500);

        return () => {
            isAnimating.current = false;
            clearTimeout(timer);
        };
    }, [isGoalReached]);

    return (
        <div className="relative w-full h-48 mt-10 mb-6 group select-none">
            {/* Background Pattern */}
            {/* Background Pattern or Cafe BG */}
            <div className={`absolute inset-0 pointer-events-none transition-all duration-500 ${streak >= 45 ? 'opacity-100' : 'opacity-20'}`}
                style={{
                    backgroundImage: streak >= 45
                        ? `url('/cat_cafe_bg.png')`
                        : 'linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px)',
                    backgroundSize: streak >= 45 ? 'cover' : '40px 40px',
                    backgroundPosition: 'center bottom'
                }}
            />

            {/* The Rug - Reduced Opacity to /40 (Hide if Cafe BG active) */}
            {streak < 45 && (
                <div className="absolute bottom-0 w-full h-1/4 bg-[#D2B48C]/40 rounded-t-[2rem] shadow-sm transform translate-y-2 pointer-events-none"
                    style={{
                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.2) 10px, rgba(255,255,255,0.2) 20px)'
                    }}>
                    {/* Soft Fringe */}
                    <div className="absolute -top-1 left-0 w-full h-2 opacity-20"
                        style={{
                            background: 'linear-gradient(90deg, transparent 5px, rgba(0,0,0,0.1) 5px) repeat-x',
                            backgroundSize: '10px 100%'
                        }}
                    />
                </div>
            )}

            {/* Controls */}
            <div className="absolute top-0 right-0 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <button onClick={resetAndStart} className="p-1.5 bg-white/80 hover:bg-white rounded-full text-slate-400 hover:text-slate-600 transition-colors shadow-sm">
                    <RefreshCw size={14} />
                </button>
                {!isGoalReached && (
                    <label className="p-1.5 bg-white/80 hover:bg-white rounded-full cursor-pointer text-slate-400 hover:text-slate-600 transition-colors shadow-sm">
                        <Camera size={14} />
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                )}
            </div>

            {/* Cat Container */}
            <div
                ref={containerRef}
                id="cat-container"
                className="absolute bottom-2 w-32 md:w-36 z-50 flex justify-center items-end cursor-pointer"
                style={{
                    willChange: 'transform',
                    left: '50%', // Initial center
                    transform: 'translateX(-50%)' // Initial center
                }}
                onClick={handleCatClick}
            >
                {/* Interaction Bubble (Overrides walking bubble) */}
                {interactionMessage ? (
                    <div
                        key="interaction-bubble"
                        className={`absolute -top-[6.5rem] left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-[1.5rem] font-bold whitespace-nowrap z-50 shadow-[0_8px_20px_rgba(0,0,0,0.05)] text-sm pointer-events-none animate-in fade-in zoom-in duration-200 ${clickCount > 5 ? 'bg-red-500 text-white border border-red-600' : 'bg-white text-slate-700 border border-orange-100'}`}
                    >
                        {interactionMessage}
                        <div className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] drop-shadow-sm ${clickCount > 5 ? 'border-t-red-500' : 'border-t-white'}`}></div>
                    </div>
                ) : (
                    /* Default Logic Bubble */
                    <div
                        key="walking-bubble"
                        ref={bubbleRef}
                        className="absolute -top-[6.5rem] left-1/2 -translate-x-1/2 bg-white px-4 py-2.5 rounded-[1.5rem] border border-orange-100 font-bold whitespace-nowrap opacity-0 transition-all duration-300 z-50 shadow-[0_8px_20px_rgba(0,0,0,0.05)] text-sm text-slate-700 pointer-events-none"
                        style={{ transform: 'translateX(-50%) scale(0)' }}
                    >
                        ...
                        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-white drop-shadow-sm"></div>
                    </div>
                )}

                <div ref={directionWrapperRef} className="w-full h-full flex justify-center items-end transition-transform duration-500 will-change-transform">
                    <div ref={animTargetRef} className="w-full h-full flex justify-center items-end relative transition-all duration-500">
                        {/* Shadow */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[60%] h-3 bg-black/5 blur-sm rounded-full z-0 transition-all duration-300 fake-shadow"></div>

                        {/* Cat Image - Optimized */}
                        <img
                            src={displayImageSrc}
                            alt="My Cat"
                            loading="lazy"
                            decoding="async"
                            className="w-full h-auto relative z-10 origin-bottom transition-transform duration-300 drop-shadow-sm select-none"
                        />

                        {/* [NEW] Second Cat (Streak 30+) - Follower */}
                        {streak >= 30 && (
                            <img
                                src="/cat2.png"
                                alt="Friend Cat"
                                loading="lazy"
                                className="absolute -left-8 bottom-0 w-full h-auto z-0 origin-bottom transition-transform duration-300 drop-shadow-sm select-none filter brightness-95"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* [NEW] Feeding Animation - Flying Food */}
            {isFeeding && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-2xl animate-feed z-[60] pointer-events-none">
                    🐟
                </div>
            )}

            {streak >= 7 && (
                <div
                    onClick={handleYarnClick}
                    className="absolute bottom-0 left-[2%] w-10 h-10 opacity-90 drop-shadow-sm select-none pointer-events-auto cursor-pointer z-[70] hover:scale-110 transition-transform active:scale-95"
                    title="รางวัลต่อเนื่อง 7 วัน (จิ้มเล่นได้เลย!)"
                >
                    <span className="text-3xl filter brightness-110">🧶</span>
                </div>
            )}
            {streak >= 14 && (
                <div className="absolute bottom-0 right-[2%] w-12 h-12 opacity-90 drop-shadow-sm select-none pointer-events-none z-10" title="Streak 14+ Days Reward">
                    <span className="text-4xl filter brightness-110">📦</span>
                </div>
            )}

            {/* Global Styles - Optimized for Mobile */}
            <style>{`
                /* Respect user preference for reduced motion */
                @media (prefers-reduced-motion: reduce) {
                    .walking-anim img,
                    .walking-anim .fake-shadow,
                    .angry-anim img {
                        animation: none !important;
                    }
                }
                
                .walking-anim img {
                    animation: walkWaddle 0.8s infinite alternate ease-in-out; /* Slowed from 0.5s */
                }
                .walking-anim .fake-shadow {
                    animation: shadowPulse 0.8s infinite alternate ease-in-out; /* Slowed from 0.5s */
                }
                .sitting-pose img {
                    transform: scaleY(0.9) translateY(4px);
                }
                .sitting-pose .fake-shadow {
                    transform: translateX(-50%) scale(1.1);
                    opacity: 0.5;
                }
                /* Goal Pose - Bigger Scale (1.2x) and Lifted Up */
                .goal-pose img {
                    transform: scale(1.2) translateY(-6px);
                }
                .goal-pose .fake-shadow {
                    transform: translateX(-50%) scale(1.2);
                    opacity: 0.5;
                }
                .show-bubble {
                    transform: translateX(-50%) scale(1) !important;
                    opacity: 1 !important;
                }
                .angry-anim img {
                    animation: angryShake 0.25s infinite ease-in-out; /* Slowed from 0.15s */
                    filter: saturate(1.5) contrast(1.2);
                }

                @keyframes walkWaddle {
                    0% { transform: translateY(0) rotate(-2deg) scaleY(1); } /* Reduced rotation */
                    100% { transform: translateY(-2px) rotate(2deg) scaleY(0.99); }
                }
                @keyframes shadowPulse {
                    0% { transform: translateX(-50%) scale(1); opacity: 0.15; }
                    100% { transform: translateX(-50%) scale(0.9); opacity: 0.1; }
                }
                @keyframes angryShake {
                    0% { transform: translateX(0) rotate(0deg); }
                    25% { transform: translateX(-1px) rotate(-3deg); } /* Reduced intensity */
                    75% { transform: translateX(1px) rotate(3deg); }
                    100% { transform: translateX(0) rotate(0deg); }
                }

                /* [NEW] Feeding Animations */
                @keyframes feedFly {
                    0% { transform: translate(-50%, -100px) scale(0.5); opacity: 0; }
                    50% { opacity: 1; }
                    100% { transform: translate(-50%, 40px) scale(1); opacity: 0; }
                }
                .animate-feed {
                    animation: feedFly 0.8s ease-in forwards;
                }
                .eating-anim img {
                    animation: angryShake 0.3s infinite ease-in-out; /* Reuse shake for chewing */
                }

                /* Click Feedback Animation */
                @keyframes jumpBounce {
                    0% { transform: translateY(0) scale(1); }
                    40% { transform: translateY(-10px) scale(1.1); } /* Jump Up */
                    100% { transform: translateY(0) scale(1); }
                }
                .animate-jump {
                    animation: jumpBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
            `}</style>
        </div>
    );
};

export default React.memo(PetSmartWalk);
