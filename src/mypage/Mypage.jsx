import { useState, useEffect } from 'react';
import Header from "../Header";
import Footer from "../Footer";
import styles from "./mypage.module.css";
import MemInfoEdit from './MemInfoEdit';
import List from "./List.jsx";
import { useNavigate } from 'react-router-dom';

// props로 로그인한 사용자 정보 user를 받아서 화면에 표시
function Mypage({ user, setUser, onLogout }) {
    const navigate = useNavigate();

    // URL에 파라미터 없이 상태 유지
    const [selectedMenuKey, setSelectedMenuKey] = useState("회원 정보");

    // 서버에서 가져온 프로그램 데이터
    const [matrixData, setMatrixData] = useState([]);

    // 메뉴 클릭 시 로직 처리
    const handleMenuClick = async (menuKey) => {
        setSelectedMenuKey(menuKey);

        // 쿼리 파라미터 제거
        window.history.replaceState({}, "", "/mypage");

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

    // URL 정리
    useEffect(() => {
        // 쿼리 파라미터 제거
        window.history.replaceState({}, "", "/mypage")
    }, []);

    // 서버에서 프로그램 데이터 가져오기 (모든 학기 합치기)
    useEffect(() => {
    const fetchAllSemesters = async () => {
      const years = ['2023', '2024', '2025'];
      const semesters = ['1', '2'];
      const fetchPromises = []; // API 호출을 담을 배열

      for (const y of years) {
        for (const s of semesters) {
          // 모든 fetch 호출을 Promise 배열에 추가
          fetchPromises.push(
            fetch(`http://localhost:3001/api/load-matrix?id=${user.id}&year=${y}&semester=${s}`)
              .then(res => res.json())
              .then(json => json.success && json.data ? json.data : [])
              .catch(err => {
                console.error(`데이터 가져오기 실패: ${y}년 ${s}학기`, err);
                return []; // 에러 시 빈 배열 반환
              })
          );
        }
      }

      try {
        // Promise.all을 사용하여 모든 호출을 병렬로 실행
        const allResults = await Promise.all(fetchPromises);
        
        // 모든 데이터를 하나의 배열로 합치기
        const allData = allResults.flat();
        
        setMatrixData(allData);
      } catch (err) {
        console.error("데이터 병렬 처리 실패:", err);
        setMatrixData([]);
      }
    };

    fetchAllSemesters();
  }, [user.id]);

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
                            {/* 추천 프로그램 리스트 (List 컴포넌트 사용) */}
                            <div className={styles.programCard}>
                                <div className={styles.programContent}>
                                    <List data={matrixData} />
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