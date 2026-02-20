
export interface PortfolioItem {
  id: number; // 백엔드와의 일관성 유지
  title: string;
  description: string[]; // 문단 배열로 변경
  images: (File | string)[]; // File 또는 URL (S3)
  techStack: string[];
  createdAt?: number;
}

export type ViewState = 'home' | 'create' | 'detail' | 'edit';
