
import React, { useRef, useEffect } from 'react';
import { PortfolioItem } from '../types';

interface PortfolioDetailProps {
  item: PortfolioItem;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

interface TiltState {
  rx: number;   // 현재 rotateX (도)
  ry: number;   // 현재 rotateY (도)
  trx: number;  // 목표 rotateX
  try: number;  // 목표 rotateY
}

const PortfolioDetail: React.FC<PortfolioDetailProps> = ({ item, onEdit, onDelete, onBack }) => {
  // 슬롯 기반 캐러셀 상수 (고정)
  const SLOT_ANGLE = 80;        // 슬롯 간 각도 — 항상 고정 (이미지 수 무관)
  const FIXED_RADIUS = 200;     // translateZ 반지름 — 항상 고정 (카드 크기 보장)
  const VISIBLE_SLOTS = 5;      // 렌더링할 슬롯 수 (-2 ~ +2)
  const HALF = 2;               // Math.floor(5 / 2)
  const MAX_TILT_ANGLE = 12;    // 최대 기울기 각도 (도) — 완만하게

  // 슬롯 ref 배열
  const slotDivRefs = useRef<Array<HTMLDivElement | null>>(Array(VISIBLE_SLOTS).fill(null));
  const tiltDivRefs = useRef<Array<HTMLDivElement | null>>(Array(VISIBLE_SLOTS).fill(null));
  const slotImgRefs = useRef<Array<HTMLImageElement | null>>(Array(VISIBLE_SLOTS).fill(null));

  // Tilt 애니메이션 상태 — 슬롯별 배열
  const tiltStates = useRef<TiltState[]>(
    Array.from({ length: VISIBLE_SLOTS }, () => ({ rx: 0, ry: 0, trx: 0, try: 0 }))
  );

  // 애니메이션 상태
  const rotationRef = useRef<number>(0);
  const isAutoRef = useRef<boolean>(true);
  const lastScrollRef = useRef<number>(Date.now());

  // Lightbox 상태
  const [selectedImageIdx, setSelectedImageIdx] = React.useState<number | null>(null);

  // 카드 사이즈 (가로형)
  const cardWidth = 420;
  const cardHeight = 240;

  // rAF 애니메이션 루프 — DOM 직접 조작
  useEffect(() => {
    let rafId: number;
    const AUTO_SPEED = 0.25;     // 도/프레임 (60fps 기준 → 1바퀴 ≈ 24초)
    const IDLE_TIMEOUT = 7000;   // ms
    const n = item.images.length;
    const SPRING = 0.12;         // 스프링 상수 (tilt 부드러움)

    if (n === 0) return;

    // 이미지 1장인 경우 — 정면 슬롯에 정적 배치, tilt는 계속 작동
    if (n === 1) {
      // HALF 제외 나머지 슬롯 숨기기 (빈 src로 인한 아이콘/이름 방지)
      for (let idx = 0; idx < VISIBLE_SLOTS; idx++) {
        if (idx !== HALF && slotDivRefs.current[idx]) {
          slotDivRefs.current[idx]!.style.display = 'none';
        }
      }
      if (slotDivRefs.current[HALF]) {
        slotDivRefs.current[HALF]!.style.transform = `rotateX(0deg) translateZ(0px)`;
      }
      if (slotImgRefs.current[HALF]) {
        slotImgRefs.current[HALF]!.src = item.images[0];
      }
      // rAF는 계속 실행 → tilt 스프링 애니메이션이 작동
    }

    const animate = () => {
      // 이미지 2장 이상일 때만 자동 회전
      if (n > 1) {
        if (isAutoRef.current) {
          rotationRef.current += AUTO_SPEED;
        } else {
          // 7초 비활동 → 자동 회전 복귀
          if (Date.now() - lastScrollRef.current > IDLE_TIMEOUT) {
            isAutoRef.current = true;
          }
        }
      }

      // Tilt 스프링 보간 — 슬롯별 개별 처리 (이미지 개수와 무관하게 항상 실행)
      for (let idx = 0; idx < VISIBLE_SLOTS; idx++) {
        const ts = tiltStates.current[idx];
        ts.rx += (ts.trx - ts.rx) * SPRING;
        ts.ry += (ts.try - ts.ry) * SPRING;
        if (tiltDivRefs.current[idx]) {
          tiltDivRefs.current[idx]!.style.transform =
            `rotateX(${ts.rx.toFixed(2)}deg) rotateY(${ts.ry.toFixed(2)}deg)`;
        }
      }

      // 이미지 1장이면 캐러셀 회전 슬롯 업데이트 건너뜀
      if (n === 1) {
        rafId = requestAnimationFrame(animate);
        return;
      }

      // 2장 이상: 슬롯별 캐러셀 회전 + 이미지 할당
      const centerSlot = Math.round(rotationRef.current / SLOT_ANGLE);

      for (let idx = 0; idx < VISIBLE_SLOTS; idx++) {
        const slotOffset = idx - HALF;                           // -2 ~ +2
        const slotIndex = centerSlot + slotOffset;
        const angleInDeg = slotIndex * SLOT_ANGLE - rotationRef.current;
        const imgIdx = ((slotIndex % n) + n) % n;               // 모듈러 순환

        if (slotDivRefs.current[idx]) {
          // opacity로 가시성 제어 — 중앙만 보이고 나머지는 완전히 숨김 (흐려지는 효과 없음)
          const absAngle = Math.abs(angleInDeg);
          const opacity = absAngle < SLOT_ANGLE / 2 ? 1 : 0;
          slotDivRefs.current[idx]!.style.transform =
            `rotateX(${angleInDeg}deg) translateZ(${FIXED_RADIUS}px)`;
          slotDivRefs.current[idx]!.style.opacity = `${opacity}`;
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

  // 휠 이벤트 핸들러 — deltaMode 기반 부호 분기
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    isAutoRef.current = false;
    lastScrollRef.current = Date.now();

    // deltaMode=0: 픽셀 단위 (트랙패드) → 부호 반전
    // deltaMode=1: 라인 단위 (마우스 휠) → 그대로
    const direction = e.deltaMode === 0 ? -1 : 1;
    rotationRef.current += e.deltaY * 0.15 * direction;
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
          style={{ height: '480px', perspective: '1000px' }}
          onWheel={handleWheel}
        >
          {item.images.length > 0 ? (
            <div
              style={{
                width: `${cardWidth}px`,
                height: `${cardHeight}px`,
                position: 'relative',
                transformStyle: 'preserve-3d',
                cursor: 'pointer',
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
                    transformStyle: 'preserve-3d',
                    transition: 'opacity 0.2s ease-out',
                  }}
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const cx = rect.left + rect.width / 2;
                    const cy = rect.top + rect.height / 2;
                    const dx = (e.clientX - cx) / (rect.width / 2);   // -1 ~ +1
                    const dy = (e.clientY - cy) / (rect.height / 2);  // -1 ~ +1

                    tiltStates.current[idx].trx = -dy * MAX_TILT_ANGLE;
                    tiltStates.current[idx].try = dx * MAX_TILT_ANGLE;
                  }}
                  onMouseLeave={() => {
                    tiltStates.current[idx].trx = 0;
                    tiltStates.current[idx].try = 0;
                  }}
                  onClick={() => setSelectedImageIdx(Math.round(rotationRef.current / SLOT_ANGLE) % item.images.length)}
                >
                  {/* Tilt 래퍼 */}
                  <div
                    ref={(el) => { tiltDivRefs.current[idx] = el; }}
                    style={{
                      width: '100%',
                      height: '100%',
                      transformStyle: 'preserve-3d',
                    }}
                  >
                    <img
                      ref={(el) => { slotImgRefs.current[idx] = el; }}
                      alt={`gallery ${idx}`}
                      className="w-full h-full object-cover rounded-sm shadow-xl hover:shadow-2xl transition-shadow"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // 빈 상태 — 기존 UI 유지
            <div className="w-full aspect-video bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-xs">
              No images available
            </div>
          )}
        </div>

      {/* Lightbox Modal */}
      {selectedImageIdx !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImageIdx(null)}
        >
          <button
            onClick={() => setSelectedImageIdx(null)}
            className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors"
            aria-label="Close lightbox"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* 이미지 컨테이너 */}
          <div
            className="max-w-5xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={item.images[selectedImageIdx]}
              alt={`${item.title} - full view`}
              className="max-w-full max-h-[80vh] object-contain"
            />
            <p className="text-white text-sm mt-4 text-center">
              {selectedImageIdx + 1} / {item.images.length}
            </p>
          </div>

          {/* 네비게이션 버튼 */}
          {item.images.length > 1 && (
            <div className="absolute bottom-6 left-6 right-6 flex justify-center gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIdx((selectedImageIdx - 1 + item.images.length) % item.images.length);
                }}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
              >
                ← Previous
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIdx((selectedImageIdx + 1) % item.images.length);
                }}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default PortfolioDetail;
