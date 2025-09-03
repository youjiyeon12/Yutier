// 마이페이지
import { useState, useEffect } from 'react';
//import { useSearchParams } from 'react-router-dom';
import Header from "../Header";
import Footer from "../Footer";
import styles from "./mypage.module.css";
import MemInfoEdit from './MemInfoEdit'; // 회원 정보 수정 컴포넌트
import { useNavigate } from 'react-router-dom';
import List from "./List";
import axios from 'axios'

// props로 로그인한 사용자 정보 user를 받아서 화면에 표시
function Mypage({ user, setUser, onLogout }) {
  // console.log("Mypage에서 받은 user 정보:", user);

  const navigate = useNavigate();

  // URL에 파라미터 없이 상태 유지
  const [selectedMenuKey, setSelectedMenuKey] = useState("회원 정보");

  // 티어 정보 상태
  const [tierInfo, setTierInfo] = useState(null);

  // 서버에서 가져온 추천 프로그램 데이터
  const [recommended, setRecommended] = useState([]);;
  // 추천 프로그램 로딩 상태 
  const [loading, setLoading] = useState(false);

  // 메뉴 클릭 시 localStorage에 저장
  const handleMenuClick = async (menuKey) => {
    setSelectedMenuKey(menuKey)

    // 쿼리 파라미터 제거
    window.history.replaceState({}, "", "/mypage")

    // 매트릭스 페이지로 이동
    if (menuKey === "매트릭스 관리") {
      try {
        const res = await fetch(`http://localhost:3001/api/validate-matrix-url?id=${user.id}`);
        const data = await res.json();

        if (data.valid) {
          navigate('/matrix'); // URL이 있으면 matrix로
        }
        else {
          navigate('/matrix-url'); // 없으면 등록 페이지로
        }
      }
      catch (err) {
        console.error("URL확인 실패:", err);
        navigate('/matrix-url'); // 에러 시 기본값으로 이동
      }
    }
  }

  // URL 정리 useEffect
  useEffect(() => {
    // 쿼리 파라미터 제거
    window.history.replaceState({}, "", "/mypage")
  }, [])

  // 서버에서 티어 정보를 가져오는 useEffect
  useEffect(() => {
    // 로그인한 사용자 정보(user.id)가 있을 때만 API를 호출
    if (user && user.id) {
      const fetchTierInfo = async () => {
        try {
          // 서버에 티어 정보를 요청합
          const res = await fetch(`http://localhost:3001/api/tier-info?id=${user.id}`);
          const data = await res.json();
          setTierInfo(data); // 받아온 데이터를 tierInfo state에 저장
        } catch (err) {
          console.error("티어 정보 로딩 실패:", err);
          // 기본값
          setTierInfo({
            currentTier: 'Unranked',
            currentScore: 0,
            nextTier: 'Bronze',
            scoreForNextTier: 70
          });
        }
      };

      fetchTierInfo();
    }
  }, [user]);



  useEffect(() => {
    const fetchRecommendedPrograms = async () => {
      // 사용자 정보가 없거나 매트릭스 URL이 없으면 API 호출 중단
      if (!user?.id || !user?.matrixUrl) {
        console.log('추천 프로그램을 불러오지 못했습니다.');
        setRecommended([]); // 추천 프로그램 목록을 비움
        return;
      }

      setLoading(true); // 로딩 시작
      const [year, semester] = [2025, 2]; // 호출할 시트의 연도와 학기

      try {
        const response = await axios.get('http://localhost:3001/api/get-recommended-programs', {
          params: { id: user.id, year: year, semester: semester }
        });

        if (response.data.success) {
          setRecommended(response.data.data);
        } else {
          console.error("추천 프로그램 조회 실패:", response.data.message);
          setRecommended([]);
        }
      } catch (err) {
        console.error("API 호출 오류:", err);
        setRecommended([]);
      } finally {
        setLoading(false); // 로딩 종료
      }
    };

    // 회원 정보 메뉴만 추천 프로그램 목록 호출 ( 과도한 API 호출 방지 )
    if (selectedMenuKey === "회원 정보") {
      fetchRecommendedPrograms();
    } else {
      setRecommended([]); // 다른 메뉴 선택 시 추천 목록을 비움
    }
  }, [user, selectedMenuKey]);

  // 왼쪽 사이드바에 표시될 목록
  const navigationItems = [
    { key: "profile", label: "회원 정보", active: true },
    { key: "edit", label: "회원 정보 수정", active: false },
    { key: "matrix", label: "매트릭스 관리", active: false },
    { key: "withdraw", label: "회원 탈퇴", active: false },
  ];

  // 회원 상세 정보 - user 객체에서 값 가져옴 (없으면 기본값)
  const memberDetails = [
    { label: "이름", value: user?.name || "유티어" },
    { label: "아이디", value: user?.id || "yutierid" },
    { label: "학부/전공", value: user?.department && user?.major ? `${user.department} ${user.major}` : (user?.department || "유한전공") },
    { label: "학번", value: user?.studentId || "123456789" },
  ];

  const tierImageMap = {
    Bronze: '/tier1.png',
    Silver: '/tier2.png',
    Gold: '/tier3.png',
    Diamond: '/tier4.png',
    // 기본값
    Unranked: '/tier1.png'
  };

  return (
    <div className={styles.container}>
      <Header user={user} onLogout={onLogout} />

      <div className={styles.contentWrapper}>
        {/* 왼쪽 사이드바 */}
        <div className={styles.sidebarCard}>
          <div>
            <p className={styles.pageTitle}>마이페이지</p>
          </div>
          <div className={styles.navList}>
            {navigationItems.map((item, index) => (
              <button
                key={index}
                className={`${styles.navItem} ${selectedMenuKey === item.label ? styles.active : ""}`}
                onClick={() => handleMenuClick(item.label)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className={styles.mainContent}>
          {selectedMenuKey === "회원 정보" && (
            <>
              {/* 유저 등급, 회원 상세 정보 */}
              <div className={styles.gradedetailCard}>
                {/* 로딩 중일 때 */}
                {!tierInfo ? (
                  <div className={styles.gradeInfoBox}>
                    <div>티어 정보를 불러오는 중입니다...</div>
                  </div>
                ) :

                  // 점수가 없을 때 (API 응답에서 success가 false일 때)
                  !tierInfo.success ? (
                    <div className={styles.gradeInfoBox}>
                      <div className={styles.noScoreBox}>
                        <h3>아직 등록된 점수가 없습니다.</h3>
                        <p>매트릭스 관리 페이지에서 점수를 입력하고 나의 등급을 확인해보세요!</p>
                        <button
                          className={styles.goToMatrixButton}
                          onClick={() => handleMenuClick("매트릭스 관리")}
                        >
                          점수 입력하러 가기
                        </button>
                      </div>
                    </div>
                  ) : (

                    // 점수가 있을 때
                    <div className={styles.gradeInfoBox}>
                      <div className={styles.showTierGroup}>
                        <div className={styles.showTierImage}>
                          <img
                            src={tierImageMap[tierInfo.currentTier] || tierImageMap['Unranked']}
                            alt={`${tierInfo.currentTier} 티어 이미지`}
                          />
                        </div>
                        <div className={styles.showTierText}>
                          <div className={styles.userName}>{user?.name || "유티어"} 님</div>
                          <div className={styles.userGrade}>
                            <span className={styles.gradeLabel}>{tierInfo.currentTier}</span> 등급입니다
                          </div>
                        </div>
                      </div>
                      <div className={styles.nextGradeBox}>
                        {/* 1위이면 축하 메시지 표시 */}
                        {tierInfo.isRankOne ? (
                          <div className={styles.rankOneMessage}>
                            🥳 전체 1위입니다! 🥳<br />🎉 축하합니다! 🎉
                          </div>
                          // 언랭크일 경우
                        ) : tierInfo.currentTier === 'Unranked' ? (
                          <div className={styles.unrankedGoal}>
                            <div className={styles.nextGradeText}>
                              다음 등급인 <span className={styles.gradeLabel}>Bronze</span>까지
                            </div>
                            <div className={styles.score}>
                              모든 역량 70점 이상 필요
                            </div>
                          </div>
                        ) : (
                          // 1등이 아닐 경우, 다음 목표(등급 또는 1등)와 필요 점수 표시
                          (() => {
                            const scoreNeeded = Math.max(0, tierInfo.scoreForNextTier - tierInfo.currentScore);
                            const displayScore = scoreNeeded % 1 === 0 ? scoreNeeded : scoreNeeded.toFixed(1);
                            return (
                              <>
                                <div className={styles.nextGradeText}>
                                  {tierInfo.nextTier === '1위' ? '전체 ' : '다음 등급인 '}
                                  <span className={styles.gradeLabel}>{tierInfo.nextTier}</span>까지
                                </div>
                                <div className={styles.score}>
                                  {displayScore}점 필요
                                </div>
                              </>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  )}
                {/* 회원 상세 정보*/}
                <div className={styles.detailContent}>
                  <p className={styles.sectionTitle}>회원 상세 정보</p>
                  <div className={styles.detailList}>
                    {memberDetails.map((detail, index) => (
                      <div key={index} className={styles.detailItem}>
                        <span className={styles.detailLabel}>{detail.label}</span>
                        <span className={styles.detailValue}>{detail.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
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
                  ) : (
                    <List data={recommended} />
                  )}
                </div>
              </div>
            </>
          )}

          {/* 회원 정보 수정 */}
          {selectedMenuKey === "회원 정보 수정" && (
            <MemInfoEdit user={user} setUser={setUser} />
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Mypage;