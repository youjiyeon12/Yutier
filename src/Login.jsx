import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './login.module.css';

function Login({ onLogin }) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!id || !password) {
      alert('아이디와 비밀번호를 입력하세요');
      return;
    }

    try {
      const res = await fetch('http://localhost:3001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password }),
      });

      const data = await res.json();

      if (data.success) {
        onLogin({ id });
        navigate('/'); // 로그인 성공 후 홈으로 이동
      } else {
        alert('아이디 또는 비밀번호가 틀렸습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className={styles.loginPage}>
      <div className={styles.logoBox}>
        <img src="/yutier.svg" alt="YUTIER 로고" className={styles.logoImage} />
      </div>

      <div className={styles.contentArea}>
        <form onSubmit={handleSubmit} className={styles.loginBox}>
          <h2>로그인</h2>
          <input
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="아이디"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
          />
          <div className={styles.rowButton}>
            <button type="submit">로그인</button>
            <button type="button" onClick={() => navigate('/signup')}>회원가입</button>
          </div>
        </form>

        <div className={styles.infoBox}>
          <h3>이런 학생에게 <strong>YUTIER</strong>를 추천해요!</h3>
          <ul>
            <li>YUHAN TRUST 제도에 대해 알고 싶은 학생</li>
            <li>TRUST 티어를 확인하고 싶은 학생</li>
            <li>TRUST 역량 점수 관리와 향상에 대한 가이드가 필요한 학생</li>
            <li>어쩌구저쩌구(?)</li>
          </ul>
          <button className={styles.infoButton} onClick={() => navigate('/detail')}>TRUST 인증제도란?</button>
        </div>
      </div>
      <footer className={styles.footer}>Copyright ⓒ hambugi</footer>
    </div>
  );
}

export default Login;
