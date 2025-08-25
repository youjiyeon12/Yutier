// 메인 화면
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import styles from './home.module.css';

function Home({ user, onLogout }) {
  const navigate = useNavigate();
  const [tierInfo, setTierInfo] = useState(null);

  const tierImageMap = {
    Bronze: '/tier1.png',
    Silver: '/tier2.png',
    Gold: '/tier3.png',
    Diamond: '/tier4.png',
    // 기본값
    Unranked: '/tier1.png' 
  };

  // 컴포넌트가 로드될 때 사용자의 점수 상태를 확인
  useEffect(() => {
    if (user && user.id) {
      const checkUserScoreStatus = async () => {
        try {
          const res = await fetch(`http://localhost:3001/api/tier-info?id=${user.id}`);
          const data = await res.json();
          setTierInfo(data); // API 응답 전체를 저장
        } catch (err) {
          console.error("점수 정보 확인 실패:", err);
          setTierInfo({ success: false }); // 에러 발생 시 점수가 없는 것으로 간주
        }
      };
      checkUserScoreStatus();
    }
  }, [user]);

  // '점수 입력하러 가기' 버튼 클릭 시 실행될 함수
  const handleGoToMatrix = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/validate-matrix-url?id=${user.id}`);
      const data = await res.json();
      if (data.valid) {
        navigate('/matrix');
      } else {
        navigate('/matrix-url');
      }
    } catch (err) {
      console.error("URL 확인 실패:", err);
      navigate('/matrix-url');
    }
  };

  return (
    <div className={styles.container}>
      <Header user={user} onLogout={onLogout} />
      <div className={styles.container_wrap}>
        <div className={styles.bannerCard}>
          <p>배너자리</p>
        </div>
        <div className={styles.profileCard}>
          <div className={styles.tierIcon}>
            {/* 로딩 중이거나 점수가 없을 때는 기본 아이콘, 점수가 있으면 티어 아이콘 */}
            {tierInfo && tierInfo.success ? (
              <img 
                src={tierImageMap[tierInfo.currentTier] || tierImageMap['Unranked']} 
                alt={`${tierInfo.currentTier} 티어`}
                className={styles.tierImage} 
              />
            ) : (
              <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 12.33L19.98 8.02L12 3.67L4.02 8.02L12 12.33ZM3.96 9.28L11 13.56V20.04L3.96 15.73V9.28ZM13 20.04V13.56L20.04 9.28V15.73L13 20.04Z" fill="#E0E0E0"/>
              </svg>
            )}
          </div>
          <div className={styles.userInfo}>
            <p className={styles.userMajor}>{user.department || '전공 정보 없음'}</p>
            <p className={styles.userName}>{user.name || user.id} 님</p>
          </div>
          
          {/* 점수 상태에 따라 다른 버튼*/}
          {!tierInfo ? (
            <p>정보를 불러오는 중...</p>
          ) : tierInfo.success ? (
            <button onClick={() => navigate('/mypage')} className={styles.scoreLink}>
              내 등급 보러 가기
            </button>
          ) : (
            <button onClick={handleGoToMatrix} className={styles.scoreLink}>
              점수 입력하러 가기
            </button>
          )}
        </div>
      </div>
      <Footer/>
    </div>
  );
};

export default Home;