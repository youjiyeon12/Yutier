import { useState, useEffect } from 'react';
import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import styles from "./styles/mypage.module.css";
import MemInfoEdit from './MemInfoEdit';
import DeleteAccount from './DeleteAccount'
import { useNavigate } from 'react-router-dom';
import List from "../../components/ui/list";
import { googleSheetsService } from '../../services/googleSheetsService';

/** 마이페이지: 회원 정보·티어·추천 프로그램, 정보 수정, 탈퇴 */
function Mypage({ user, setUser, onLogout }) {
  const navigate = useNavigate();

  const [selectedMenuKey, setSelectedMenuKey] = useState("회원 정보");

  const [tierInfo, setTierInfo] = useState(null);

  const [recommended, setRecommended] = useState([]);;
  // 추천 프로그램 로딩 상태 
  const [loading, setLoading] = useState(false);

  // 매트릭스 이동 로딩 바
  const [loading2, setLoading2] = useState(false);

  const handleMenuClick = async (menuKey) => {
    setSelectedMenuKey(menuKey)

    if (menuKey === "매트릭스 관리") {
      setLoading2(true);
      try {
        const data = await googleSheetsService.validateMatrixUrl(user.id);

        if (data.valid) {
          navigate('/matrix');
        }
        else {
          navigate('/matrix-url');
        }
      }
      catch (err) {
        console.error("URL확인 실패:", err);
        navigate('/matrix-url');
      } finally {
        setLoading2(false);
      }
    }
  }

  useEffect(() => {
    if (user && user.id) {
      const fetchTierInfo = async () => {
        try {
          const data = await googleSheetsService.getTierInfo(user.id);
          setTierInfo(data);
        } catch (err) {
          console.error("❌ [Mypage] 티어 정보 로딩 실패:", err);
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
      if (!user?.id) {
        setRecommended([]);
        return;
      }

      let currentUser = user;
      
      if (!user.matrixUrl || user.matrixUrl === '') {
        
        try {
          const userData = await googleSheetsService.getUserMatrixUrl(user.id);
          if (userData.success && userData.matrixUrl) {
            currentUser = { ...user, matrixUrl: userData.matrixUrl };
            if (setUser) {
              setUser(currentUser);
            }
          } else {
            setRecommended([]);
            return;
          }
        } catch (error) {
          console.error("❌ [Mypage] 매트릭스 URL 조회 실패:", error);
          setRecommended([]);
          return;
        }
      }

      setLoading(true);
      const [year, semester] = [2025, 2];

      try {
        const data = await googleSheetsService.getRecommendedPrograms(user.id, year, semester);

        if (data.success) {
          setRecommended(data.data || []);
        } else {
          setRecommended([]);
        }
      } catch (err) {
        console.error("❌ [Mypage] API 호출 오류:", err);
        setRecommended([]);
      } finally {
        setLoading(false);
      }
    };

    // 회원 정보 메뉴만 추천 프로그램 조회 (과도한 API 호출 방지)
    if (selectedMenuKey === "회원 정보") {
      fetchRecommendedPrograms();
    } else {
      setRecommended([]);
    }
  }, [user, selectedMenuKey, setUser]);

    const maskId = (id) => {
      if (!id) return "yutierid";
      if (id.length <= 3) return id;
      return id.substring(0, 3) + '*'.repeat(id.length - 3);
    };

  const navigationItems = [
    { key: "profile", label: "회원 정보", active: true },
    { key: "edit", label: "회원 정보 수정", active: false },
    { key: "matrix", label: "매트릭스 관리", active: false },
    { key: "withdraw", label: "회원 탈퇴", active: false },
  ];

  const memberDetails = [
    { label: "이름", value: user?.name || "유티어" },
    { label: "아이디", value: maskId(user?.id) },
    { label: "학부/전공", value: user?.department && user?.major ? `${user.department} ${user.major}` : (user?.department || "유한전공") },
    { label: "학번", value: user?.studentId || "123456789" },
  ];


  const tierImageMap = {
    Bronze: `${import.meta.env.BASE_URL}tier1.png`,
    Silver: `${import.meta.env.BASE_URL}tier2.png`,
    Gold: `${import.meta.env.BASE_URL}tier3.png`,
    Diamond: `${import.meta.env.BASE_URL}tier4.png`,
    Unranked: `${import.meta.env.BASE_URL}tier0.png`
  };

  return (
  <>
    <div className={styles.container}>
      <Header user={user} onLogout={onLogout} />

      <div className={styles.contentWrapper}>
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

        <div className={styles.mainContent}>
          {selectedMenuKey === "회원 정보" && (
            <>
              <div className={styles.gradedetailCard}>
                {!tierInfo ? (
                  <div className={styles.gradeInfoBox}>
                    <div>티어 정보를 불러오는 중입니다...</div>
                  </div>
                ) :
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
                        {tierInfo.isRankOne ? (
                          <div className={styles.rankOneMessage}>
                            🥳 전체 1등입니다! 🥳<br />🎉 축하합니다! 🎉
                          </div>
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
                          (() => {
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
                            const scoreNeeded = Math.max(0, tierInfo.scoreForNextTier);
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

          {selectedMenuKey === "회원 정보 수정" && (
            <MemInfoEdit user={user} setUser={setUser} />
          )}

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
