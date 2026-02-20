import React, { createContext, useState, useCallback, useEffect } from 'react';

export interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: () => void;
  logout: () => Promise<void>;
  setAccessToken: (token: string) => void;
  refreshAccessToken: () => Promise<boolean>;
}

const DEFAULT_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  isLoading: false,
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // localStorage에서 accessToken 복구
    const savedToken = localStorage.getItem('access_token');
    return {
      isAuthenticated: !!savedToken,
      accessToken: savedToken,
      isLoading: false,
    };
  });

  // 로그인 버튼 클릭 시 호출
  const login = useCallback(() => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
    const redirectUri = `${window.location.origin}/oauth/callback`;
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

    // Google OAuth 리다이렉트
    window.location.href = `${backendUrl}/oauth2/authorization/google?redirect_uri=${encodeURIComponent(redirectUri)}`;
  }, []);

  // 로그아웃
  const logout = useCallback(async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

      // RefreshToken 쿠키 삭제 요청
      await fetch(`${backendUrl}/api/refresh-token`, {
        method: 'DELETE',
        credentials: 'include', // 쿠키 포함
      });
    } catch (error) {
      console.error('로그아웃 요청 실패:', error);
    } finally {
      // localStorage에서 accessToken 삭제
      localStorage.removeItem('access_token');
      setAuthState({
        isAuthenticated: false,
        accessToken: null,
        isLoading: false,
      });
    }
  }, []);

  // AccessToken 수동 설정 (OAuth 콜백에서 사용)
  const setAccessToken = useCallback((token: string) => {
    localStorage.setItem('access_token', token);
    setAuthState({
      isAuthenticated: true,
      accessToken: token,
      isLoading: false,
    });
  }, []);

  // AccessToken 갱신 (401 에러 시 호출)
  const refreshAccessToken = useCallback(async (): Promise<boolean> => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

      const response = await fetch(`${backendUrl}/api/token`, {
        method: 'POST',
        credentials: 'include', // RefreshToken 쿠키 포함
      });

      if (!response.ok) {
        // RefreshToken도 만료됨 → 자동 로그아웃
        await logout();
        return false;
      }

      const data = await response.json();
      const newAccessToken = data.accessToken;

      setAccessToken(newAccessToken);
      return true;
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      await logout();
      return false;
    }
  }, [logout, setAccessToken]);

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    setAccessToken,
    refreshAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내부에서만 사용 가능합니다');
  }
  return context;
};
