# YUTIER 프로젝트 구조 및 파일 설명

## 📁 프로젝트 개요
YUTIER는 유한대학교 TRUST 인증 시스템을 위한 웹 애플리케이션입니다. React 프론트엔드와 Google Apps Script 백엔드로 구성되어 있습니다.

## 🏗️ 전체 프로젝트 구조

```
d:\school\Yutier\
├── apps_script\                    # Google Apps Script 백엔드
│   └── backend.gs                 # 메인 백엔드 로직
├── public\                        # 정적 파일들
│   ├── Github.svg
│   ├── Instagram.svg
│   ├── Youtube.svg
│   ├── yutier.svg
│   ├── yutierSymbol1.svg
│   ├── yutierSymbol2.svg
│   ├── yutierSymbol2-white.svg
│   ├── tier1.png
│   ├── tier2.png
│   ├── tier3.png
│   └── tier4.png
├── src\                          # React 프론트엔드 소스코드
│   ├── components\               # 재사용 가능한 컴포넌트들
│   │   ├── common\              # 공통 컴포넌트
│   │   │   ├── Footer.jsx
│   │   │   ├── Header.jsx
│   │   │   └── styles\
│   │   │       ├── footer.module.css
│   │   │       └── header.module.css
│   │   └── ui\                  # UI 컴포넌트
│   │       ├── list.jsx
│   │       └── styles\
│   ├── constants\               # 상수 정의
│   ├── hooks\                  # 커스텀 훅
│   ├── pages\                  # 페이지 컴포넌트들
│   │   ├── auth\              # 인증 관련 페이지
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── styles\
│   │   │       ├── login.module.css
│   │   │       └── signup.module.css
│   │   ├── home\              # 홈 관련 페이지
│   │   │   ├── Detail.jsx
│   │   │   ├── Detail2.jsx
│   │   │   ├── Guide.jsx
│   │   │   ├── Home.jsx
│   │   │   └── styles\
│   │   │       ├── detail.module.css
│   │   │       └── home.module.css
│   │   ├── matrix\            # 매트릭스 관리 페이지
│   │   │   ├── Matrix.jsx
│   │   │   ├── MatrixURLSubmit.jsx
│   │   │   └── styles\
│   │   │       ├── matrix.module.css
│   │   │       └── matrixURLSubmit.module.css
│   │   └── mypage\            # 마이페이지
│   │       ├── DeleteAccount.jsx
│   │       ├── MemInfoEdit.jsx
│   │       ├── Mypage.jsx
│   │       └── styles\
│   │           └── mypage.module.css
│   ├── services\              # API 서비스
│   │   └── googleSheetsService.js
│   ├── utils\                 # 유틸리티 함수들
│   ├── App.css               # 메인 앱 스타일
│   ├── App.jsx               # 메인 앱 컴포넌트
│   ├── global.css            # 전역 스타일
│   ├── index.css             # 인덱스 스타일
│   └── main.jsx              # 앱 진입점
├── eslint.config.js          # ESLint 설정
├── index.html                # HTML 템플릿
├── package.json              # 프로젝트 의존성
├── package-lock.json         # 의존성 잠금 파일
├── README.md                 # 프로젝트 설명서
└── vite.config.js            # Vite 빌드 설정
```

## 🔧 주요 파일 상세 설명

### 📱 프론트엔드 (React)

#### `src/App.jsx`
- **역할**: 메인 앱 컴포넌트, 라우팅 및 전역 상태 관리
- **주요 기능**: 
  - React Router를 통한 페이지 라우팅
  - 사용자 인증 상태 관리
  - 전역 컨텍스트 제공

#### `src/main.jsx`
- **역할**: React 앱의 진입점
- **주요 기능**: React 앱을 DOM에 마운트

#### `src/services/googleSheetsService.js`
- **역할**: Google Apps Script와의 API 통신을 담당하는 중앙 서비스
- **주요 기능**:
  - 사용자 인증 (로그인/회원가입)
  - 매트릭스 데이터 관리 (조회/저장)
  - 티어 점수 계산 및 조회
  - 추천 프로그램 조회
  - URL 길이 제한을 위한 청크 저장 기능

#### `src/pages/matrix/Matrix.jsx`
- **역할**: 매트릭스 점수 관리 페이지
- **주요 기능**:
  - 매트릭스 데이터 로드 및 표시
  - 이수/미이수 체크박스 관리
  - 변경된 데이터만 청크로 저장
  - 티어 점수 표시

#### `src/pages/matrix/MatrixURLSubmit.jsx`
- **역할**: 매트릭스 URL 등록 페이지
- **주요 기능**: 사용자의 Google Sheets URL 등록

#### `src/pages/auth/Login.jsx`
- **역할**: 사용자 로그인 페이지
- **주요 기능**: 사용자 인증 및 세션 관리

#### `src/pages/auth/Signup.jsx`
- **역할**: 사용자 회원가입 페이지
- **주요 기능**: 새 사용자 등록

#### `src/pages/home/Home.jsx`
- **역할**: 메인 홈페이지
- **주요 기능**: TRUST 인증 시스템 소개 및 네비게이션

#### `src/pages/mypage/Mypage.jsx`
- **역할**: 사용자 마이페이지
- **주요 기능**: 사용자 정보 관리 및 계정 설정

### 🔧 백엔드 (Google Apps Script)

#### `apps_script/backend.gs`
- **역할**: Google Apps Script 백엔드의 메인 로직
- **주요 기능**:
  - `doGet()`: HTTP GET 요청 처리
  - `doPost()`: HTTP POST 요청 처리 (현재 미사용)
  - 사용자 관리 (등록, 로그인, 정보 조회)
  - 매트릭스 데이터 관리 (로드, 저장)
  - 티어 점수 계산 및 관리
  - 추천 프로그램 로직

#### 주요 함수들:

##### 인증 관련
- `handleLogin(data)`: 사용자 로그인 처리
- `handleSignup(data)`: 사용자 회원가입 처리
- `findUserById(id)`: 사용자 ID로 사용자 정보 조회

##### 매트릭스 관련
- `handleGetMatrix(data)`: 매트릭스 데이터 로드
- `handleSaveMatrix(data)`: 매트릭스 데이터 저장
- `getMatrixDataFromUrl(matrixUrl, year, semester)`: URL에서 매트릭스 데이터 추출
- `extractSpreadsheetId(url)`: URL에서 스프레드시트 ID 추출

##### 티어 관련
- `handleGetTierScores(data)`: 티어 점수 조회
- `handleSaveTierScores(data)`: 티어 점수 저장
- `calculateTierScores(matrixData)`: 티어 점수 계산

##### 추천 프로그램 관련
- `handleGetRecommendedPrograms(data)`: 추천 프로그램 조회
- `getRecommendedPrograms(matrixData, tierScores)`: 추천 프로그램 계산

### 🎨 스타일링

#### CSS 모듈 시스템
- 각 컴포넌트별로 `.module.css` 파일 사용
- 컴포넌트 스코프 스타일링으로 충돌 방지
- 주요 스타일 파일들:
  - `src/global.css`: 전역 스타일
  - `src/App.css`: 앱 레벨 스타일
  - 각 페이지별 모듈 CSS 파일들

### ⚙️ 설정 파일들

#### `package.json`
- **역할**: 프로젝트 의존성 및 스크립트 관리
- **주요 의존성**:
  - React 18
  - React Router DOM
  - Vite (빌드 도구)

#### `vite.config.js`
- **역할**: Vite 빌드 도구 설정
- **주요 기능**: 개발 서버 설정, 빌드 최적화

#### `eslint.config.js`
- **역할**: 코드 품질 관리
- **주요 기능**: JavaScript/React 코드 린팅 규칙

## 🔄 데이터 흐름

### 1. 사용자 인증
```
Login.jsx → googleSheetsService.js → Apps Script → Google Sheets (users 시트)
```

### 2. 매트릭스 데이터 로드
```
Matrix.jsx → googleSheetsService.js → Apps Script → 사용자 매트릭스 스프레드시트
```

### 3. 매트릭스 데이터 저장
```
Matrix.jsx → googleSheetsService.js (청크 저장) → Apps Script → 사용자 매트릭스 스프레드시트
```

## 🚀 개발 환경 설정

### 프론트엔드 실행
```bash
npm install
npm run dev
```

### Apps Script 배포
1. Google Apps Script 에디터에서 `backend.gs` 파일 업로드
2. 배포 → 새 배포 → 웹 앱으로 설정
3. 환경변수 `VITE_APPS_SCRIPT_URL`에 배포 URL 설정

## 📊 주요 기능

### 1. 사용자 관리
- 회원가입/로그인
- 프로필 관리
- 매트릭스 URL 등록

### 2. 매트릭스 관리
- 매트릭스 데이터 조회
- 이수/미이수 상태 관리
- 변경사항 청크 저장

### 3. 티어 시스템
- 5개 핵심역량별 점수 계산
- 티어 등급 관리
- 상위 % 기반 티어 계산

### 4. 추천 시스템
- 사용자별 맞춤 프로그램 추천
- 핵심역량 기반 추천 알고리즘

## 🔧 현재 해결 중인 문제

### 매트릭스 데이터 로드 이슈
- **문제**: `이수/미이수` 컬럼 값이 제대로 로드되지 않음
- **원인**: 시트 선택 로직 및 데이터 범위 읽기 문제
- **해결 방안**: 
  - URL에서 스프레드시트 ID 추출 로직 개선
  - 시트 선택 및 데이터 범위 읽기 최적화
  - 상세한 디버깅 로그 추가

## 📝 개발 노트

### 최근 변경사항
- Apps Script에서 복잡한 시트 찾기 로직 구현
- 프론트엔드에서 변경된 데이터만 청크로 저장하는 최적화
- CORS 문제 해결을 위한 GET 요청 전용 구조
- 상세한 디버깅 로그 추가로 문제 진단 개선

### 향후 개선사항
- 매트릭스 데이터 로드 안정성 향상
- 사용자 경험 개선
- 성능 최적화
- 에러 처리 강화
