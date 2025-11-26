import React, { useState } from 'react';
import Header from '../../components/common/Header';
import Footer from "../../components/common/Footer";
import dmc from "./styles/guide.module.css"; 

const allGuides = {
  '백엔드 설정': [
    { id: 1, text: (<><h1 className={dmc.title}>백엔드 설정</h1>
    <p className={dmc.title2}>1. 프로젝트용 Google Sheets 생성</p>
    <p className={dmc.tbody}>
      Yutier 프로젝트는 두 종류의 Google Sheets를 사용합니다. 아래 링크를 클릭하여 각각의 사본을 본인의 Google Drive에 생성해주세요.
      <br/>
      ① 데이터베이스 템플릿 (서버용)
       <br/>
      <img src={`${import.meta.env.BASE_URL}gui0.jpg`} height="300px" style={{marginleft: '-100px'}}></img>
      <br/>
      모든 사용자의 정보(ID, 티어 등)가 저장되는 중앙 데이터베이스입니다.
      ▶ 데이터베이스 시트 사본 만들기 (<a href='https://docs.google.com/spreadsheets/d/1pZEerJseEaWSAbWqdZeWqg93kwY7IBdYZwLhBJTrCGc/copy' 
      target='_blank'>https://docs.google.com</a>)
      </p></>) },

    { id: 2, text: (<><h1 className={dmc.title}>백엔드 설정</h1>
    <p className={dmc.title2}>1. 프로젝트용 Google Sheets 생성</p>
    <p className={dmc.tbody}>② 매트릭스 템플릿 (사용자용)
      각 사용자가 개인의 역량 점수를 입력하기 위해 복사해가는 양식입니다.
      <img src={`${import.meta.env.BASE_URL}gui1.jpg`} height="300px" style={{marginleft: '-100px'}}></img>
      <br/>
      ▶ 매트릭스 시트 사본 만들기 (<a href='https://docs.google.com/spreadsheets/u/2/d/12ymRONolKRri2KKSiVT6SCHxJarmTsS9ZqZ-_0LYt6s/copy' 
      target='_blank'>https://docs.google.com</a>)
      </p></>) },

    { id: 3, text: (<><h1 className={dmc.title}>백엔드 설정</h1>
    <p className={dmc.title2}>2. Apps Script 프로젝트 설정</p>
    <p className={dmc.tbody}>② 매트릭스 템플릿 (사용자용)
      Google Apps Script로 이동하여 새 프로젝트를 생성합니다
      <br/>
      apps_script/backend.gs 파일의 모든 코드를 복사하여 Apps Script 편집기에 붙여넣습니다.
      <img src={`${import.meta.env.BASE_URL}gui2.jpg`} height="300px" style={{marginRight: '50px'}}></img>
      <img src={`${import.meta.env.BASE_URL}gui3.jpg`} height="300px" style={{marginleft: '50px'}}></img>
      <br/>
      ▶ 매트릭스 시트 사본 만들기 (<a href='https://docs.google.com/spreadsheets/u/2/d/12ymRONolKRri2KKSiVT6SCHxJarmTsS9ZqZ-_0LYt6s/copy' 
      target='_blank'>https://docs.google.com</a>)
      </p></>) },
    { id: 4, text: (<><h1 className={dmc.title}>백엔드 설정</h1>
    <p className={dmc.title2}>2. Apps Script 프로젝트 설정</p>
    <p className={dmc.tbody}>코드 상단의 SPREADSHEET_ID 상수를 ①번에서 생성한 데이터베이스 시트의 ID로 교체합니다.
     <img src={`${import.meta.env.BASE_URL}gui4.jpg`} height="250px" style={{marginRight: '10px'}}></img>
     <br/>
     <img src={`${import.meta.env.BASE_URL}gui5.jpg`} height="100px" style={{marginleft: '50px'}}></img>
      </p></>) },

      { id: 5, text: (<><h1 className={dmc.title}>백엔드 설정</h1>
    <p className={dmc.title2}>3. 웹 앱 배포</p>
    <p className={dmc.tbody}>Apps Script 편집기 우측 상단의 배포 &gt; **새 배포**를 클릭합니다.
      <br/>
      유형 선택: 웹 앱
      <br/>
      <img src={`${import.meta.env.BASE_URL}gui6.jpg`} height="200px" style={{marginleftt: '10px'}}></img>
      <img src={`${import.meta.env.BASE_URL}gui7.jpg`} height="250px" style={{marginleftt: '50px'}}></img>
      </p></>) },

      { id: 6, text: (<><h1 className={dmc.title}>백엔드 설정</h1>
    <p className={dmc.title2}>3. 웹 앱 배포</p>
    <p className={dmc.tbody}>설정:다음 사용자로 실행: 나 (내 이메일 주소)액세스 권한이 있는 사용자: 모든 사용자
      배포 버튼을 클릭하고 권한을 승인합니다.
      <br/>
      <img src={`${import.meta.env.BASE_URL}gui8.jpg`} height="300px" style={{marginRight: '50px'}}></img>
      <img src={`${import.meta.env.BASE_URL}gui9.jpg" height="300px`} style={{marginleftt: '50px'}}></img>
      
      <br/>
      </p></>) },

      { id: 7, text: (<><h1 className={dmc.title}>백엔드 설정</h1>
    <p className={dmc.title2}>3. 웹 앱 배포</p>
    <p className={dmc.tbody}>설정:다음 사용자로 실행: 나 (내 이메일 주소)액세스 권한이 있는 사용자: 모든 사용자
      배포 버튼을 클릭하고 권한을 승인합니다.
      <br/>
      <img src={`${import.meta.env.BASE_URL}gui10.jpg`} height="300px" style={{marginRight: '50px'}}></img>
      <img src={`${import.meta.env.BASE_URL}gui11.jpg`} height="300px" style={{marginleftt: '50px'}}></img>
      <br/>
      </p></>) },

      { id: 8, text: (<><h1 className={dmc.title}>백엔드 설정</h1>
    <p className={dmc.title2}>3. 웹 앱 배포</p>
    <p className={dmc.tbody}>설정:다음 사용자로 실행: 나 (내 이메일 주소)액세스 권한이 있는 사용자: 모든 사용자
      배포 버튼을 클릭하고 권한을 승인합니다.
      <br/>
      <img src={`${import.meta.env.BASE_URL}gui11.jpg`} height="300px" style={{marginRight: '20px'}}></img>
      <img src={`${import.meta.env.BASE_URL}gui12.jpg`} height="300px" style={{marginRight: '20px'}}></img>
      <img src={`${import.meta.env.BASE_URL}gui13.jpg`} height="300px"></img>

      <br/>
      </p></>) },
      
      
  ],
  '프론트엔드 설정': [
    { id: 1, text: (<><h1 className={dmc.title}>프론트엔드 설정</h1>
    <p className={dmc.title2}>1. 프로젝트 클론</p>
      <p className={dmc.tbody}>
      - git을 열고 아래 주소를 클론합니다.
      <br/>
      git clone <a href='https://github.com/youjiyeon12/Yutier.git'target='_blank'>https://github.com/youjiyeon12/Yutier.git</a>
      <br/>
      <br/>
      <img src={`${import.meta.env.BASE_URL}gui111.png`} height="300px" style={{marginRight: '50px'}}></img>
      </p>
      <br/>
      </>) },

    { id: 2, text: (<><h1 className={dmc.title}>프론트엔드 설정</h1>
    <p className={dmc.title2}>2. 필요한 라이브러리 설치</p>
    <p className={dmc.tbody}> 
      -Visual Studio Code에서 Yutier 폴더를 열고 터미널에서 아래 명령어를 입력합니다.
      <br/>
      <u> cd Yutier</u>
      <br/>
      <u> npm install</u>
      <br/>
      <br/>
      <img src={`${import.meta.env.BASE_URL}gui333.png`} height="170px" style={{marginRight: '50px'}}></img>
      <img src={`${import.meta.env.BASE_URL}gui222.png`} height="170px" style={{marginRight: '50px'}}></img>
      </p>
      
    </>) },

    { id: 3, text: (<><h1 className={dmc.title}>프론트엔드 설정</h1>
    <p className={dmc.title2}>3. 환경 변수 설정</p>
    <p className={dmc.tbody}>
    프로젝트 루트 디렉토리에 있는 .env 파일을 엽니다.
    <br/>"YOUR_WEB_APP_URL" 부분에 위에서 복사한 웹 앱 URL을 붙여넣습니다.
    <br/>
    <br/> <i>VITE_APPS_SCRIPT_URL="YOUR_WEB_APP_URL"</i>
    <br/>
    <img src={`${import.meta.env.BASE_URL}gui555.png`} height="240px" style={{marginRight: '50px'}}></img>
    </p>
    </>) },

    { id: 4, text: (<><h1 className={dmc.title}>프론트엔드 설정</h1>
    <p className={dmc.title2}>4 .프론트엔드 서버 실행</p>
    <p className={dmc.tbody}>
    <u>npm run dev</u>
    <br/>
     <br/>
    <img src={`${import.meta.env.BASE_URL}gui444.png`} height="300px" style={{marginRight: '50px'}}></img>
    <br/>
    개발 서버가 http://localhost:5173과 같은 주소에서 실행됩니다.
    </p>
    </>) }
  ]
};

const categories = Object.keys(allGuides); 

function Guide({ user, onLogout }) {
  
  const [currentCategory, setCurrentCategory] = useState(categories[0]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const currentSlideData = allGuides[currentCategory];
  const totalSlides = currentSlideData.length;

  const goToNext = () => {
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  
  const goToPrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
    setCurrentSlideIndex(0);
  };

  const currentContent = currentSlideData[currentSlideIndex].text;

  return (
    <div>

      <Header user={user} onLogout={onLogout} />

      <div className={dmc.topSectionWrapper}>{/* pdf */}
    
      <div className={dmc.menuContent}>
        <span className={dmc.menuTitleText}>
          시작하기
        </span>
        
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            className={currentCategory === category ? dmc.activeCategory : ''}
          >
            {category}
          </button>
        ))}
      </div>

      {/*  PDF 다운로드----------------------------------------------  */}
        <a href={`${import.meta.env.BASE_URL}유티어(Yutier) 프로젝트 상세 배포 가이드.pdf"`} download className={dmc.pdfDownloadLink}>
          <img src={`${import.meta.env.BASE_URL}sheet.png`} alt="PDF Download" className={dmc.pdfIconOnly} />
          <span className={dmc.pdfIconLabel}>상세 배포 가이드 PDF</span>
        </a>

      </div> 
      
      
      
      <div className={dmc.sliderContainer}>
        
        {/* 이전 버튼 */}
        <button 
          onClick={goToPrev} 
          disabled={currentSlideIndex === 0}
          className={dmc.arrowButton} 
          style={{ opacity: currentSlideIndex === 0 ? 0.4 : 1 }} 
        >
          <img 
            src={`${import.meta.env.BASE_URL}arrow-1.png`} 
            alt="이전 슬라이드" 
            className={dmc.arrowImage}
          />
        </button>

        {/* 슬라이드 내용 */}
        <div className={dmc.body} key={currentCategory}>
          {currentContent}
          {/* 페이지 번호 (position: absolute) */}
          <p className={dmc.slideCounter}> 
            {currentSlideIndex + 1} / {totalSlides}
          </p>
        </div>

        {/* 다음 버튼 */}
        <button 
          onClick={goToNext} 
          disabled={currentSlideIndex === totalSlides - 1}
          className={`${dmc.arrowButton} ${dmc.nextButtonMargin}`} 
          style={{ opacity: currentSlideIndex === totalSlides - 1 ? 0.4 : 1 }}
        >
          <img 
            src={`${import.meta.env.BASE_URL}arrow-2.png`} 
            alt="다음 슬라이드" 
            className={dmc.arrowImage}
          />
        </button>
      </div>
      
      <Footer />
    </div>
  );
}

export default Guide;
