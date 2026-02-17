
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PortfolioItem } from '../types';

interface HeroSectionProps {
  portfolios: PortfolioItem[];
  onItemClick: (id: string) => void;
}

interface WobbleState {
  rx: number;   // 현재 rotateX (도)
  ry: number;   // 현재 rotateY (도)
  trx: number;  // 목표 rotateX
  try: number;  // 목표 rotateY
}

const HeroSection: React.FC<HeroSectionProps> = ({ portfolios, onItemClick }) => {
  const [progress, setProgress] = useState(0.5);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0.5); // Use a ref for the animation loop to avoid stale closure issues
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const wobbleMap = useRef<Map<string, WobbleState>>(new Map());

  // Pre-calculate random rotations
  const rotations = useMemo(() => {
    return Array.from({ length: 100 }).map(() => (Math.random() * 80 - 40));
  }, []);

  // Sync ref with state for event handlers, but use ref for the smooth loop
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // 포트폴리오 변경 시 wobbleMap 초기화
  useEffect(() => {
    portfolios.forEach((p) => {
      if (!wobbleMap.current.has(p.id)) {
        wobbleMap.current.set(p.id, { rx: 0, ry: 0, trx: 0, try: 0 });
      }
    });
  }, [portfolios]);

  // Automatic smooth drift animation loop
  useEffect(() => {
    let animationFrameId: number;
    
    const animate = () => {
      // Small constant increment for "alive" feel
      const nextProgress = progressRef.current + 0.00015;
      progressRef.current = nextProgress;
      setProgress(nextProgress);

      // 각 카드 워블 스프링 보간
      const SPRING = 0.12;
      wobbleMap.current.forEach((state, id) => {
        state.rx += (state.trx - state.rx) * SPRING;
        state.ry += (state.try - state.ry) * SPRING;

        const el = cardRefs.current.get(id);
        if (el) {
          el.style.transform = `perspective(500px) rotateX(${state.rx.toFixed(2)}deg) rotateY(${state.ry.toFixed(2)}deg)`;
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY;
      const nextProgress = progressRef.current + delta * 0.0003;
      progressRef.current = nextProgress;
      setProgress(nextProgress);
    };

    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touchY = e.touches[0].clientY;
      const delta = touchStartY - touchY;
      touchStartY = touchY;
      const nextProgress = progressRef.current + delta * 0.001;
      progressRef.current = nextProgress;
      setProgress(nextProgress);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
      }
    };
  }, []);

  // 틸트 계산 헬퍼 함수
  const MAX_ANGLE = 22; // 최대 기울기 각도 (도)

  const handleCardTilt = (id: string, clientX: number, clientY: number, el: Element) => {
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (clientX - cx) / (rect.width / 2);   // -1 ~ +1
    const dy = (clientY - cy) / (rect.height / 2);  // -1 ~ +1

    const state = wobbleMap.current.get(id);
    if (state) {
      state.trx = -dy * MAX_ANGLE;
      state.try = dx * MAX_ANGLE;
    }
  };

  const resetCardTilt = (id: string) => {
    const state = wobbleMap.current.get(id);
    if (state) {
      state.trx = 0;
      state.try = 0;
    }
  };

  const getPosition = (index: number, total: number, currentProgress: number) => {
    const pathSpan = 8; 
    const itemSpacing = 0.35; 
    const t = (index * itemSpacing) - (currentProgress * pathSpan) + 2.5;
    
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const centerX = vw / 2;
    const centerY = vh / 2;

    const scaleX = vw * 0.45;
    const scaleY = vh * 0.4;
    
    // Parametric Ribbon Path
    const x = centerX + scaleX * Math.sin(t * 0.8);
    const y = centerY + scaleY * Math.sin(t * 1.6) * Math.cos(t * 0.4) + (vh * 0.1);

    const baseSize = vw < 768 ? 60 : 95;
    const scaleMultiplier = 0.8 + Math.sin(t * 0.8) * 0.2;
    
    // Opacity fades at the edges of the parametric cycle
    const opacity = Math.min(1, Math.max(0, 1.8 - Math.abs(Math.sin(t * 0.4)) * 2));
    const zIndex = Math.round((2 - Math.abs(Math.sin(t * 0.4))) * 100);

    return { x, y, scaleMultiplier, zIndex, opacity, baseSize };
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-white overflow-hidden select-none cursor-grab active:cursor-grabbing"
    >
      {/* Central Typography */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        <span className="text-[#666] font-normal tracking-[0.02em] text-[11px] md:text-[13px] mb-[-4px] font-mono">Graphic design</span>
        <h1 className="text-[16vw] md:text-[11vw] font-normal leading-none text-black tracking-tighter">
          Portfolio
        </h1>
      </div>

      {/* Interactive Gallery Layer */}
      <div className="absolute inset-0">
        {portfolios.map((item, idx) => {
          const { x, y, scaleMultiplier, zIndex, opacity, baseSize } = getPosition(idx, portfolios.length, progress);
          
          if (opacity <= 0.01) return null;

          const thumbSrc = item.images && item.images.length > 0 ? item.images[0] : `https://picsum.photos/seed/${idx + 200}/300/300`;
          const rotation = rotations[idx % rotations.length];

          return (
            <div
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className="absolute pointer-events-auto cursor-pointer group"
              style={{
                left: 0,
                top: 0,
                // Using translate3d for GPU acceleration and removing transition classes
                // translate(-50%, -50%) centers the item on the calculated x,y
                transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scaleMultiplier}) rotate(${rotation}deg)`,
                zIndex: zIndex,
                opacity: opacity,
                willChange: 'transform, opacity',
              }}
              // 마우스 (데스크탑)
              onMouseMove={(e) => handleCardTilt(item.id, e.clientX, e.clientY, e.currentTarget)}
              onMouseLeave={() => resetCardTilt(item.id)}
              // 터치 (모바일)
              onTouchStart={(e) => {
                const t = e.touches[0];
                handleCardTilt(item.id, t.clientX, t.clientY, e.currentTarget);
              }}
              onTouchMove={(e) => {
                const t = e.touches[0];
                handleCardTilt(item.id, t.clientX, t.clientY, e.currentTarget);
              }}
              onTouchEnd={() => resetCardTilt(item.id)}
              onTouchCancel={() => resetCardTilt(item.id)}
            >
              <div
                ref={(el) => {
                  if (el) cardRefs.current.set(item.id, el);
                  else cardRefs.current.delete(item.id);
                }}
                className="relative bg-white shadow-sm overflow-hidden transition-shadow duration-300 group-hover:shadow-2xl"
                style={{ width: `${baseSize}px`, height: `${baseSize}px` }}
              >
                <img 
                  src={thumbSrc} 
                  alt={item.title} 
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="bg-white/95 backdrop-blur-sm px-2 py-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <p className="text-[8px] font-black uppercase tracking-tighter text-black truncate max-w-[65px]">
                      {item.title}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual scroll hint */}
      <div className="absolute bottom-10 left-10 flex items-center gap-4 text-gray-200 opacity-40 pointer-events-none">
         <span className="text-[8px] font-bold tracking-[0.5em] uppercase vertical-text">DRAG OR SCROLL</span>
      </div>
    </div>
  );
};

export default HeroSection;
