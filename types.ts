
export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  images: string[]; // Base64 or URLs
  techStack: string[];
  createdAt: number;
}

export type ViewState = 'home' | 'create' | 'detail' | 'edit';
