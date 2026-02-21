
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
  // 1. item 유효성 검증
  if (!item || !item.title) {
    return (
      <div className="max-w-6xl mx-auto px-6 text-center">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">유효하지 않은 데이터입니다</h2>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold"
        >
          돌아가기
        </button>
      </div>
    );
  }

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
        slotDivRefs.current[HALF]!.style.transform = `rotateX(0deg) translateZ(${FIXED_RADIUS}px)`;
      }
      if (slotImgRefs.current[HALF]) {
        const img = item.images[0];
        const src = typeof img === 'string' ? img : URL.createObjectURL(img);
        slotImgRefs.current[HALF]!.src = src;
      }
      // rAF는 계속 실행 → tilt 스프링 애니메이션이 작동
    }

    // 슬롯별 독립적인 slotIndex 추적 배열
    const slotIndices = [-2, -1, 0, 1, 2];
    const WRAP_THRESHOLD = SLOT_ANGLE * VISIBLE_SLOTS / 2; // 200° — 드럼 완전 뒤쪽 임계값

    // rAF 시작 전: 초기 이미지 할당
    if (n > 1) {
      for (let idx = 0; idx < VISIBLE_SLOTS; idx++) {
        const si = slotIndices[idx];
        const imgIdx = ((si % n) + n) % n;
        if (slotImgRefs.current[idx]) {
          const img = item.images[imgIdx];
          const src = typeof img === 'string' ? img : URL.createObjectURL(img);
          slotImgRefs.current[idx]!.src = src;
        }
      }
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
      for (let idx = 0; idx < VISIBLE_SLOTS; idx++) {
        let si = slotIndices[idx];
        let angleInDeg = si * SLOT_ANGLE - rotationRef.current;

        // 슬롯이 드럼 완전 뒤쪽(±200° 초과)으로 넘어가면 반대편으로 이동
        // 이 시점에는 backfaceVisibility가 이미 숨겨줬으므로 사용자에게 보이지 않음
        if (angleInDeg > WRAP_THRESHOLD) {
          si -= VISIBLE_SLOTS;           // 5 슬롯 뒤로 이동 (400° 감소)
          slotIndices[idx] = si;
          angleInDeg = si * SLOT_ANGLE - rotationRef.current;
          // 화면 밖에서 이미지 업데이트 (사용자에게 보이지 않음)
          const imgIdx = ((si % n) + n) % n;
          if (slotImgRefs.current[idx]) {
            const img = item.images[imgIdx];
            const src = typeof img === 'string' ? img : URL.createObjectURL(img);
            slotImgRefs.current[idx]!.src = src;
          }
        } else if (angleInDeg < -WRAP_THRESHOLD) {
          si += VISIBLE_SLOTS;           // 5 슬롯 앞으로 이동 (400° 증가)
          slotIndices[idx] = si;
          angleInDeg = si * SLOT_ANGLE - rotationRef.current;
          const imgIdx = ((si % n) + n) % n;
          if (slotImgRefs.current[idx]) slotImgRefs.current[idx]!.src = item.images[imgIdx];
        }

        if (slotDivRefs.current[idx]) {
          const absAngle = Math.abs(angleInDeg);
          // 88°까지 opacity 1 유지 → backfaceVisibility가 90°에서 자연스럽게 숨김
          // 기존 40° 임계값 대신 88°로 확장 → 인접 카드가 얇은 슬라이버로 보이며 자연스러운 드럼 회전 연출
          const opacity = absAngle < 88 ? 1 : 0;
          slotDivRefs.current[idx]!.style.transform =
            `rotateX(${angleInDeg}deg) translateZ(${FIXED_RADIUS}px)`;
          slotDivRefs.current[idx]!.style.opacity = `${opacity}`;
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
      {/* 뒤로가기 버튼 */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black dark:hover:text-white transition-colors mb-8 group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>
      <div className="flex flex-col lg:flex-row gap-16">
        <div className="flex-1 space-y-12">
          {/* Main Content */}
          <section>
            <h1 className="text-6xl font-bold font-heading mb-6 leading-tight dark:text-white">{item.title}</h1>
            <div className="flex flex-wrap gap-2 mb-8">
              {item.techStack.map((tech, i) => (
                <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-[10px] font-black uppercase tracking-widest rounded-full dark:text-white">
                  {tech}
                </span>
              ))}
            </div>
            <div className="space-y-4">
              {Array.isArray(item.description) ? (
                item.description.map((desc, i) => (
                  <p key={i} className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                    {desc}
                  </p>
                ))
              ) : (
                <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                  {item.description}
                </p>
              )}
            </div>
          </section>

          {/* Actions */}
          <div className="flex gap-4 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <button
              onClick={onEdit}
              className="flex-1 bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              EDIT PROJECT
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this project?')) {
                  onDelete();
                }
              }}
              className="px-8 border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl font-bold tracking-widest transition-all"
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
            <div className="w-full aspect-video bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-xs">
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
              src={typeof item.images[selectedImageIdx] === 'string' ? item.images[selectedImageIdx] : URL.createObjectURL(item.images[selectedImageIdx] as File)}
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
