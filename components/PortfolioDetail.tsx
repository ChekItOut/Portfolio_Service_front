
import React, { useRef, useEffect } from 'react';
import { PortfolioItem } from '../types';

interface PortfolioDetailProps {
  item: PortfolioItem;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

const PortfolioDetail: React.FC<PortfolioDetailProps> = ({ item, onEdit, onDelete, onBack }) => {
  // 슬롯 기반 캐러셀 상수 (고정)
  const SLOT_ANGLE = 80;        // 슬롯 간 각도 — 항상 고정 (이미지 수 무관)
  const FIXED_RADIUS = 200;     // translateZ 반지름 — 항상 고정 (카드 크기 보장)
  const VISIBLE_SLOTS = 5;      // 렌더링할 슬롯 수 (-2 ~ +2)
  const HALF = 2;               // Math.floor(5 / 2)

  // 슬롯 ref 배열
  const slotDivRefs = useRef<Array<HTMLDivElement | null>>(Array(VISIBLE_SLOTS).fill(null));
  const slotImgRefs = useRef<Array<HTMLImageElement | null>>(Array(VISIBLE_SLOTS).fill(null));

  // 애니메이션 상태
  const rotationRef = useRef<number>(0);
  const isAutoRef = useRef<boolean>(true);
  const lastScrollRef = useRef<number>(Date.now());

  // 카드 사이즈 (가로형)
  const cardWidth = 420;
  const cardHeight = 240;

  // rAF 애니메이션 루프 — DOM 직접 조작
  useEffect(() => {
    let rafId: number;
    const AUTO_SPEED = 0.25;     // 도/프레임 (60fps 기준 → 1바퀴 ≈ 24초)
    const IDLE_TIMEOUT = 7000;   // ms
    const n = item.images.length;

    if (n === 0) return;

    // 이미지 1장인 경우 — 자동 회전 비활성화
    if (n === 1) {
      if (slotDivRefs.current[HALF]) {
        slotDivRefs.current[HALF]!.style.transform = `rotateX(0deg) translateZ(0px)`;
      }
      if (slotImgRefs.current[HALF]) {
        slotImgRefs.current[HALF]!.src = item.images[0];
      }
      return;
    }

    const animate = () => {
      if (isAutoRef.current) {
        rotationRef.current += AUTO_SPEED;
      } else {
        // 7초 비활동 → 자동 회전 복귀
        if (Date.now() - lastScrollRef.current > IDLE_TIMEOUT) {
          isAutoRef.current = true;
        }
      }

      // centerSlot 계산
      const centerSlot = Math.round(rotationRef.current / SLOT_ANGLE);

      // 5개 슬롯 업데이트
      for (let idx = 0; idx < VISIBLE_SLOTS; idx++) {
        const slotOffset = idx - HALF;                           // -2 ~ +2
        const slotIndex = centerSlot + slotOffset;
        const angleInDeg = slotIndex * SLOT_ANGLE - rotationRef.current;
        const imgIdx = ((slotIndex % n) + n) % n;               // 모듈러 순환

        if (slotDivRefs.current[idx]) {
          slotDivRefs.current[idx]!.style.transform =
            `rotateX(${angleInDeg}deg) translateZ(${FIXED_RADIUS}px)`;
        }
        if (slotImgRefs.current[idx]) {
          slotImgRefs.current[idx]!.src = item.images[imgIdx];
        }
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [item.images]);

  // 휠 이벤트 핸들러
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    isAutoRef.current = false;
    lastScrollRef.current = Date.now();
    rotationRef.current += e.deltaY * 0.15;
  };

  return (
    <div className="max-w-6xl mx-auto px-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={onBack}
        className="mb-10 flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-widest"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Archive
      </button>

      <div className="flex flex-col lg:flex-row gap-16">
        <div className="flex-1 space-y-12">
          {/* Main Content */}
          <section>
            <h1 className="text-6xl font-black font-heading mb-6 leading-tight">{item.title}</h1>
            <div className="flex flex-wrap gap-2 mb-8">
              {item.techStack.map((tech, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 text-[10px] font-black uppercase tracking-widest rounded-full">
                  {tech}
                </span>
              ))}
            </div>
            <p className="text-xl text-gray-600 leading-relaxed font-light">
              {item.description}
            </p>
          </section>

          {/* Actions */}
          <div className="flex gap-4 p-6 bg-gray-50 rounded-2xl">
            <button 
              onClick={onEdit}
              className="flex-1 bg-black text-white py-4 rounded-xl font-bold tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              EDIT PROJECT
            </button>
            <button 
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this project?')) {
                  onDelete();
                }
              }}
              className="px-8 border border-red-200 text-red-500 hover:bg-red-50 rounded-xl font-bold tracking-widest transition-all"
            >
              DELETE
            </button>
          </div>
        </div>

        {/* Gallery Display */}
        <div
          className="lg:w-1/2 flex items-center justify-center"
          style={{ height: '480px' }}
          onWheel={handleWheel}
        >
          {item.images.length > 0 ? (
            <div style={{ perspective: '1000px' }}>
              {/* 슬롯 컨테이너 */}
              <div
                style={{
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                  position: 'relative',
                  transformStyle: 'preserve-3d',
                }}
              >
                {Array.from({ length: VISIBLE_SLOTS }, (_, idx) => (
                  <div
                    key={idx}
                    ref={(el) => { slotDivRefs.current[idx] = el; }}
                    style={{
                      position: 'absolute',
                      width: `${cardWidth}px`,
                      height: `${cardHeight}px`,
                      backfaceVisibility: 'hidden',
                    }}
                  >
                    <img
                      ref={(el) => { slotImgRefs.current[idx] = el; }}
                      alt={`gallery ${idx}`}
                      className="w-full h-full object-cover rounded-sm shadow-xl"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // 빈 상태 — 기존 UI 유지
            <div className="w-full aspect-video bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-xs">
              No images available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioDetail;
