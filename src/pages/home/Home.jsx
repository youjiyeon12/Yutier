// 메인 화면
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import styles from './styles/home.module.css';
import List from '../../components/ui/List';
import { googleSheetsService } from '../../services/googleSheetsService';

function Home({ user, onLogout }) {
  const navigate = useNavigate();
  const [tierInfo, setTierInfo] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(false);

  const tierImageMap = {
    Bronze: `${import.meta.env.BASE_URL}tier1.png`,
    Silver: `${import.meta.env.BASE_URL}tier2.png`,
    Gold: `${import.meta.env.BASE_URL}tier3.png`,
    Diamond: `${import.meta.env.BASE_URL}tier4.png`,
    // 기본값
    Unranked: `${import.meta.env.BASE_URL}tier0.png`
  };

  // 컴포넌트가 로드될 때 사용자의 점수 상태를 확인
  useEffect(() => {
    if (user && user.id) {
      const checkUserScoreStatus = async () => {
        try {
          console.log("홈화면 - 티어 정보 조회 시작");
          const data = await googleSheetsService.getTierInfo(user.id);
          console.log("홈화면 - 티어 정보 응답:", data);
          setTierInfo(data); // API 응답 전체를 저장
        } catch (err) {
          console.error("점수 정보 확인 실패:", err);
          setTierInfo({ success: false }); // 에러 발생 시 점수가 없는 것으로 간주
        }
      };
      checkUserScoreStatus();
    }
  }, [user]);

  // 추천 프로그램 가져오기
  useEffect(() => {
    if (!user?.id) return;

    const fetchRecommendedPrograms = async () => {
      setLoading(true);
      try {
        console.log("홈화면 - 추천 프로그램 조회 시작");
        const [year, semester] = [2025, 2];
        const data = await googleSheetsService.getRecommendedPrograms(user.id, year, semester);
        console.log("홈화면 - 추천 프로그램 응답:", data);
        
        if (data.success) {
          setRecommended(data.data || []);
        } else {
          console.log("추천 프로그램 조회 실패:", data.message);
          setRecommended([]);
        }
      } catch (err) {
        console.error("추천 프로그램 조회 실패:", err);
        setRecommended([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedPrograms();
  }, [user]);

  // '점수 입력하러 가기' 버튼 클릭 시 실행될 함수
  const handleGoToMatrix = async () => {
    try {
      console.log("홈화면 - 매트릭스 URL 검증 시작");
      const data = await googleSheetsService.validateMatrixUrl(user.id);
      console.log("홈화면 - URL 검증 결과:", data);
      
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

  // 디버깅 정보
  console.log("홈화면 렌더링 - user:", user);
  console.log("홈화면 렌더링 - tierInfo:", tierInfo);
  console.log("홈화면 렌더링 - recommended:", recommended);
  console.log("홈화면 렌더링 - loading:", loading);

  return (
    <div className={styles.container}>
      <Header user={user} onLogout={onLogout} />
      <div className={styles.container_wrap}>
        <div className={styles.bannerCard}>
          <img src={`${import.meta.env.BASE_URL}banner.png`} alt='배너' ></img>
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
                  <path d="M12 2L2 7V17L12 22L22 17V7L12 2ZM12 12.33L19.98 8.02L12 3.67L4.02 8.02L12 12.33ZM3.96 9.28L11 13.56V20.04L3.96 15.73V9.28ZM13 20.04V13.56L20.04 9.28V15.73L13 20.04Z" fill="#E0E0E0" />
                </svg>
              )}
            </div>
            <div className={styles.userInfo}>
              <p className={styles.gradeLabel}>&lt;{tierInfo?.currentTier || 'Unranked'}&gt;</p>
              <p className={styles.userMajor}>{user.department && user.major ? `${user.department} ${user.major}` : user.department || '전공 정보 없음'}</p>
              <p className={styles.userName}>{user.name || user.id} 님</p>
            </div>
          

          {/* 점수 상태에 따라 다른 버튼*/}
          {!tierInfo ? (
            <div className={styles.loadingWrapper}>
              <p>정보를 불러오는 중...</p>  
            </div>
          ) : tierInfo.success ? (
            <button onClick={() => navigate('/mypage')} className={styles.scoreLink}>
              내 정보 보러 가기
            </button>
          ) : (
            <button onClick={handleGoToMatrix} className={styles.scoreLink}>
              점수 입력하러 가기
            </button>
          )}
          </div>
        

        {/* 추천 프로그램 리스트 */}
        <div className={styles.programCard}>
          <div
            className={styles.programContent}
            style={{
              minHeight: "150px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            {loading ? (
              <span>추천 프로그램 리스트 로딩 중...</span>
            ) : recommended && recommended.length > 0 ? (
              <List data={recommended} />
            ) : (
              <div style={{ textAlign: "center", color: "#666" }}>
                <p>추천 프로그램이 없습니다.</p>
                <p style={{ fontSize: "14px", marginTop: "10px" }}>
                  매트릭스 URL을 등록하고 점수를 입력하면 추천 프로그램을 확인할 수 있습니다.
                </p>
              </div>
            )}
          </div>
        </div>  
      </div>

      <div className={styles.linkSection}>
        <div className={styles.linkCard}>
          <a href="https://trust.yuhan.ac.kr/" target="_blank"><img src={`${import.meta.env.BASE_URL}shortcut_banner/biba.png`} alt ="비통시 바로가기"></img></a> 
        </div>
        <div className={styles.linkCard}>
          <a href="https://portal.yuhan.ac.kr/" target="_blank"><img src={`${import.meta.env.BASE_URL}shortcut_banner/poba.png`} alt="포털 바로가기"></img></a>
        </div>
        <div className={styles.linkCard}>
           <a href="/[Yutier]YuhanTRUST_프로그램정리.zip" download><img src={`${import.meta.env.BASE_URL}shortcut_banner/seda.png`} alt="파일 다운로드"></img></a>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Home;