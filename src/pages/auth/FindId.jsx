import { useEffect, useState, useRef } from 'react';
import styles from './styles/findid.module.css';
import { googleSheetsService } from '../../services/googleSheetsService';
import { useNavigate } from 'react-router-dom';

function FindId(){
    // 입력 값 State
    const[name, setName] = useState('');
    const[studentID, setStudentID] = useState('');
    const[email, setEmail] = useState('');
    const[checknumber, setCheckNumber] = useState('');

    // 로직 제어 State
    const[message, setMessage] = useState('');
    const[isLoading, setIsLoading] = useState(false);
    const[isCodeSent, setIsCodeSent] = useState(false); // 인증번호 발송 여부
    const[isVerified, setIsVerified] = useState(false); // 인증 완료 여부
    const[timer, setTimer] = useState(0); // 타이머
    const timerRef = useRef(null);
    const navigate = useNavigate();

    // 타이머 효과
    useEffect(() => {
        if(timer > 0) {
            timerRef.current = setTimeout(() => {
                setTimer(timer - 1);
            }, 1000);
        } else {
            clearTimeout(timerRef.current);
            if(isCodeSent && !isVerified) {
                setMessage('인증 시간이 만료되었습니다. 다시 요청해주세요.'); 
                setIsCodeSent(false); 
                setCheckNumber(''); 
            }
        }
         return () => clearTimeout(timerRef.current);
    }, [timer, isCodeSent, isVerified]);

    // '인증번호 받기' 버튼 클릭 핸들러
    const handleSendCode = async(e) => {
        setMessage('');
        
        if(!name || !studentID || !email){
            setMessage('이름, 학번, 이메일을 모두 입력해주세요.');
            return;
        }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        setMessage('올바른 이메일 형식이 아닙니다.');
        return;
    }
    
    // 학번 형식 검사
    const studentIDRegex = /^[0-9]+$/;
    if (!studentIDRegex.test(studentID)) {
        setMessage('학번은 숫자만 입력해주세요.');
        return;
    }

        setIsLoading(true);
        setMessage('');

        const result = await googleSheetsService.sendVerificationCode({name, studentID, email});
            
        setIsLoading(false);
        if (result.success) {
            setMessage('입력하신 이메일로 인증번호가 발송되었습니다.');
            setIsCodeSent(true);
            setTimer(180); // 3분 타이머
        } else {
            setMessage(result.message || '인증번호 발송에 실패했습니다.');
        }
    };


    // '확인' 버튼 클릭 핸들러
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isCodeSent) {
            setMessage('먼저 이메일 인증번호를 받아주세요.');
            return;
        }
        if (!checknumber) {
            setMessage('인증번호를 입력해주세요.');
            return;
        }
        setIsLoading(true);
        setMessage('');

        const result = await googleSheetsService.findIdWithVerification(email, checknumber);

        setIsLoading(false);
        if (result.success) {
            setMessage(`회원님의 아이디는 [ ${result.id} ] 입니다.`);
            setIsVerified(true); // 인증 성공
            setTimer(0); // 타이머 중지
        } else {
            setMessage(result.message || '인증에 실패했습니다.');
        }
    };

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    return (
        <div className={styles.findIdPage}>
            <div className={styles.container}>
                <div className={styles.logoBox}>
                    <img src={`${import.meta.env.BASE_URL}yutier.svg`} alt="YUTIER 로고" className={styles.logoImage} />
                </div>

                <div className={styles.findIdBox}>
                    <h1 className={styles.title}>아이디 찾기</h1>
                    
                    {/* 결과 메시지를 표시할 영역 */}
                    {message && <div className={styles.resultBox}>{message}</div>}

                    <form onSubmit={handleSubmit}>
                        <div className={styles.inputRow}>
                            <label className={styles.label}>이&nbsp;&nbsp;&nbsp;름</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isCodeSent}   
                            />
                        </div>

                        <div className={styles.inputRow}>
                            <label className={styles.label}>학&nbsp;&nbsp;&nbsp;번</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={studentID}
                                onChange={(e) => setStudentID(e.target.value)}
                                disabled={isCodeSent}
                            />
                        </div>

                        <div className={styles.inputRow}>
                            <label className={styles.label}>이메일</label>
                            <input type="email" 
                                className={styles.input} 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                disabled={isCodeSent} 
                            />
                            <button type="button" className={styles.emailButton} onClick={handleSendCode} disabled={isLoading || isCodeSent}>
                                {isCodeSent ? '전송완료' : '받기'}
                            </button>
                        </div>

                        {isCodeSent && (
                            <div className={styles.inputRow}>
                                <label className={styles.label}>인증번호</label>
                                <input type="text" 
                                    className={styles.input} 
                                    value={checknumber} 
                                    onChange={(e) => setCheckNumber(e.target.value)} 
                                    disabled={isVerified} />
                                {timer > 0 && <span className={styles.timer}>{formatTime(timer)}</span>}
                            </div>
                        )}
                        <div className={styles.submitButtonContainer}>
                            <button type="submit" className={styles.submitButton} disabled={isLoading || isVerified}>
                                {isLoading ? '처리 중...' : '확인'}
                            </button>
                        </div>
                    </form>

                    <div className={styles.linksBox}>
                        <a onClick={() => navigate('/login')} className={styles.link}>로그인</a>
                        <span className={styles.separator}>|</span>
                        <a onClick={() => navigate('/signup')} className={styles.link}>회원가입</a>
                        <span className={styles.separator}>|</span>
                        <a onClick={() => navigate('/findpassword')} className={styles.link}>비밀번호 찾기</a>
                    </div>
                </div>
                <footer className={styles.footer}>Copyright ⓒ hambugi</footer>
            </div>
        </div>
    );
}
export default FindId;