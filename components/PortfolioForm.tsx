
import React, { useState, useRef } from 'react';
import { PortfolioItem } from '../types';

interface PortfolioFormProps {
  initialData?: PortfolioItem;
  onSubmit: (data: Omit<PortfolioItem, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const PortfolioForm: React.FC<PortfolioFormProps> = ({ initialData, onSubmit, onCancel, isLoading = false }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [descriptions, setDescriptions] = useState<string[]>(
    initialData?.description || ['']
  );
  const [currentDescIndex, setCurrentDescIndex] = useState(0);
  const [images, setImages] = useState<(File | string)[]>(initialData?.images || []);
  const [techStackInput, setTechStackInput] = useState(initialData?.techStack.join(', ') || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 7 - images.length;
    const filesArray = Array.from(files).slice(0, remainingSlots);

    setImages(prev => [...prev, ...filesArray].slice(0, 7));
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const getImageUrl = (img: File | string): string => {
    if (typeof img === 'string') {
      return img; // URL
    }
    return URL.createObjectURL(img); // File 객체
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const techStack = techStackInput.split(',').map(s => s.trim()).filter(Boolean);
    onSubmit({
      title,
      description: descriptions,
      images,
      techStack
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 bg-white dark:bg-gray-800 p-8 border border-gray-100 dark:border-gray-700 shadow-xl rounded-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-300 uppercase tracking-widest mb-2">Project Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Modern UI Kit"
              className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-5 py-3 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none text-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-300 uppercase tracking-widest mb-2">Description (각 문단을 슬라이드로 작성)</label>
            <div className="space-y-3">
              <textarea
                required
                value={descriptions[currentDescIndex]}
                onChange={(e) => {
                  const updated = [...descriptions];
                  updated[currentDescIndex] = e.target.value;
                  setDescriptions(updated);
                }}
                placeholder="이 프로젝트의 이야기를 작성해주세요..."
                rows={5}
                className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-5 py-3 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none resize-none"
              />

              {/* 네비게이션 */}
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setCurrentDescIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentDescIndex === 0}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  ← 이전
                </button>

                <span className="text-sm font-bold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  {currentDescIndex + 1} / {descriptions.length}
                </span>

                <button
                  type="button"
                  onClick={() => setCurrentDescIndex(prev => Math.min(descriptions.length - 1, prev + 1))}
                  disabled={currentDescIndex === descriptions.length - 1}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  다음 →
                </button>
              </div>

              {/* 새 문단 추가 */}
              <button
                type="button"
                onClick={() => {
                  setDescriptions([...descriptions, '']);
                  setCurrentDescIndex(descriptions.length);
                }}
                className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-lg text-gray-600 dark:text-gray-300 font-bold hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors"
              >
                + 새 문단 추가
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 dark:text-gray-300 uppercase tracking-widest mb-2">Tech Stack (Comma separated)</label>
            <input
              type="text"
              value={techStackInput}
              onChange={(e) => setTechStackInput(e.target.value)}
              placeholder="React, TypeScript, Tailwind..."
              className="w-full bg-gray-50 dark:bg-gray-700 dark:text-white border-none rounded-xl px-5 py-3 focus:ring-2 focus:ring-black dark:focus:ring-white transition-all outline-none"
            />
          </div>
        </div>

        <div className="space-y-6">
          <label className="block text-xs font-bold text-gray-400 dark:text-gray-300 uppercase tracking-widest mb-2">Images (Max 7, first is thumbnail)</label>
          <div className="grid grid-cols-4 gap-2">
            {images.map((img, idx) => (
              <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 group">
                <img src={getImageUrl(img)} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-xs font-bold"
                >
                  REMOVE
                </button>
              </div>
            ))}
            {images.length < 7 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 dark:text-gray-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors"
              >
                <span className="text-2xl font-light">+</span>
                <span className="text-[10px] font-bold">ADD</span>
              </button>
            )}
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      <div className="flex gap-4 pt-6 border-t border-gray-50 dark:border-gray-700">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 bg-black dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold tracking-widest hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors uppercase disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-black dark:disabled:hover:bg-white"
        >
          {isLoading ? 'Saving...' : (initialData ? 'Update Project' : 'Save Project')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-10 py-4 border border-gray-200 dark:border-gray-600 rounded-xl font-bold tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors uppercase dark:text-white"
        >
          Back to ARCHIVE
        </button>
      </div>
    </form>
  );
};

export default PortfolioForm;
