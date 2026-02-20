// API 응답 구조
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 로그인 응답
export interface LoginResponse {
  accessToken: string;
  tokenType: string; // "Bearer"
}

// 토큰 갱신 응답
export interface TokenRefreshResponse {
  accessToken: string;
  tokenType: string;
}

// 포트폴리오 목록 응답
export interface PortfolioListResponse {
  portfolioId: number;
  title: string;
  description: string[];
  skill: string[];
  images: string[]; // S3 URL 배열
  createdAt?: string;
}

// 포트폴리오 상세 응답
export interface PortfolioDetailResponse {
  portfolioId: number;
  title: string;
  description: string[];
  skill: string[];
  images: string[];
  createdAt?: string;
}

// 에러 응답
export interface ErrorResponse {
  timestamp?: string;
  status: number;
  error: string;
  message: string;
  path?: string;
}
