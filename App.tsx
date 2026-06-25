
import React, { useMemo, useState, useEffect } from 'react';
import { PortfolioItem, ViewState } from './types';
import HeroSection from './components/HeroSection';
import PortfolioForm from './components/PortfolioForm';
import PortfolioDetail from './components/PortfolioDetail';
import {
  createUserPortfolioId,
  isUserPortfolio,
  loadUserPortfolios,
  saveUserPortfolios,
  StoredPortfolioItem,
  toStoredPortfolioItem,
} from './src/utils/localPortfolioStorage';

// 디폴트 갤러리 이미지 import
import pic1 from './src/img/pic1.png';
import pic2 from './src/img/pic2.png';
import pic3 from './src/img/pic3.png';
import pic4 from './src/img/pic4.png';
import pic5 from './src/img/pic5.png';
import pic6 from './src/img/pic6.png';
import pic7 from './src/img/pic7.png';
import pic8 from './src/img/pic8.png';
import pic9 from './src/img/pic9.png';
import pic10 from './src/img/pic10.png';
import pic11 from './src/img/pic11.png';
import pic12 from './src/img/pic12.png';

// 기본 갤러리 (12개 커스텀 이미지)
const DEFAULT_PORTFOLIOS: PortfolioItem[] = [
  {
    id: 0,
    title: 'Stillness',
    description: [`A white presence stands on deep green grass, where contrast refines the scene into calm. The field absorbs light; the figure returns it—quietly luminous, effortlessly precise.`],
    images: [pic1],
    techStack: ['Photography', 'Composition'],
  },
  {
    id: 1,
    title: 'Perch',
    description: [`Perched above the world, the cat holds the blue roof like a private stage. The saturated plane feels crisp and clean, while the still figure adds warmth—minimal, balanced, and quietly cinematic.`],
    images: [pic2],
    techStack: ['Photography', 'Color Theory'],
  },
  {
    id: 2,
    title: 'Afterglow',
    description: [`He looks into orange as if into late light. The painting offers intensity; he answers with calm. Between them, the room feels suspended—an elegant pause where color becomes atmosphere.`],
    images: [pic3],
    techStack: ['Photography', 'Portrait'],
  },
  {
    id: 3,
    title: 'Tremble',
    description: [`A white flower shivers against a red ground, like a thought you can't hold still. The blur becomes a heartbeat—tender, urgent—turning motion into feeling and color into a quiet confession.`],
    images: [pic4],
    techStack: ['Photography', 'Motion Blur'],
  },
  {
    id: 4,
    title: 'Yellow',
    description: [`Yellow flowers gather like small suns, brightening the air without asking permission. Their light feels simple, yet impossible to ignore—joy made visible, held gently in petals.`],
    images: [pic5],
    techStack: ['Photography', 'Nature'],
  },
  {
    id: 5,
    title: 'Pasture',
    description: [`Green spreads like calm across the frame, and the dog appears as a gentle punctuation mark. The image reads like a memory: light, honest, and quietly enduring.`],
    images: [pic6],
    techStack: ['Photography', 'Landscape'],
  },
  {
    id: 6,
    title: 'Sunlit',
    description: [`Against deep green, yellow flowers glow with an effortless brightness. They soften the scene without overwhelming it—light held in petals, calm held in color.`],
    images: [pic7],
    techStack: ['Photography', 'Natural Light'],
  },
  {
    id: 7,
    title: 'Drift',
    description: [`A small boat moves across a blue sea, as if carried by a thought too gentle to name. The horizon holds steady while the water shifts, turning distance into comfort and motion into quiet hope.`],
    images: [pic8],
    techStack: ['Photography', 'Seascape'],
  },
  {
    id: 8,
    title: 'Ink',
    description: [`White swans drift across ink-dark water, each curve a soft flame against the void. Together they make a living constellation—elegant, weightless, and strangely intimate.`],
    images: [pic9],
    techStack: ['Photography', 'Wildlife'],
  },
  {
    id: 9,
    title: 'Ember',
    description: [`A single orange fish moves through clear water like a drifting spark. Every ripple softens into silence, and the scene holds a gentle warmth without noise. 🐟`],
    images: [pic10],
    techStack: ['Photography', 'Underwater'],
  },
  {
    id: 10,
    title: 'Field',
    description: [`Green spreads like life, white like light, and a figure appears as the measure between them. The contrast is sharp, but the mood is soft—human warmth held in a painted world. 🌿`],
    images: [pic11],
    techStack: ['Photography', 'Human & Nature'],
  },
  {
    id: 11,
    title: 'Glint',
    description: [`Surfing over shining waves, the rider cuts through light like a clean stroke. The sea flickers beneath—silver, restless, alive—while balance turns motion into grace. 🏄‍♂️`],
    images: [pic12],
    techStack: ['Photography', 'Action'],
  },
];

const AppContent: React.FC = () => {
  const [userPortfolios, setUserPortfolios] = useState<StoredPortfolioItem[]>(() => loadUserPortfolios());
  const portfolios = useMemo<PortfolioItem[]>(
    () => [...userPortfolios, ...DEFAULT_PORTFOLIOS],
    [userPortfolios],
  );
  const [view, setView] = useState<ViewState>('home');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // view 변경 시 body overflow 제어
  useEffect(() => {
    if (view === 'home') {
      document.body.style.overflow = 'hidden';    // HeroSection 스크롤용
      document.body.style.overflowX = 'hidden';   // 가로 스크롤 차단
    } else {
      document.body.style.overflow = 'auto';      // 일반 스크롤 허용
      document.body.style.overflowX = 'hidden';   // 가로 스크롤만 차단
    }

    // cleanup: 컴포넌트 언마운트 시 복원
    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.overflowX = 'auto';
    };
  }, [view]);

  // HTML 클래스 토글 (Tailwind dark: 활성화)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggleDark = () => setIsDark(prev => !prev);

  const persistUserPortfolios = (items: StoredPortfolioItem[]) => {
    saveUserPortfolios(items);
    setUserPortfolios(items);
  };

  const handleCreate = async (item: Omit<PortfolioItem, 'id' | 'createdAt'>) => {
    try {
      setIsLoading(true);
      const id = createUserPortfolioId(portfolios);
      const createdAt = Date.now();
      const newItem = await toStoredPortfolioItem(item, id, createdAt);
      persistUserPortfolios([newItem, ...userPortfolios]);
      setSelectedId(newItem.id);
      setView('home');
    } catch (error) {
      console.error('포트폴리오 저장 실패:', error);
      alert('포트폴리오를 저장하지 못했습니다. 이미지 용량이 너무 크면 사진 수를 줄이거나 더 작은 이미지를 사용해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (id: number, updated: Omit<PortfolioItem, 'id' | 'createdAt'>) => {
    if (!isUserPortfolio(id)) {
      alert('기본 샘플 포트폴리오는 수정할 수 없습니다.');
      return;
    }

    try {
      setIsLoading(true);
      const originalItem = userPortfolios.find(p => p.id === id);
      if (!originalItem) return;

      const storedItem = await toStoredPortfolioItem(
        updated,
        id,
        originalItem.createdAt,
        Date.now(),
      );
      const nextItems = userPortfolios.map(p => p.id === id ? storedItem : p);
      persistUserPortfolios(nextItems);
      setSelectedId(id);
      setView('detail');
    } catch (error) {
      console.error('포트폴리오 수정 저장 실패:', error);
      alert('포트폴리오를 수정하지 못했습니다. 이미지 용량이 너무 크면 사진 수를 줄이거나 더 작은 이미지를 사용해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!isUserPortfolio(id)) {
      alert('기본 샘플 포트폴리오는 삭제할 수 없습니다.');
      return;
    }

    try {
      setIsLoading(true);
      const nextItems = userPortfolios.filter(p => p.id !== id);
      persistUserPortfolios(nextItems);
      setSelectedId(null);
      setView('home');
    } catch (error) {
      console.error('포트폴리오 삭제 저장 실패:', error);
      alert('포트폴리오 삭제 내용을 저장하지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToDetail = (id: number) => {
    setSelectedId(id);
    setView('detail');
  };

  const navigateToCreate = () => {
    setView('create');
  };

  const selectedItem = portfolios.find(p => p.id === selectedId);

  return (
    <div className={`min-h-screen bg-[#f9fafb] dark:bg-[#111111] text-gray-900 dark:text-gray-100 transition-colors duration-300 ${view === 'home' ? 'overflow-hidden' : ''}`}>
      <main className="relative">
        {view === 'home' && (
          <HeroSection
            portfolios={portfolios}
            onItemClick={navigateToDetail}
            onAddClick={navigateToCreate}
            isDark={isDark}
            onToggleDark={toggleDark}
          />
        )}

        {view === 'create' && (
          <div className="max-w-4xl mx-auto p-6 pt-32 pb-20">
            <h2 className="text-4xl font-bold mb-8 font-heading uppercase tracking-tighter dark:text-white">New Portfolio</h2>
            <PortfolioForm onSubmit={handleCreate} onCancel={() => setView('home')} isLoading={isLoading} />
            <Footer />
          </div>
        )}

        {view === 'detail' && (
          <>
            {selectedItem ? (
              <>
                <PortfolioDetail
                  item={selectedItem}
                  onEdit={() => setView('edit')}
                  onDelete={() => handleDelete(selectedItem.id)}
                  onBack={() => setView('home')}
                  canEdit={isUserPortfolio(selectedItem.id)}
                />
                <Footer />
              </>
            ) : (
              <div className="min-h-screen flex items-center justify-center">
                <div className="flex flex-col items-center gap-6 px-6 text-center">
                  <div className="text-6xl">🔍</div>
                  <div>
                    <h2 className="text-2xl font-bold mb-2 dark:text-white">포트폴리오를 찾을 수 없습니다</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">선택한 포트폴리오를 찾을 수 없습니다.</p>
                  </div>
                  <button
                    onClick={() => setView('home')}
                    className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:scale-[1.02] transition-all"
                  >
                    홈으로 돌아가기
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {view === 'edit' && selectedItem && (
          <div className="max-w-4xl mx-auto p-6 pt-32 pb-20">
            <h2 className="text-4xl font-bold mb-8 font-heading uppercase tracking-tighter dark:text-white">Edit Portfolio</h2>
            <PortfolioForm
              initialData={selectedItem}
              onSubmit={(data) => handleUpdate(selectedItem.id, data)}
              onCancel={() => setView('detail')}
              isLoading={isLoading}
            />
            <Footer />
          </div>
        )}
      </main>
    </div>
  );
};

const Footer: React.FC = () => (
  <footer className="py-10 text-center text-gray-300 dark:text-gray-600 border-t border-gray-50 dark:border-gray-800 bg-[#f9fafb] dark:bg-[#111111] w-full transition-colors duration-300">
    <p className="text-[10px] font-heading tracking-[0.5em] uppercase font-bold">Curvify Creative Lab © 2024</p>
  </footer>
);

const App: React.FC = () => {
  return <AppContent />;
};

export default App;
