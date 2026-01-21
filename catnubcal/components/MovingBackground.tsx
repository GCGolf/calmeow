import React, { useEffect, useState } from 'react';

const MovingBackground: React.FC = () => {
    const [isMobile, setIsMobile] = useState(false);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        // Detect mobile device
        const checkMobile = () => {
            const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmallScreen = window.innerWidth <= 768;
            setIsMobile(isTouchDevice || isSmallScreen);
        };

        // Detect prefers-reduced-motion
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(motionQuery.matches);

        const handleMotionChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
        motionQuery.addEventListener('change', handleMotionChange);

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
            motionQuery.removeEventListener('change', handleMotionChange);
        };
    }, []);

    // Disable animation on mobile or if user prefers reduced motion
    const shouldAnimate = !isMobile && !prefersReducedMotion;

    return (
        <div className="fixed inset-0 -z-50 overflow-hidden bg-[#FAF8F6]">
            {/* CSS for Seamless Infinite Scroll - Only on Desktop */}
            <style>{`
                @keyframes slide-diagonal {
                    0% { background-position: 0px 0px; }
                    100% { background-position: 300px 300px; }
                }
                
                .pattern-layer {
                    position: absolute;
                    inset: 0;
                    background-image: url('/cat-pattern-bg.png'); 
                    background-size: 300px;
                    background-repeat: repeat;
                    opacity: 0.15;
                }
                
                .pattern-layer.animated {
                    animation: slide-diagonal 60s linear infinite;
                    will-change: background-position;
                }
                
                .pattern-layer.static {
                    /* No animation - static background for mobile */
                }
            `}</style>

            {/* Layer 1: Main Cat Pattern */}
            <div className={`pattern-layer ${shouldAnimate ? 'animated' : 'static'}`} />

            {/* Content Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/10 to-transparent pointer-events-none" />
        </div>
    );
};

export default React.memo(MovingBackground);

