// 회원 탈퇴 컴포넌트
import styles from "./styles/mypage.module.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { googleSheetsService } from "../../services/googleSheetsService";

function DeleteAccount({ user, onLogout }) {
    const [password, setPassword] = useState(""); 
    const navigate = useNavigate();

    const handleDelete = async () => {
        // 비밀번호 입력 확인
        if(!password){
            alert("현재 비밀번호를 입력해주세요.");
            return;
        }

        // 사용자에게 재확인
        if(window.confirm("정말로 탈퇴하시겠습니까? 탈퇴 후에는 계정을 복구할 수 없습니다.")){
            try{
                // googleSheetsService를 사용하여 회원 탈퇴 처리
                const result = await googleSheetsService.deleteAccount(user.id, password);
                
                if(result.message && result.message.includes("성공")){
                    alert("회원 탈퇴가 완료되었습니다.");
                    onLogout(); // 로그아웃 처리
                    navigate("/"); // 메인 페이지로 이동
                } else {
                    alert(result.message || "탈퇴 처리 중 오류가 발생했습니다.");
                }
            }
            catch (error){
                console.error("Delete account error:", error);
                alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
                setPassword(""); // 비밀번호 입력 필드 초기화
            }
        }
    }

    return (
        <div className={styles.detailCard}>
            <p className={styles.sectionTitle}>회원 탈퇴</p>
            <div className={styles.detailList}>

                {/* 이름 표시 */}
                <div className={styles.detailItem}>
                <span className={styles.detailLabel}>이름</span>
                <span className={styles.detailValue}>{user?.name || "사용자"}</span>
                </div>

                {/* 아이디 표시 */}
                <div className={styles.detailItem}>
                <span className={styles.detailLabel}>아이디</span>
                <span className={styles.detailValue}>{user?.id || "알 수 없음"}</span>
                </div>
                
                {/* 현재 비밀번호 입력 */}
                <div className={styles.detailItem}>
                <span className={styles.detailLabel}>현재 비밀번호</span>
                <input
                    className={styles.inputField}
                    type="password"
                    placeholder="현재 비밀번호 입력"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleDelete()}
                />
                </div>
            </div>
            
            {/* 탈퇴 버튼 */}
            <div className={styles.buttonWrapper}>
                <button className={styles.deleteButton} onClick={handleDelete}>탈퇴</button>
            </div>
        </div>
    );
}

export default DeleteAccount;