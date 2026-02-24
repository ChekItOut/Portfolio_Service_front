
import React, { useState } from 'react';
import { PortfolioItem } from '../types';

interface PortfolioDetailProps {
  item: PortfolioItem;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

// 이미지 슬라이더 컴포넌트
const ImageSlider: React.FC<{ images: (File | string)[], onImageClick: (idx: number) => void }> = ({ images, onImageClick }) => {
  if (images.length === 0) {
    return (
      <div className="h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <span className="text-gray-400 font-bold uppercase text-xs">No images available</span>
      </div>
    );
  }

  if (images.length === 1) {
    const img = images[0];
    const src = typeof img === 'string' ? img : URL.createObjectURL(img);
    return (
      <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <img
          src={src}
          alt="Portfolio"
          className="max-h-full max-w-full object-contain cursor-pointer hover:scale-[1.02] transition-transform"
          onClick={() => onImageClick(0)}
        />
      </div>
    );
  }

  // 2개 이상: 3배 복제로 완전한 무한 루프
  const triplicatedImages = [...images, ...images, ...images];
  const animationDuration = images.length * 5;

  return (
    <div className="h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
      <style>{`
        @keyframes slide-left {
          from { transform: translateX(0); }
          to { transform: translateX(-33.333%); }
        }
      `}</style>
      <div
        className="flex h-full gap-2"
        style={{
          animation: `slide-left ${animationDuration}s linear infinite`,
          willChange: 'transform'
        }}
      >
        {triplicatedImages.map((img, idx) => {
          const src = typeof img === 'string' ? img : URL.createObjectURL(img);
          const originalIdx = idx % images.length;
          return (
            <img
              key={idx}
              src={src}
              alt={`Portfolio ${originalIdx + 1}`}
              className="h-full object-contain cursor-pointer flex-shrink-0 hover:opacity-90 transition-opacity"
              onClick={() => onImageClick(originalIdx)}
            />
          );
        })}
      </div>
    </div>
  );
};

const PortfolioDetail: React.FC<PortfolioDetailProps> = ({ item, onEdit, onDelete, onBack }) => {
  // item 유효성 검증
  if (!item || !item.title) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center dark:bg-gray-900">
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Invalid data</h2>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold"
        >
          Back
        </button>
      </div>
    );
  }

  const [selectedImageIdx, setSelectedImageIdx] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* 뒤로가기 버튼 (고정 상단 좌측) */}
      <button
        onClick={onBack}
        className="fixed top-6 left-6 z-20 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-black dark:hover:text-white transition-colors group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back
      </button>

      {/* 이미지 슬라이더 영역 (상단 50vh) */}
      <section className="h-[50vh] w-full">
        <ImageSlider
          images={item.images}
          onImageClick={(idx) => setSelectedImageIdx(idx)}
        />
      </section>

      {/* 하단 콘텐츠 영역 */}
      <section className="w-full px-12 py-12">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row gap-12">
          {/* 좌측: Title + TechStack + Buttons (sticky) */}
          <aside className="lg:w-2/5 lg:sticky lg:top-24 lg:self-start space-y-6 h-fit">
            <h1 className="text-4xl lg:text-6xl font-bold font-heading leading-tight dark:text-white">
              {item.title}
            </h1>
            <div className="flex flex-wrap gap-2">
              {item.techStack.map((tech, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-[10px] font-black uppercase tracking-widest rounded-full dark:text-white"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* Edit/Delete 버튼 - TechStack 아래로 이동 */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onEdit}
                className="flex-1 bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-xl font-bold tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                EDIT
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this project?')) {
                    onDelete();
                  }
                }}
                className="flex-1 border-2 border-red-500 text-red-500 px-6 py-3 rounded-xl font-bold tracking-widest hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
              >
                DELETE
              </button>
            </div>
          </aside>

          {/* 우측: Description (스크롤 가능) */}
          <article className="lg:w-3/5 space-y-6 pb-[150vh]">
            {Array.isArray(item.description) ? (
              item.description.map((para, i) => (
                <p key={i} className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                  {para}
                </p>
              ))
            ) : (
              <p className="text-lg lg:text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-light">
                {item.description}
              </p>
            )}
          </article>
        </div>
      </section>

      {/* Lightbox 모달 */}
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
  );
};

export default PortfolioDetail;
