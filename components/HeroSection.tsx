
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PortfolioItem } from '../types';

interface HeroSectionProps {
  portfolios: PortfolioItem[];
  onItemClick: (id: number) => void;
  onAddClick: () => void;
  isDark: boolean;
  onToggleDark: () => void;
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

// Version 3: Cross 궤도 (세로 Lissajous figure-8)
const ROUTE_V3: RouteFn = (t, vw, vh) => {
  const baseSize = vw < 768 ? 60 : 95;
  const centerX = vw / 2;
  const centerY = vh / 2;

  // 한 사이클 = 2π (figure-8 한 바퀴)
  const CROSS_PERIOD = 2 * Math.PI;
  const phase = ((t % CROSS_PERIOD) + CROSS_PERIOD) % CROSS_PERIOD;
  const normalizedPhase = phase / CROSS_PERIOD; // 0 ~ 1

  const scaleX = vw * 0.46;   // V2처럼 화면 전체 너비 활용
  const scaleY = vh * 0.42;   // 화면 높이의 42% 활용

  // Lissajous 2:1: x 2번 진동, y 1번 진동 → 세로 figure-8
  // progress 증가 → t 감소 → phase 감소 → 왼쪽→오른쪽 이동 보장을 위해 x 부호 반전
  const x = centerX - scaleX * Math.sin(2 * phase);
  const y = centerY + scaleY * Math.sin(phase);

  // 불투명도: x 좌표 기준으로 왼쪽 생성 직후 / 오른쪽 이탈 직전 페이드
  const xMin = centerX - scaleX;
  const xMax = centerX + scaleX;
  const normalizedX = (x - xMin) / (xMax - xMin); // 0 ~ 1
  const FADE_X = 0.10; // 좌우 각 10% 구간에서 페이드
  let opacity: number;
  if (normalizedX < FADE_X) {
    opacity = normalizedX / FADE_X;
  } else if (normalizedX > 1 - FADE_X) {
    opacity = (1 - normalizedX) / FADE_X;
  } else {
    opacity = 1.0;
  }

  // z-index: 경로 위쪽 루프(y < centerY)에서 높게, 아래쪽 루프에서 낮게
  const zIndex = Math.round((1 - normalizedPhase) * 100);
  const scaleMultiplier = 0.75 + Math.abs(Math.cos(phase)) * 0.25;

  return { x, y, opacity, zIndex, scaleMultiplier, baseSize };
};

const ROUTES: RouteFn[] = [ROUTE_V1, ROUTE_V2, ROUTE_V3];
const ROUTE_LABELS = ['RIBBON', 'SPIRAL', 'CROSS'];

interface WobbleState {
  rx: number;   // 현재 rotateX (도)
  ry: number;   // 현재 rotateY (도)
  trx: number;  // 목표 rotateX
  try: number;  // 목표 rotateY
}

const HeroSection: React.FC<HeroSectionProps> = ({
  portfolios,
  onItemClick,
  onAddClick,
  isDark,
  onToggleDark
}) => {
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
    // ROUTE_V1(0): 0.6, ROUTE_V2(1): 0.55, ROUTE_V3(2): 0.35
    const itemSpacing = routeVersion === 0 ? 0.6 : routeVersion === 1 ? 0.55 : 0.35;
    const t = (index * itemSpacing) - (currentProgress * pathSpan) + 2.5;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return ROUTES[routeVersion](t, vw, vh);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen bg-white dark:bg-[#111111] overflow-hidden select-none cursor-grab active:cursor-grabbing transition-colors duration-300"
    >

      {/* Central Typography */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-[9999]">
        <span className="text-[#666] dark:text-gray-400 font-normal tracking-[0.02em] text-[11px] md:text-[13px] mb-[-4px] font-mono">Keep Shipping & Keep Yours 🌊</span>
        <h1
          className="text-[16vw] md:text-[11vw] font-cormorant leading-none text-black dark:text-white tracking-tighter"
          style={{
            textShadow: isDark ? '0 4px 12px rgba(255, 255, 255, 0.1)' : '0 4px 12px rgba(0, 0, 0, 0.15)',
            transform: 'skewX(-12deg)'
          }}
        >
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
                className="relative bg-white dark:bg-gray-800 shadow-sm overflow-hidden transition-shadow duration-300 group-hover:shadow-2xl"
                style={{ width: `${baseSize}px`, height: `${baseSize}px` }}
              >
                <img
                  src={thumbSrc}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors flex items-center justify-center">
                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-2 py-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <p className="text-[8px] font-black uppercase tracking-tighter text-black dark:text-white truncate max-w-[65px]">
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
            getPosition(btnIdx, portfolios.length + 3, progress);

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
                className="bg-black dark:bg-gray-800 flex flex-col items-center justify-center rounded-sm shadow-xl hover:shadow-2xl transition-shadow"
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

        {(() => {
          const ADD_PROJECT_ID = 'add-project-btn';
          const btnIdx = portfolios.length + 1;
          const { x, y, scaleMultiplier, zIndex, opacity, baseSize } =
            getPosition(btnIdx, portfolios.length + 3, progress);

          if (opacity <= 0.01) return null;

          const btnRotation = rotations[(portfolios.length + 1) % rotations.length];

          return (
            <div
              key={ADD_PROJECT_ID}
              onClick={onAddClick}
              className="absolute pointer-events-auto cursor-pointer group"
              style={{
                left: 0, top: 0,
                transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scaleMultiplier}) rotate(${btnRotation}deg)`,
                zIndex: zIndex + 10,
                opacity: opacity,
                willChange: 'transform, opacity',
                transition: isTransitioningRef.current ? 'transform 0.5s ease-out' : undefined,
              }}
              onMouseMove={(e) => handleCardTilt(ADD_PROJECT_ID, e.clientX, e.clientY, e.currentTarget)}
              onMouseLeave={() => resetCardTilt(ADD_PROJECT_ID)}
              onTouchStart={(e) => {
                const t = e.touches[0];
                handleCardTilt(ADD_PROJECT_ID, t.clientX, t.clientY, e.currentTarget);
              }}
              onTouchMove={(e) => {
                const t = e.touches[0];
                handleCardTilt(ADD_PROJECT_ID, t.clientX, t.clientY, e.currentTarget);
              }}
              onTouchEnd={() => resetCardTilt(ADD_PROJECT_ID)}
              onTouchCancel={() => resetCardTilt(ADD_PROJECT_ID)}
            >
              <div
                ref={(el) => {
                  if (el) {
                    cardRefs.current.set(ADD_PROJECT_ID, el);
                    if (!wobbleMap.current.has(ADD_PROJECT_ID)) {
                      wobbleMap.current.set(ADD_PROJECT_ID, { rx: 0, ry: 0, trx: 0, try: 0 });
                    }
                  } else {
                    cardRefs.current.delete(ADD_PROJECT_ID);
                    wobbleMap.current.delete(ADD_PROJECT_ID);
                  }
                }}
                style={{ width: `${baseSize}px`, height: `${baseSize}px` }}
                className="bg-white dark:bg-gray-800 border-2 border-black dark:border-white flex flex-col items-center justify-center rounded-sm shadow-xl hover:shadow-2xl transition-shadow"
              >
                <span className="text-black dark:text-white text-[24px] font-light leading-none">+</span>
                <span className="text-black dark:text-white text-[8px] font-black uppercase tracking-widest mt-1.5">
                  Add
                </span>
              </div>
            </div>
          );
        })()}

        {(() => {
          const DARK_BTN_ID = 'dark-toggle-btn';
          const darkBtnIdx = portfolios.length + 2;
          const { x, y, scaleMultiplier, zIndex, opacity, baseSize } =
            getPosition(darkBtnIdx, portfolios.length + 3, progress);

          if (opacity <= 0.01) return null;

          const btnRotation = rotations[(portfolios.length + 2) % rotations.length];

          return (
            <div
              key={DARK_BTN_ID}
              onClick={onToggleDark}
              className="absolute pointer-events-auto cursor-pointer group"
              style={{
                left: 0, top: 0,
                transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scaleMultiplier}) rotate(${btnRotation}deg)`,
                zIndex: zIndex + 10,
                opacity: opacity,
                willChange: 'transform, opacity',
                transition: isTransitioningRef.current ? 'transform 0.5s ease-out' : undefined,
              }}
              onMouseMove={(e) => handleCardTilt(DARK_BTN_ID, e.clientX, e.clientY, e.currentTarget)}
              onMouseLeave={() => resetCardTilt(DARK_BTN_ID)}
              onTouchStart={(e) => {
                const t = e.touches[0];
                handleCardTilt(DARK_BTN_ID, t.clientX, t.clientY, e.currentTarget);
              }}
              onTouchMove={(e) => {
                const t = e.touches[0];
                handleCardTilt(DARK_BTN_ID, t.clientX, t.clientY, e.currentTarget);
              }}
              onTouchEnd={() => resetCardTilt(DARK_BTN_ID)}
              onTouchCancel={() => resetCardTilt(DARK_BTN_ID)}
            >
              <div
                ref={(el) => {
                  if (el) {
                    cardRefs.current.set(DARK_BTN_ID, el);
                    if (!wobbleMap.current.has(DARK_BTN_ID)) {
                      wobbleMap.current.set(DARK_BTN_ID, { rx: 0, ry: 0, trx: 0, try: 0 });
                    }
                  } else {
                    cardRefs.current.delete(DARK_BTN_ID);
                    wobbleMap.current.delete(DARK_BTN_ID);
                  }
                }}
                style={{ width: `${baseSize}px`, height: `${baseSize}px` }}
                className={`flex flex-col items-center justify-center rounded-sm shadow-xl hover:shadow-2xl transition-shadow ${
                  isDark ? 'bg-white' : 'bg-black'
                }`}
              >
                {isDark ? (
                  <>
                    <svg className="w-5 h-5 text-black mb-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.707.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm5.657-9.193a1 1 0 00-1.414 0l-.707.707A1 1 0 005.05 13.536l.707.707a1 1 0 001.414-1.414l-.707-.707zM5 12a1 1 0 100 2H4a1 1 0 100-2h1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-black text-[8px] font-black uppercase tracking-widest opacity-60">
                      LIGHT
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-white mb-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                    <span className="text-white text-[8px] font-black uppercase tracking-widest opacity-60">
                      DARK
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })()}

      </div>

      {/* Visual scroll hint */}
      <div className="absolute bottom-10 left-10 flex items-center gap-4 text-gray-200 dark:text-gray-600 opacity-40 pointer-events-none">
         <span className="text-[8px] font-bold tracking-[0.5em] uppercase vertical-text">DRAG OR SCROLL</span>
      </div>
    </div>
  );
};

export default HeroSection;
