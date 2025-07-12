// 마이페이지 화면
//import { useState } from 'react';
//import { useNavigate } from 'react-router-dom';
import Header from "./Header";
import Footer from "./Footer";
import styles from "./mypage.module.css";
import tierImage from '../public/tierImg/extier.png';

// 마이페이지 컴포넌트
// props로 로그인한 사용자 정보 user를 받아서 화면에 표시
function Mypage({ user }) {
  console.log("Mypage에서 받은 user 정보:", user); 
  // 왼쪽 사이드바에 표시될 목록
  const navigationItems = [
    { label: "회원 정보", active: true },
    { label: "회원정보 수정", active: false },
    { label: "매트릭스 관리", active: false },
    { label: "TIER 정보", active: false },
    { label: "회원 탈퇴", active: false },
  ];

  // 회원 상세 정보 - user 객체에서 값 가져옴 (없으면 기본값)
  const memberDetails = [
    { label: "이름", value: user?.name || "유티어" },
    { label: "아이디", value: user?.id || "yutierid" },
    { label: "학부/전공", value: user?.department || "유티어전공" },
    { label: "학번", value: user?.studentId || "123456789" },
  ];

  return (
    <div className={styles.container}>
      <Header user={user} />

      <div className={styles.contentWrapper}>
        {/* 왼쪽 사이드바 */}
        <div className={styles.sidebarCard}>
          <div className={styles.sidebarContent}>
            <h2 className={styles.pageTitle}>마이페이지</h2>

            {/* 메뉴 리스트 */}
            <div className={styles.navList}>
              {navigationItems.map((item, index) => (
                <button
                  key={index}
                  className={`${styles.navItem} ${item.active ? styles.active : ""}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className={styles.mainContent}>
           {/* 유저 등급, 회원 상세 정보 */}
          <div className={styles.gradedetailCard}>
            <div className={styles.gradedetailContent}>
              {/* 유저 등급 정보 ~ 티어이미지, 매트릭스 완성 후 구현 예정 ~*/}
              <div className={styles.gradeInfoBox}>
                {/* 티어 표시 */}
                <div className={styles.showTierGroup}>
                  <div className={styles.showTierImage}>
                    <img src={tierImage} alt="티어 이미지" />
                  </div>
                  <div className={styles.showTierText}>
                    <div className={styles.userName}>{user?.name || "유티어"} 님</div>
                    <div className={styles.userGrade}>
                      <span className={styles.gradeLabel}>SILVER</span> 등급입니다
                    </div>
                  </div>
                </div>
                {/* 다음 등급까지 남은 점수 */}
                <div className={styles.nextGradeBox}>
                  <div className={styles.nextGradeText}>
                    다음 <span className={styles.gradeLabel}>GOLD</span> 등급까지
                  </div>
                  <div className={styles.score}>??점</div>
                </div>
              </div>
             {/* 회원 상세 정보 */}
              <div className={styles.detailContent}>
                <h3 className={styles.sectionTitle}>회원 상세 정보</h3>
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
          </div>

          {/* 프로그램 이수 현황 */}
          <div className={styles.programCard}>
            <div className={styles.programContent}>
              <h3 className={styles.sectionTitle}>프로그램 이수 현황</h3>
              <div className={styles.programList}>
                {/* ~ 프로그램 이수 목록 추가 예정 ~*/}
                <div className={styles.programBox} />
                <div className={styles.programBox} />
                <div className={styles.programBox} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default Mypage;