
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PortfolioItem } from '../types';

interface HeroSectionProps {
  portfolios: PortfolioItem[];
  onItemClick: (id: string) => void;
}

interface RouteResult {
  x: number; y: number;
  opacity: number; zIndex: number;
  scaleMultiplier: number; baseSize: number;
}
type RouteFn = (t: number, vw: number, vh: number) => RouteResult;

// Version 1: 리본 (기존 경로)
const ROUTE_V1: RouteFn = (t, vw, vh) => {
  const baseSize = vw < 768 ? 60 : 95;
  const centerX = vw / 2;
  const centerY = vh / 2;
  const scaleX = vw * 0.45;
  const scaleY = vh * 0.4;

  const x = centerX + scaleX * Math.sin(t * 0.8);
  const y = centerY + scaleY * Math.sin(t * 1.6) * Math.cos(t * 0.4) + vh * 0.1;
  const scaleMultiplier = 0.8 + Math.sin(t * 0.8) * 0.2;
  const opacity = Math.min(1, Math.max(0, 1.8 - Math.abs(Math.sin(t * 0.4)) * 2));
  const zIndex = Math.round((2 - Math.abs(Math.sin(t * 0.4))) * 100);
  return { x, y, opacity, zIndex, scaleMultiplier, baseSize };
};

// Version 2: 아르키메데스 나선 (바깥 → 중앙 수렴)
const ROUTE_V2: RouteFn = (t, vw, vh) => {
  const baseSize = vw < 768 ? 60 : 95;
  const centerX = vw / 2;
  const centerY = vh / 2;

  const theta = t * 1.5;
  const SPIRAL_TURNS = 3;
  const SPIRAL_PERIOD = 2 * Math.PI * SPIRAL_TURNS;
  const phase = ((theta % SPIRAL_PERIOD) + SPIRAL_PERIOD) % SPIRAL_PERIOD;
  // 화면 대각선 기준으로 범위 대폭 확대 (화면 밖까지)
  const maxR = Math.sqrt(vw * vw + vh * vh) * 0.55;
  const minR = maxR * 0.06;
  // r 공식 반전: phase=0→r=minR(중앙), phase=SPIRAL_PERIOD→r=maxR(바깥)
  const r = minR + (maxR - minR) * (phase / SPIRAL_PERIOD);
  const x = centerX + r * Math.cos(theta);
  // * 0.65 제거 → 타원형에서 정원으로
  const y = centerY + r * Math.sin(theta);
  const normalizedPhase = phase / SPIRAL_PERIOD;  // 0(중앙) ~ 1(바깥)
  // 양끝 12% 구간에서만 페이드, 중간 76%는 완전 불투명
  const FADE_ZONE = 0.12;
  let opacity: number;
  if (normalizedPhase < FADE_ZONE) {
    opacity = normalizedPhase / FADE_ZONE;          // 중앙 소멸 직전
  } else if (normalizedPhase > 1 - FADE_ZONE) {
    opacity = (1 - normalizedPhase) / FADE_ZONE;    // 바깥 생성 직후
  } else {
    opacity = 1.0;                                  // 중간 구간 완전 불투명
  }
  const zIndex = Math.round(normalizedPhase * 100);
  const scaleMultiplier = 0.7 + normalizedPhase * 0.3;
  return { x, y, opacity, zIndex, scaleMultiplier, baseSize };
};

const ROUTES: RouteFn[] = [ROUTE_V1, ROUTE_V2];
const ROUTE_LABELS = ['RIBBON', 'SPIRAL'];

interface WobbleState {
  rx: number;   // 현재 rotateX (도)
  ry: number;   // 현재 rotateY (도)
  trx: number;  // 목표 rotateX
  try: number;  // 목표 rotateY
}

const HeroSection: React.FC<HeroSectionProps> = ({ portfolios, onItemClick }) => {
  const [progress, setProgress] = useState(0.5);
  const [routeVersion, setRouteVersion] = useState<number>(() => {
    const saved = localStorage.getItem('curvify_route_version');
    return saved ? parseInt(saved, 10) : 0;
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0.5); // Use a ref for the animation loop to avoid stale closure issues
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const wobbleMap = useRef<Map<string, WobbleState>>(new Map());
  const isTransitioningRef = useRef(false);

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

  const handleRouteToggle = () => {
    const next = (routeVersion + 1) % ROUTES.length;
    // 전환 시 0.5s 동안 CSS transition 활성화
    isTransitioningRef.current = true;
    setTimeout(() => { isTransitioningRef.current = false; }, 500);
    setRouteVersion(next);
    localStorage.setItem('curvify_route_version', String(next));
  };

  const getPosition = (index: number, _total: number, currentProgress: number) => {
    const pathSpan = 8;
    // V2에서만 간격을 넓혀서 카드들이 더 분산되도록
    const itemSpacing = routeVersion === 1 ? 0.6 : 0.35;
    const t = (index * itemSpacing) - (currentProgress * pathSpan) + 2.5;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return ROUTES[routeVersion](t, vw, vh);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-white overflow-hidden select-none cursor-grab active:cursor-grabbing"
    >
      {/* Central Typography */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-[9999]">
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
                transition: isTransitioningRef.current ? 'transform 0.5s ease-out, opacity 0.5s ease-out' : undefined,
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

        {(() => {
          const BTN_ID = 'route-toggle-btn';
          const btnIdx = portfolios.length;  // 마지막 포트폴리오 다음 인덱스
          const { x, y, scaleMultiplier, zIndex, opacity, baseSize } =
            getPosition(btnIdx, portfolios.length + 1, progress);

          if (opacity <= 0.01) return null;

          const btnRotation = rotations[portfolios.length % rotations.length];
          const nextLabel = ROUTE_LABELS[(routeVersion + 1) % ROUTES.length];

          return (
            <div
              key={BTN_ID}
              onClick={handleRouteToggle}
              className="absolute pointer-events-auto cursor-pointer group"
              style={{
                left: 0, top: 0,
                transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scaleMultiplier}) rotate(${btnRotation}deg)`,
                zIndex: zIndex + 10,
                opacity: opacity,
                willChange: 'transform, opacity',
                transition: isTransitioningRef.current ? 'transform 0.5s ease-out' : undefined,
              }}
              onMouseMove={(e) => handleCardTilt(BTN_ID, e.clientX, e.clientY, e.currentTarget)}
              onMouseLeave={() => resetCardTilt(BTN_ID)}
              onTouchStart={(e) => {
                const t = e.touches[0];
                handleCardTilt(BTN_ID, t.clientX, t.clientY, e.currentTarget);
              }}
              onTouchMove={(e) => {
                const t = e.touches[0];
                handleCardTilt(BTN_ID, t.clientX, t.clientY, e.currentTarget);
              }}
              onTouchEnd={() => resetCardTilt(BTN_ID)}
              onTouchCancel={() => resetCardTilt(BTN_ID)}
            >
              <div
                ref={(el) => {
                  if (el) {
                    cardRefs.current.set(BTN_ID, el);
                    if (!wobbleMap.current.has(BTN_ID)) {
                      wobbleMap.current.set(BTN_ID, { rx: 0, ry: 0, trx: 0, try: 0 });
                    }
                  } else {
                    cardRefs.current.delete(BTN_ID);
                    wobbleMap.current.delete(BTN_ID);
                  }
                }}
                style={{ width: `${baseSize}px`, height: `${baseSize}px` }}
                className="bg-black flex flex-col items-center justify-center rounded-sm shadow-xl hover:shadow-2xl transition-shadow"
              >
                <span className="text-white text-[8px] font-black uppercase tracking-widest opacity-60">
                  SWITCH TO
                </span>
                <span className="text-white text-[11px] font-black uppercase tracking-widest mt-0.5">
                  {nextLabel}
                </span>
                <div className="mt-1.5 w-4 h-[1px] bg-white opacity-40" />
              </div>
            </div>
          );
        })()}
      </div>

      {/* Visual scroll hint */}
      <div className="absolute bottom-10 left-10 flex items-center gap-4 text-gray-200 opacity-40 pointer-events-none">
         <span className="text-[8px] font-bold tracking-[0.5em] uppercase vertical-text">DRAG OR SCROLL</span>
      </div>
    </div>
  );
};

export default HeroSection;
