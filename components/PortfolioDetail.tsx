
import React from 'react';
import { PortfolioItem } from '../types';

interface PortfolioDetailProps {
  item: PortfolioItem;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

const PortfolioDetail: React.FC<PortfolioDetailProps> = ({ item, onEdit, onDelete, onBack }) => {
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
        <div className="lg:w-1/2">
          <div className="grid grid-cols-1 gap-6">
            {item.images.map((img, idx) => (
              <div 
                key={idx} 
                className={`overflow-hidden rounded-3xl border border-gray-100 shadow-sm ${idx === 0 ? 'aspect-square lg:aspect-video' : 'aspect-video'}`}
              >
                <img 
                  src={img} 
                  alt={`${item.title} ${idx + 1}`} 
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" 
                />
              </div>
            ))}
            {item.images.length === 0 && (
              <div className="aspect-video bg-gray-100 rounded-3xl flex items-center justify-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                No images available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioDetail;
