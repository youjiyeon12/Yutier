// 상단 화면
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles/header.module.css';
import { googleSheetsService } from '../../services/googleSheetsService';

function Header({ user, onLogout }){
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };
  
  const handleMatrixClick = async () => {
    try {
      setLoading(true);

      if (!user || !user.id) {
        console.error("로그인 정보 없음");
        navigate('/matrix-url');
        return;
      }

      const data = await googleSheetsService.validateMatrixUrl(user.id);

      if (data.valid) { 
        navigate('/matrix');
      } else {
        navigate('/matrix-url');
      }
    } catch (err) {
      console.error("URL 확인 실패:", err);
      navigate('/matrix-url');
    } finally {
      setLoading(false);
    }
  };


    return (
    <>
    <div className={styles.header}>
      <img className={styles.symbol} alt="yutierSymbol2" src={`${import.meta.env.BASE_URL}yutierSymbol2.svg`} onClick={() => navigate('/')}/>
      <div className={styles.menu}>
        <p><span onClick={() => navigate('/')}>HOME</span></p>
        <p><span onClick={() => navigate('/detail')}>YUHAN TRUST란?</span></p>
        <p><span onClick={() => navigate('/guide')}>설정가이드</span></p>
        <p><span onClick={handleMatrixClick}>매트릭스</span></p>
        {/* 로그인 여부에 따른 버튼 변화 */}
        {user ? (
          // 로그인 상태
          <>
          <button className={styles.btn1} onClick={() => navigate('/mypage')}>마이페이지</button>
          <button className={styles.btn2} onClick={handleLogout}>로그아웃</button>
          </>
        ) : (
          //로그아웃 상태
          <>
          <button className={styles.btn1} onClick={() => navigate('/login')}>로그인</button>
          <button className={styles.btn2} onClick={() => navigate('/signup')}>회원가입</button>
          </>
        )}
      </div>
    </div>

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loader}></div>
          <p>매트릭스로 이동 중...</p>
        </div>
      )}
    </>
    );
}
export default Header;