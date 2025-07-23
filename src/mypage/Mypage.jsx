// 마이페이지
import { useState, useEffect } from 'react';
//import { useSearchParams } from 'react-router-dom';
import Header from "../Header";
import Footer from "../Footer";
import styles from "./mypage.module.css";
import MemInfoEdit from './MemInfoEdit'; // 회원 정보 수정 컴포넌트

// props로 로그인한 사용자 정보 user를 받아서 화면에 표시
function Mypage({ user, setUser, onLogout }) {
  // console.log("Mypage에서 받은 user 정보:", user);

  // URL에 파라미터 없이 상태 유지
  const [selectedMenuKey, setSelectedMenuKey] = useState("회원 정보");

  // 메뉴 클릭 시 localStorage에 저장
  const handleMenuClick = (menuKey) => {
    setSelectedMenuKey(menuKey)

    // 쿼리 파라미터 제거
    window.history.replaceState({}, "", "/mypage")
  }

  // URL 정리
  useEffect(() => {
    // 쿼리 파라미터 제거
    window.history.replaceState({}, "", "/mypage")
  }, [])

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
                {/* 유저 티어 정보 */}
                <div className={styles.gradeInfoBox}>
                  <div className={styles.showTierGroup}>
                    <div className={styles.showTierImage}>
                      <img src="/tierImg/extier.png" alt="티어 이미지" />
                    </div>
                    <div className={styles.showTierText}>
                      <div className={styles.userName}>{user?.name || "유티어"} 님</div>
                      <div className={styles.userGrade}>
                        <span className={styles.gradeLabel}>SILVER</span> 등급입니다
                      </div>
                    </div>
                  </div>
                  <div className={styles.nextGradeBox}>
                    <div className={styles.nextGradeText}>
                      다음 <span className={styles.gradeLabel}>GOLD</span> 등급까지
                    </div>
                    <div className={styles.score}>??점</div>
                  </div>
                </div>

                {/* 회원 상세 정보 */}
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

              {/* 프로그램 이수 현황 */}
              <div className={styles.programCard}>
                <div className={styles.programContent}>
                  <h3 className={styles.sectionTitle}>프로그램 이수 현황</h3>
                  <div className={styles.programList}>
                    {/* 프로그램 이수 목록 추가 예정 */}
                    <div className={styles.programBox} />
                    <div className={styles.programBox} />
                    <div className={styles.programBox} />
                  </div>
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