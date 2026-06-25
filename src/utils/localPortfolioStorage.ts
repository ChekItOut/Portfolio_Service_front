import { PortfolioItem } from '../../types';

export const USER_PORTFOLIOS_STORAGE_KEY = 'curvify_user_portfolios_v1';
export const USER_PORTFOLIO_ID_START = 1000;

export interface StoredPortfolioItem {
  id: number;
  title: string;
  description: string[];
  images: string[];
  techStack: string[];
  createdAt: number;
  updatedAt?: number;
}

const MAX_IMAGE_SIZE = 1600;
const IMAGE_QUALITY = 0.82;
const OUTPUT_TYPE = 'image/jpeg';

const isStoredPortfolioItem = (value: unknown): value is StoredPortfolioItem => {
  if (!value || typeof value !== 'object') return false;

  const item = value as Partial<StoredPortfolioItem>;
  return (
    typeof item.id === 'number' &&
    typeof item.title === 'string' &&
    Array.isArray(item.description) &&
    item.description.every((description) => typeof description === 'string') &&
    Array.isArray(item.images) &&
    item.images.every((image) => typeof image === 'string') &&
    Array.isArray(item.techStack) &&
    item.techStack.every((tech) => typeof tech === 'string') &&
    typeof item.createdAt === 'number'
  );
};

export const loadUserPortfolios = (): StoredPortfolioItem[] => {
  try {
    const rawValue = localStorage.getItem(USER_PORTFOLIOS_STORAGE_KEY);
    if (!rawValue) return [];

    const parsed = JSON.parse(rawValue);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isStoredPortfolioItem)
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.warn('저장된 포트폴리오를 읽지 못했습니다:', error);
    return [];
  }
};

export const saveUserPortfolios = (items: StoredPortfolioItem[]) => {
  localStorage.setItem(USER_PORTFOLIOS_STORAGE_KEY, JSON.stringify(items));
};

export const createUserPortfolioId = (items: Pick<PortfolioItem, 'id'>[]): number => {
  const maxId = items.reduce((max, item) => Math.max(max, item.id), USER_PORTFOLIO_ID_START - 1);
  return Math.max(Date.now(), maxId + 1, USER_PORTFOLIO_ID_START);
};

export const isUserPortfolio = (id: number): boolean => id >= USER_PORTFOLIO_ID_START;

const cleanDescription = (description: string[]): string[] => {
  const cleaned = description.map((value) => value.trim()).filter(Boolean);
  return cleaned.length > 0 ? cleaned : [''];
};

const cleanTechStack = (techStack: string[]): string[] => (
  techStack.map((value) => value.trim()).filter(Boolean)
);

const loadImage = (file: File): Promise<HTMLImageElement> => (
  new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('이미지 파일을 읽을 수 없습니다.'));
    };
    image.src = objectUrl;
  })
);

const getCanvasSize = (width: number, height: number) => {
  const longestSide = Math.max(width, height);
  if (longestSide <= MAX_IMAGE_SIZE) {
    return { width, height };
  }

  const scale = MAX_IMAGE_SIZE / longestSide;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
};

export const fileToCompressedDataUrl = async (file: File): Promise<string> => {
  const image = await loadImage(file);
  const { width, height } = getCanvasSize(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('이미지 변환을 준비할 수 없습니다.');
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL(OUTPUT_TYPE, IMAGE_QUALITY);
};

export const normalizeImagesForStorage = async (images: (File | string)[]): Promise<string[]> => (
  Promise.all(
    images.map((image) => (
      typeof image === 'string' ? image : fileToCompressedDataUrl(image)
    ))
  )
);

export const toStoredPortfolioItem = async (
  item: Omit<PortfolioItem, 'id' | 'createdAt'>,
  id: number,
  createdAt: number,
  updatedAt?: number,
): Promise<StoredPortfolioItem> => ({
  id,
  title: item.title.trim(),
  description: cleanDescription(item.description),
  images: await normalizeImagesForStorage(item.images),
  techStack: cleanTechStack(item.techStack),
  createdAt,
  updatedAt,
});
