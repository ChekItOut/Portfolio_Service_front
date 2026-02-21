import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const OAuthCallback: React.FC = () => {
  const { setAccessToken } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1. 에러 파라미터 체크
        const params = new URLSearchParams(window.location.search);
        const error = params.get('error');

        if (error) {
          setError(`로그인 실패: ${error}`);
          return;
        }

        // 2. URL 파라미터에서 accessToken 시도 (백엔드가 전달하는 경우 대비)
        let token = params.get('accessToken');

        // 3. URL에 accessToken이 없으면 /api/token 호출하여 RefreshToken으로 획득
        if (!token) {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

          const response = await fetch(`${backendUrl}/api/token`, {
            method: 'POST',
            credentials: 'include', // RefreshToken 쿠키 포함
          });

          if (!response.ok) {
            setError('액세스 토큰 발급에 실패했습니다.');
            console.error('Token fetch failed:', response.status, response.statusText);
            return;
          }

          const data = await response.json();
          token = data.accessToken;
        }

        if (!token) {
          setError('액세스 토큰을 받지 못했습니다.');
          return;
        }

        // 4. AccessToken 저장 및 상태 업데이트
        setAccessToken(token);

        // 5. 메인 페이지로 리다이렉트
        window.location.href = '/';
      } catch (err) {
        setError('로그인 처리 중 오류가 발생했습니다.');
        console.error('OAuth callback error:', err);
      }
    };

    handleCallback();
  }, [setAccessToken]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f9fafb] dark:bg-[#111111]">
      <div className="text-center">
        {error ? (
          <>
            <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">
              로그인 실패
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <a
              href="/"
              className="inline-block bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              홈으로 돌아가기
            </a>
          </>
        ) : (
          <>
            <div className="animate-spin inline-block w-10 h-10 border-4 border-gray-300 border-t-black dark:border-t-white rounded-full mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              로그인 중...
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              잠시 기다려주세요.
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;
