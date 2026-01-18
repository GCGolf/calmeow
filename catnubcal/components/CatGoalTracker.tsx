import React, { useState, useRef } from 'react';

interface CatGoalTrackerProps {
    currentDay: number;
    targetDay?: number;
    goalDate?: string; // e.g., "15 Jan"
    goalLabel?: string;
}

const CatGoalTracker: React.FC<CatGoalTrackerProps> = ({
    currentDay,
    targetDay = 7,
    goalDate = "เป้าหมาย",
    goalLabel = "ไปถึงกันเถอะ!"
}) => {
    const [isInteracted, setIsInteracted] = useState(false);
    const [clickCount, setClickCount] = useState(0);
    const resetTimerRef = useRef<NodeJS.Timeout | null>(null);

    const progress = Math.min(currentDay / targetDay, 1);
    const progressPercent = progress * 100;

    // Limit checkpoints to max 7-10, evenly distributed
    const maxCheckpoints = Math.min(targetDay, 7);
    const checkpointInterval = targetDay > maxCheckpoints ? Math.floor(targetDay / (maxCheckpoints - 1)) : 1;

    // Generate checkpoint positions (evenly distributed)
    const checkpoints = [];
    for (let i = 0; i < maxCheckpoints; i++) {
        const dayNumber = i === 0 ? 1 : i === maxCheckpoints - 1 ? targetDay : Math.round(1 + i * (targetDay - 1) / (maxCheckpoints - 1));
        const position = (i / (maxCheckpoints - 1)) * 100;
        checkpoints.push({
            position,
            day: dayNumber,
            isPassed: dayNumber <= currentDay,
            isCurrent: dayNumber === currentDay,
            isFirst: i === 0,
            isLast: i === maxCheckpoints - 1
        });
    }

    const handleCatClick = () => {
        setIsInteracted(true);
        setClickCount(prev => prev + 1);

        // Reset timer on every click to count consecutive clicks
        if (resetTimerRef.current) {
            clearTimeout(resetTimerRef.current);
        }

        resetTimerRef.current = setTimeout(() => {
            setClickCount(0);
            setIsInteracted(false);
        }, 2000);
    };

    const isAngry = clickCount > 5;

    return (
        <div className="bg-white p-6 rounded-[3rem] border border-[#F1EFE9] shadow-[0_10px_40px_rgba(0,0,0,0.03)] mb-6">
            {/* Inject Keyframes */}
            <style>{`
                @keyframes catWiggle {
                    0%, 100% { transform: translateX(-50%) rotate(-5deg); }
                    50% { transform: translateX(-50%) rotate(5deg); }
                }
                @keyframes catAngryShake {
                    0%, 100% { transform: translateX(-50%) rotate(0deg); }
                    25% { transform: translateX(-52%) rotate(-5deg); }
                    75% { transform: translateX(-48%) rotate(5deg); }
                }
                @keyframes catBounce {
                    0%, 100% { transform: translateX(-50%) translateY(0) rotate(-3deg); }
                    25% { transform: translateX(-50%) translateY(-2px) rotate(3deg); }
                    50% { transform: translateX(-50%) translateY(0) rotate(-3deg); }
                    75% { transform: translateX(-50%) translateY(-1px) rotate(2deg); }
                }
                @keyframes pathDraw {
                    from { stroke-dashoffset: 100; }
                    to { stroke-dashoffset: 0; }
                }
                @keyframes pawPopup {
                    0% { transform: scale(0) rotate(-45deg); opacity: 0; }
                    50% { transform: scale(1.2) rotate(0deg); opacity: 1; }
                    100% { transform: scale(1) rotate(0deg); opacity: 0; }
                }
                @keyframes messageFloat {
                    0% { transform: translateY(10px); opacity: 0; }
                    20% { transform: translateY(0); opacity: 1; }
                    80% { transform: translateY(0); opacity: 1; }
                    100% { transform: translateY(-10px); opacity: 0; }
                }
                .cat-wiggle {
                    animation: catBounce 0.8s ease-in-out infinite;
                }
                .cat-angry {
                    animation: catAngryShake 0.2s ease-in-out infinite;
                }
                .progress-bar-animate {
                    transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .paw-effect {
                    animation: pawPopup 0.5s ease-out forwards;
                }
                .message-effect {
                    animation: messageFloat 2s ease-out forwards;
                }
            `}</style>

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-black text-slate-800">เดินทางสู่เป้าหมาย</h3>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">GOAL JOURNEY</p>
                </div>
                <div className="bg-gradient-to-br from-[#E88D67] to-[#F3BD7E] px-4 py-2 rounded-full">
                    <span className="text-xs font-black text-white">{goalDate}</span>
                </div>
            </div>

            {/* Progress Track */}
            <div className="relative h-20 flex items-center">
                {/* Background Track */}
                <div className="absolute left-0 right-0 h-3 bg-[#FAF8F6] rounded-full border border-[#F1EFE9]" />

                {/* Progress Fill */}
                <div
                    className="absolute left-0 h-3 bg-gradient-to-r from-[#E88D67] to-[#F3BD7E] rounded-full progress-bar-animate shadow-lg shadow-orange-200/50"
                    style={{ width: `${progressPercent}%` }}
                />

                {/* Checkpoints */}
                {checkpoints.map((cp, idx) => (
                    <div
                        key={idx}
                        className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center"
                        style={{ left: `${cp.position}%`, transform: `translateX(-50%) translateY(-50%)` }}
                    >
                        {/* Dot */}
                        <div className={`w-4 h-4 rounded-full border-2 transition-all duration-500 ${cp.isPassed
                            ? 'bg-[#E88D67] border-[#E88D67] scale-110'
                            : 'bg-white border-[#E1DDD5]'
                            }`}>
                            {cp.isPassed && (
                                <svg className="w-full h-full text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                        {/* Day Label */}
                        <span className={`absolute -bottom-6 text-[9px] font-bold ${cp.isPassed ? 'text-[#E88D67]' : 'text-slate-300'}`}>
                            {cp.isFirst ? 'START' : cp.isLast ? 'GOAL' : `D${cp.day}`}
                        </span>
                    </div>
                ))}

                {/* Cat Head (The Hero!) */}
                <div
                    className="absolute top-1/2 z-50 cursor-pointer group select-none"
                    style={{
                        left: `${progressPercent}%`,
                        marginTop: '-28px',
                        transform: 'translateX(-50%)', // Ensure centering logic matches, handling wiggle separately if needed
                        transition: 'left 1s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                    onClick={handleCatClick}
                >
                    <div className={`relative ${isAngry ? 'cat-angry' : 'cat-wiggle'}`}>
                        {/* Interaction Effects */}
                        {(isInteracted || isAngry) && (
                            <>
                                {/* Speech Bubble */}
                                {!isAngry && (
                                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap bg-white px-3 py-1.5 rounded-full shadow-lg border border-orange-100 message-effect z-20">
                                        <span className="text-xs font-bold text-slate-700">เมี๊ยว เมี๊ยว 😸✨</span>
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45 border-b border-r border-orange-100"></div>
                                    </div>
                                )}
                                {isAngry && (
                                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-500 px-3 py-1.5 rounded-full shadow-lg border border-red-600 message-effect z-20">
                                        <span className="text-xs font-bold text-white">แง่งงง! 😾💢</span>
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rotate-45 border-b border-r border-red-600"></div>
                                    </div>
                                )}

                                {/* Paw Print SVG (Only show when happy) */}
                                {!isAngry && (
                                    <div className="absolute -top-8 -right-8 paw-effect z-30 text-orange-400">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C13.1 2 14 2.9 14 4S13.1 6 12 6 10 5.1 10 4 10.9 2 12 2M12 22C9.24 22 7 19.76 7 17C7 16.15 7.27 15.38 7.71 14.73C7.23 15.17 6.64 15.5 6 15.5C4.34 15.5 3 14.16 3 12.5C3 10.84 4.34 9.5 6 9.5C7.66 9.5 9 10.84 9 12.5C9 12.78 8.95 13.04 8.86 13.29C9.57 12.42 10.66 11.77 11.91 11.75C11.94 11.75 11.97 11.75 12 11.75C12.03 11.75 12.06 11.75 12.09 11.75C13.34 11.77 14.43 12.42 15.14 13.29C15.05 13.04 15 12.78 15 12.5C15 10.84 16.34 9.5 18 9.5C19.66 9.5 21 10.84 21 12.5C21 14.16 19.66 15.5 18 15.5C17.36 15.5 16.77 15.17 16.29 14.73C16.73 15.38 17 16.15 17 17C17 19.76 14.76 22 12 22Z" />
                                        </svg>
                                    </div>
                                )}
                                {/* Angry Symbol (Show when angry) */}
                                {isAngry && (
                                    <div className="absolute -top-6 -right-6 message-effect z-30 text-red-500 text-xl font-bold">
                                        💢
                                    </div>
                                )}
                            </>
                        )}

                        {/* Cute Cat SVG */}
                        <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform active:scale-95">
                            {/* Ears */}
                            <path d="M20 45 L10 15 L35 30 Z" fill="#E88D67" />
                            <path d="M80 45 L90 15 L65 30 Z" fill="#E88D67" />
                            <path d="M22 42 L15 20 L32 32 Z" fill="#FFD4C4" />
                            <path d="M78 42 L85 20 L68 32 Z" fill="#FFD4C4" />

                            {/* Face */}
                            <ellipse cx="50" cy="55" rx="35" ry="32" fill="#E88D67" />

                            {/* Inner Face (Lighter) */}
                            <ellipse cx="50" cy="58" rx="28" ry="25" fill="#F3BD7E" />

                            {/* Eyes - Change based on state */}
                            {!isAngry ? (
                                <>
                                    <ellipse cx="38" cy="52" rx="6" ry="7" fill="#1A1C1E" />
                                    <ellipse cx="62" cy="52" rx="6" ry="7" fill="#1A1C1E" />
                                    <circle cx="40" cy="50" r="2" fill="white" />
                                    <circle cx="64" cy="50" r="2" fill="white" />
                                </>
                            ) : (
                                <>
                                    {/* Angry Eyes (Slanted) */}
                                    <path d="M32 48 L44 54" stroke="#1A1C1E" strokeWidth="3" strokeLinecap="round" />
                                    <path d="M68 48 L56 54" stroke="#1A1C1E" strokeWidth="3" strokeLinecap="round" />
                                    <circle cx="38" cy="54" r="3" fill="#1A1C1E" />
                                    <circle cx="62" cy="54" r="3" fill="#1A1C1E" />
                                </>
                            )}

                            {/* Nose */}
                            <ellipse cx="50" cy="62" rx="4" ry="3" fill="#E88D67" />

                            {/* Mouth - Change based on state */}
                            {!isAngry ? (
                                <>
                                    <path d="M50 65 Q45 72 40 68" stroke="#E88D67" strokeWidth="2" strokeLinecap="round" fill="none" />
                                    <path d="M50 65 Q55 72 60 68" stroke="#E88D67" strokeWidth="2" strokeLinecap="round" fill="none" />
                                </>
                            ) : (
                                <>
                                    {/* Angry Mouth (Frown/Open) */}
                                    <ellipse cx="50" cy="68" rx="6" ry="3" fill="#3E2723" />
                                    <path d="M50 65 L46 72 L54 72 Z" fill="white" /> {/* Fangs */}
                                </>
                            )}

                            {/* Whiskers */}
                            <line x1="15" y1="55" x2="30" y2="58" stroke="#E88D67" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="15" y1="62" x2="30" y2="62" stroke="#E88D67" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="70" y1="58" x2="85" y2="55" stroke="#E88D67" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="70" y1="62" x2="85" y2="62" stroke="#E88D67" strokeWidth="1.5" strokeLinecap="round" />

                            {/* Blush (Hide when angry) */}
                            {!isAngry && (
                                <>
                                    <ellipse cx="28" cy="62" rx="5" ry="3" fill="#FFB5A0" opacity="0.6" />
                                    <ellipse cx="72" cy="62" rx="5" ry="3" fill="#FFB5A0" opacity="0.6" />
                                </>
                            )}
                        </svg>
                    </div>

                </div>

                {/* Static Goal Flag at the end */}
                <div className="absolute -right-2 top-1/2 -translate-y-1/2 z-10">
                    <div className="flex flex-col items-center">
                        <span className="text-2xl transform -translate-y-4">🚩</span>
                    </div>
                </div>

            </div>

            {/* Footer Stats */}
            <div className="flex justify-between items-center mt-10 pt-4 border-t border-[#F1EFE9]">
                <div className="text-center">
                    <p className="text-2xl font-black text-[#E88D67]">{currentDay}</p>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-wider">วันที่ผ่านมา</p>
                </div>
                <div className="text-center px-4 py-2 bg-[#FAF8F6] rounded-full">
                    <p className="text-xs font-black text-slate-600">{goalLabel}</p>
                </div>
                <div className="text-center">
                    <p className="text-2xl font-black text-slate-800">{targetDay - currentDay}</p>
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-wider">วันที่เหลือ</p>
                </div>
            </div>
        </div>
    );
};

export default CatGoalTracker;
