// 회원 정보 수정 컴포넌트
import styles from "./mypage.module.css";
import { useState, useEffect } from "react";

function MemInfoEdit({ user, setUser }) {
  // 현재 선택된 학부
  const [selectedDept, setSelectedDept] = useState(user?.department || "");
  // 현재 선택된 전공 
  const [selectedMajor, setSelectedMajor] = useState(user?.major || "");
  // 전체 학부 목록
  const [departments, setDepartments] = useState([]);
  // 선택된 학부에 속한 전공 목록
  const [majors, setMajors] = useState([]);

  // 사용자가 입력한 현재 비밀번호
  const [currentPassword, setCurrentPassword] = useState("");
  // 사용자가 입력한 새 비밀번호
  const [newPassword, setNewPassword] = useState("");
  // 새 비밀번호 확인
  const [confirmPassword, setConfirmPassword] = useState("");
  // 비밀번호 유효성 
  const pwRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!?/@#$%^])[a-zA-Z\d!?/@#$%^]{8,20}$/;


  // 확인 버튼 클릭 시
  const handleSave = async () => {
    // 아무것도 변경되지 않았을 경우
    if (
      selectedDept.trim() === (user?.department || "").trim() &&
      selectedMajor.trim() === (user?.major || "").trim() &&
      !newPassword
    ) {
      alert("변경된 내용이 없습니다.");
      return;
    }

    // 비밀번호 유효성 검사
    if (newPassword && !pwRegex.test(newPassword)) {
      alert("비밀번호는 8~20자이며, 영문+숫자+특수문자(!,?,/,@,#,$,%,^)를 포함해야 합니다.");
      return;
    }
    // 새 비밀번호와 확인 비밀번호가 일치하는지 검사
    if (newPassword && newPassword !== confirmPassword) {
    alert("새 비밀번호가 일치하지 않습니다.");

    return;
    }

    // 사용자 정보 업데이트 요청
    try {
      const res = await fetch("http://localhost:3001/api/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,              // ID
          department: selectedDept, // 선택한 학부
          major: selectedMajor,     // 선택한 전공
          currentPassword,          // 현재 비번
          newPassword,              // 새 비번
          }),
      });

      if (!res.ok) {
        throw new Error(`서버 오류: ${res.status}`);
      }

      // 서버로부터 응답 받아 파싱
      const data = await res.json();

      // 응답 결과에 따라 알림
      if (data.success) {
        alert("정보가 성공적으로 수정되었습니다!");

        // 변경된  정보로 업데이트
        const updatedUser = {
          ...user,
          department: selectedDept,
          major: selectedMajor,
        };
        setUser(updatedUser); // 상태 업데이트
        localStorage.setItem("user", JSON.stringify(updatedUser)); // 로컬스토리지도 동기화
      } else {
        alert(data.message || "수정에 실패했습니다.");
      }
      } catch (err) {
        console.error("저장 실패:", err);
        alert("서버 오류가 발생했습니다.");
      }
  }
  
  useEffect(() => {
    // 학부/전공 목록 불러오기
    fetch("http://localhost:3001/api/major-list")
      .then((res) => res.json())
      .then((data) => {
        setDepartments(Object.keys(data)); // 학부 목록 설정
        if (user?.department) {
          setMajors(data[user.department] || []); // 학부에 따른 전공 목록 설정
        }
      })
      .catch((err) => console.error("학부/전공 불러오기 오류:", err));
  }, [user?.department]);

  // 선택 학부의 전공 목록 세팅
  useEffect(() => {
    if (!selectedDept) {
      setMajors([]); // 학부 선택 없으면 전공 목록 비움
      return;
    }

    // 선택된 학부에 해당하는 전공 목록 요청
    fetch("http://localhost:3001/api/major-list")
      .then((res) => res.json())
      .then((data) => {
        setMajors(data[selectedDept] || []); // 전공 목록 세팅
      });
  }, [selectedDept]); // 학부 바뀔 때마다 실행
  
  return (
    <div className={styles.detailCard}>
      <div className={styles.detailContent}>
        <h3 className={styles.sectionTitle}>회원 정보 수정</h3>
        <div className={styles.detailList}>
          {/* 이름 */}
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>이름</span>
            <span className={styles.detailValue}>{user?.name || "유티어"}</span>
          </div>

          {/* 아이디 */}
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>아이디</span>
            <span className={styles.detailValue}>{user?.id || "yutierid"}</span>
          </div>

          {/* 학부/전공 */}
          <div className={styles.detailItem}>
             <label className={styles.detailLabel}>학부/전공</label>
             <div className={styles.selectRow}>
               <select
                 className={styles.select}
                  value={selectedDept}
                  onChange={(e) => {
                    setSelectedDept(e.target.value);
                    setSelectedMajor("");
                  }}
                >
                  <option value="">학부</option>
                  {departments.map((dept) => (<option key={dept} value={dept}>{dept}</option>
                  ))}
              </select>
              <select
                className={styles.select}
                value={selectedMajor}
                onChange={(e) => setSelectedMajor(e.target.value)}
                disabled={!selectedDept}
              >
                <option value="">전공</option>
                {majors.map((major) => (
                  <option key={major} value={major}>{major}</option>
                ))}
              </select>
              </div>
            </div>

          {/* 학번 */}
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>학번</span>
            <span className={styles.detailValue}>{user?.studentId || "123456789"}</span>
          </div>

          {/* 현재 비밀번호 */}
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>현재 비밀번호</span>
            <input
              className={styles.inputField}
              type="password"
              placeholder="현재 비밀번호 입력"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          {/* 새 비밀번호 */}
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>새 비밀번호</span>
            <input
              className={styles.inputField}
              type="password"
              placeholder="새 비밀번호 입력"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          {/* 새 비밀번호 확인 */}
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>새 비밀번호 확인</span>
            <input
              className={styles.inputField}
              type="password"
              placeholder="새 비밀번호 다시 입력"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {/* 확인 버튼 */}
          <div className={styles.buttonWrapper}>
            <button className={styles.confirmButton} onClick={handleSave}>확인</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MemInfoEdit;
