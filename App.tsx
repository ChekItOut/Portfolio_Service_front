
import React, { useState, useEffect } from 'react';
import { PortfolioItem, ViewState } from './types';
import HeroSection from './components/HeroSection';
import PortfolioForm from './components/PortfolioForm';
import PortfolioDetail from './components/PortfolioDetail';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import OAuthCallback from './src/components/OAuthCallback';
import { apiClient, setRefreshTokenCallback } from './src/services/apiClient';
import { mapApiResponsesToPortfolioItems } from './src/utils/portfolioMapper';

// 로그인 전 표시할 기본 갤러리 (12개 샘플 이미지)
const DEFAULT_PORTFOLIOS: PortfolioItem[] = Array.from({ length: 12 }).map((_, i) => ({
  id: Number(`${i}`), // 기본값은 number 타입
  title: `Project ${i + 1}`,
  description: ['This is a default sample project to demonstrate the gallery flow.'],
  images: [`https://picsum.photos/seed/${i + 50}/600/600`],
  techStack: ['React', 'Tailwind', 'Motion'],
}));

const AppContent: React.FC = () => {
  const { isAuthenticated, accessToken, refreshAccessToken, login, logout } = useAuth();
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>(DEFAULT_PORTFOLIOS);
  const [view, setView] = useState<ViewState>('home');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    if (isAuthenticated) {
      try {
        // 상세 정보 로드
        const response = await apiClient.get<any>(`/portfolios/detail/${id}`);
        const item = mapApiResponsesToPortfolioItems([response])[0];
        setPortfolios(prev => prev.map(p => p.id === id ? item : p));
      } catch (error) {
        console.error('포트폴리오 상세 로드 실패:', error);
      }
    }
    setSelectedId(id);
    setView('detail');
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
