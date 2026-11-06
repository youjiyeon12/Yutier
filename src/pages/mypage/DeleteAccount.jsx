import styles from "./styles/mypage.module.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { googleSheetsService } from "../../services/googleSheetsService";

function DeleteAccount({ user, onLogout }) {
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleDelete = async (e) => {
        e?.preventDefault();
        if (loading) return;
        if(!password){
            alert("현재 비밀번호를 입력해주세요.");
            return;
        }

        setLoading(true);
        try{
            // 비밀번호가 맞는지 먼저 확인한 뒤에 탈퇴 여부를 묻는다.
            const check = await googleSheetsService.verifyPassword(user.id, password);
            if(!check.success){
                alert(check.message || "비밀번호가 일치하지 않습니다.");
                setPassword("");
                return;
            }
        } finally {
            setLoading(false);
        }

        if(window.confirm("정말로 탈퇴하시겠습니까? 탈퇴 후에는 계정을 복구할 수 없습니다.")){
            setLoading(true);
            try{
                const result = await googleSheetsService.deleteAccount(user.id, password);
                
                if(result.success){
                    alert("회원 탈퇴가 완료되었습니다.");
                    onLogout();
                    navigate("/");
                } else {
                    alert(result.message || "탈퇴 처리 중 오류가 발생했습니다.");
                }
            }
            catch (error){
                console.error("Delete account error:", error);
                alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
                setPassword("");
            } finally {
                setLoading(false);
            }
        }
    }

    return (
        <form className={styles.detailCard} onSubmit={handleDelete}>
            <p className={styles.sectionTitle}>회원 탈퇴</p>
            <div className={styles.detailList}>

                <div className={styles.detailItem}>
                <span className={styles.detailLabel}>이름</span>
                <span className={styles.detailValue}>{user?.name || "사용자"}</span>
                </div>

                <div className={styles.detailItem}>
                <span className={styles.detailLabel}>아이디</span>
                <span className={styles.detailValue}>{user?.id || "알 수 없음"}</span>
                </div>
                
                <div className={styles.detailItem}>
                <span className={styles.detailLabel}>현재 비밀번호</span>
                <input aria-label="현재 비밀번호" autoComplete="current-password"
                    className={styles.inputField}
                    type="password"
                    placeholder="현재 비밀번호 입력"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                </div>
            </div>
            
            <div className={styles.buttonWrapper}>
                <button type="submit" className={styles.deleteButton} disabled={loading} aria-busy={loading}>{loading ? '처리 중...' : '탈퇴'}</button>
            </div>
        </form>
    );
}

export default DeleteAccount;