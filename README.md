# 🚀 Yutier - 유한대학교 역량 관리 및 티어 시스템

**Yutier**는 유한대학교 학생들의 핵심역량 점수를 체계적으로 관리하고, 성취도에 따라 티어(등급)를 부여하여 학생들의 성장을 시각적으로 보여주는 웹 서비스입니다. 자신의 역량 수준을 객관적으로 파악하고, 추천 프로그램을 통해 자기계발에 대한 동기를 부여받을 수 있습니다.

<br>

## ✨ 주요 기능

-   **🧑‍🤝‍🧑 회원 관리**: 간편한 회원가입, 로그인, 아이디/비밀번호 찾기, 회원 정보 수정 및 탈퇴 기능을 제공합니다.
-   **📊 역량 매트릭스**: 개인 Google Sheet와 연동하여 자신의 역량 점수를 직접 관리하고 학기별로 추적할 수 있습니다.
-   **🏆 자동 티어 시스템**: 핵심역량 점수를 기반으로 `Diamond`, `Gold`, `Silver`, `Bronze` 등급의 티어가 실시간으로 자동 산정됩니다.
-   **🎯 맞춤형 프로그램 추천**: 현재 역량 점수가 낮은 분야를 보완할 수 있는 교내 프로그램을 추천받을 수 있습니다.
-   **📈 대시보드**: 나의 현재 티어, 종합 점수, 다음 등급까지 남은 점수 등을 한눈에 확인할 수 있습니다.

<br>

## 🛠️ 기술 스택

| Category     | Technology                                      |
| ------------ | ----------------------------------------------- |
| **Frontend** | `React`, `Vite`, `React Router`, `CSS Modules`  |
| **Backend** | `Google Apps Script`                            |
| **Database** | `Google Sheets`                                 |

<br>

## 🏁 시작하기

### 1. 백엔드 설정 (Google Apps Script)

1.  **프로젝트용 Google Sheets 생성**
    -   Yutier 프로젝트는 **두 종류**의 Google Sheets를 사용합니다. 아래 링크를 클릭하여 각각의 사본을 **본인의 Google Drive에 생성**해주세요.

    -   **① 데이터베이스 템플릿 (서버용)**
        -   모든 사용자의 정보(ID, 티어 등)가 저장되는 중앙 데이터베이스입니다.
        -   **[▶ 데이터베이스 시트 사본 만들기](https://docs.google.com/spreadsheets/d/1pZEerJseEaWSAbWqdZeWqg93kwY7IBdYZwLhBJTrCGc/copy)**

    -   **② 매트릭스 템플릿 (사용자용)**
        -   각 사용자가 개인의 역량 점수를 입력하기 위해 복사해가는 양식입니다.
        -   **[▶ 매트릭스 시트 사본 만들기](https://docs.google.com/spreadsheets/d/12ymRONolKRri2KKSiVT6SCHxJarmTsS9ZqZ-_0LYt6s/copy)**

2.  **Apps Script 프로젝트 설정**
    -   [Google Apps Script](https://script.google.com)로 이동하여 새 프로젝트를 생성합니다.
    -   `apps_script/backend.gs` 파일의 모든 코드를 복사하여 Apps Script 편집기에 붙여넣습니다.
    -   코드 상단의 `SPREADSHEET_ID` 상수를 **①번에서 생성한 데이터베이스 시트의 ID**로 교체합니다.

3.  **웹 앱 배포**
    -   Apps Script 편집기 우측 상단의 **`배포`** > **`새 배포`**를 클릭합니다.
    -   **유형 선택**: `웹 앱`
    -   **설정**:
        -   **다음 사용자로 실행**: `나 (내 이메일 주소)`
        -   **액세스 권한이 있는 사용자**: `모든 사용자`
    -   **`배포`** 버튼을 클릭하고 권한을 승인합니다.
    -   배포 완료 후 표시되는 **웹 앱 URL**을 복사합니다.

### 2. 프론트엔드 설정 (React)

1.  **프로젝트 클론**
    ```bash
    git clone [https://github.com/youjiyeon12/Yutier.git](https://github.com/youjiyeon12/Yutier.git)
    cd Yutier
    ```

2.  **필요한 라이브러리 설치**
    ```bash
    npm install
    ```

3.  **환경 변수 설정**
    -   프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 아래 내용을 채웁니다.
    -   **"YOUR_WEB_APP_URL"** 부분에 위에서 복사한 **웹 앱 URL**을 붙여넣습니다.
    ```
    VITE_APPS_SCRIPT_URL="YOUR_WEB_APP_URL"
    ```

4.  **프론트엔드 서버 실행**
    ```bash
    npm run dev
    ```
    *개발 서버가 `http://localhost:5173`과 같은 주소에서 실행됩니다.*

<br>

## 👨‍👩‍👧‍👦 팀원 정보

| 역할 | 이름 |
| --- | --- |
| 👑 **팀장** | **김원정** |
| 💻 **팀원** | 김려원 |
| 🎨 **팀원** | 김은비 |
| 💡 **팀원** | 박한별 |
| 🚀 **팀원** | 윤나래 |

<br>

## 👏 도움을 주신 분들 (Acknowledgements)

-   **티어 이미지 디자인**: 숙명여자대학교 환경디자인과 박령빈
-   **백엔드 마이그레이션 (Node.js → Google Apps Script)**: 유한대학교 컴퓨터공학과 김형균, 용지순

---
*This project was part of the YUHAN TRUST program.*
