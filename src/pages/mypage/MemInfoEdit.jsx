import styles from "./styles/mypage.module.css";
import { useState, useEffect } from "react";
import { googleSheetsService } from "../../services/googleSheetsService";

function MemInfoEdit({ user, setUser }) {
  // 사용자 정보에 "학부 전공" 같이 합쳐진 값이 올 수 있어 분리
  const initialDept = user?.department ? user.department.split(" ")[0] : "";
  const initialMajorFromCombined = user?.department ? (user.department.split(" ")[1] || "") : "";
  const [selectedDept, setSelectedDept] = useState(initialDept);
  const [selectedMajor, setSelectedMajor] = useState(user?.major || initialMajorFromCombined || "");
  const [departments, setDepartments] = useState([]);
  const [majors, setMajors] = useState([]);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const pwRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!?/@#$%^])[a-zA-Z\d!?/@#$%^]{8,20}$/;

  const handleSave = async (e) => {
    e?.preventDefault();
    if (saving) return;
    const currentDept = user?.department ? user.department.split(" ")[0] : "";
    const currentMajor = user?.major || (user?.department ? user.department.split(" ")[1] || "" : "");
    
    
    if (
      selectedDept.trim() === currentDept.trim() &&
      selectedMajor.trim() === currentMajor.trim() &&
      !newPassword
    ) {
      alert("변경된 내용이 없습니다.");
      return;
    }

    if (newPassword && !pwRegex.test(newPassword)) {
      alert("비밀번호는 8~20자이며, 영문+숫자+특수문자(!,?,/,@,#,$,%,^)를 포함해야 합니다.");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      alert("새 비밀번호가 일치하지 않습니다.");

      return;
    }

    setSaving(true);
    try {
      const updateData = {
        department: selectedDept,
        major: selectedMajor,
        currentPassword,
        newPassword: newPassword || undefined
      };


      const result = await googleSheetsService.updateUser(user.id, updateData);

      if (result.success) {
        alert("정보가 성공적으로 수정되었습니다!");

        const updatedUser = {
          ...user,
          department: selectedDept,
          major: selectedMajor,
        };
        setUser(updatedUser);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        alert(result.message || "수정에 실패했습니다.");
      }
    } catch (err) {
      console.error("저장 실패:", err);
      alert("서버 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    googleSheetsService
      .getMajorList()
      .then((data) => {
        setDepartments(Object.keys(data || {}));
      })
      .catch((err) => console.error("학부/전공 불러오기 오류:", err));
  }, []);

  useEffect(() => {
    if (!selectedDept) {
      setMajors([]);
      return;
    }

    googleSheetsService
      .getMajorList()
      .then((data) => {
        const majorList = (data && data[selectedDept]) || [];
        setMajors(majorList);
      })
      .catch((err) => {
        console.error("전공 목록 불러오기 오류:", err);
        setMajors([]);
      });
  }, [selectedDept]);

  // 사용자 정보가 바뀌었을 때 선택값 동기화 (합쳐진 문자열 대비)
  useEffect(() => {
    const dept = user?.department ? user.department.split(" ")[0] : "";
    const majFromCombined = user?.department ? (user.department.split(" ")[1] || "") : "";
    setSelectedDept(dept);
    setSelectedMajor(user?.major || majFromCombined || "");
  }, [user]);

  return (
    <form className={styles.detailCard} onSubmit={handleSave}>
      <p className={styles.sectionTitle}>회원 정보 수정</p>
      <div className={styles.detailList}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>이름</span>
          <span className={styles.detailValue}>{user?.name || "유티어"}</span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>아이디</span>
          <span className={styles.detailValue}>{user?.id || "yutierid"}</span>
        </div>

        <div className={styles.detailItem}>
          <label className={styles.detailLabel}>학부/전공</label>
          <div className={styles.selectRow}>
            <select aria-label="학부"
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
            <select aria-label="전공"
              className={styles.select}
              value={selectedMajor}
              onChange={(e) => {
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

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>학번</span>
          <span className={styles.detailValue}>{user?.studentId || "123456789"}</span>
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>현재 비밀번호</span>
          <input aria-label="현재 비밀번호" autoComplete="current-password"
            className={styles.inputField}
            type="password"
            placeholder="현재 비밀번호 입력"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>새 비밀번호</span>
          <input aria-label="새 비밀번호" autoComplete="new-password"
            className={styles.inputField}
            type="password"
            placeholder="새 비밀번호 입력"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>새 비밀번호 확인</span>
          <input aria-label="새 비밀번호 확인" autoComplete="new-password"
            className={styles.inputField}
            type="password"
            placeholder="새 비밀번호 다시 입력"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>
      <div className={styles.buttonWrapper}>
        <button type="submit" className={styles.confirmButton} disabled={saving} aria-busy={saving}>{saving ? '저장 중...' : '확인'}</button>
      </div>
    </form>
  );
}

export default MemInfoEdit;
