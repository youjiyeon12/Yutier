import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './styles/findid.module.css';
import { googleSheetsService } from '../../services/googleSheetsService';

function FindId(){
    const[name, setName] = useState('');
    const[studentID, setStudentID] = useState('');
    const[email, setEmail] = useState('');
    const[checknumber, setCheckNumber] = useState('');

    const handleSubmit = async(e) => {

    }

    return(
        <div className={styles.findIdPage}>
            <div className={styles.logoBox}>
                <img src="/yutier.svg" alt="YUTIER 로고" className={styles.logoImage} />
            </div>

            <form onSubmit={handleSubmit}>
            <div className={styles.contentbox}>
                <h1>아이디 찾기</h1>
                <h2>이름</h2>
                <h2>학번</h2>
                <h2>이메일</h2>
                <button type='submit'>인증번호 받기</button>
                <h2>인증번호</h2>
                <button type='submit'>확인</button>
            </div>
            </form>

        </div>
    );
}
export default FindId;