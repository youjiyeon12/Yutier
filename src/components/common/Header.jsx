// 상단 화면
//import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles/header.module.css';

function Header({ user, onLogout }){
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };
  
    return (
    <div className={styles.header}>
      <img className={styles.symbol} alt="yutierSymbol2" src={`${import.meta.env.BASE_URL}yutierSymbol2.svg`} onClick={() => navigate('/')}/>
      <div className={styles.menu}>
        <p><span onClick={() => navigate('/')}>HOME</span></p>
        <p><span onClick={() => navigate('/detail')}>YUHAN TRUST란?</span></p>
        <p><span onClick={() => navigate('/guide')}>설정가이드</span></p>
        <p><span onClick={() => navigate('/matrix')}>매트릭스</span></p>
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
    );
}
export default Header;