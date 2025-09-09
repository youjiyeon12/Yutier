// URL 제출 화면
import { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import style from './matrixURLSubmit.module.css';
import { useNavigate } from 'react-router-dom'

// 조회 버튼 클릭 시 실행
function MatrixURLSubmit({ user, onLogout }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!url.trim()) {
      setError('URL을 입력하세요.');
      setSuccess(false);
      return;
    }

    // 서버 응답
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/verify-matrix-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: user.id, url }),
      });

      const result = await response.json();

      if (result.success) {
        setError('');
        setSuccess(true);
        navigate('/matrix');
      } else {
        setError(result.message || '서버 오류');
        setSuccess(false);
      }
    } catch (err) {
      setError('서버 연결 실패');
      setSuccess(false);
    }
  };

return (
  <>
    <Header user={user} onLogout={onLogout} />

    <div className={style.container}>
      <main className={style.mainContent}>
        <div className={style.content}>
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
              👥 사본 시트에서 공유 ▶ 서비스 계정 이메일 추가:
              <br />
              <code>yuhantrust@yuhan-459709.iam.gserviceaccount.com</code>
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
        </div>
      </main>
    </div>

    <Footer />
  </>
);
}

export default MatrixURLSubmit;
