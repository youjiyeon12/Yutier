import { useState } from 'react';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import style from './styles/matrixURLSubmit.module.css';
import { useNavigate } from 'react-router-dom'
import { googleSheetsService } from '../../services/googleSheetsService';

function MatrixURLSubmit({ user, onLogout }) {
  
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (loading) return;
    
    if (!url.trim()) {
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

    setLoading(true);
    try {
      const result = await googleSheetsService.verifyMatrixUrl(user.id, url);

      if (result.success) {
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
    } finally {
      setLoading(false);
    }
  };

return (
  <>
    <Header user={user} onLogout={onLogout} />

    <div className={style.container}>
      <main className={style.mainContent}>
        <div className={style.content}>

          <button
            onClick={() => setShowHelp(true)}
            className={style['help-button-corner']} 
            >
            <img
            src={`${import.meta.env.BASE_URL}question.png`}
            alt={`${import.meta.env.BASE_URL}도움말 버튼`}
            className={style['help-icon']} 
            />
          </button>

        <h2>🗂️ 유한 TRUST 매트릭스 제출</h2>
          <ol>
            <li>
              아래 템플릿 링크를 클릭해 사본을 만들어 주세요.
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
              사본 시트에서 <b>공유 &gt; 링크가 있는 모든 사용자 &gt; 편집자</b>로 변경하세요.
            </li>
            <li>아래에 본인의 시트 URL을 붙여넣고 '<b>조회</b>'를 클릭하세요.</li>
          </ol>

          <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
          <label>📄 사본 시트 URL:</label>
          <input aria-label="매트릭스 시트 URL"
            type="text"
            className={style.input}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="URL을 입력하세요"
          />
          <button type="submit" className={style.button} disabled={loading} aria-busy={loading}>{loading ? '확인 중...' : '조회'}</button>
          </form>

          {error && <p style={{ color: 'red' }}>{error}</p>}
          {success && <p style={{ color: 'green' }}>✅ 저장되었습니다.</p>}

         {showHelp && (
          <div 
          className={style['modal-overlay']} 
          onClick={() => { setShowHelp(false); setCurrentSlide(0); }}
          >

            <div 
            className={style['help-window']} 
            onClick={(e) => e.stopPropagation()}>


  {(() => {
 const slideContents = [
  { 
    id: 1, 
    text: (
      <>
        <h3 className={style.title}>Yutier 매트릭스 등록</h3>
        <p className={style.tbody}>
         1. [매트릭스 사본 만들기] 클릭합니다
        <br/>
         2. Google Sheet가 나왔다면 한 번 더 [사본 만들기] 클릭합니다
        <br/>
        
        </p>
       <img src={`${import.meta.env.BASE_URL}url1.png`} height="390px"
      className={style.guideImage}/>
    </>
    ) 
  },
 { 
      id: 2, 
      text: (
          <>
          <h3 className={style.title}>Yutier 매트릭스 등록</h3>
          <p className={style.tbody}>
          3.[공유] 버튼을 눌러 사본 공유로 들어갑니다.
          <br/>
          4. 엑세스에서 '제한됨'을 '링크가 있는 모든 사용자'로 바꿉니다.
        </p>
        <img src={`${import.meta.env.BASE_URL}url3.png`} height="390px" style={{ marginTop: '30px', marginRight: '40px' }}></img>
        <img src={`${import.meta.env.BASE_URL}url4.png`} height="390px" style={{ marginTop: '30px' }}></img>
      </>
    )
  },
  { 
      id: 3, 
      text: (
          <>
          <h3 className={style.title}>Yutier 매트릭스 등록</h3>
          <p className={style.tbody}>
          5. '뷰어' 탭을 눌러 뷰어가 아닌 '편집자'로 바꿉니다.
          <br/>
          6. 후에는 링크를 복사하여 [완료]를 누릅니다.
        </p>
        <img src={`${import.meta.env.BASE_URL}url5.png`} height="390px" style={{ marginTop: '30px' , marginRight: '40px'}}></img>
        <img src={`${import.meta.env.BASE_URL}url6.png`} height="390px" style={{ marginTop: '30px' }}></img>
      </>
    )
  },
  { 
      id: 4, 
      text: (
          <>
          <h3 className={style.title}>Yutier 매트릭스 등록</h3>
          <p className={style.tbody}>
          7. Yuier 사이트로 돌아와 붙여넣기 후 조회를 클릭합니다.
        </p>
        <img src={`${import.meta.env.BASE_URL}url7.png`} height="400px" style={{ marginTop: '30px' }}></img>
      </>
    )
  },
  
 ];

      return (
      <>
          <button
            onClick={() => { setShowHelp(false); setCurrentSlide(0); }}
            className={style['close-button']} 
            >
          &times;
          </button>

          <div className={style.slideContentArea}>
             {slideContents[currentSlide].text}
          </div>

          <div className={style.slideControlsBottomLeft}>
          <button
          onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
          disabled={currentSlide === 0} 
          className={style.slideNavButton}
          >
      <img 
      src={`${import.meta.env.BASE_URL}arrow-left.png`} 
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
          <img src={`${import.meta.env.BASE_URL}arrow-right.png`} alt="다음" className={style.slideNavIcon}/>
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
