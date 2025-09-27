// 회원 정보 수정 컴포넌트
import styles from "./styles/mypage.module.css";
import { useState, useEffect } from "react";
import { googleSheetsService } from "../../services/googleSheetsService";

function MemInfoEdit({ user, setUser }) {
  // 사용자 정보에 "학부 전공" 같이 합쳐진 값이 올 수 있어 분리
  const initialDept = user?.department ? user.department.split(" ")[0] : "";
  const initialMajorFromCombined = user?.department ? (user.department.split(" ")[1] || "") : "";
  // 현재 선택된 학부
  const [selectedDept, setSelectedDept] = useState(initialDept);
  // 현재 선택된 전공 
  const [selectedMajor, setSelectedMajor] = useState(user?.major || initialMajorFromCombined || "");
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
    const currentDept = user?.department ? user.department.split(" ")[0] : "";
    const currentMajor = user?.major || (user?.department ? user.department.split(" ")[1] || "" : "");
    
    console.log("현재 학부:", currentDept, "선택된 학부:", selectedDept);
    console.log("현재 전공:", currentMajor, "선택된 전공:", selectedMajor);
    console.log("새 비밀번호:", newPassword);
    
    if (
      selectedDept.trim() === currentDept.trim() &&
      selectedMajor.trim() === currentMajor.trim() &&
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
      const updateData = {
        department: selectedDept,
        major: selectedMajor,
        currentPassword,
        newPassword: newPassword || undefined
      };

      console.log("전송할 데이터:", updateData);
      console.log("사용자 ID:", user.id);

      const result = await googleSheetsService.updateUser(user.id, updateData);
      console.log("서버 응답:", result);

      // 응답 결과에 따라 알림
      if (result.success) {
        alert("정보가 성공적으로 수정되었습니다!");

        // 변경된 정보로 업데이트
        const updatedUser = {
          ...user,
          department: selectedDept,
          major: selectedMajor,
        };
        setUser(updatedUser); // 상태 업데이트
        localStorage.setItem("user", JSON.stringify(updatedUser)); // 로컬스토리지도 동기화
        console.log("사용자 정보 업데이트됨:", updatedUser);
      } else {
        alert(result.message || "수정에 실패했습니다.");
      }
    } catch (err) {
      console.error("저장 실패:", err);
      alert("서버 오류가 발생했습니다.");
    }
  }

  useEffect(() => {
    // 학부/전공 목록 불러오기 (Apps Script 경유 서비스 사용)
    googleSheetsService
      .getMajorList()
      .then((data) => {
        setDepartments(Object.keys(data || {}));
        console.log("학부 목록 로드됨:", Object.keys(data || {}));
      })
      .catch((err) => console.error("학부/전공 불러오기 오류:", err));
  }, []);

  // 선택 학부의 전공 목록 세팅
  useEffect(() => {
    if (!selectedDept) {
      setMajors([]); // 학부 선택 없으면 전공 목록 비움
      return;
    }

    // 선택된 학부에 해당하는 전공 목록 요청 (서비스 사용)
    googleSheetsService
      .getMajorList()
      .then((data) => {
        const majorList = (data && data[selectedDept]) || [];
        setMajors(majorList);
        console.log(`${selectedDept} 학부의 전공 목록:`, majorList);
      })
      .catch((err) => {
        console.error("전공 목록 불러오기 오류:", err);
        setMajors([]);
      });
  }, [selectedDept]); // 학부 바뀔 때마다 실행

  // 사용자 정보가 바뀌었을 때 선택값 동기화 (합쳐진 문자열 대비)
  useEffect(() => {
    const dept = user?.department ? user.department.split(" ")[0] : "";
    const majFromCombined = user?.department ? (user.department.split(" ")[1] || "") : "";
    setSelectedDept(dept);
    setSelectedMajor(user?.major || majFromCombined || "");
  }, [user]);

  // 디버깅 정보
  console.log("MemInfoEdit 렌더링 - selectedDept:", selectedDept, "selectedMajor:", selectedMajor);
  console.log("MemInfoEdit 렌더링 - departments:", departments, "majors:", majors);

  return (
    <div className={styles.detailCard}>
      <p className={styles.sectionTitle}>회원 정보 수정</p>
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
                console.log("학부 선택됨:", e.target.value);
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
              onChange={(e) => {
                console.log("전공 선택됨:", e.target.value);
                setSelectedMajor(e.target.value);
              }}
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
      </div>
      {/* 확인 버튼 */}
      <div className={styles.buttonWrapper}>
        <button className={styles.confirmButton} onClick={handleSave}>확인</button>
      </div>
    </div>
  );
}

export default MemInfoEdit;
