// URL 제출 화면
import { useState, useEffect } from 'react';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import style from './styles/matrixURLSubmit.module.css';
import { useNavigate } from 'react-router-dom'
import { googleSheetsService } from '../../services/googleSheetsService';


// 조회 버튼 클릭 시 실행
function MatrixURLSubmit({ user, onLogout }) {
  console.log("🔍 [MatrixURLSubmit] 컴포넌트 렌더링 시작");
  console.log("🔍 [MatrixURLSubmit] 받은 user 정보:", user);
  console.log("🔍 [MatrixURLSubmit] user.id:", user?.id);
  
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  //도움말 버튼
  const [showHelp, setShowHelp] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  

  const handleSubmit = async () => {
    console.log("🔍 [MatrixURLSubmit] handleSubmit 시작");
    console.log("🔍 [MatrixURLSubmit] 입력된 URL:", url);
    
    if (!url.trim()) {
      console.log("❌ [MatrixURLSubmit] URL이 비어있습니다.");
      setError('URL을 입력하세요.');
      setSuccess(false);
      return;
    }

    if (!user?.id) {
      console.error("❌ [MatrixURLSubmit] user.id가 없습니다.");
      setError('사용자 정보가 없습니다.');
      setSuccess(false);
      return;
    }

    // Apps Script 경유 서비스 호출
    try {
      console.log("🔍 [MatrixURLSubmit] verifyMatrixUrl API 호출 시작");
      const result = await googleSheetsService.verifyMatrixUrl(user.id, url);
      console.log("🔍 [MatrixURLSubmit] verifyMatrixUrl 응답:", result);

      if (result.success) {
        console.log("✅ [MatrixURLSubmit] URL 검증 성공");
        setError('');
        setSuccess(true);
        navigate('/matrix');
      } else {
        console.error("❌ [MatrixURLSubmit] URL 검증 실패:", result.message);
        setError(result.message || '서버 오류');
        setSuccess(false);
      }
    } catch (err) {
      console.error("❌ [MatrixURLSubmit] API 호출 오류:", err);
      setError('요청 실패');
      setSuccess(false);
    }
  };

return (
  <>
    <Header user={user} onLogout={onLogout} />

    <div className={style.container}>
      <main className={style.mainContent}>
        <div className={style.content}>

        
        {/* 도움말 버튼 ----------------------------------------- */}
          <button
            onClick={() => setShowHelp(true)}
            className={style['help-button-corner']} 
            >
            <img
            src="question.png"
            alt="도움말 버튼"
            className={style['help-icon']} 
            />
          </button>

        <h2>🗂️ 유한 TRUST 매트릭스 제출</h2>
          <ol>
            <li>
              🔗 아래 템플릿 링크를 클릭해 사본을 만들고 점수를 입력하세요:
              <br />
              <a
                href="https://docs.google.com/spreadsheets/d/1x_8ecj8ocy-dti7O9IzQLGiJ8uho9YCNhu1KCPttib8/copy"
                target="_blank"
                rel="noopener noreferrer"
              >
                ▶ 매트릭스 템플릿 사본 만들기
              </a>
            </li>
            <li>
              👥 사본 시트는 Apps Script 웹앱이 접근 가능한 위치(스크립트 소유자 계정이 접근 가능한 드라이브)에 두세요.
            </li>
            <li>🔍 아래에 본인의 시트 URL을 붙여넣고 ‘조회’를 클릭하세요.</li>
          </ol>

          <label>📄 사본 시트 URL:</label>
          <input
            type="text"
            className={style.input}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL을 입력하세요"
          />
          <button onClick={handleSubmit} className={style.button}>조회</button>

          {error && <p style={{ color: 'red' }}>{error}</p>}
          {success && <p style={{ color: 'green' }}>✅ 저장되었습니다.</p>}

         {/* 도움말 버튼: className="help-button" 사용 */}
     
         {showHelp && (
          // 모달 오버레이
          <div 
          className={style['modal-overlay']} 
          // 💡 모달이 닫힐 때 슬라이드를 1페이지로 리셋합니다.
          onClick={() => { setShowHelp(false); setCurrentSlide(0); }}
          >

            {/* 도움말 창 본체 */}
            <div 
            className={style['help-window']} 
            onClick={(e) => e.stopPropagation()}>

{/*[2단계] 슬라이드 콘텐츠를 모달 안에 직접 정의합니다. */}
  {(() => {
 const slideContents = [
  { 
    id: 1, 
    text: (
      <>
        <h3 className={style.title}>Yutier 매트릭스 등록 (1/2)</h3>
        <p style={{ fontSize: "16px"}}>
        1. [로그인] - [마이페이지] - [매트릭스 관리]
        <br/>
        2. '매트릭스 사본 만들기' 클릭
        <br/>
        3. 시트 URL 복사 후 '공유' 버튼 클릭
        <img src="/sc6.png" height="410"
          className={style.guideImage}/>
      </p> 
    </>
    ) 
  },
 { 
      id: 2, 
      text: (
          <>
          <h3 className={style.title}>Yutier 매트릭스 등록 (2/2)</h3>
          <p>
          4. 복사한 URL을 사본 공유에 붙여넣기
          <br/>
          5. YUTER 웹페이지로 돌아와 URL 붙여넣고 '조회'
          <img src="/sc8.png" className={style.guideImage}/>
          </p>
      </>
    )
  }
 ];

      return (
      <>
          {/* 닫기 버튼 */}
          <button
            onClick={() => { setShowHelp(false); setCurrentSlide(0); }}
            className={style['close-button']} 
            >
          &times;
          </button>

          {/* 슬라이드 내용 영역 */}
          <div className={style.slideContentArea}>
             {slideContents[currentSlide].text}
          </div>

          {/* 슬라이드 제어 버튼 */}
          <div className={style.slideControlsBottomLeft}>
          <button
          onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
          disabled={currentSlide === 0} 
          className={style.slideNavButton}
          >
      <img 
      src="/arrow-left.png" 
      alt="이전" 
      className={style.slideNavIcon}/>

      </button>
        <span className={style.slidePageIndicator}>
        {currentSlide + 1} / {slideContents.length}
        </span>
          <button
            onClick={() => setCurrentSlide(prev => Math.min(slideContents.length - 1, prev + 1))}
            disabled={currentSlide === slideContents.length - 1} 
            className={style.slideNavButton}>
          <img src="/arrow-right.png" alt="다음" className={style.slideNavIcon}/>
              </button>
            </div>
          </>
          );
       })()}
  </div>
</div>
 )}

        </div>
      </main>
    </div>

    <Footer />
  </>
);
}

export default MatrixURLSubmit;
