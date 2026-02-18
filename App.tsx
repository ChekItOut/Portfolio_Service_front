
import React, { useState, useEffect } from 'react';
import { PortfolioItem, ViewState } from './types';
import HeroSection from './components/HeroSection';
import PortfolioForm from './components/PortfolioForm';
import PortfolioDetail from './components/PortfolioDetail';

// Initial default data
const DEFAULT_PORTFOLIOS: PortfolioItem[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `default-${i}`,
  title: `Project ${i + 1}`,
  description: 'This is a default sample project to demonstrate the gallery flow.',
  images: [`https://picsum.photos/seed/${i + 50}/600/600`],
  techStack: ['React', 'Tailwind', 'Motion'],
  createdAt: Date.now() - i * 1000000,
}));

const App: React.FC = () => {
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>(() => {
    const saved = localStorage.getItem('curvify_portfolios');
    return saved ? JSON.parse(saved) : DEFAULT_PORTFOLIOS;
  });
  const [view, setView] = useState<ViewState>('home');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('curvify_portfolios', JSON.stringify(portfolios));
  }, [portfolios]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const handleCreate = (item: Omit<PortfolioItem, 'id' | 'createdAt'>) => {
    const newItem: PortfolioItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setPortfolios([newItem, ...portfolios]);
    setView('home');
  };

  const handleUpdate = (id: string, updated: Omit<PortfolioItem, 'id' | 'createdAt'>) => {
    setPortfolios(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    setView('detail');
  };

  const handleDelete = (id: string) => {
    setPortfolios(prev => prev.filter(p => p.id !== id));
    setView('home');
  };

  const navigateToDetail = (id: string) => {
    setSelectedId(id);
    setView('detail');
  };

  const navigateToCreate = () => {
    setView('create');
  };

  const selectedItem = portfolios.find(p => p.id === selectedId);

  return (
    <div className={`min-h-screen bg-[#f9fafb] text-gray-900 ${view === 'home' ? 'overflow-hidden' : 'overflow-x-hidden'}`}>
      <main className="relative">
        {view === 'home' && (
          <HeroSection
            portfolios={portfolios}
            onItemClick={navigateToDetail}
            onAddClick={navigateToCreate}
          />
        )}

        {view === 'create' && (
          <div className="max-w-4xl mx-auto p-6 pt-32 pb-20">
            <h2 className="text-4xl font-bold mb-8 font-heading uppercase tracking-tighter">New Portfolio</h2>
            <PortfolioForm onSubmit={handleCreate} onCancel={() => setView('home')} />
            <Footer />
          </div>
        )}

        {view === 'detail' && selectedItem && (
          <div className="min-h-screen flex flex-col">
            <div className="flex-1 flex items-center py-16">
              <PortfolioDetail
                item={selectedItem}
                onEdit={() => setView('edit')}
                onDelete={() => handleDelete(selectedItem.id)}
                onBack={() => setView('home')}
              />
            </div>
            <Footer />
          </div>
        )}

        {view === 'edit' && selectedItem && (
          <div className="max-w-4xl mx-auto p-6 pt-32 pb-20">
            <h2 className="text-4xl font-bold mb-8 font-heading uppercase tracking-tighter">Edit Portfolio</h2>
            <PortfolioForm 
              initialData={selectedItem} 
              onSubmit={(data) => handleUpdate(selectedItem.id, data)} 
              onCancel={() => setView('detail')} 
            />
            <Footer />
          </div>
        )}
      </main>
    </div>
  );
};

const Footer: React.FC = () => (
  <footer className="py-10 text-center text-gray-300 border-t border-gray-50 bg-[#f9fafb] w-full">
    <p className="text-[10px] font-heading tracking-[0.5em] uppercase font-bold">Curvify Creative Lab © 2024</p>
  </footer>
);

export default App;
