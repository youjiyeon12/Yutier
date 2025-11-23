/**
 * 마이페이지 컴포넌트
 * 사용자의 개인정보, 티어 정보, 추천 프로그램을 표시하는 메인 페이지
 * 
 * 주요 기능:
 * - 사용자 정보 표시 및 수정
 * - 티어 정보 조회 및 표시
 * - 추천 프로그램 조회 및 표시
 * - 매트릭스 관리 페이지로 이동
 * 
 * @param {Object} props - 컴포넌트 props
 * @param {Object} props.user - 로그인한 사용자 정보
 * @param {Function} props.setUser - 사용자 정보 업데이트 함수
 * @param {Function} props.onLogout - 로그아웃 함수
 */
import { useState, useEffect } from 'react';
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import styles from "./styles/mypage.module.css";
import MemInfoEdit from './MemInfoEdit';
import DeleteAccount from './DeleteAccount'
import { useNavigate } from 'react-router-dom';
import List from "../../components/ui/list";
import { googleSheetsService } from '../../services/googleSheetsService';

function Mypage({ user, setUser, onLogout }) {
  // 개발 모드에서만 로깅
  if (import.meta.env.DEV) {
    console.log("🏠 [Mypage] 컴포넌트 렌더링 시작");
    console.log("👤 [Mypage] 사용자 정보:", user);
    console.log("🆔 [Mypage] 사용자 ID:", user?.id);
    console.log("🔗 [Mypage] 매트릭스 URL:", user?.matrixUrl);
  }

  const navigate = useNavigate();

  // URL에 파라미터 없이 상태 유지
  const [selectedMenuKey, setSelectedMenuKey] = useState("회원 정보");

  // 티어 정보 상태
  const [tierInfo, setTierInfo] = useState(null);

  // 서버에서 가져온 추천 프로그램 데이터
  const [recommended, setRecommended] = useState([]);;
  // 추천 프로그램 로딩 상태 
  const [loading, setLoading] = useState(false);

  // 매트릭드 이동 로딩 바
  const [loading2, setLoading2] = useState(false);

  // 메뉴 클릭 시 localStorage에 저장
  const handleMenuClick = async (menuKey) => {
    setSelectedMenuKey(menuKey)

    // 쿼리 파라미터 제거
    window.history.replaceState({}, "", "/mypage")

    // 매트릭스 페이지로 이동
    if (menuKey === "매트릭스 관리") {
      setLoading2(true);
      try {
        const data = await googleSheetsService.validateMatrixUrl(user.id);

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
      } finally {
        setLoading2(false);
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
    console.log("🔍 [Mypage] 티어 정보 useEffect 실행");
    console.log("🔍 [Mypage] user 존재 여부:", !!user);
    console.log("🔍 [Mypage] user.id 존재 여부:", !!user?.id);
    
    // 로그인한 사용자 정보(user.id)가 있을 때만 API를 호출
    if (user && user.id) {
      console.log("🔍 [Mypage] 티어 정보 API 호출 시작");
      const fetchTierInfo = async () => {
        try {
          console.log("🔍 [Mypage] getTierInfo 호출 중...");
          // 서버에 티어 정보를 요청합
          const data = await googleSheetsService.getTierInfo(user.id);
          console.log("🔍 [Mypage] getTierInfo 응답:", data);
          setTierInfo(data); // 받아온 데이터를 tierInfo state에 저장
        } catch (err) {
          console.error("❌ [Mypage] 티어 정보 로딩 실패:", err);
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
    } else {
      console.log("⚠️ [Mypage] user 또는 user.id가 없어서 티어 정보를 가져오지 않습니다.");
    }
  }, [user]);




  /**
   * 추천 프로그램 조회 useEffect
   * 회원 정보 메뉴가 선택되었을 때만 추천 프로그램을 조회
   */
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("🎯 [Mypage] 추천 프로그램 useEffect 실행");
      console.log("📋 [Mypage] 선택된 메뉴:", selectedMenuKey);
      console.log("👤 [Mypage] 사용자 ID:", user?.id);
      console.log("🔗 [Mypage] 매트릭스 URL:", user?.matrixUrl);
    }
    
    /**
     * 추천 프로그램 조회 함수
     * 1. 사용자 정보 확인
     * 2. 매트릭스 URL 확인 (없으면 서버에서 조회)
     * 3. 추천 프로그램 API 호출
     */
    const fetchRecommendedPrograms = async () => {
      // 1. 사용자 정보 확인
      if (!user?.id) {
        if (import.meta.env.DEV) {
          console.log("⚠️ [Mypage] 사용자 ID가 없어서 추천 프로그램을 불러오지 못했습니다.");
        }
        setRecommended([]);
        return;
      }

      // 2. 매트릭스 URL 확인 및 조회
      let currentUser = user;
      
      if (!user.matrixUrl || user.matrixUrl === '') {
        if (import.meta.env.DEV) {
          console.log("🔍 [Mypage] 매트릭스 URL이 없어서 서버에서 조회");
        }
        
        try {
          const userData = await googleSheetsService.getUserMatrixUrl(user.id);
          if (userData.success && userData.matrixUrl) {
            currentUser = { ...user, matrixUrl: userData.matrixUrl };
            if (import.meta.env.DEV) {
              console.log("✅ [Mypage] 매트릭스 URL 조회 성공:", currentUser.matrixUrl);
            }
            // 사용자 정보 업데이트
            if (setUser) {
              setUser(currentUser);
            }
          } else {
            if (import.meta.env.DEV) {
              console.log("⚠️ [Mypage] 매트릭스 URL을 찾을 수 없습니다.");
            }
            setRecommended([]);
            return;
          }
        } catch (error) {
          console.error("❌ [Mypage] 매트릭스 URL 조회 실패:", error);
          setRecommended([]);
          return;
        }
      }

      // 3. 추천 프로그램 API 호출
      if (import.meta.env.DEV) {
        console.log("🚀 [Mypage] 추천 프로그램 API 호출 시작");
      }
      
      setLoading(true);
      const [year, semester] = [2025, 2]; // 현재 연도/학기

      try {
        const data = await googleSheetsService.getRecommendedPrograms(user.id, year, semester);

        if (data.success) {
          if (import.meta.env.DEV) {
            console.log("✅ [Mypage] 추천 프로그램 조회 성공");
            console.log("📊 [Mypage] 추천된 프로그램 수:", data.data?.length || 0);
          }
          setRecommended(data.data || []);
        } else {
          if (import.meta.env.DEV) {
            console.log("⚠️ [Mypage] 추천 프로그램 조회 실패:", data.message);
          }
          setRecommended([]);
        }
      } catch (err) {
        console.error("❌ [Mypage] API 호출 오류:", err);
        setRecommended([]);
      } finally {
        setLoading(false);
        if (import.meta.env.DEV) {
          console.log("🏁 [Mypage] 추천 프로그램 로딩 완료");
        }
      }
    };

    // 회원 정보 메뉴만 추천 프로그램 조회 (과도한 API 호출 방지)
    if (selectedMenuKey === "회원 정보") {
      if (import.meta.env.DEV) {
        console.log("📋 [Mypage] 회원 정보 메뉴 선택됨, 추천 프로그램 호출");
      }
      fetchRecommendedPrograms();
    } else {
      if (import.meta.env.DEV) {
        console.log("📋 [Mypage] 다른 메뉴 선택됨, 추천 프로그램 목록 비움");
      }
      setRecommended([]); // 다른 메뉴 선택 시 추천 목록을 비움
    }
  }, [user, selectedMenuKey]);

  // 아이디 마스킹 함수
    const maskId = (id) => {
      if (!id) return "yutierid"; // 아이디가 없으면 기본값 반환
      if (id.length <= 3) return id; // 3글자 이하면 마스킹하지 않음
      return id.substring(0, 3) + '*'.repeat(id.length - 3);
    };

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
    { label: "아이디", value: maskId(user?.id) },
    { label: "학부/전공", value: user?.department && user?.major ? `${user.department} ${user.major}` : (user?.department || "유한전공") },
    { label: "학번", value: user?.studentId || "123456789" },
  ];

  console.log("🔍 [Mypage] 현재 상태:");
  console.log("🔍 [Mypage] tierInfo:", tierInfo);
  console.log("🔍 [Mypage] recommended:", recommended);
  console.log("🔍 [Mypage] loading:", loading);
  console.log("🔍 [Mypage] selectedMenuKey:", selectedMenuKey);

  const tierImageMap = {
    Bronze: `${import.meta.env.BASE_URL}tier1.png`,
    Silver: `${import.meta.env.BASE_URL}tier2.png`,
    Gold: `${import.meta.env.BASE_URL}tier3.png`,
    Diamond: `${import.meta.env.BASE_URL}tier4.png`,
    // 기본값
    Unranked: `${import.meta.env.BASE_URL}tier0.png`
  };

  return (
  <>
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
                        {/* 1등이면 축하 메시지 표시 */}
                        {tierInfo.isRankOne ? (
                          <div className={styles.rankOneMessage}>
                            🥳 전체 1등입니다! 🥳<br />🎉 축하합니다! 🎉
                          </div>
                        ) : tierInfo.currentTier === 'Unranked' ? (
                          // 언랭크일 경우 - 자격 조건 안내
                          <div className={styles.unrankedGoal}>
                            <div className={styles.nextGradeText}>
                              다음 등급인 <span className={styles.gradeLabel}>Bronze</span>까지
                            </div>
                            <div className={styles.score}>
                              모든 역량 70점 이상 필요
                            </div>
                          </div>
                        ) : (
                          // 자격이 있는 경우 - 다음 티어 커트라인 점수 표시
                          (() => {
                            // 다음 티어가 1위인 경우와 다른 티어인 경우를 구분
                            if (tierInfo.nextTier === '1위') {
                              return (
                                <>
                                  <div className={styles.nextGradeText}>
                                    전체 <span className={styles.gradeLabel}>1위</span>까지
                                  </div>
                                  <div className={styles.score}>
                                    {tierInfo.scoreForNextTier}점 필요
                                  </div>
                                </>
                              );
                            } else {
                            // 다른 티어로의 상승
                            const scoreNeeded = Math.max(0, tierInfo.scoreForNextTier);
                            //- tierInfo.currentScore
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
                            }
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

          {/* 회원 탈퇴 */}
          {selectedMenuKey === "회원 탈퇴" && (
            <DeleteAccount user={user} onLogout={onLogout} />
          )}
        </div>
      </div>

      <Footer />
    </div>

    {loading2 && (
            <div className={styles.loadingOverlay}>
              <div className={styles.loader}></div>
              <p>매트릭스로 이동 중...</p>
            </div>
          )}
    </>
  );
}

export default Mypage;
