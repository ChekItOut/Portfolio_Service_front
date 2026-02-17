
import React from 'react';
import { ViewState } from '../types';

interface HeaderProps {
  setView: (v: ViewState) => void;
  currentView: ViewState;
  onAddClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ setView, currentView, onAddClick }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex justify-between items-center">
      <div 
        className="text-2xl font-black font-heading tracking-tighter cursor-pointer flex items-center gap-2"
        onClick={() => setView('home')}
      >
        <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
          <div className="w-3 h-3 bg-white rounded-full translate-x-1"></div>
        </div>
        CURVIFY
      </div>
      
      <nav className="flex gap-6 items-center">
        <button 
          onClick={() => setView('home')}
          className={`text-sm font-semibold tracking-wide transition-colors ${currentView === 'home' ? 'text-black' : 'text-gray-400 hover:text-black'}`}
        >
          ARCHIVE
        </button>
        <button 
          onClick={onAddClick}
          className="bg-black text-white px-5 py-2 rounded-full text-sm font-bold tracking-wide hover:scale-105 transition-transform"
        >
          ADD PROJECT
        </button>
      </nav>
    </header>
  );
};

export default Header;
