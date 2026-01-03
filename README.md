# Trader's Mark - 자동매매 플랫폼

주식과 암호화폐를 포함한 모든 자산의 자동매매를 지원하는 React 기반 프론트엔드 애플리케이션입니다.

## 기술 스택

- **React 18**
- **Vite** - 빌드 도구
- **React Router** - 라우팅
- **Axios** - HTTP 클라이언트
- **JWT** - 인증

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
VITE_API_BASE_URL=http://localhost:8000
```

### 3. 개발 서버 실행

```bash
npm run dev
```

개발 서버가 `http://localhost:3000`에서 실행됩니다.

### 4. 빌드

```bash
npm run build
```

빌드된 파일은 `dist` 디렉토리에 생성됩니다.

## 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Navbar.jsx      # 네비게이션 바
│   └── ProtectedRoute.jsx  # 인증이 필요한 라우트 보호
├── contexts/            # React Context
│   └── AuthContext.jsx # 인증 상태 관리
├── pages/              # 페이지 컴포넌트
│   ├── LandingPage.jsx # 랜딩 페이지
│   ├── LoginPage.jsx   # 로그인 페이지
│   └── SignupPage.jsx  # 회원가입 페이지
├── services/           # API 서비스
│   └── api.js          # API 클라이언트 및 인증 관련 함수
├── App.jsx             # 메인 앱 컴포넌트
└── main.jsx            # 엔트리 포인트
```

## 주요 기능

### 인증

- **회원가입**: 새로운 사용자 계정 생성
- **로그인**: JWT 토큰 기반 인증
- **자동 토큰 갱신**: 액세스 토큰 만료 시 자동으로 갱신

### 페이지

- **랜딩 페이지**: 서비스 소개 및 주요 기능 안내
- **로그인 페이지**: 사용자 로그인
- **회원가입 페이지**: 신규 사용자 등록

## 백엔드 연동

이 프로젝트는 Django DRF 백엔드와 연동됩니다:

- **API Base URL**: `http://localhost:8000` (기본값)
- **인증 엔드포인트**: 
  - `POST /api/token/` - 로그인
  - `POST /api/token/refresh/` - 토큰 갱신
  - `POST /api/users/` - 회원가입

## 브랜딩

- **브랜드명**: Trader's Mark (트레이더스 마크)
- **브랜드 컬러**: 빨강 (#dc2626)
- **지원 자산**: 주식, 암호화폐를 포함한 모든 자동매매

## 개발 참고사항

### CORS 설정

백엔드 Django 설정에서 CORS를 허용해야 합니다. `django-cors-headers` 패키지를 사용하는 것을 권장합니다.

```python
# settings.py
INSTALLED_APPS = [
    ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    ...
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]
```

## 라이선스

ISC

