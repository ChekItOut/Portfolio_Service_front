# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Curvify Portfolio Archive는 고급 포트폴리오 아카이빙 서비스로, 스크롤에 따라 움직이는 독특한 곡선 갤러리 레이아웃을 특징으로 합니다. 사용자는 작업물을 업로드하고, 기술 스택을 추적하며, 시각적으로 훌륭한 인터페이스에서 창작물을 관리할 수 있습니다.

**핵심 기술 스택:**
- React 19 + TypeScript
- Vite (빌드 도구)
- Tailwind CSS (CDN 로드)
- localStorage (데이터 지속성)

## 주요 명령어

```bash
# 개발 서버 시작 (포트 3000)
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 코드 아키텍처

### 상태 관리 및 네비게이션
**App.tsx**가 전체 애플리케이션 상태를 관리합니다:
- `portfolios`: PortfolioItem[] - 모든 포트폴리오 항목
- `view`: ViewState ('home' | 'create' | 'detail' | 'edit') - 현재 화면 상태
- `selectedId`: 선택된 포트폴리오 ID
- 모든 CRUD 작업 처리 (handleCreate, handleUpdate, handleDelete)
- localStorage에 자동 저장 (curvify_portfolios 키)

### 컴포넌트 구조

| 컴포넌트 | 역할 |
|---------|------|
| **HeroSection** | 스크롤/터치 기반 곡선 갤러리. 복잡한 매개변수 애니메이션(parametric path) 사용. 약 100 프레임을 미리 계산하여 성능 최적화. |
| **Header** | 상단 네비게이션 및 "Add" 버튼. 현재 뷰에 따라 동적으로 렌더링. |
| **PortfolioForm** | 새 포트폴리오 생성/편집 폼. 제목, 설명, 이미지, 기술 스택 입력. |
| **PortfolioDetail** | 포트폴리오 항목 상세 보기. 편집 및 삭제 버튼 포함. |

### 데이터 모델
```typescript
interface PortfolioItem {
  id: string;                    // UUID (crypto.randomUUID())
  title: string;                 // 포트폴리오 제목
  description: string;           // 설명
  images: string[];              // Base64 또는 URL
  techStack: string[];           // 사용된 기술
  createdAt: number;             // 타임스탐프
}
```

### 스타일 및 레이아웃
- **Tailwind CSS**: CDN을 통해 로드 (index.html)
- **폰트**:
  - `Inter`: 본문 (Google Fonts에서 로드)
  - `JetBrains Mono`: 모노스페이스 (코드/기술 스택)
  - 커스텀 CSS 클래스: `.vertical-text`, `.font-heading`, `.font-mono`
- **색상 스킴**: 밝은 배경 (#f9fafb, #ffffff), 다크 텍스트

### HeroSection 애니메이션 세부사항
갤러리는 매개변수 리본 경로를 따릅니다:
- **X 축**: `centerX + scaleX * Math.sin(t * 0.8)`
- **Y 축**: `centerY + scaleY * Math.sin(t * 1.6) * Math.cos(t * 0.4)`
- 불투명도와 Z-인덱스는 `Math.sin(t * 0.4)`로 계산
- 마우스 휠/터치로 `progress` 상태를 업데이트하여 갤러리 스크롤
- `requestAnimationFrame`으로 매 프레임 0.00015씩 자동 진행

### 환경 변수
- **GEMINI_API_KEY**: vite.config.ts에서 처리하여 클라이언트에 주입
- `.env.local` 파일에서 설정 (예: `GEMINI_API_KEY=your_api_key`)

## 개발 주의사항

1. **포트폴리오 데이터**: localStorage를 통해 지속되므로, 데이터 구조를 변경할 때 마이그레이션 로직이 필요할 수 있습니다.
2. **이미지 처리**: Base64 또는 URL 지원. 대용량 Base64는 localStorage 크기 제한에 주의.
3. **성능**: HeroSection의 애니메이션은 GPU 가속을 위해 `translate3d`와 `willChange` CSS 사용.
4. **뷰 전환**: 뷰 변경 시 자동으로 페이지 맨 위로 스크롤 (useEffect in App.tsx).
5. **TypeScript**: JSX pragma는 React 17+ 자동 import 사용 (tsconfig.json의 `jsx: "react-jsx"`).
