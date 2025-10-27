import React, { useState } from 'react';
import Header from '../../components/common/Header';
import Footer from "../../components/common/Footer";
import dmc from "./styles/guide.module.css"; 

const slideContents = [
  { 
    id: 1, 
    text: (
      <>
        <h1 className={dmc.title}>Yutier 매트릭스 등록하는 방법</h1>
        <p style={{ fontSize: "18px"}}>
          1. [로그인] - [마이페이지] - [매트릭스 관리]으로 들어갑니다
          <br/>
          2. [매트릭스 관리]으로 들어가서 '매트릭스 사본 만들기'를 클릭합니다.
          <br/>
          3. 매트릭스로 들어왔다면 화면 맨 위의 본인의 시트 URL을 복사한  후 '공유' 버튼을 누릅니다
          <img src="/sc6.png" 
            className={dmc.guideImage}/>
        </p>
      </>
    ) 
  },
  { 
    id: 2, 
    text: (
      <>
      <h1 className={dmc.title}>Yutier 매트릭스 등록하는 방법</h1>
        <p>
          4. 복사한 URL을 사본 공유에 붙여 넣은 후 완료를 누릅니다. 
          <br/>
          5. YUTER 웹페이지로 돌아온 후 아래 사본 시트 URL을 넣고 조회를 누르세요.
          <img src="/sc8.png" 
           className={dmc.guideImage}/>
        </p>
      </>
    )
  },
   { 
    id: 3, 
    text: (
      <>
        <h1 className={dmc.title}>Yutier 매트릭스 등록하는 방법</h1>
        <p>
          6. 매트릭스 점수 입력하는 페이지가 나오면 유한대학교 포털(<a href='https://portal.yuhan.ac.kr/'n target='_blank'>https://portal.yuhan.ac.kr/</a>)로 이동합니다. 
          <br/>
          7. 로그인 후 [학생이력]으로 들어가줍니다.
          <br/>
          8. '나의 TRUST인증 현황' 아래에 각각의 자신의 점수를 Yutier 웹페이지로 돌아와 입력해줍니다.
              <img src="/sc9.png"
            className={`${dmc.guideImage} ${dmc.largeImage}`} />
        </p>
      </>
    ) 
  },
   { 
    id: 4,    
    text: (
      <>
         <h1 className={dmc.title}>Yutier 매트릭스 등록하는 방법</h1>
        <p>
          
        </p>
      </>
    ) 
  },
   { 
    id: 5, 
    text: (
      <>
         <h1 className={dmc.title}>Yutier 매트릭스 등록하는 방법</h1>
        <p>
          
        </p>
      </>
    ) 
  },
  // 필요한 만큼 슬라이드를 추가
];


function Guide({ user, onLogout }) {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const totalSlides = slideContents.length;

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

  const currentContent = slideContents[currentSlideIndex].text;

  return (
    <div>
      <Header user={user} onLogout={onLogout} />
      
      {/* 💡 슬라이더 전체 컨테이너에 dmc.sliderContainer 클래스 적용 */}
      <div className={dmc.sliderContainer}>
        
        {/* 이전 버튼 */}
        <button 
          onClick={goToPrev} 
          disabled={currentSlideIndex === 0}
          className={dmc.arrowButton} 
          style={{ 
            // opacity만 인라인으로 유지
            opacity: currentSlideIndex === 0 ? 0.4 : 1 
          }} 
        >
          <img 
            src="/arrow-1.png" 
            alt="이전 슬라이드" 
            className={dmc.arrowImage} // 이미지 크기 클래스
          />
        </button>

        
        <div className={dmc.body} key={currentSlideIndex}>
          {currentContent}
          
          {/* 현재가 몇 번째 페이지인지 */}
            <p className={dmc.slideCounter}> 
              {currentSlideIndex + 1} / {totalSlides}
            </p>
        </div>

        <button 
          onClick={goToNext} 
          disabled={currentSlideIndex === totalSlides - 1}
          // 공통 버튼 클래스와 추가 마진 클래스 모두 적용
          className={`${dmc.arrowButton} ${dmc.nextButtonMargin}`} 
          style={{ 
            // opacity만 인라인
            opacity: currentSlideIndex === totalSlides - 1 ? 0.4 : 1
          }}
        >
          <img 
            src="/arrow-2.png" 
            alt="다음 슬라이드" 
            className={dmc.arrowImage} // 이미지 크기 클래스
          />
        </button>
      </div>
      
      <Footer />
    </div>
  );
}

export default Guide;