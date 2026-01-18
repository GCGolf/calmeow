import React from 'react';

const MovingBackground: React.FC = () => {
    return (
        <div className="fixed inset-0 -z-50 overflow-hidden bg-[#FAF8F6]">
            {/* CSS for Seamless Infinite Scroll */}
            <style>{`
                @keyframes slide-diagonal {
                    0% { background-position: 0px 0px; }
                    100% { background-position: 300px 300px; } /* Must match background-size */
                }
                
                .pattern-layer {
                    position: absolute;
                    inset: 0;
                    /* The Cat Pattern */
                    background-image: url('/cat-pattern-bg.png'); 
                    background-size: 300px; /* Size of one tile */
                    background-repeat: repeat;
                    opacity: 0.15; /* Increased from 0.08 for better visibility */
                    
                    /* The Animation */
                    animation: slide-diagonal 60s linear infinite;
                    will-change: background-position;
                }
            `}</style>

            {/* Layer 1: Main Cat Pattern (Moving) - Single Layer Only */}
            <div className="pattern-layer" />

            {/* Content Overlay Gradient (to ensure text readability) */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/10 to-transparent pointer-events-none" />
        </div>
    );
};

export default React.memo(MovingBackground);
