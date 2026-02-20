// 프론트엔드 내부 사용 타입
export interface PortfolioItem {
  id: number; // 백엔드에서는 Long (portfolioId)
  title: string;
  description: string[]; // 문단 배열
  images: (File | string)[]; // File 객체 또는 URL (S3)
  techStack: string[];
  createdAt?: number; // 선택적 (백엔드에서 제공하지 않음)
}

// 폼 제출용 타입 (File 제외)
export interface PortfolioFormData {
  title: string;
  description: string[];
  skill: string[]; // 백엔드에서는 skill로 명명
  images?: (File | string)[];
}

// 백엔드 API 응답 타입
export interface PortfolioResponse {
  portfolioId: Long;
  title: string;
  description: string[]; // List<String>
  skill: string[]; // List<String>
  images: string[]; // S3 URL 배열
}

type Long = number | string; // TypeScript의 Long 표현
