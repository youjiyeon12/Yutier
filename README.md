# 🚀 Yutier - 유한대학교 역량 관리 및 티어 시스템

**Yutier**는 유한대학교 학생들의 핵심역량 점수를 체계적으로 관리하고, 성취도에 따라 티어(등급)를 부여하여 학생들의 성장을 시각적으로 보여주는 웹 서비스입니다. 자신의 역량 수준을 객관적으로 파악하고, 추천 프로그램을 통해 자기계발에 대한 동기를 부여받을 수 있습니다.

<br>

## ✨ 주요 기능

- **🧑‍🤝‍🧑 회원 관리**: 간편한 회원가입, 로그인, 회원 정보 수정 및 탈퇴 기능을 제공합니다.
- **📊 역량 매트릭스**: 개인 Google Sheet와 연동하여 자신의 역량 점수를 직접 관리하고 학기별로 추적할 수 있습니다.
- **🏆 자동 티어 시스템**: 핵심역량 점수를 기반으로 `Diamond`, `Gold`, `Silver`, `Bronze` 등급의 티어가 주기적으로 자동 산정됩니다.
- **🎯 맞춤형 프로그램 추천**: 현재 역량 점수가 낮은 분야를 보완할 수 있는 교내 프로그램을 추천받을 수 있습니다.
- **📈 대시보드**: 나의 현재 티어, 종합 점수, 다음 등급까지의 목표 점수 등을 한눈에 확인할 수 있습니다.

<br>

## 🛠️ 기술 스택

| Category      | Technology                                                              |
| ------------- | ----------------------------------------------------------------------- |
| **Frontend**  | `React`, `Vite`, `React Router`, `Axios`, `CSS Modules`                 |
| **Backend**   | `Node.js`, `Express.js`                                                 |
| **Database**  | `Google Sheets API`                                                     |
| **Deployment**| `Docker`                                                                |

<br>

## 🏁 시작하기

### 1. 프로젝트 클론
```bash
git clone https://github.com/youjiyeon12/Yutier.git
cd Yutier
```

### 2. 백엔드 서버 설정 (`/server`)
1.  **필요한 라이브러리 설치**
    ```bash
    cd server
    npm install
    ```
2.  **Google API 인증 설정**
    - Google Cloud Platform에서 서비스 계정을 생성하고, 권한을 설정한 뒤 `credentials.json` 키 파일을 다운로드하여 `/server` 디렉토리에 추가합니다.
    - 데이터를 관리할 메인 Google Sheet를 생성하고, 해당 시트에 서비스 계정 이메일을 편집자로 공유합니다.

3.  **환경 변수 설정**
    - `/server` 디렉토리에 `.env` 파일을 생성하고 아래 내용을 채웁니다.
    ```
    # 관리자용 메인 Google Sheet의 ID
    VITE_GOOGLE_SHEET_ID="YOUR_GOOGLE_SHEET_ID"

    # API 서버 주소
    VITE_API_URL="http://localhost:3001"
    ```

4.  **백엔드 서버 실행**
    ```bash
    node index.js
    ```
    *서버가 `http://localhost:3001`에서 실행됩니다.*

### 3. 프론트엔드 설정 (루트 디렉토리 `/`)
1.  **필요한 라이브러리 설치**
    ```bash
    npm install
    ```
2.  **프론트엔드 서버 실행**
    ```bash
    npm run dev
    ```
    *개발 서버가 `http://localhost:5173`와 같은 주소에서 실행됩니다.*

<br>

## 👨‍👩‍👧‍👦 팀원 정보

| 역할 | 이름 |
| --- | --- |
| 👑 **팀장** | **김원정** |
| 💻 **팀원** | 김려원 |
| 🎨 **팀원** | 김은비 |
| 💡 **팀원** | 박한별 |
| 🚀 **팀원** | 윤나래 |

---
*This project was part of the YUHAN TRUST program.*