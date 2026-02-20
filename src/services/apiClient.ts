import { ErrorResponse } from '../types/api';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

// AuthContext의 refreshAccessToken을 호출하기 위한 콜백
let refreshTokenCallback: (() => Promise<boolean>) | null = null;

export const setRefreshTokenCallback = (callback: () => Promise<boolean>) => {
  refreshTokenCallback = callback;
};

interface FetchOptions extends RequestInit {
  skipAuth?: boolean; // Authorization 헤더 추가 여부
}

class ApiClient {
  private baseUrl: string = BACKEND_URL;

  async fetch<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      ...fetchOptions.headers,
    };

    // Authorization 헤더 추가
    if (!skipAuth) {
      const accessToken = localStorage.getItem('access_token');
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }

    let response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: 'include', // RefreshToken 쿠키 포함
    });

    // 401 에러: AccessToken 갱신 시도
    if (response.status === 401 && !skipAuth && refreshTokenCallback) {
      const refreshed = await refreshTokenCallback();
      if (refreshed) {
        // 토큰 갱신 성공 → 원래 요청 재시도
        const newToken = localStorage.getItem('access_token');
        const retryHeaders = { ...headers };
        if (newToken) {
          retryHeaders['Authorization'] = `Bearer ${newToken}`;
        }

        response = await fetch(url, {
          ...fetchOptions,
          headers: retryHeaders,
          credentials: 'include',
        });
      }
    }

    // 에러 응답 처리
    if (!response.ok) {
      const errorData: ErrorResponse = await response.json().catch(() => ({
        status: response.status,
        error: response.statusText,
        message: '알 수 없는 에러가 발생했습니다',
      }));

      throw new ApiError(errorData);
    }

    // Content-Type에 따라 파싱
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }

    return response.text() as T;
  }

  // GET 요청
  get<T = any>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'GET',
      ...options,
    });
  }

  // POST 요청
  post<T = any>(endpoint: string, body?: any, options?: FetchOptions): Promise<T> {
    const fetchOptions: FetchOptions = {
      method: 'POST',
      ...options,
    };

    if (body) {
      // FormData인 경우 Content-Type을 자동으로 설정하지 않음 (브라우저가 처리)
      if (!(body instanceof FormData)) {
        if (!fetchOptions.headers) fetchOptions.headers = {};
        (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(body);
      } else {
        fetchOptions.body = body;
      }
    }

    return this.fetch<T>(endpoint, fetchOptions);
  }

  // PATCH 요청
  patch<T = any>(endpoint: string, body?: any, options?: FetchOptions): Promise<T> {
    const fetchOptions: FetchOptions = {
      method: 'PATCH',
      ...options,
    };

    if (body) {
      if (!(body instanceof FormData)) {
        if (!fetchOptions.headers) fetchOptions.headers = {};
        (fetchOptions.headers as Record<string, string>)['Content-Type'] = 'application/json';
        fetchOptions.body = JSON.stringify(body);
      } else {
        fetchOptions.body = body;
      }
    }

    return this.fetch<T>(endpoint, fetchOptions);
  }

  // DELETE 요청
  delete<T = any>(endpoint: string, options?: FetchOptions): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'DELETE',
      ...options,
    });
  }
}

// 커스텀 에러 클래스
export class ApiError extends Error {
  constructor(public data: ErrorResponse) {
    super(data.message || '알 수 없는 에러가 발생했습니다');
    this.name = 'ApiError';
  }

  get statusCode(): number {
    return this.data.status;
  }

  get isUnauthorized(): boolean {
    return this.data.status === 401;
  }

  get isForbidden(): boolean {
    return this.data.status === 403;
  }

  get isServerError(): boolean {
    return this.data.status >= 500;
  }
}

export const apiClient = new ApiClient();
