import { PortfolioItem } from '../types/portfolio';
import { PortfolioListResponse, PortfolioDetailResponse } from '../types/api';

/**
 * 백엔드 API 응답을 프론트엔드 PortfolioItem으로 변환
 */
export const mapApiResponseToPortfolioItem = (
  response: PortfolioListResponse | PortfolioDetailResponse
): PortfolioItem => {
  // 1. null/undefined 체크
  if (!response) {
    throw new Error('응답 데이터가 없습니다');
  }

  // 2. 필수 필드 검증
  if (!response.portfolioId || !response.title) {
    throw new Error('필수 필드가 누락되었습니다 (portfolioId, title)');
  }

  // 3. 안전한 변환
  return {
    id: Number(response.portfolioId),
    title: response.title,
    description: Array.isArray(response.description) && response.description.length > 0
      ? response.description
      : ['설명이 없습니다'],
    images: Array.isArray(response.images) ? response.images : [],
    techStack: Array.isArray(response.skill) ? response.skill : [],
  };
};

/**
 * 백엔드 응답 배열을 프론트엔드 배열로 변환
 */
export const mapApiResponsesToPortfolioItems = (
  responses: (PortfolioListResponse | PortfolioDetailResponse)[]
): PortfolioItem[] => {
  return responses.map(mapApiResponseToPortfolioItem);
};

/**
 * 필드명 변환: techStack → skill
 * FormData에 포함될 JSON 객체 생성
 */
export const createPortfolioRequestDto = (
  title: string,
  description: string[],
  techStack: string[]
) => {
  // 빈 문단 제거
  const cleanedDescription = description.filter(d => d.trim());

  return {
    title,
    description: cleanedDescription.length > 0 ? cleanedDescription : [''],
    skill: techStack, // techStack → skill 필드명 변환
  };
};

/**
 * FormData 생성 (멀티파트 요청용)
 */
export const createFormData = (
  title: string,
  description: string[],
  techStack: string[],
  images: (File | string)[]
): FormData => {
  const formData = new FormData();

  // JSON 요청 바디
  const request = createPortfolioRequestDto(title, description, techStack);
  formData.append(
    'request',
    new Blob([JSON.stringify(request)], { type: 'application/json' })
  );

  // 이미지 추가 (File 객체만)
  images.forEach((img) => {
    if (img instanceof File) {
      formData.append('images', img);
    }
  });

  return formData;
};

/**
 * 이미지 변경 감지
 * @returns { newFiles, existingUrls } - 새 이미지와 기존 URL 구분
 */
export const analyzeImageChanges = (images: (File | string)[]): {
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
