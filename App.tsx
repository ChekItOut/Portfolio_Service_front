
import React, { useState, useEffect } from 'react';
import { PortfolioItem, ViewState } from './types';
import HeroSection from './components/HeroSection';
import PortfolioForm from './components/PortfolioForm';
import PortfolioDetail from './components/PortfolioDetail';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import OAuthCallback from './src/components/OAuthCallback';
import { apiClient, setRefreshTokenCallback } from './src/services/apiClient';
import { mapApiResponsesToPortfolioItems } from './src/utils/portfolioMapper';

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

// 로그인 전 표시할 기본 갤러리 (12개 커스텀 이미지)
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
  const { isAuthenticated, accessToken, refreshAccessToken, login, logout } = useAuth();
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>(DEFAULT_PORTFOLIOS);
  const [view, setView] = useState<ViewState>('home');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  // API 클라이언트에 토큰 갱신 콜백 설정
  useEffect(() => {
    setRefreshTokenCallback(refreshAccessToken);
  }, [refreshAccessToken]);

  // 포트폴리오 목록 로드 (API)
  const loadPortfolios = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const response = await apiClient.get<any[]>('/portfolios/hero');
      const items = mapApiResponsesToPortfolioItems(response);
      setPortfolios(items);
    } catch (error) {
      console.error('포트폴리오 로드 실패:', error);
      alert('포트폴리오를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인 전/후에 따라 포트폴리오 목록 로드
  useEffect(() => {
    if (isAuthenticated) {
      loadPortfolios();
    } else {
      setPortfolios(DEFAULT_PORTFOLIOS);
    }
  }, [isAuthenticated]);

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // HTML 클래스 토글 (Tailwind dark: 활성화)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const toggleDark = () => setIsDark(prev => !prev);

  const handleCreate = async (item: Omit<PortfolioItem, 'id' | 'createdAt'>) => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      setIsLoading(true);

      // FormData 생성
      const formData = new FormData();
      const request = {
        title: item.title,
        description: item.description.filter(d => d.trim()), // 빈 문단 제거
        skill: item.techStack, // techStack → skill 필드명 변경
      };
      formData.append('request', new Blob([JSON.stringify(request)], {
        type: 'application/json'
      }));

      // 이미지 추가 (File 객체만)
      item.images.forEach((img) => {
        if (img instanceof File) {
          formData.append('images', img);
        }
      });

      // API 호출
      const response = await apiClient.post<any>('/portfolios/posts', formData);
      const newItem = mapApiResponsesToPortfolioItems([response])[0];
      setPortfolios([newItem, ...portfolios]);
      setView('home');
    } catch (error) {
      console.error('포트폴리오 생성 실패:', error);
      alert('포트폴리오 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async (id: number, updated: Omit<PortfolioItem, 'id' | 'createdAt'>) => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      setIsLoading(true);

      const originalItem = portfolios.find(p => p.id === id);
      if (!originalItem) return;

      // 1. 텍스트 변경 감지
      const textChanged =
        originalItem.title !== updated.title ||
        JSON.stringify(originalItem.description) !== JSON.stringify(updated.description) ||
        JSON.stringify(originalItem.techStack) !== JSON.stringify(updated.techStack);

      if (textChanged) {
        await apiClient.patch(`/portfolios/text/${id}`, {
          title: updated.title,
          description: updated.description.filter(d => d.trim()),
          skill: updated.techStack,
        });
      }

      // 2. 이미지 변경 감지
      const { newFiles, existingUrls } = analyzeImageChanges(updated.images);

      if (existingUrls.length > 0 && newFiles.length > 0) {
        // 케이스 A: 기존 이미지 유지 + 새 이미지 추가
        const formData = new FormData();
        newFiles.forEach((file) => {
          formData.append('images', file);
        });
        await apiClient.post(`/portfolios/imageAdd/${id}`, formData);
      } else if (newFiles.length > 0) {
        // 케이스 B: 이미지 전체 재업로드
        const formData = new FormData();
        const request = {
          title: updated.title,
          description: updated.description.filter(d => d.trim()),
          skill: updated.techStack,
        };
        formData.append('request', new Blob([JSON.stringify(request)], {
          type: 'application/json'
        }));
        newFiles.forEach((file) => {
          formData.append('images', file);
        });
        await apiClient.patch(`/portfolios/imageReorder/${id}`, formData);
      }

      // 3. 로컬 상태 업데이트
      setPortfolios(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
      setView('detail');
    } catch (error) {
      console.error('포트폴리오 수정 실패:', error);
      alert('포트폴리오 수정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 이미지 변경 감지 헬퍼 (portfolioMapper에서 import)
  const analyzeImageChanges = (images: (File | string)[]): {
    newFiles: File[];
    existingUrls: string[];
  } => {
    const newFiles: File[] = [];
    const existingUrls: string[] = [];
    images.forEach((img) => {
      if (img instanceof File) {
        newFiles.push(img);
      } else if (typeof img === 'string') {
        existingUrls.push(img);
      }
    });
    return { newFiles, existingUrls };
  };

  const handleDelete = async (id: number) => {
    if (!isAuthenticated) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.delete(`/portfolios/${id}`);
      setPortfolios(prev => prev.filter(p => p.id !== id));
      setView('home');
    } catch (error) {
      console.error('포트폴리오 삭제 실패:', error);
      alert('포트폴리오 삭제에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToDetail = async (id: number) => {
    // 1. 로딩/에러 상태 초기화 및 뷰 전환
    setDetailLoadingId(id);
    setDetailError(null);
    setSelectedId(id);
    setView('detail');

    // 2. 디폴트 포트폴리오 확인 (id 0-11)
    const isDefaultPortfolio = id >= 0 && id <= 11;

    // 3. 디폴트 포트폴리오이거나 비로그인 상태면 로컬 데이터만 사용
    if (isDefaultPortfolio || !isAuthenticated) {
      setDetailLoadingId(null);
      return;
    }

    try {
      // 4. 사용자 포트폴리오만 API 호출
      const response = await apiClient.get<any>(`/portfolios/detail/${id}`);
      console.log('[navigateToDetail] API 응답:', { response });

      // 5. 응답 검증 (null 체크)
      if (!response || !response.portfolioId) {
        throw new Error('상세 데이터를 가져올 수 없습니다');
      }

      // 6. 데이터 매핑 및 portfolios 상태 업데이트
      const item = mapApiResponsesToPortfolioItems([response])[0];
      console.log('[navigateToDetail] 매핑된 데이터:', { item });
      setPortfolios(prev => prev.map(p => p.id === id ? item : p));

    } catch (error) {
      console.error('[navigateToDetail] 포트폴리오 상세 로드 실패:', {
        error,
        errorMessage: error instanceof Error ? error.message : '알 수 없는 에러'
      });

      // 7. 에러 메시지 설정
      const errorMessage = error instanceof Error
        ? error.message
        : '상세 정보를 불러오는 중 오류가 발생했습니다';
      setDetailError(errorMessage);

      // 8. 로컬에 데이터가 없으면 홈으로 리다이렉트
      const existsLocally = portfolios.some(p => p.id === id);
      if (!existsLocally) {
        alert(errorMessage + '\n홈으로 돌아갑니다.');
        setView('home');
      }
    } finally {
      // 9. 로딩 상태 해제
      setDetailLoadingId(null);
    }
  };

  const navigateToCreate = () => {
    setView('create');
  };

  const selectedItem = portfolios.find(p => p.id === selectedId);

  // OAuth 콜백 라우팅
  const path = window.location.pathname;
  if (path === '/oauth/callback') {
    return <OAuthCallback />;
  }

  return (
    <div className={`min-h-screen bg-[#f9fafb] dark:bg-[#111111] text-gray-900 dark:text-gray-100 transition-colors duration-300 ${view === 'home' ? 'overflow-hidden' : 'overflow-x-hidden'}`}>
      <main className="relative">
        {view === 'home' && (
          <HeroSection
            portfolios={portfolios}
            onItemClick={navigateToDetail}
            onAddClick={navigateToCreate}
            isDark={isDark}
            onToggleDark={toggleDark}
            isAuthenticated={isAuthenticated}
            isLoading={isLoading}
            onLogin={login}
            onLogout={logout}
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
          <div className="min-h-screen flex flex-col">
            <div className="flex-1 flex items-center py-16">
              {/* 상태 1: 로딩 중 */}
              {detailLoadingId === selectedId ? (
                <div className="max-w-6xl mx-auto px-6 text-center">
                  <div className="inline-block w-16 h-16 border-4 border-gray-200 border-t-black dark:border-t-white rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-500 dark:text-gray-400">상세 정보를 불러오는 중...</p>
                </div>
              ) : detailError ? (
                /* 상태 2: 에러 발생 */
                <div className="max-w-6xl mx-auto px-6 text-center">
                  <div className="mb-8">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-2xl font-bold mb-2 dark:text-white">오류 발생</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{detailError}</p>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={() => {
                        setDetailError(null);
                        navigateToDetail(selectedId!);
                      }}
                      className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:scale-[1.02] transition-all"
                    >
                      다시 시도
                    </button>
                    <button
                      onClick={() => setView('home')}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                      홈으로 돌아가기
                    </button>
                  </div>
                </div>
              ) : selectedItem ? (
                /* 상태 3: 정상 렌더링 */
                <PortfolioDetail
                  item={selectedItem}
                  onEdit={() => setView('edit')}
                  onDelete={() => handleDelete(selectedItem.id)}
                  onBack={() => setView('home')}
                />
              ) : (
                /* 상태 4: 데이터 없음 (fallback) */
                <div className="max-w-6xl mx-auto px-6 text-center">
                  <h2 className="text-2xl font-bold mb-4 dark:text-white">포트폴리오를 찾을 수 없습니다</h2>
                  <button
                    onClick={() => setView('home')}
                    className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold hover:scale-[1.02] transition-all"
                  >
                    홈으로 돌아가기
                  </button>
                </div>
              )}
            </div>
            <Footer />
          </div>
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

// App 컴포넌트는 AuthProvider로 래핑
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
